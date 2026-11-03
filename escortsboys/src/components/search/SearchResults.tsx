import Link from 'next/link';
import { Suspense } from 'react';
import { AdGrid } from '../AdCard';
import { EmptyState, LinkButton, Pagination } from '../ui';
import { FiltersForm } from './FiltersForm';
import { SortSelect } from './SortSelect';
import { filtersToQuery, searchAds, type SearchFilters } from '@/lib/search';
import { getCategories, getCities, listPublicAds } from '@/lib/repo';
import { AVAILABILITY_LABEL } from '@/lib/availability';
import { formatBRL } from '@/lib/format';

/** Resultado + filtros + ordenação + paginação, compartilhado por /anuncios e páginas de cidade. */
export async function SearchResults({ f, basePath, lockedCity }: { f: SearchFilters; basePath: string; lockedCity?: boolean }) {
  const [ads, cities, categories] = await Promise.all([listPublicAds(), getCities(), getCategories()]);
  const res = searchAds(ads, f);
  const city = cities.find((c) => c.slug === f.cidade);
  const region = city?.regions.find((r) => r.slug === f.regiao);

  // Chips de filtros ativos, cada um com link que remove só aquele filtro.
  const chips: { label: string; href: string }[] = [];
  const without = (patch: Partial<SearchFilters>) => `/anuncios${filtersToQuery({ ...f, pagina: 1, ...patch })}`;
  if (f.q) chips.push({ label: `“${f.q}”`, href: without({ q: '' }) });
  if (city && !lockedCity) chips.push({ label: city.name, href: without({ cidade: '', regiao: '' }) });
  if (region && !lockedCity) chips.push({ label: region.name, href: without({ regiao: '' }) });
  if (f.idadeMin || f.idadeMax) chips.push({ label: `${f.idadeMin ?? 18}–${f.idadeMax ?? '+'} anos`, href: without({ idadeMin: null, idadeMax: null }) });
  f.disponibilidade.forEach((d) => chips.push({ label: AVAILABILITY_LABEL[d], href: without({ disponibilidade: f.disponibilidade.filter((x) => x !== d) }) }));
  f.modalidades.forEach((m) => chips.push({ label: categories.find((c) => c.slug === m)?.name ?? m, href: without({ modalidades: f.modalidades.filter((x) => x !== m) }) }));
  if (f.precoMin || f.precoMax) chips.push({ label: `${f.precoMin ? formatBRL(f.precoMin) : 'R$ 0'} – ${f.precoMax ? formatBRL(f.precoMax) : 'sem limite'}`, href: without({ precoMin: null, precoMax: null }) });
  if (f.verificados) chips.push({ label: 'Verificados', href: without({ verificados: false }) });
  if (f.recentes) chips.push({ label: 'Atualizados em 24 h', href: without({ recentes: false }) });

  const hrefFor = (p: number) => `${basePath}${filtersToQuery({ ...f, ...(lockedCity ? { cidade: '', regiao: '' } : {}), pagina: p })}`;

  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
      <FiltersForm cities={cities} categories={categories} f={f} activeCount={chips.length} />
      <section aria-label="Resultados da busca" className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted" aria-live="polite">
            <strong className="text-ink">{res.total} {res.total === 1 ? 'anúncio' : 'anúncios'}</strong>
            {res.total > 0 ? ` · página ${res.page} de ${res.pages}` : ''}
          </p>
          <Suspense fallback={null}><SortSelect value={f.ordem} /></Suspense>
        </div>
        {chips.length ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-muted">Filtros ativos:</span>
            {chips.map((c) => (
              <Link key={c.label} href={c.href} className="rounded-sm bg-sky px-2 py-1 text-xs text-navy no-underline hover:no-underline" aria-label={`Remover filtro ${c.label}`}>
                {c.label} <span aria-hidden="true">✕</span>
              </Link>
            ))}
            <Link href={lockedCity ? basePath : '/anuncios'} className="ml-1 text-xs font-semibold">Limpar filtros</Link>
          </div>
        ) : null}
        {f.ordem === 'disponiveis' ? (
          <p className="text-xs text-muted">Mostrando apenas anúncios com status “Disponível agora” informado nas últimas 4 horas.</p>
        ) : null}
        {res.items.length ? (
          <>
            <AdGrid ads={res.items} />
            <Pagination page={res.page} pages={res.pages} hrefFor={hrefFor} />
          </>
        ) : (
          <EmptyState title="Nenhum anúncio com esses filtros" action={<LinkButton href={lockedCity ? basePath : '/anuncios'}>Limpar filtros</LinkButton>}>
            Remova algum filtro, amplie a região ou tente outra palavra na busca.
          </EmptyState>
        )}
      </section>
    </div>
  );
}
