import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { DATA_DIR } from '@/lib/db/store';
import { sniffImage } from '@/lib/images';
import { rateLimit } from '@/lib/rate-limit';

const MAX_BYTES = 10 * 1024 * 1024;

/**
 * Upload de foto (anunciante autenticado). Valida o tipo real pelos bytes, limita tamanho e dimensões,
 * e grava com nome aleatório. Em produção, troque por Supabase Storage (bucket privado + URL assinada/CDN).
 */
export async function POST(req: NextRequest) {
  const u = await getCurrentUser();
  if (!u) return NextResponse.json({ error: 'Faça login para enviar fotos.' }, { status: 401 });
  if (!rateLimit(`upload:${u.id}`, 120, 3600_000)) return NextResponse.json({ error: 'Limite de envios atingido. Tente mais tarde.' }, { status: 429 });
  const form = await req.formData().catch(() => null);
  const file = form?.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'Arquivo não enviado.' }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'A foto deve ter no máximo 10 MB.' }, { status: 413 });
  const buf = Buffer.from(await file.arrayBuffer());
  const info = sniffImage(buf);
  if (!info) return NextResponse.json({ error: 'Formato não suportado. Use JPG, PNG ou WebP.' }, { status: 415 });
  if (info.width < 400 || info.height < 400) return NextResponse.json({ error: 'A foto precisa ter pelo menos 400 × 400 pixels.' }, { status: 422 });
  if (info.width > 8000 || info.height > 8000) return NextResponse.json({ error: 'Dimensões muito grandes (máx. 8000 px).' }, { status: 422 });
  const name = `${randomUUID()}.${info.type === 'jpeg' ? 'jpg' : info.type}`;
  const dir = path.join(DATA_DIR, 'uploads');
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, name), buf);
  return NextResponse.json({ id: name.split('.')[0], url: `/media/${name}`, width: info.width, height: info.height, alt: '' });
}
