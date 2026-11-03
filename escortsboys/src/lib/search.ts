import type { Availability, PublicAd } from '@/lib/types';

export type SortKey = 'relevantes' | 'recentes' | 'atualizados' | 'disponiveis';

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'relevantes', label: 'Mais relevantes' },
  { value: 'recentes', label: 'Mais recentes' },
  { value: 'atualizados', label: 'Atualizados recentemente' },
  { value: 'disponiveis', label: 'Disponíveis agora' },
];

export interface SearchFilters {
  q: string;
  cidade: string;
  regiao: string;
  idadeMin: number | null;
  idadeMax: number | null;
  disponibilidade: Availability[];
  modalidades: string[];
  precoMin: number | null;
  precoMax: number | null;
  verificados: boolean;
  recentes: boolean; // atualizados nas últimas 24 h
  ordem: SortKey;
  pagina: number;
}

export const PAGE_SIZE = 12;

type Params = Record<string, string | string[] | undefined>;

const list = (v: string | string[] | undefined) => (Array.isArray(v) ? v : v ? v.split(',') : []).map((s) => s.trim()).filter(Boolean);
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';
const num = (v: string | string[] | undefined) => {
  const n = Number.parseInt(one(v), 10);
  return Number.isFinite(n) ? n : null;
};

const AVAIL: Availability[] = ['available_now', 'available_today', 'by_appointment'];

export function parseFilters(params: Params): SearchFilters {
  const ordem = one(params.ordem) as SortKey;
  const idadeMin = num(params.idade_min);
  const idadeMax = num(params.idade_max);
  return {
    q: one(params.q).slice(0, 80),
    cidade: one(params.cidade),
    regiao: one(params.regiao),
    idadeMin: idadeMin !== null ? Math.max(18, idadeMin) : null,
    idadeMax: idadeMax !== null ? Math.max(18, idadeMax) : null,
    disponibilidade: list(params.disp).filter((d): d is Availability => (AVAIL as string[]).includes(d)),
    modalidades: list(params.modo),
    precoMin: num(params.preco_min),
    precoMax: num(params.preco_max),
    verificados: one(params.verificados) === '1',
    recentes: one(params.recentes) === '1',
    ordem: SORT_OPTIONS.some((o) => o.value === ordem) ? ordem : 'relevantes',
    pagina: Math.max(1, num(params.pagina) ?? 1),
  };
}

/** Serializa filtros de volta para query string (omite valores padrão). */
export function filtersToQuery(f: Partial<SearchFilters>): string {
  const p = new URLSearchParams();
  if (f.q) p.set('q', f.q);
  if (f.cidade) p.set('cidade', f.cidade);
  if (f.regiao) p.set('regiao', f.regiao);
  if (f.idadeMin) p.set('idade_min', String(f.idadeMin));
  if (f.idadeMax) p.set('idade_max', String(f.idadeMax));
  if (f.disponibilidade?.length) p.set('disp', f.disponibilidade.join(','));
  if (f.modalidades?.length) p.set('modo', f.modalidades.join(','));
  if (f.precoMin) p.set('preco_min', String(f.precoMin));
  if (f.precoMax) p.set('preco_max', String(f.precoMax));
  if (f.verificados) p.set('verificados', '1');
  if (f.recentes) p.set('recentes', '1');
  if (f.ordem && f.ordem !== 'relevantes') p.set('ordem', f.ordem);
  if (f.pagina && f.pagina > 1) p.set('pagina', String(f.pagina));
  const s = p.toString();
  return s ? `?${s}` : '';
}

function normalize(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function haystack(ad: PublicAd) {
  return normalize(
    [ad.publicName, ad.title, ad.summary, ad.description, ad.cityName, ad.regionName ?? '', ad.areasServed.join(' '),
      ad.characteristics.map((c) => `${c.label} ${c.value}`).join(' '), ad.modes.map((m) => m.name).join(' ')].join(' '),
  );
}

/** Pontuação de relevância: texto, completude do anúncio, atualização recente e verificação. */
function relevance(ad: PublicAd, terms: string[], now: number): number {
  let score = 0;
  if (terms.length) {
    const h = haystack(ad);
    const name = normalize(ad.publicName);
    for (const t of terms) {
      if (name.includes(t)) score += 6;
      else if (h.includes(t)) score += 2;
    }
  }
  if (ad.verified) score += 3;
  if (ad.availabilityReliable && ad.availability !== 'unavailable') score += 2;
  score += Math.min(ad.photos.length, 6) * 0.25;
  if (ad.showPrices && ad.priceFrom !== null) score += 0.5;
  const hours = (now - new Date(ad.updatedAt).getTime()) / 3600_000;
  score += Math.max(0, 3 - hours / 24); // até +3 nas primeiras 72 h
  return score;
}

export interface SearchResult {
  items: PublicAd[];
  total: number;
  page: number;
  pages: number;
}

export function searchAds(ads: PublicAd[], f: SearchFilters, now = Date.now()): SearchResult {
  const terms = normalize(f.q).split(/\s+/).filter((t) => t.length >= 2);
  let rows = ads.filter((ad) => {
    if (f.cidade && ad.citySlug !== f.cidade) return false;
    if (f.regiao && ad.regionSlug !== f.regiao) return false;
    if (f.idadeMin !== null && (ad.age === null || ad.age < f.idadeMin)) return false;
    if (f.idadeMax !== null && (ad.age === null || ad.age > f.idadeMax)) return false;
    if (f.disponibilidade.length && !(ad.availabilityReliable && f.disponibilidade.includes(ad.availability))) return false;
    if (f.modalidades.length && !f.modalidades.every((m) => ad.modes.some((x) => x.slug === m))) return false;
    if (f.precoMin !== null && (ad.priceFrom === null || ad.priceFrom < f.precoMin)) return false;
    if (f.precoMax !== null && (ad.priceFrom === null || ad.priceFrom > f.precoMax)) return false;
    if (f.verificados && !ad.verified) return false;
    if (f.recentes && now - new Date(ad.updatedAt).getTime() > 24 * 3600_000) return false;
    if (terms.length) {
      const h = haystack(ad);
      if (!terms.every((t) => h.includes(t))) return false;
    }
    return true;
  });

  if (f.ordem === 'disponiveis') {
    rows = rows.filter((a) => a.availabilityReliable && a.availability === 'available_now');
  }

  const byDate = (k: 'publishedAt' | 'updatedAt') => (a: PublicAd, b: PublicAd) =>
    new Date(b[k] ?? b.updatedAt).getTime() - new Date(a[k] ?? a.updatedAt).getTime();

  if (f.ordem === 'recentes') rows.sort(byDate('publishedAt'));
  else if (f.ordem === 'atualizados' || f.ordem === 'disponiveis') rows.sort(byDate('updatedAt'));
  else {
    const scored = rows.map((ad) => ({ ad, s: relevance(ad, terms, now) }));
    scored.sort((a, b) => b.s - a.s || new Date(b.ad.updatedAt).getTime() - new Date(a.ad.updatedAt).getTime());
    rows = scored.map((x) => x.ad);
  }

  const total = rows.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(f.pagina, pages);
  return { items: rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), total, page, pages };
}
