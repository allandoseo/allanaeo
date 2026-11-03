'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import {
  adminMarkMessage, adminModerateAd, adminResolveReport, adminSetUser, adminSetVerification, adminUpdateSettings,
  adminUpsertCategory, adminUpsertCity, adminUpsertPlan, getCategories, getCities, getPlans,
} from '@/lib/repo';
import { slugify } from '@/lib/slug';
import { zodErrors } from '@/lib/validation';
import {
  categorySchema, citySchema, moderateSchema, planSchema, reportResolveSchema, settingsSchema, userAdminSchema, verifySchema,
} from '@/lib/validation-admin';
import type { FormState } from './types';

const fail = (e: unknown): FormState => ({ message: e instanceof Error ? ERR[e.message] ?? 'Não foi possível concluir a operação.' : 'Erro inesperado.' });
const ERR: Record<string, string> = {
  NOT_FOUND: 'Registro não encontrado.',
  SELF_CHANGE: 'Você não pode alterar o próprio papel ou status.',
  DEMO_CANNOT_BE_VERIFIED: 'Perfis de demonstração não podem ser marcados como verificados.',
};

export async function moderateAction(_: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const p = moderateSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { errors: zodErrors(p.error) };
  try {
    await adminModerateAd(admin.id, p.data.adId, p.data.decision, p.data.note);
  } catch (e) { return fail(e); }
  revalidatePath('/admin', 'layout');
  revalidatePath('/', 'layout');
  const msg = { approve: 'Anúncio aprovado e publicado.', reject: 'Anúncio rejeitado.', remove: 'Anúncio removido.', pause: 'Anúncio pausado.' };
  return { ok: true, message: msg[p.data.decision] };
}

export async function resolveReportAction(_: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const p = reportResolveSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { errors: zodErrors(p.error) };
  const { reportId, adId, op, resolution } = p.data;
  try {
    if (op !== 'dismiss' && adId) await adminModerateAd(admin.id, adId, op === 'remove' ? 'remove' : 'pause', resolution);
    await adminResolveReport(admin.id, reportId, op === 'dismiss' ? 'dismissed' : 'resolved', resolution);
  } catch (e) { return fail(e); }
  revalidatePath('/admin', 'layout');
  revalidatePath('/', 'layout');
  return { ok: true, message: op === 'dismiss' ? 'Denúncia arquivada.' : 'Denúncia resolvida.' };
}

export async function verifyAction(_: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const p = verifySchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { errors: zodErrors(p.error) };
  try {
    await adminSetVerification(admin.id, p.data.profileId, p.data.decision, p.data.note);
  } catch (e) { return fail(e); }
  revalidatePath('/admin', 'layout');
  revalidatePath('/', 'layout');
  return { ok: true, message: p.data.decision === 'verified' ? 'Perfil marcado como verificado.' : 'Verificação rejeitada.' };
}

export async function userAction(_: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const raw = Object.fromEntries([...fd.entries()].filter(([, v]) => v !== ''));
  const p = userAdminSchema.safeParse(raw);
  if (!p.success || (!p.data.role && !p.data.status)) return { message: 'Dados inválidos.' };
  try {
    await adminSetUser(admin.id, p.data.userId, { role: p.data.role, status: p.data.status });
  } catch (e) { return fail(e); }
  revalidatePath('/admin/usuarios');
  return { ok: true, message: 'Usuário atualizado.' };
}

export async function markMessageAction(_: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const id = String(fd.get('id') ?? '');
  if (!id) return { message: 'Mensagem inválida.' };
  await adminMarkMessage(admin.id, id);
  revalidatePath('/admin', 'layout');
  return { ok: true, message: 'Marcada como tratada.' };
}

export async function categoryAction(_: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const p = categorySchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { errors: zodErrors(p.error) };
  const existing = await getCategories(false);
  const slug = p.data.slug || slugify(p.data.name);
  if (!slug) return { errors: { name: 'Nome inválido.' } };
  if (!p.data.slug && existing.some((c) => c.slug === slug)) return { errors: { name: 'Já existe uma categoria com este nome.' } };
  await adminUpsertCategory(admin.id, { slug, name: p.data.name, description: p.data.description, active: p.data.active });
  revalidatePath('/admin/categorias');
  revalidatePath('/', 'layout');
  return { ok: true, message: p.data.slug ? 'Categoria atualizada.' : 'Categoria criada.' };
}

export async function cityAction(_: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const p = citySchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { errors: zodErrors(p.error) };
  const existing = await getCities(false);
  const slug = p.data.slug || slugify(p.data.name);
  if (!slug) return { errors: { name: 'Nome inválido.' } };
  if (!p.data.slug && existing.some((c) => c.slug === slug)) return { errors: { name: 'Esta cidade já está cadastrada.' } };
  const seen = new Set<string>();
  const regions = p.data.regions
    .map((name) => ({ slug: slugify(name), name }))
    .filter((r) => r.slug && !seen.has(r.slug) && seen.add(r.slug));
  await adminUpsertCity(admin.id, { slug, name: p.data.name, state: p.data.state, active: p.data.active, regions });
  revalidatePath('/admin/cidades');
  revalidatePath('/', 'layout');
  return { ok: true, message: p.data.slug ? 'Cidade atualizada.' : 'Cidade criada.' };
}

export async function planAction(_: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const p = planSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { errors: zodErrors(p.error) };
  const existing = await getPlans(false);
  const id = p.data.id || slugify(p.data.name);
  if (!p.data.id && existing.some((x) => x.id === id)) return { errors: { name: 'Já existe um plano com este nome.' } };
  await adminUpsertPlan(admin.id, {
    id, name: p.data.name, description: p.data.description, priceCents: p.data.price, periodDays: p.data.periodDays,
    features: p.data.features, highlight: p.data.highlight, active: p.data.active,
  });
  revalidatePath('/admin/planos');
  revalidatePath('/anunciar');
  return { ok: true, message: p.data.id ? 'Plano atualizado.' : 'Plano criado.' };
}

export async function settingsAction(_: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const p = settingsSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { errors: zodErrors(p.error) };
  await adminUpdateSettings(admin.id, p.data);
  revalidatePath('/', 'layout');
  return { ok: true, message: 'Configurações salvas.' };
}
