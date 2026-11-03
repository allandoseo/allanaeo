import { z } from 'zod';

const bool = z.preprocess((v) => v === 'on' || v === 'true' || v === true, z.boolean());
const lines = z.string().default('').transform((s) => s.split('\n').map((x) => x.trim()).filter(Boolean));

export const moderateSchema = z
  .object({
    adId: z.string().min(1),
    decision: z.enum(['approve', 'reject', 'remove', 'pause']),
    note: z.string().trim().max(500).default(''),
  })
  .refine((d) => d.decision === 'approve' || d.decision === 'pause' || d.note.length >= 5, { path: ['note'], message: 'Informe o motivo (mínimo 5 caracteres).' });

export const reportResolveSchema = z.object({
  reportId: z.string().min(1),
  adId: z.string().default(''),
  op: z.enum(['remove', 'pause', 'dismiss']),
  resolution: z.string().trim().min(5, 'Descreva a resolução (mínimo 5 caracteres).').max(500),
});

export const verifySchema = z
  .object({ profileId: z.string().min(1), decision: z.enum(['verified', 'rejected']), note: z.string().trim().max(500).default('') })
  .refine((d) => d.decision === 'verified' || d.note.length >= 5, { path: ['note'], message: 'Informe o motivo da rejeição.' });

export const userAdminSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(['user', 'advertiser', 'admin']).optional(),
  status: z.enum(['active', 'suspended']).optional(),
});

export const categorySchema = z.object({
  slug: z.string().default(''),
  name: z.string().trim().min(2, 'Informe o nome.').max(60),
  description: z.string().trim().max(200).default(''),
  active: bool,
});

export const citySchema = z.object({
  slug: z.string().default(''),
  name: z.string().trim().min(2, 'Informe o nome da cidade.').max(60),
  state: z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/, 'UF deve ter 2 letras.'),
  active: bool,
  regions: lines,
});

export const planSchema = z.object({
  id: z.string().default(''),
  name: z.string().trim().min(2, 'Informe o nome do plano.').max(40),
  description: z.string().trim().max(200).default(''),
  price: z
    .string()
    .trim()
    .default('')
    .transform((v, ctx) => {
      if (!v) return null;
      const n = Number(v.replace(/\./g, '').replace(',', '.'));
      if (!Number.isFinite(n) || n < 0 || n > 100000) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Preço inválido.' });
        return z.NEVER;
      }
      return Math.round(n * 100);
    }),
  periodDays: z.coerce.number().int().min(1, 'Período mínimo de 1 dia.').max(365),
  features: lines,
  highlight: bool,
  active: bool,
});

export const settingsSchema = z
  .object({
    siteName: z.string().trim().min(2).max(60),
    contactEmail: z.string().trim().email('E-mail inválido.'),
    moderationRequired: bool,
    minPhotos: z.coerce.number().int().min(1).max(12),
    maxPhotos: z.coerce.number().int().min(1).max(30),
    minAdsForIndex: z.coerce.number().int().min(1).max(50),
    notice: z.string().trim().max(300).default(''),
  })
  .refine((d) => d.maxPhotos >= d.minPhotos, { path: ['maxPhotos'], message: 'O máximo deve ser maior ou igual ao mínimo.' });
