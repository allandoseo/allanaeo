import 'server-only';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { Database } from '@/lib/types';
import { createSeed, ensureAdmin } from './seed';

/**
 * Armazenamento local em arquivo JSON (adaptador "local").
 * Serve para desenvolvimento e demonstração; em produção use o adaptador
 * Supabase (ver supabase/migrations e README). Todas as escritas passam por
 * uma fila serial e são gravadas de forma atômica (arquivo temporário + rename).
 */

export const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

type Cache = { db: Database | null; loading: Promise<Database> | null; queue: Promise<unknown> };
const g = globalThis as unknown as { __ebStore?: Cache };
const cache: Cache = g.__ebStore ?? (g.__ebStore = { db: null, loading: null, queue: Promise.resolve() });

/** Carga única e compartilhada: requisições simultâneas no primeiro acesso aguardam a mesma promise. */
function load(): Promise<Database> {
  if (cache.db) return Promise.resolve(cache.db);
  cache.loading ??= (async () => {
    let db: Database;
    try {
      db = JSON.parse(await fs.readFile(DB_FILE, 'utf8')) as Database;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
      db = await createSeed();
      await persist(db);
    }
    if (await ensureAdmin(db)) await persist(db);
    cache.db = db;
    return db;
  })().finally(() => { cache.loading = null; });
  return cache.loading;
}

async function persist(db: Database) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${DB_FILE}.${process.pid}.${randomUUID()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 2), 'utf8');
  await fs.rename(tmp, DB_FILE);
}

/** Leitura: devolve um snapshot que não deve ser alterado. */
export async function read<T>(fn: (db: Database) => T): Promise<T> {
  await cache.queue;
  const db = await load();
  return fn(db);
}

/** Escrita serializada: a função recebe o banco e pode alterá-lo. */
export function write<T>(fn: (db: Database) => T | Promise<T>): Promise<T> {
  const run = cache.queue.then(async () => {
    const db = await load();
    const result = await fn(db);
    await persist(db);
    return result;
  });
  cache.queue = run.catch(() => undefined);
  return run;
}
