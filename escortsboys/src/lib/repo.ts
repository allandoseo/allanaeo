import 'server-only';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { read, write } from '@/lib/db/store';
import { effectiveAvailability, isAvailabilityReliable } from '@/lib/availability';
import { slugify } from '@/lib/slug';
import type {
  Ad, AdStatus, Availability, Category, City, ContactMessage, Database, Plan, Profile, PublicAd, Report, ReportStatus,
  Role, Settings, User, UserStatus,
} from '@/lib/types';
import type { AdData } from '@/lib/validation';

const nowIso = () => new Date().toISOString();
export const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());

// ───────────────────────── Projeção pública ─────────────────────────

function isPublic(ad: Ad, db: Database) {
  if (ad.status !== 'active') return false;
  const owner = db.users.find((u) => u.id === ad.ownerId);
  return !!owner && owner.status === 'active';
}

export function toPublicAd(ad: Ad, db: Database): PublicAd {
  const city = db.cities.find((c) => c.slug === ad.citySlug);
  const region = city?.regions.find((r) => r.slug === ad.regionSlug) ?? null;
  const profile = db.profiles.find((p) => p.id === ad.profileId);
  const reliable = isAvailabilityReliable(ad.availability, ad.availabilityUpdatedAt);
  const amounts = ad.showPrices ? ad.prices.map((p) => p.amount).filter((n): n is number => typeof n === 'number') : [];
  return {
    id: ad.id,
    slug: ad.slug,
    title: ad.title,
    publicName: ad.publicName,
    age: ad.age,
    citySlug: ad.citySlug,
    cityName: city ? city.name : ad.citySlug,
    regionSlug: ad.regionSlug,
    regionName: region?.name ?? null,
    areasServed: ad.areasServed,
    summary: ad.summary,
    description: ad.description,
    characteristics: ad.characteristics,
    modes: ad.modes.map((slug) => ({ slug, name: db.categories.find((c) => c.slug === slug)?.name ?? slug })),
    availability: effectiveAvailability(ad.availability, ad.availabilityUpdatedAt),
    availabilityReliable: reliable,
    availabilityNote: reliable ? ad.availabilityNote : '',
    availabilityUpdatedAt: ad.availabilityUpdatedAt,
    schedule: ad.schedule,
    prices: ad.showPrices ? ad.prices : [],
    showPrices: ad.showPrices,
    priceFrom: amounts.length ? Math.min(...amounts) : null,
    rules: ad.rules,
    conditions: ad.conditions,
    hasWhatsapp: ad.contact.showWhatsapp && !!ad.contact.whatsapp,
    hasPhone: ad.contact.showPhone && !!ad.contact.phone,
    hasTelegram: ad.contact.showTelegram && !!ad.contact.telegram,
    photos: ad.photos,
    verified: profile?.verification === 'verified',
    isDemo: ad.isDemo,
    profileSlug: profile?.slug ?? '',
    updatedAt: ad.updatedAt,
    publishedAt: ad.publishedAt,
  };
}

export const listPublicAds = () => read((db) => db.ads.filter((a) => isPublic(a, db)).map((a) => toPublicAd(a, db)));

export const getPublicAdBySlug = (slug: string) =>
  read((db) => {
    const ad = db.ads.find((a) => a.slug === slug);
    return ad && isPublic(ad, db) ? toPublicAd(ad, db) : null;
  });

export const getPublicAdsByIds = (ids: string[]) =>
  read((db) => ids.map((id) => db.ads.find((a) => a.id === id)).filter((a): a is Ad => !!a && isPublic(a, db)).map((a) => toPublicAd(a, db)));

/** Contato só é revelado sob demanda (rota /api/contato), nunca no HTML. */
export const getAdContact = (adId: string) =>
  read((db) => {
    const ad = db.ads.find((a) => a.id === adId);
    if (!ad || !isPublic(ad, db)) return null;
    return {
      whatsapp: ad.contact.showWhatsapp ? ad.contact.whatsapp : null,
      phone: ad.contact.showPhone ? ad.contact.phone : null,
      telegram: ad.contact.showTelegram ? ad.contact.telegram : null,
      publicName: ad.publicName,
    };
  });

// ───────────────────────── Catálogos ─────────────────────────

export const getCities = (onlyActive = true) => read((db) => db.cities.filter((c) => !onlyActive || c.active));
export const getCity = (slug: string) => read((db) => db.cities.find((c) => c.slug === slug && c.active) ?? null);
export const getCategories = (onlyActive = true) => read((db) => db.categories.filter((c) => !onlyActive || c.active));
export const getPlans = (onlyActive = true) => read((db) => db.plans.filter((p) => !onlyActive || p.active));
export const getSettings = () => read((db) => db.settings);

/** Contagem de anúncios ativos por cidade e região (para páginas indexáveis e menus). */
export const getCoverage = () =>
  read((db) => {
    const out: Record<string, { total: number; regions: Record<string, number> }> = {};
    for (const ad of db.ads) {
      if (!isPublic(ad, db)) continue;
      const c = (out[ad.citySlug] ??= { total: 0, regions: {} });
      c.total++;
      if (ad.regionSlug) c.regions[ad.regionSlug] = (c.regions[ad.regionSlug] ?? 0) + 1;
    }
    return out;
  });

// ───────────────────────── Perfis ─────────────────────────

export const getProfileBySlug = (slug: string) =>
  read((db) => {
    const p = db.profiles.find((x) => x.slug === slug);
    if (!p) return null;
    const owner = db.users.find((u) => u.id === p.userId);
    if (!owner || owner.status !== 'active') return null;
    const ads = db.ads.filter((a) => a.profileId === p.id && isPublic(a, db)).map((a) => toPublicAd(a, db));
    if (!ads.length) return null; // perfil sem anúncio ativo não é público
    const city = db.cities.find((c) => c.slug === p.citySlug);
    return { profile: p, cityName: city?.name ?? '', ads };
  });

export const getProfileByUser = (userId: string) => read((db) => db.profiles.find((p) => p.userId === userId) ?? null);

function uniqueSlug(db: Database, base: string, kind: 'ad' | 'profile', ignoreId?: string) {
  const root = slugify(base) || 'anuncio';
  const taken = (s: string) =>
    kind === 'ad' ? db.ads.some((a) => a.slug === s && a.id !== ignoreId) : db.profiles.some((p) => p.slug === s && p.id !== ignoreId);
  if (!taken(root)) return root;
  for (let i = 2; ; i++) if (!taken(`${root}-${i}`)) return `${root}-${i}`;
}

export const upsertProfile = (userId: string, data: { publicName: string; bio: string; citySlug: string }) =>
  write((db) => {
    let p = db.profiles.find((x) => x.userId === userId);
    const t = nowIso();
    if (!p) {
      p = {
        id: randomUUID(), userId, slug: uniqueSlug(db, `${data.publicName}-${data.citySlug}`, 'profile'), publicName: data.publicName,
        bio: data.bio, citySlug: data.citySlug, avatarUrl: null, verification: 'none', verificationNote: null, isDemo: false, createdAt: t, updatedAt: t,
      };
      db.profiles.push(p);
    } else {
      Object.assign(p, data, { updatedAt: t });
    }
    const user = db.users.find((u) => u.id === userId);
    if (user && user.role === 'user') user.role = 'advertiser';
    return p;
  });

export const setProfileAvatar = (userId: string, url: string | null) =>
  write((db) => {
    const p = db.profiles.find((x) => x.userId === userId);
    if (p) Object.assign(p, { avatarUrl: url, updatedAt: nowIso() });
    return p ?? null;
  });

export const requestVerification = (userId: string) =>
  write((db) => {
    const p = db.profiles.find((x) => x.userId === userId);
    if (p && (p.verification === 'none' || p.verification === 'rejected')) Object.assign(p, { verification: 'pending', verificationNote: null, updatedAt: nowIso() });
    return p ?? null;
  });

// ───────────────────────── Usuários e sessões ─────────────────────────

export const findUserByEmail = (email: string) => read((db) => db.users.find((u) => u.email === email.toLowerCase()) ?? null);
export const getUserById = (id: string) => read((db) => db.users.find((u) => u.id === id) ?? null);

export const createUser = (data: { name: string; email: string; passwordHash: string; role: Role }) =>
  write((db) => {
    if (db.users.some((u) => u.email === data.email)) throw new Error('EMAIL_TAKEN');
    const t = nowIso();
    const user: User = { id: randomUUID(), ...data, status: 'active', ageConfirmedAt: t, termsAcceptedAt: t, createdAt: t, lastLoginAt: null };
    db.users.push(user);
    return user;
  });

export const updateUser = (id: string, patch: Partial<Pick<User, 'name' | 'passwordHash'>>) =>
  write((db) => {
    const u = db.users.find((x) => x.id === id);
    if (u) Object.assign(u, patch);
    return u ?? null;
  });

export const createSession = (userId: string, days: number) =>
  write((db) => {
    const token = randomBytes(32).toString('base64url');
    const t = new Date();
    db.sessions = db.sessions.filter((s) => new Date(s.expiresAt) > t);
    db.sessions.push({ tokenHash: sha256(token), userId, createdAt: t.toISOString(), expiresAt: new Date(t.getTime() + days * 86400_000).toISOString() });
    const u = db.users.find((x) => x.id === userId);
    if (u) u.lastLoginAt = t.toISOString();
    return token;
  });

export const getUserBySessionToken = (token: string) =>
  read((db) => {
    const s = db.sessions.find((x) => x.tokenHash === sha256(token));
    if (!s || new Date(s.expiresAt) < new Date()) return null;
    const u = db.users.find((x) => x.id === s.userId);
    return u && u.status === 'active' ? u : null;
  });

export const deleteSession = (token: string) => write((db) => { db.sessions = db.sessions.filter((s) => s.tokenHash !== sha256(token)); });
export const deleteUserSessions = (userId: string) => write((db) => { db.sessions = db.sessions.filter((s) => s.userId !== userId); });

export const createPasswordReset = (userId: string) =>
  write((db) => {
    const token = randomBytes(32).toString('base64url');
    const t = new Date();
    db.passwordResets = db.passwordResets.filter((r) => r.userId !== userId && new Date(r.expiresAt) > t);
    db.passwordResets.push({ tokenHash: sha256(token), userId, createdAt: t.toISOString(), expiresAt: new Date(t.getTime() + 3600_000).toISOString(), usedAt: null });
    return token;
  });

export const consumePasswordReset = (token: string, passwordHash: string) =>
  write((db) => {
    const r = db.passwordResets.find((x) => x.tokenHash === sha256(token));
    if (!r || r.usedAt || new Date(r.expiresAt) < new Date()) return false;
    const u = db.users.find((x) => x.id === r.userId);
    if (!u) return false;
    r.usedAt = nowIso();
    u.passwordHash = passwordHash;
    db.sessions = db.sessions.filter((s) => s.userId !== u.id);
    return true;
  });

export const isResetTokenValid = (token: string) =>
  read((db) => {
    const r = db.passwordResets.find((x) => x.tokenHash === sha256(token));
    return !!r && !r.usedAt && new Date(r.expiresAt) > new Date();
  });

// ───────────────────────── Favoritos ─────────────────────────

export const listFavoriteIds = (userId: string) => read((db) => db.favorites.filter((f) => f.userId === userId).map((f) => f.adId));

export const addFavorites = (userId: string, adIds: string[]) =>
  write((db) => {
    for (const adId of adIds) {
      const ad = db.ads.find((a) => a.id === adId);
      if (!ad || db.favorites.some((f) => f.userId === userId && f.adId === adId)) continue;
      db.favorites.push({ userId, adId, createdAt: nowIso() });
      ad.stats.favorites++;
      bump(db, adId, 'favorites');
    }
    return db.favorites.filter((f) => f.userId === userId).map((f) => f.adId);
  });

export const removeFavorite = (userId: string, adId: string) =>
  write((db) => {
    const before = db.favorites.length;
    db.favorites = db.favorites.filter((f) => !(f.userId === userId && f.adId === adId));
    const ad = db.ads.find((a) => a.id === adId);
    if (ad && before !== db.favorites.length) ad.stats.favorites = Math.max(0, ad.stats.favorites - 1);
    return db.favorites.filter((f) => f.userId === userId).map((f) => f.adId);
  });

// ───────────────────────── Estatísticas ─────────────────────────

function bump(db: Database, adId: string, field: 'views' | 'contacts' | 'favorites') {
  const d = today();
  let row = db.dailyStats.find((s) => s.adId === adId && s.date === d);
  if (!row) db.dailyStats.push((row = { adId, date: d, views: 0, contacts: 0, favorites: 0 }));
  row[field]++;
}

export const recordView = (adId: string) =>
  write((db) => {
    const ad = db.ads.find((a) => a.id === adId);
    if (!ad) return;
    ad.stats.views++;
    bump(db, adId, 'views');
  });

export const recordContact = (adId: string) =>
  write((db) => {
    const ad = db.ads.find((a) => a.id === adId);
    if (!ad) return;
    ad.stats.contactClicks++;
    bump(db, adId, 'contacts');
  });

export const getOwnerStats = (ownerId: string, days = 30) =>
  read((db) => {
    const ids = new Set(db.ads.filter((a) => a.ownerId === ownerId).map((a) => a.id));
    const since = new Date(Date.now() - days * 86400_000);
    const sinceStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(since);
    const rows = db.dailyStats.filter((s) => ids.has(s.adId) && s.date >= sinceStr);
    const byDate = new Map<string, { views: number; contacts: number; favorites: number }>();
    for (const r of rows) {
      const e = byDate.get(r.date) ?? { views: 0, contacts: 0, favorites: 0 };
      e.views += r.views; e.contacts += r.contacts; e.favorites += r.favorites;
      byDate.set(r.date, e);
    }
    const series = [...byDate.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, v]) => ({ date, ...v }));
    const totals = series.reduce((acc, r) => ({ views: acc.views + r.views, contacts: acc.contacts + r.contacts, favorites: acc.favorites + r.favorites }), { views: 0, contacts: 0, favorites: 0 });
    const perAd = db.ads.filter((a) => ids.has(a.id)).map((a) => ({ id: a.id, title: a.title, status: a.status, ...a.stats }));
    return { series, totals, perAd, hasData: rows.length > 0 };
  });

// ───────────────────────── Denúncias e contato ─────────────────────────

export const createReport = (data: Omit<Report, 'id' | 'status' | 'resolution' | 'createdAt' | 'resolvedAt'>) =>
  write((db) => {
    if (!db.ads.some((a) => a.id === data.adId)) throw new Error('AD_NOT_FOUND');
    const r: Report = { ...data, id: randomUUID(), status: 'open', resolution: null, createdAt: nowIso(), resolvedAt: null };
    db.reports.push(r);
    return r;
  });

export const createContactMessage = (data: Omit<ContactMessage, 'id' | 'createdAt' | 'handled'>) =>
  write((db) => {
    const m: ContactMessage = { ...data, id: randomUUID(), createdAt: nowIso(), handled: false };
    db.contactMessages.push(m);
    return m;
  });

// ───────────────────────── Anunciante ─────────────────────────

export const listAdsByOwner = (ownerId: string) =>
  read((db) => db.ads.filter((a) => a.ownerId === ownerId && a.status !== 'removed').sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));

export const getOwnAd = (ownerId: string, adId: string) => read((db) => db.ads.find((a) => a.id === adId && a.ownerId === ownerId && a.status !== 'removed') ?? null);

/** Campos que exigem nova moderação quando alterados num anúncio já aprovado. */
const SENSITIVE: (keyof AdData)[] = ['publicName', 'age', 'title', 'summary', 'description', 'photos', 'citySlug', 'regionSlug', 'characteristics', 'rules', 'conditions'];

function emptyAd(ownerId: string, profileId: string): Ad {
  const t = nowIso();
  return {
    id: randomUUID(), slug: '', ownerId, profileId, title: '', publicName: '', age: null, citySlug: '', regionSlug: null, areasServed: [],
    summary: '', description: '', characteristics: [], modes: [], availability: 'unknown', availabilityNote: '', availabilityUpdatedAt: null,
    schedule: [], prices: [], showPrices: false, rules: [], conditions: '',
    contact: { whatsapp: null, phone: null, telegram: null, showWhatsapp: false, showPhone: false, showTelegram: false },
    photos: [], imageConsentAt: null, status: 'draft', moderationNote: null, isDemo: false,
    stats: { views: 0, contactClicks: 0, favorites: 0 }, createdAt: t, updatedAt: t, publishedAt: null, draftStep: 1,
  };
}

/** Salva rascunho (dados parcialmente validados pelo chamador). */
export const saveAdDraft = (ownerId: string, adId: string | null, patch: Partial<Ad>, step: number) =>
  write((db) => {
    const profile = db.profiles.find((p) => p.userId === ownerId);
    if (!profile) throw new Error('NO_PROFILE');
    let ad = adId ? db.ads.find((a) => a.id === adId && a.ownerId === ownerId && a.status !== 'removed') : undefined;
    if (adId && !ad) throw new Error('NOT_FOUND');
    if (!ad) {
      ad = emptyAd(ownerId, profile.id);
      db.ads.push(ad);
    }
    Object.assign(ad, patch, { updatedAt: nowIso(), draftStep: Math.max(ad.draftStep, step) });
    return ad;
  });

/** Envia o anúncio (dados já validados pelo esquema completo). */
export const submitAd = (ownerId: string, adId: string, data: AdData) =>
  write((db) => {
    const ad = db.ads.find((a) => a.id === adId && a.ownerId === ownerId && a.status !== 'removed');
    if (!ad) throw new Error('NOT_FOUND');
    const wasLive = ad.status === 'active' || ad.status === 'paused';
    const changedSensitive = SENSITIVE.some((k) => JSON.stringify((ad as unknown as Record<string, unknown>)[k]) !== JSON.stringify((data as Record<string, unknown>)[k]));
    const t = nowIso();
    const { imageConsent: _consent, ...rest } = data;
    void _consent;
    Object.assign(ad, rest, {
      imageConsentAt: t,
      updatedAt: t,
      draftStep: 10,
      availabilityUpdatedAt: data.availability !== ad.availability || !ad.availabilityUpdatedAt ? t : ad.availabilityUpdatedAt,
    });
    if (!ad.slug) ad.slug = uniqueSlug(db, `${data.publicName}-${data.regionSlug}-${data.citySlug}`, 'ad', ad.id);
    const needsReview = db.settings.moderationRequired && (!wasLive || changedSensitive);
    if (needsReview) {
      ad.status = 'pending';
      ad.moderationNote = null;
    } else if (!wasLive) {
      ad.status = 'active';
      ad.publishedAt = t;
    }
    return ad;
  });

export const setOwnAdStatus = (ownerId: string, adId: string, action: 'pause' | 'resume' | 'delete') =>
  write((db) => {
    const ad = db.ads.find((a) => a.id === adId && a.ownerId === ownerId && a.status !== 'removed');
    if (!ad) throw new Error('NOT_FOUND');
    if (action === 'pause' && ad.status === 'active') ad.status = 'paused';
    else if (action === 'resume' && ad.status === 'paused') ad.status = 'active';
    else if (action === 'delete') {
      ad.status = 'removed';
      db.favorites = db.favorites.filter((f) => f.adId !== ad.id);
    } else throw new Error('INVALID_TRANSITION');
    ad.updatedAt = nowIso();
    return ad;
  });

export const updateOwnAvailability = (ownerId: string, adId: string | 'all', availability: Availability, note: string, schedule?: Ad['schedule']) =>
  write((db) => {
    const t = nowIso();
    const ads = db.ads.filter((a) => a.ownerId === ownerId && a.status !== 'removed' && (adId === 'all' || a.id === adId));
    for (const ad of ads) {
      ad.availability = availability;
      ad.availabilityNote = note;
      ad.availabilityUpdatedAt = t;
      if (schedule) ad.schedule = schedule;
      ad.updatedAt = t;
    }
    return ads.length;
  });

/** Remove dados pessoais e encerra a conta (LGPD: direito de eliminação). */
export const deleteAccount = (userId: string) =>
  write((db) => {
    const u = db.users.find((x) => x.id === userId);
    if (!u || u.role === 'admin') return false;
    db.ads.filter((a) => a.ownerId === userId).forEach((a) => { a.status = 'removed'; a.contact = { whatsapp: null, phone: null, telegram: null, showWhatsapp: false, showPhone: false, showTelegram: false }; a.photos = []; });
    db.profiles = db.profiles.filter((p) => p.userId !== userId);
    db.favorites = db.favorites.filter((f) => f.userId !== userId);
    db.sessions = db.sessions.filter((s) => s.userId !== userId);
    db.users = db.users.filter((x) => x.id !== userId);
    return true;
  });

// ───────────────────────── Administração ─────────────────────────

function audit(db: Database, actorId: string, action: string, target: string, note: string | null = null) {
  db.audit.unshift({ id: randomUUID(), actorId, action, target, note, createdAt: nowIso() });
  db.audit = db.audit.slice(0, 2000);
}

export const adminOverview = () =>
  read((db) => ({
    users: db.users.length,
    advertisers: db.users.filter((u) => u.role === 'advertiser').length,
    activeAds: db.ads.filter((a) => a.status === 'active').length,
    pendingAds: db.ads.filter((a) => a.status === 'pending').length,
    openReports: db.reports.filter((r) => r.status === 'open').length,
    pendingVerifications: db.profiles.filter((p) => p.verification === 'pending').length,
    unreadMessages: db.contactMessages.filter((m) => !m.handled).length,
    recentAudit: db.audit.slice(0, 15).map((a) => ({ ...a, actor: db.users.find((u) => u.id === a.actorId)?.email ?? '—' })),
  }));

export const adminListUsers = (q = '') =>
  read((db) =>
    db.users
      .filter((u) => !q || u.email.includes(q.toLowerCase()) || u.name.toLowerCase().includes(q.toLowerCase()))
      .map((u) => ({ ...u, passwordHash: undefined, ads: db.ads.filter((a) => a.ownerId === u.id && a.status !== 'removed').length }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  );

export const adminSetUser = (actorId: string, userId: string, patch: { role?: Role; status?: UserStatus }) =>
  write((db) => {
    const u = db.users.find((x) => x.id === userId);
    if (!u) throw new Error('NOT_FOUND');
    if (u.id === actorId) throw new Error('SELF_CHANGE');
    Object.assign(u, patch);
    if (patch.status === 'suspended') db.sessions = db.sessions.filter((s) => s.userId !== u.id);
    audit(db, actorId, `user.${patch.role ? 'role:' + patch.role : 'status:' + patch.status}`, u.email);
    return u;
  });

export const adminListAds = (status?: AdStatus | 'all') =>
  read((db) =>
    db.ads
      .filter((a) => (status && status !== 'all' ? a.status === status : a.status !== 'draft'))
      .map((a) => ({
        ad: a,
        owner: db.users.find((u) => u.id === a.ownerId)?.email ?? '—',
        profile: db.profiles.find((p) => p.id === a.profileId) ?? null,
        reports: db.reports.filter((r) => r.adId === a.id && r.status === 'open').length,
      }))
      .sort((x, y) => y.ad.updatedAt.localeCompare(x.ad.updatedAt)),
  );

export const adminGetAd = (adId: string) =>
  read((db) => {
    const ad = db.ads.find((a) => a.id === adId);
    if (!ad) return null;
    return {
      ad,
      owner: db.users.find((u) => u.id === ad.ownerId) ?? null,
      profile: db.profiles.find((p) => p.id === ad.profileId) ?? null,
      reports: db.reports.filter((r) => r.adId === ad.id),
      cityName: db.cities.find((c) => c.slug === ad.citySlug)?.name ?? ad.citySlug,
    };
  });

export const adminModerateAd = (actorId: string, adId: string, decision: 'approve' | 'reject' | 'remove' | 'pause', note: string) =>
  write((db) => {
    const ad = db.ads.find((a) => a.id === adId);
    if (!ad) throw new Error('NOT_FOUND');
    const t = nowIso();
    if (decision === 'approve') {
      ad.status = 'active';
      ad.publishedAt ??= t;
      ad.moderationNote = null;
    } else if (decision === 'reject') {
      ad.status = 'rejected';
      ad.moderationNote = note || 'Anúncio em desacordo com as diretrizes.';
    } else if (decision === 'pause') {
      ad.status = 'paused';
      ad.moderationNote = note || null;
    } else {
      ad.status = 'removed';
      ad.moderationNote = note || 'Removido pela moderação.';
      db.favorites = db.favorites.filter((f) => f.adId !== ad.id);
    }
    ad.updatedAt = t;
    audit(db, actorId, `ad.${decision}`, ad.slug || ad.id, note || null);
    return ad;
  });

export const adminListReports = (status: ReportStatus | 'all' = 'open') =>
  read((db) =>
    db.reports
      .filter((r) => status === 'all' || r.status === status)
      .map((r) => {
        const ad = db.ads.find((a) => a.id === r.adId);
        return { report: r, adTitle: ad?.title ?? '(removido)', adSlug: ad?.slug ?? '', adStatus: ad?.status ?? 'removed' };
      })
      .sort((a, b) => b.report.createdAt.localeCompare(a.report.createdAt)),
  );

export const adminResolveReport = (actorId: string, reportId: string, status: 'resolved' | 'dismissed', resolution: string) =>
  write((db) => {
    const r = db.reports.find((x) => x.id === reportId);
    if (!r) throw new Error('NOT_FOUND');
    Object.assign(r, { status, resolution, resolvedAt: nowIso() });
    audit(db, actorId, `report.${status}`, r.id, resolution);
    return r;
  });

export const adminListVerifications = () =>
  read((db) =>
    db.profiles
      .filter((p) => p.verification === 'pending')
      .map((p) => ({ profile: p, email: db.users.find((u) => u.id === p.userId)?.email ?? '—' })),
  );

export const adminSetVerification = (actorId: string, profileId: string, verification: 'verified' | 'rejected' | 'none', note: string) =>
  write((db) => {
    const p = db.profiles.find((x) => x.id === profileId);
    if (!p) throw new Error('NOT_FOUND');
    if (p.isDemo && verification === 'verified') throw new Error('DEMO_CANNOT_BE_VERIFIED');
    Object.assign(p, { verification, verificationNote: note || null, updatedAt: nowIso() });
    audit(db, actorId, `profile.verification:${verification}`, p.slug, note || null);
    return p;
  });

export const adminUpsertCity = (actorId: string, city: City) =>
  write((db) => {
    const i = db.cities.findIndex((c) => c.slug === city.slug);
    if (i >= 0) db.cities[i] = city; else db.cities.push(city);
    db.cities.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    audit(db, actorId, i >= 0 ? 'city.update' : 'city.create', city.slug);
    return city;
  });

export const adminUpsertCategory = (actorId: string, cat: Category) =>
  write((db) => {
    const i = db.categories.findIndex((c) => c.slug === cat.slug);
    if (i >= 0) db.categories[i] = cat; else db.categories.push(cat);
    audit(db, actorId, i >= 0 ? 'category.update' : 'category.create', cat.slug);
    return cat;
  });

export const adminUpsertPlan = (actorId: string, plan: Plan) =>
  write((db) => {
    const i = db.plans.findIndex((p) => p.id === plan.id);
    if (i >= 0) db.plans[i] = plan; else db.plans.push(plan);
    audit(db, actorId, i >= 0 ? 'plan.update' : 'plan.create', plan.id);
    return plan;
  });

export const adminUpdateSettings = (actorId: string, patch: Partial<Settings>) =>
  write((db) => {
    db.settings = { ...db.settings, ...patch };
    audit(db, actorId, 'settings.update', 'settings');
    return db.settings;
  });

export const adminListMessages = () => read((db) => [...db.contactMessages].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));

export const adminMarkMessage = (actorId: string, id: string) =>
  write((db) => {
    const m = db.contactMessages.find((x) => x.id === id);
    if (m) m.handled = true;
    audit(db, actorId, 'message.handled', id);
  });

export type { Profile };
