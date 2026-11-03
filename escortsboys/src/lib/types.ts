// Modelo de domínio do EscortsBoys. Espelha supabase/migrations/0001_schema.sql.

export type Role = 'user' | 'advertiser' | 'admin';
export type UserStatus = 'active' | 'suspended';

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: Role;
  status: UserStatus;
  /** Declaração de maioridade feita no cadastro (obrigatória). */
  ageConfirmedAt: string;
  termsAcceptedAt: string;
  createdAt: string;
  lastLoginAt: string | null;
}

export type Verification = 'none' | 'pending' | 'verified' | 'rejected';

/** Perfil público do anunciante (um por usuário anunciante). */
export interface Profile {
  id: string;
  userId: string;
  slug: string;
  publicName: string;
  bio: string;
  citySlug: string;
  avatarUrl: string | null;
  verification: Verification;
  verificationNote: string | null;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AdStatus = 'draft' | 'pending' | 'active' | 'paused' | 'rejected' | 'removed';

/**
 * Disponibilidade declarada pelo anunciante. "available_now" só é considerado
 * confiável enquanto availabilityUpdatedAt estiver dentro da janela definida
 * em lib/availability.ts.
 */
export type Availability = 'unknown' | 'available_now' | 'available_today' | 'by_appointment' | 'unavailable';

export interface ScheduleSlot {
  /** 0 = domingo … 6 = sábado */
  day: number;
  from: string; // HH:MM
  to: string; // HH:MM
}

export interface PriceItem {
  label: string;
  /** Valor em reais; null = "consultar". */
  amount: number | null;
}

export interface Photo {
  id: string;
  url: string;
  width: number;
  height: number;
  alt: string;
}

export interface Characteristic {
  label: string;
  value: string;
}

export interface AdContact {
  whatsapp: string | null;
  phone: string | null;
  telegram: string | null;
  showWhatsapp: boolean;
  showPhone: boolean;
  showTelegram: boolean;
}

export interface AdStats {
  views: number;
  contactClicks: number;
  favorites: number;
}

export interface Ad {
  id: string;
  slug: string;
  ownerId: string;
  profileId: string;
  title: string;
  publicName: string;
  age: number | null;
  citySlug: string;
  regionSlug: string | null;
  /** Bairros/regiões atendidos (texto livre curto, nunca endereço). */
  areasServed: string[];
  summary: string;
  description: string;
  characteristics: Characteristic[];
  /** slugs de categorias (modalidades de atendimento) */
  modes: string[];
  availability: Availability;
  availabilityNote: string;
  availabilityUpdatedAt: string | null;
  schedule: ScheduleSlot[];
  prices: PriceItem[];
  showPrices: boolean;
  rules: string[];
  conditions: string;
  contact: AdContact;
  photos: Photo[];
  /** Momento em que o anunciante declarou ter autorização sobre todas as imagens. */
  imageConsentAt: string | null;
  status: AdStatus;
  moderationNote: string | null;
  isDemo: boolean;
  stats: AdStats;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  /** Etapa do assistente em que o rascunho parou. */
  draftStep: number;
}

export interface Region {
  slug: string;
  name: string;
}

export interface City {
  slug: string;
  name: string;
  state: string;
  regions: Region[];
  active: boolean;
}

export interface Category {
  slug: string;
  name: string;
  description: string;
  active: boolean;
}

export interface Plan {
  id: string;
  name: string;
  description: string;
  /** Em centavos; null = valor a definir pela administração. */
  priceCents: number | null;
  periodDays: number;
  features: string[];
  highlight: boolean;
  active: boolean;
}

export type ReportReason =
  | 'minor'
  | 'non_consensual_images'
  | 'impersonation'
  | 'third_party'
  | 'personal_data'
  | 'fraud'
  | 'other';

export type ReportStatus = 'open' | 'resolved' | 'dismissed';

export interface Report {
  id: string;
  adId: string;
  reason: ReportReason;
  details: string;
  reporterEmail: string | null;
  reporterUserId: string | null;
  status: ReportStatus;
  resolution: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

export interface Favorite {
  userId: string;
  adId: string;
  createdAt: string;
}

export interface Session {
  tokenHash: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

export interface PasswordReset {
  tokenHash: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
  usedAt: string | null;
}

export type EventType = 'view' | 'contact_whatsapp' | 'contact_phone' | 'contact_telegram' | 'favorite';

/** Contadores diários por anúncio (sem dados pessoais do visitante). */
export interface DailyStat {
  adId: string;
  date: string; // YYYY-MM-DD
  views: number;
  contacts: number;
  favorites: number;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
  handled: boolean;
}

export interface Settings {
  siteName: string;
  contactEmail: string;
  /** Anúncios novos e editados passam por moderação antes de ficar públicos. */
  moderationRequired: boolean;
  minPhotos: number;
  maxPhotos: number;
  /** Mínimo de anúncios ativos para uma página de cidade/região ser indexável. */
  minAdsForIndex: number;
  notice: string;
}

export interface AuditEntry {
  id: string;
  actorId: string;
  action: string;
  target: string;
  note: string | null;
  createdAt: string;
}

export interface Database {
  version: number;
  users: User[];
  profiles: Profile[];
  ads: Ad[];
  cities: City[];
  categories: Category[];
  plans: Plan[];
  reports: Report[];
  favorites: Favorite[];
  sessions: Session[];
  passwordResets: PasswordReset[];
  dailyStats: DailyStat[];
  contactMessages: ContactMessage[];
  settings: Settings;
  audit: AuditEntry[];
}

/** Forma pública do anúncio: nunca inclui ownerId, contato não autorizado ou notas de moderação. */
export interface PublicAd {
  id: string;
  slug: string;
  title: string;
  publicName: string;
  age: number | null;
  citySlug: string;
  cityName: string;
  regionSlug: string | null;
  regionName: string | null;
  areasServed: string[];
  summary: string;
  description: string;
  characteristics: Characteristic[];
  modes: { slug: string; name: string }[];
  availability: Availability;
  availabilityReliable: boolean;
  availabilityNote: string;
  availabilityUpdatedAt: string | null;
  schedule: ScheduleSlot[];
  prices: PriceItem[];
  showPrices: boolean;
  priceFrom: number | null;
  rules: string[];
  conditions: string;
  hasWhatsapp: boolean;
  hasPhone: boolean;
  hasTelegram: boolean;
  photos: Photo[];
  verified: boolean;
  isDemo: boolean;
  profileSlug: string;
  updatedAt: string;
  publishedAt: string | null;
}
