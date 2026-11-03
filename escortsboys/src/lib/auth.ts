import 'server-only';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { createSession, deleteSession, getUserBySessionToken } from '@/lib/repo';
import type { User } from '@/lib/types';

export const SESSION_COOKIE = 'eb_session';

export type SafeUser = Omit<User, 'passwordHash'>;

function strip(u: User): SafeUser {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...rest } = u;
  return rest;
}

export async function getCurrentUser(): Promise<SafeUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const u = await getUserBySessionToken(token);
  return u ? strip(u) : null;
}

/** Exige sessão; redireciona ao login preservando o destino. */
export async function requireUser(next = '/painel'): Promise<SafeUser> {
  const u = await getCurrentUser();
  if (!u) redirect(`/login?next=${encodeURIComponent(next)}`);
  return u;
}

/** Área administrativa: usuários sem papel admin recebem 404 (não revela a existência da rota). */
export async function requireAdmin(): Promise<SafeUser> {
  const u = await requireUser('/admin');
  if (u.role !== 'admin') notFound();
  return u;
}

export async function startSession(userId: string, remember: boolean) {
  const days = remember ? 30 : 1;
  const token = await createSession(userId, days);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    ...(remember ? { maxAge: days * 86400 } : {}),
  });
}

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await deleteSession(token);
  jar.delete(SESSION_COOKIE);
}

/** Destino seguro pós-login (somente caminhos internos). */
export function safeNext(next: unknown, fallback = '/painel'): string {
  return typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') ? next : fallback;
}
