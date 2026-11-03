import { z } from 'zod';
import { normalizePhoneBR } from '@/lib/format';

const email = z.string().trim().toLowerCase().email('Informe um e-mail válido.').max(160);
const password = z
  .string()
  .min(8, 'A senha precisa ter pelo menos 8 caracteres.')
  .max(128, 'A senha pode ter no máximo 128 caracteres.')
  .regex(/[A-Za-z]/, 'Inclua pelo menos uma letra.')
  .regex(/\d/, 'Inclua pelo menos um número.');

const checkbox = (msg: string) =>
  z.preprocess((v) => v === 'on' || v === 'true' || v === true, z.boolean()).refine((v) => v, { message: msg });

export const signupSchema = z
  .object({
    name: z.string().trim().min(2, 'Informe seu nome.').max(80),
    email,
    password,
    confirm: z.string(),
    adult: checkbox('É necessário confirmar que você tem 18 anos ou mais.'),
    terms: checkbox('É necessário aceitar os termos de uso e a política de privacidade.'),
    intent: z.enum(['user', 'advertiser']).default('user'),
  })
  .refine((d) => d.password === d.confirm, { path: ['confirm'], message: 'As senhas não conferem.' });

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Informe sua senha.'),
  remember: z.preprocess((v) => v === 'on' || v === 'true', z.boolean()).default(false),
});

export const forgotSchema = z.object({ email });

export const resetSchema = z
  .object({ token: z.string().min(20), password, confirm: z.string() })
  .refine((d) => d.password === d.confirm, { path: ['confirm'], message: 'As senhas não conferem.' });

export const reportSchema = z.object({
  adId: z.string().min(1),
  reason: z.enum(['minor', 'non_consensual_images', 'impersonation', 'third_party', 'personal_data', 'fraud', 'other'], {
    errorMap: () => ({ message: 'Selecione o motivo da denúncia.' }),
  }),
  details: z.string().trim().max(2000).default(''),
  email: z.union([email, z.literal('')]).optional(),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2, 'Informe seu nome.').max(80),
  email,
  subject: z.enum(['duvida', 'anuncio', 'remocao', 'privacidade', 'imprensa', 'outro']),
  message: z.string().trim().min(10, 'Escreva pelo menos 10 caracteres.').max(4000),
});

export const profileSchema = z.object({
  publicName: z.string().trim().min(2, 'Informe o nome público.').max(40),
  bio: z.string().trim().max(1500).default(''),
  citySlug: z.string().min(1, 'Selecione a cidade.'),
});

export const accountSchema = z.object({
  name: z.string().trim().min(2, 'Informe seu nome.').max(80),
});

export const changePasswordSchema = z
  .object({ current: z.string().min(1, 'Informe a senha atual.'), password, confirm: z.string() })
  .refine((d) => d.password === d.confirm, { path: ['confirm'], message: 'As senhas não conferem.' });

const optionalPhone = z
  .string()
  .trim()
  .max(30)
  .transform((v, ctx) => {
    if (!v) return null;
    const n = normalizePhoneBR(v);
    if (!n) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Telefone inválido. Use DDD + número.' });
      return z.NEVER;
    }
    return n;
  });

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Horário inválido.');

/** Bloqueia telefones, e-mails e links no texto livre (contato só pelos campos próprios). */
const noContactInText = (label: string) =>
  z
    .string()
    .trim()
    .refine((v) => !/(\d[\s.-]?){8,}/.test(v), { message: `Não inclua telefone em ${label}. Use a etapa Contato.` })
    .refine((v) => !/[\w.+-]+@[\w-]+\.[\w.]+/.test(v), { message: `Não inclua e-mail em ${label}.` })
    .refine((v) => !/https?:\/\/|www\./i.test(v), { message: `Não inclua links em ${label}.` });

/** Esquema completo do anúncio (exigido para enviar à moderação). */
export const adSchema = z.object({
  publicName: z.string().trim().min(2, 'Informe o nome público.').max(40),
  age: z.coerce.number({ invalid_type_error: 'Informe a idade.' }).int().min(18, 'A idade mínima para anunciar é 18 anos.').max(80, 'Idade inválida.'),
  title: noContactInText('o título').pipe(z.string().min(8, 'O título precisa ter pelo menos 8 caracteres.').max(90)),
  citySlug: z.string().min(1, 'Selecione a cidade.'),
  regionSlug: z.string().min(1, 'Selecione o bairro ou região principal.'),
  areasServed: z.array(z.string().trim().min(2).max(40)).max(10).default([]),
  summary: noContactInText('o resumo').pipe(z.string().min(20, 'O resumo precisa ter pelo menos 20 caracteres.').max(220)),
  description: noContactInText('a descrição').pipe(z.string().min(80, 'A descrição precisa ter pelo menos 80 caracteres.').max(4000)),
  characteristics: z
    .array(z.object({ label: z.string().trim().min(1).max(30), value: z.string().trim().min(1).max(60) }))
    .max(15)
    .default([]),
  modes: z.array(z.string()).min(1, 'Selecione pelo menos uma modalidade de atendimento.'),
  availability: z.enum(['unknown', 'available_now', 'available_today', 'by_appointment', 'unavailable']).default('unknown'),
  availabilityNote: z.string().trim().max(120).default(''),
  schedule: z
    .array(z.object({ day: z.number().int().min(0).max(6), from: time, to: time }))
    .max(21)
    .default([]),
  showPrices: z.boolean().default(false),
  prices: z
    .array(z.object({ label: z.string().trim().min(1).max(40), amount: z.number().int().min(1).max(100000).nullable() }))
    .max(10)
    .default([]),
  rules: z.array(noContactInText('as regras').pipe(z.string().min(3).max(160))).max(12).default([]),
  conditions: noContactInText('as condições').pipe(z.string().max(1000)).default(''),
  photos: z
    .array(z.object({ id: z.string(), url: z.string().startsWith('/'), width: z.number(), height: z.number(), alt: z.string().max(140) }))
    .min(1, 'Envie pelo menos uma foto.')
    .max(12, 'Máximo de 12 fotos.'),
  imageConsent: z.literal(true, { errorMap: () => ({ message: 'Confirme que você tem autorização para publicar todas as imagens.' }) }),
  contact: z
    .object({
      whatsapp: optionalPhone,
      phone: optionalPhone,
      telegram: z
        .string()
        .trim()
        .max(32)
        .transform((v) => (v ? v.replace(/^@/, '') : null))
        .refine((v) => v === null || /^[A-Za-z0-9_]{5,32}$/.test(v), 'Usuário do Telegram inválido.'),
      showWhatsapp: z.boolean(),
      showPhone: z.boolean(),
      showTelegram: z.boolean(),
    })
    .refine((c) => (c.showWhatsapp && c.whatsapp) || (c.showPhone && c.phone) || (c.showTelegram && c.telegram), {
      message: 'Informe e autorize a exibição de pelo menos uma forma de contato.',
    }),
});

export type AdInput = z.input<typeof adSchema>;
export type AdData = z.output<typeof adSchema>;

/** Etapas do assistente e os campos validados em cada uma. */
export const AD_STEPS = [
  { n: 1, label: 'Informações básicas', fields: ['publicName', 'age', 'title'] },
  { n: 2, label: 'Localização', fields: ['citySlug', 'regionSlug', 'areasServed'] },
  { n: 3, label: 'Descrição', fields: ['summary', 'description'] },
  { n: 4, label: 'Características', fields: ['characteristics'] },
  { n: 5, label: 'Modalidades', fields: ['modes'] },
  { n: 6, label: 'Disponibilidade', fields: ['availability', 'availabilityNote', 'schedule'] },
  { n: 7, label: 'Valores', fields: ['showPrices', 'prices', 'rules', 'conditions'] },
  { n: 8, label: 'Fotos', fields: ['photos', 'imageConsent'] },
  { n: 9, label: 'Contato', fields: ['contact'] },
  { n: 10, label: 'Revisão', fields: [] },
] as const;

export type FieldErrors = Record<string, string>;

export function zodErrors(err: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of err.issues) {
    const key = issue.path.length ? issue.path.join('.') : '_';
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/** Valida apenas os campos de uma etapa. */
export function validateStep(step: number, data: unknown): FieldErrors {
  const def = AD_STEPS.find((s) => s.n === step);
  if (!def || def.fields.length === 0) return {};
  const mask = Object.fromEntries(def.fields.map((f) => [f, true])) as Record<string, true>;
  const res = adSchema.pick(mask as never).safeParse(data);
  return res.success ? {} : zodErrors(res.error);
}
