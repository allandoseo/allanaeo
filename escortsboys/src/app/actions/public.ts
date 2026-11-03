'use server';

import { headers } from 'next/headers';
import { getCurrentUser } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import { createContactMessage, createReport } from '@/lib/repo';
import { contactSchema, reportSchema, zodErrors } from '@/lib/validation';
import type { FormState } from './types';

async function ip() {
  const h = await headers();
  return h.get('x-forwarded-for')?.split(',')[0].trim() || 'local';
}

export async function reportAction(_: FormState, fd: FormData): Promise<FormState> {
  const parsed = reportSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { errors: zodErrors(parsed.error) };
  if (!rateLimit(`report:${await ip()}`, 10, 3600_000)) return { message: 'Limite de denúncias atingido. Tente mais tarde ou use a página de contato.' };
  const user = await getCurrentUser();
  try {
    await createReport({ adId: parsed.data.adId, reason: parsed.data.reason, details: parsed.data.details, reporterEmail: parsed.data.email || null, reporterUserId: user?.id ?? null });
  } catch {
    return { message: 'Anúncio não encontrado.' };
  }
  return { ok: true, message: 'Denúncia recebida. A moderação analisa denúncias graves com prioridade e pode remover o anúncio imediatamente.' };
}

export async function contactAction(_: FormState, fd: FormData): Promise<FormState> {
  const raw = Object.fromEntries(fd);
  const values = { name: String(raw.name ?? ''), email: String(raw.email ?? ''), subject: String(raw.subject ?? ''), message: String(raw.message ?? '') };
  // Campo-armadilha para robôs
  if (raw.website) return { ok: true, message: 'Mensagem enviada.' };
  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success) return { errors: zodErrors(parsed.error), values };
  if (!rateLimit(`contact:${await ip()}`, 5, 3600_000)) return { message: 'Muitas mensagens enviadas. Tente novamente mais tarde.', values };
  await createContactMessage(parsed.data);
  return { ok: true, message: 'Mensagem enviada. Respondemos em até 2 dias úteis; pedidos de remoção de conteúdo têm prioridade.' };
}
