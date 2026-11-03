import { describe, expect, it } from 'vitest';
import { filtersToQuery, parseFilters, searchAds, PAGE_SIZE } from '@/lib/search';
import type { PublicAd } from '@/lib/types';

const base: PublicAd = {
  id: 'x', slug: 'x', title: 'Título', publicName: 'Nome', age: 30, citySlug: 'rio-de-janeiro', cityName: 'Rio de Janeiro',
  regionSlug: 'copacabana', regionName: 'Copacabana', areasServed: [], summary: 'Resumo', description: 'Descrição', characteristics: [],
  modes: [{ slug: 'hotel', name: 'Hotel ou motel' }], availability: 'unknown', availabilityReliable: false, availabilityNote: '',
  availabilityUpdatedAt: null, schedule: [], prices: [], showPrices: false, priceFrom: null, rules: [], conditions: '',
  hasWhatsapp: false, hasPhone: false, hasTelegram: false, photos: [], verified: false, isDemo: false, profileSlug: 'p',
  updatedAt: new Date().toISOString(), publishedAt: new Date().toISOString(),
};
const ad = (p: Partial<PublicAd>): PublicAd => ({ ...base, ...p });

describe('parseFilters', () => {
  it('aplica padrões e sanitiza valores', () => {
    const f = parseFilters({ idade_min: '15', ordem: 'invalida', disp: 'available_now,qualquer', pagina: '-3' });
    expect(f.idadeMin).toBe(18);
    expect(f.ordem).toBe('relevantes');
    expect(f.disponibilidade).toEqual(['available_now']);
    expect(f.pagina).toBe(1);
  });
  it('faz ida e volta pela query string', () => {
    const f = parseFilters({ q: 'moreno', cidade: 'sao-paulo', modo: ['hotel', 'eventos'], verificados: '1', ordem: 'recentes' });
    expect(parseFilters(Object.fromEntries(new URLSearchParams(filtersToQuery(f).slice(1))))).toMatchObject({
      q: 'moreno', cidade: 'sao-paulo', modalidades: ['hotel', 'eventos'], verificados: true, ordem: 'recentes',
    });
  });
});

describe('searchAds', () => {
  const ads = [
    ad({ id: '1', publicName: 'Rafael', age: 29, priceFrom: 300, showPrices: true }),
    ad({ id: '2', publicName: 'Diego', age: 40, citySlug: 'sao-paulo', regionSlug: 'jardins', modes: [{ slug: 'eventos', name: 'Eventos' }] }),
    ad({ id: '3', publicName: 'Lucas', age: 22, verified: true, availability: 'available_now', availabilityReliable: true }),
    ad({ id: '4', publicName: 'Bruno', age: 35, updatedAt: new Date(Date.now() - 5 * 86400_000).toISOString() }),
  ];

  it('filtra por cidade, idade e modalidade combinadas', () => {
    const r = searchAds(ads, parseFilters({ cidade: 'rio-de-janeiro', idade_min: '25', modo: 'hotel' }));
    expect(r.items.map((a) => a.id).sort()).toEqual(['1', '4']);
  });
  it('busca textual ignora acentos e maiúsculas', () => {
    expect(searchAds(ads, parseFilters({ q: 'DIÉGO' })).items.map((a) => a.id)).toEqual(['2']);
  });
  it('disponibilidade só conta status confiável', () => {
    expect(searchAds(ads, parseFilters({ disp: 'available_now' })).items.map((a) => a.id)).toEqual(['3']);
    expect(searchAds(ads, parseFilters({ ordem: 'disponiveis' })).items.map((a) => a.id)).toEqual(['3']);
  });
  it('faixa de preço exclui anúncios sem valor informado', () => {
    expect(searchAds(ads, parseFilters({ preco_max: '350' })).items.map((a) => a.id)).toEqual(['1']);
  });
  it('verificados e recentes', () => {
    expect(searchAds(ads, parseFilters({ verificados: '1' })).items.map((a) => a.id)).toEqual(['3']);
    expect(searchAds(ads, parseFilters({ recentes: '1' })).items.map((a) => a.id)).not.toContain('4');
  });
  it('pagina resultados e limita a página máxima', () => {
    const many = Array.from({ length: PAGE_SIZE + 3 }, (_, i) => ad({ id: String(i) }));
    const r = searchAds(many, parseFilters({ pagina: '99' }));
    expect(r.pages).toBe(2);
    expect(r.page).toBe(2);
    expect(r.items).toHaveLength(3);
  });
});
