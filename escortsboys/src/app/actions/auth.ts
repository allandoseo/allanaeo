'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { endSession, safeNext, startSession } from '@/lib/auth';
import { hashPassword, verifyPassword } from '@/lib/password';
import { rateLimit } from '@/lib/rate-limit';
import { consumePasswordReset, createPasswordReset, createUser, findUserByEmail } from '@/lib/repo';
import { sendMail } from '@/lib/mail';
import { absoluteUrl } from '@/lib/site';
import { forgotSchema, loginSchema, resetSchema, signupSchema, zodErrors } from '@/lib/validation';
import type { FormState } from './types';

async function clientIp() {
  const h = await headers();
  return h.get('x-forwarded-for')?.split(',')[0].trim() || h.get('x-real-ip') || 'local';
}

export async function signupAction(_: FormState, fd: FormData): Promise<FormState> {
  const raw = Object.fromEntries(fd);
  const values = { name: String(raw.name ?? ''), email: String(raw.email ?? ''), intent: String(raw.intent ?? 'user') };
  if (!rateLimit(`signup:${await clientIp()}`, 10, 3600_000)) return { message: 'Muitas tentativas. Tente novamente mais tarde.', values };
  const parsed = signupSchema.safeParse(raw);
  if (!parsed.success) return { errors: zodErrors(parsed.error), values };
  const d = parsed.data;
  if (await findUserByEmail(d.email)) return { errors: { email: 'Já existe uma conta com este e-mail.' }, values };
  let userId: string;
  try {
    const u = await createUser({ name: d.name, email: d.email, passwordHash: await hashPassword(d.password), role: d.intent === 'advertiser' ? 'advertiser' : 'user' });
    userId = u.id;
  } catch {
    return { errors: { email: 'Já existe uma conta com este e-mail.' }, values };
  }
  await startSession(userId, true);
  redirect(d.intent === 'advertiser' ? '/painel/perfil?bemvindo=1' : '/favoritos?bemvindo=1');
}

export async function loginAction(_: FormState, fd: FormData): Promise<FormState> {
  const raw = Object.fromEntries(fd);
  const values = { email: String(raw.email ?? '') };
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) return { errors: zodErrors(parsed.error), values };
  const { email, password, remember } = parsed.data;
  if (!rateLimit(`login:${email}`, 8, 15 * 60_000) || !rateLimit(`login-ip:${await clientIp()}`, 30, 15 * 60_000)) {
    return { message: 'Muitas tentativas de acesso. Aguarde alguns minutos.', values };
  }
  const u = await findUserByEmail(email);
  const ok = u ? await verifyPassword(password, u.passwordHash) : false;
  if (!u || !ok) return { message: 'E-mail ou senha incorretos.', values };
  if (u.status !== 'active') return { message: 'Esta conta está suspensa. Fale com o suporte pela página de contato.', values };
  await startSession(u.id, remember);
  redirect(safeNext(fd.get('next'), u.role === 'admin' ? '/admin' : u.role === 'advertiser' ? '/painel' : '/favoritos'));
}

export async function logoutAction() {
  await endSession();
  redirect('/');
}

export async function forgotAction(_: FormState, fd: FormData): Promise<FormState> {
  const parsed = forgotSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { errors: zodErrors(parsed.error), values: { email: String(fd.get('email') ?? '') } };
  const { email } = parsed.data;
  // Resposta idêntica exista ou não a conta (evita enumeração de e-mails).
  const generic: FormState = { ok: true, message: 'Se houver uma conta com este e-mail, você receberá um link para criar uma nova senha. O link vale por 1 hora.' };
  if (!rateLimit(`forgot:${email}`, 3, 3600_000) || !rateLimit(`forgot-ip:${await clientIp()}`, 10, 3600_000)) return generic;
  const u = await findUserByEmail(email);
  if (!u || u.passwordHash === '!') return generic;
  const token = await createPasswordReset(u.id);
  const link = absoluteUrl(`/recuperar-senha/nova?token=${token}`);
  const { delivered } = await sendMail(u.email, 'Redefinição de senha — EscortsBoys', `Olá, ${u.name}.\n\nPara criar uma nova senha, acesse:\n${link}\n\nO link expira em 1 hora. Se você não pediu a redefinição, ignore este e-mail.`);
  return { ...generic, devLink: !delivered && process.env.NODE_ENV !== 'production' ? link : undefined };
}

export async function resetAction(_: FormState, fd: FormData): Promise<FormState> {
  const parsed = resetSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { errors: zodErrors(parsed.error) };
  const ok = await consumePasswordReset(parsed.data.token, await hashPassword(parsed.data.password));
  if (!ok) return { message: 'Este link é inválido ou expirou. Solicite um novo.' };
  redirect('/login?senha=redefinida');
}
