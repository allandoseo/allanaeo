'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { endSession, requireUser } from '@/lib/auth';
import { hashPassword, verifyPassword } from '@/lib/password';
import {
  deleteAccount, deleteUserSessions, getOwnAd, getProfileByUser, getUserById, requestVerification, saveAdDraft, setOwnAdStatus,
  setProfileAvatar, submitAd, updateOwnAvailability, updateUser, upsertProfile,
} from '@/lib/repo';
import { onlyDigits } from '@/lib/format';
import type { Ad, Availability } from '@/lib/types';
import { accountSchema, adSchema, changePasswordSchema, profileSchema, validateStep, zodErrors, type FieldErrors } from '@/lib/validation';
import type { FormState } from './types';

// ───────────── Perfil ─────────────

export async function saveProfileAction(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser('/painel/perfil');
  const raw = Object.fromEntries(fd);
  const values = { publicName: String(raw.publicName ?? ''), bio: String(raw.bio ?? ''), citySlug: String(raw.citySlug ?? '') };
  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) return { errors: zodErrors(parsed.error), values };
  await upsertProfile(user.id, parsed.data);
  revalidatePath('/painel', 'layout');
  return { ok: true, message: 'Perfil salvo.', values };
}

export async function setAvatarAction(url: string | null): Promise<{ ok: boolean; error?: string }> {
  const user = await requireUser('/painel/perfil');
  if (url !== null && !/^\/media\/[0-9a-f-]{36}\.(jpg|png|webp)$/.test(url)) return { ok: false, error: 'Imagem inválida.' };
  const p = await setProfileAvatar(user.id, url);
  if (!p) return { ok: false, error: 'Crie o perfil antes de enviar a foto.' };
  revalidatePath('/painel/perfil');
  return { ok: true };
}

export async function requestVerificationAction(): Promise<void> {
  const user = await requireUser('/painel/perfil');
  await requestVerification(user.id);
  revalidatePath('/painel', 'layout');
}

// ───────────── Anúncios: status ─────────────

export async function adStatusAction(fd: FormData): Promise<void> {
  const user = await requireUser('/painel/anuncios');
  const adId = String(fd.get('adId') ?? '');
  const action = String(fd.get('action') ?? '');
  if (!['pause', 'resume', 'delete'].includes(action)) return;
  try {
    await setOwnAdStatus(user.id, adId, action as 'pause' | 'resume' | 'delete');
  } catch {
    /* transição inválida ou anúncio de outro usuário: ignora */
  }
  revalidatePath('/painel', 'layout');
  revalidatePath('/anuncios');
  redirect(`/painel/anuncios?ok=${action}`);
}

// ───────────── Anúncios: assistente ─────────────

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const strList = (v: unknown, maxItems: number, maxLen: number) =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string').map((x) => x.trim().slice(0, maxLen)).filter(Boolean).slice(0, maxItems) : [];
const AVAIL: Availability[] = ['unknown', 'available_now', 'available_today', 'by_appointment', 'unavailable'];
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Saneia dados parciais de rascunho (não exige completude, apenas tipos e limites). */
function sanitizeDraft(input: unknown): Partial<Ad> {
  const d = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const age = Number(d.age);
  const contact = (d.contact && typeof d.contact === 'object' ? d.contact : {}) as Record<string, unknown>;
  const phone = (v: unknown) => {
    const x = onlyDigits(str(v, 30)).slice(0, 15);
    return x || null;
  };
  return {
    publicName: str(d.publicName, 40),
    age: Number.isInteger(age) && age >= 18 && age <= 80 ? age : null,
    title: str(d.title, 90),
    citySlug: str(d.citySlug, 60),
    regionSlug: str(d.regionSlug, 60) || null,
    areasServed: strList(d.areasServed, 10, 40),
    summary: str(d.summary, 220),
    description: str(d.description, 4000),
    characteristics: Array.isArray(d.characteristics)
      ? d.characteristics
          .map((c) => ({ label: str((c as Record<string, unknown>)?.label, 30), value: str((c as Record<string, unknown>)?.value, 60) }))
          .filter((c) => c.label && c.value)
          .slice(0, 15)
      : [],
    modes: strList(d.modes, 10, 40),
    availability: AVAIL.includes(d.availability as Availability) ? (d.availability as Availability) : 'unknown',
    availabilityNote: str(d.availabilityNote, 120),
    schedule: Array.isArray(d.schedule)
      ? d.schedule
          .map((s) => s as Record<string, unknown>)
          .filter((s) => Number.isInteger(s.day) && (s.day as number) >= 0 && (s.day as number) <= 6 && TIME.test(String(s.from)) && TIME.test(String(s.to)))
          .map((s) => ({ day: s.day as number, from: String(s.from), to: String(s.to) }))
          .slice(0, 21)
      : [],
    showPrices: d.showPrices === true,
    prices: Array.isArray(d.prices)
      ? d.prices
          .map((p) => p as Record<string, unknown>)
          .map((p) => ({ label: str(p.label, 40), amount: typeof p.amount === 'number' && Number.isInteger(p.amount) && p.amount > 0 && p.amount <= 100000 ? p.amount : null }))
          .filter((p) => p.label)
          .slice(0, 10)
      : [],
    rules: strList(d.rules, 12, 160),
    conditions: str(d.conditions, 1000),
    photos: Array.isArray(d.photos)
      ? d.photos
          .map((p) => p as Record<string, unknown>)
          .filter((p) => typeof p.url === 'string' && /^\/(media|demo)\//.test(p.url))
          .map((p) => ({ id: str(p.id, 64), url: String(p.url), width: Number(p.width) || 800, height: Number(p.height) || 1000, alt: str(p.alt, 140) }))
          .slice(0, 12)
      : [],
    contact: {
      whatsapp: phone(contact.whatsapp),
      phone: phone(contact.phone),
      telegram: str(contact.telegram, 32).replace(/^@/, '') || null,
      showWhatsapp: contact.showWhatsapp === true,
      showPhone: contact.showPhone === true,
      showTelegram: contact.showTelegram === true,
    },
  };
}

export interface StepResult {
  ok: boolean;
  adId: string | null;
  errors?: FieldErrors;
  savedAt?: string;
  message?: string;
}

/** Valida uma etapa no servidor e, se o anúncio for rascunho/rejeitado, salva o progresso. */
export async function wizardStepAction(adId: string | null, data: unknown, step: number, saveOnly = false): Promise<StepResult> {
  const user = await requireUser('/painel/anuncios');
  if (!(await getProfileByUser(user.id))) return { ok: false, adId, message: 'Crie seu perfil antes de anunciar.' };
  const errors = saveOnly ? {} : validateStep(step, data);
  if (Object.keys(errors).length) return { ok: false, adId, errors };
  const existing = adId ? await getOwnAd(user.id, adId) : null;
  if (adId && !existing) return { ok: false, adId: null, message: 'Anúncio não encontrado.' };
  const editableDraft = !existing || existing.status === 'draft' || existing.status === 'rejected';
  if (!editableDraft) {
    // Anúncio publicado: alterações só valem quando enviadas na revisão (passam por moderação se necessário).
    return saveOnly ? { ok: false, adId, message: 'Este anúncio já foi publicado. Use “Salvar e enviar” na etapa de revisão.' } : { ok: true, adId };
  }
  try {
    const ad = await saveAdDraft(user.id, adId, sanitizeDraft(data), step);
    revalidatePath('/painel/anuncios');
    return { ok: true, adId: ad.id, savedAt: ad.updatedAt };
  } catch {
    return { ok: false, adId, message: 'Não foi possível salvar o rascunho.' };
  }
}

/** Envio final: valida tudo no servidor com o esquema completo. */
export async function submitAdAction(adId: string | null, data: unknown): Promise<StepResult> {
  const user = await requireUser('/painel/anuncios');
  if (!(await getProfileByUser(user.id))) return { ok: false, adId, message: 'Crie seu perfil antes de anunciar.' };
  const parsed = adSchema.safeParse(data);
  if (!parsed.success) return { ok: false, adId, errors: zodErrors(parsed.error), message: 'Revise as etapas destacadas antes de enviar.' };
  let id = adId;
  try {
    if (!id) id = (await saveAdDraft(user.id, null, sanitizeDraft(data), 10)).id;
    else if (!(await getOwnAd(user.id, id))) return { ok: false, adId: null, message: 'Anúncio não encontrado.' };
    await submitAd(user.id, id, parsed.data);
  } catch {
    return { ok: false, adId: id, message: 'Não foi possível enviar o anúncio. Tente novamente.' };
  }
  revalidatePath('/painel', 'layout');
  revalidatePath('/anuncios');
  redirect('/painel/anuncios?enviado=1');
}

// ───────────── Disponibilidade ─────────────

export async function availabilityAction(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser('/painel/disponibilidade');
  const status = String(fd.get('availability') ?? '') as Availability;
  const target = String(fd.get('target') ?? 'all');
  const note = String(fd.get('note') ?? '').trim().slice(0, 120);
  if (!AVAIL.includes(status) || status === 'unknown') return { errors: { availability: 'Selecione um status.' } };
  if (target !== 'all' && !(await getOwnAd(user.id, target))) return { message: 'Anúncio não encontrado.' };
  const n = await updateOwnAvailability(user.id, target as string | 'all', status, note);
  revalidatePath('/painel', 'layout');
  revalidatePath('/anuncios');
  return n ? { ok: true, message: `Disponibilidade atualizada em ${n} ${n === 1 ? 'anúncio' : 'anúncios'}.` } : { message: 'Você ainda não tem anúncios.' };
}

// ───────────── Configurações ─────────────

export async function updateNameAction(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser('/painel/configuracoes');
  const parsed = accountSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { errors: zodErrors(parsed.error), values: { name: String(fd.get('name') ?? '') } };
  await updateUser(user.id, { name: parsed.data.name });
  revalidatePath('/', 'layout');
  return { ok: true, message: 'Nome atualizado.' };
}

export async function changePasswordAction(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser('/painel/configuracoes');
  const parsed = changePasswordSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { errors: zodErrors(parsed.error) };
  const full = await getUserById(user.id);
  if (!full || !(await verifyPassword(parsed.data.current, full.passwordHash))) return { errors: { current: 'Senha atual incorreta.' } };
  await updateUser(user.id, { passwordHash: await hashPassword(parsed.data.password) });
  return { ok: true, message: 'Senha alterada.' };
}

export async function logoutAllAction(): Promise<void> {
  const user = await requireUser('/painel/configuracoes');
  await deleteUserSessions(user.id);
  await endSession();
  redirect('/login');
}

export async function deleteAccountAction(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser('/painel/configuracoes');
  if (String(fd.get('confirm') ?? '').trim() !== 'EXCLUIR') return { errors: { confirm: 'Digite EXCLUIR para confirmar.' } };
  if (user.role === 'admin') return { message: 'Contas de administração não podem ser excluídas por aqui.' };
  const ok = await deleteAccount(user.id);
  if (!ok) return { message: 'Não foi possível excluir a conta.' };
  await endSession();
  redirect('/?conta=excluida');
}
