import Link from 'next/link';
import { AdGrid } from '@/components/AdCard';
import { EmptyState, LinkButton } from '@/components/ui';
import { getCategories, getCities, getCoverage, listPublicAds } from '@/lib/repo';
import { parseFilters, searchAds } from '@/lib/search';
import { absoluteUrl } from '@/lib/site';

export default async function HomePage() {
  const [ads, cities, coverage, categories] = await Promise.all([listPublicAds(), getCities(), getCoverage(), getCategories()]);
  const top = searchAds(ads, parseFilters({}));
  const shown = top.items.slice(0, 10);
  const citiesWithAds = cities.filter((c) => (coverage[c.slug]?.total ?? 0) > 0);
  const topRegions = citiesWithAds
    .flatMap((c) => c.regions.map((r) => ({ city: c, region: r, n: coverage[c.slug]?.regions[r.slug] ?? 0 })))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n)
    .slice(0, 6);

  const quick = [
    { label: 'Disponível agora', href: '/anuncios?ordem=disponiveis' },
    { label: 'Disponível hoje', href: '/anuncios?disp=available_today' },
    { label: 'Verificados', href: '/anuncios?verificados=1' },
    { label: 'Atualizados em 24 h', href: '/anuncios?recentes=1' },
    ...categories.slice(0, 3).map((c) => ({ label: c.name, href: `/anuncios?modo=${c.slug}` })),
    ...topRegions.slice(0, 3).map((x) => ({ label: x.region.name, href: `/acompanhantes/${x.city.slug}/${x.region.slug}` })),
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'EscortsBoys',
    url: absoluteUrl('/'),
    potentialAction: { '@type': 'SearchAction', target: `${absoluteUrl('/anuncios')}?q={search_term_string}`, 'query-input': 'required name=search_term_string' },
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-page flex-col gap-3.5 px-4 pb-4 pt-5 sm:px-6">
          <h1 className="text-[22px] font-bold leading-tight tracking-tight text-navy sm:text-[26px]">Encontre acompanhantes masculinos</h1>
          <form action="/anuncios" method="get" role="search" className="flex flex-wrap gap-2.5">
            <div className="flex min-w-[240px] flex-[3_1_280px] flex-col gap-1">
              <label htmlFor="home-q" className="text-xs font-semibold text-muted">Buscar por nome ou característica</label>
              <input id="home-q" name="q" type="search" placeholder="Ex.: moreno, inglês, Copacabana" className="h-12 rounded border border-line px-3 text-[15px]" />
            </div>
            <div className="flex flex-[1_1_200px] flex-col gap-1">
              <label htmlFor="home-city" className="text-xs font-semibold text-muted">Cidade</label>
              <select id="home-city" name="cidade" defaultValue="" className="h-12 rounded border border-line bg-white px-2 text-[15px]">
                <option value="">Todas as cidades</option>
                {cities.map((c) => <option key={c.slug} value={c.slug}>{c.name}, {c.state}</option>)}
              </select>
            </div>
            <div className="flex flex-[0_1_160px] items-end">
              <button type="submit" className="h-12 w-full rounded bg-brand font-semibold text-white hover:bg-brand-dark">Buscar</button>
            </div>
          </form>
          <nav aria-label="Filtros rápidos" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <ul className="flex gap-2 pb-1 sm:flex-wrap">
              {quick.map((q) => (
                <li key={q.href} className="shrink-0">
                  <Link href={q.href} className="flex h-9 items-center rounded-full border border-line bg-white px-3.5 text-[13px] font-medium text-ink no-underline hover:border-brand hover:no-underline">{q.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-page flex-col gap-4 px-4 pb-12 pt-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm text-muted"><strong className="text-ink">{top.total} anúncios</strong> em destaque nas cidades atendidas</h2>
          <Link href="/anuncios?ordem=atualizados" className="text-[13px] font-semibold">Ver atualizados recentemente</Link>
        </div>
        {shown.length ? <AdGrid ads={shown} /> : (
          <EmptyState title="Ainda não há anúncios publicados" action={<LinkButton href="/anunciar">Seja o primeiro a anunciar</LinkButton>}>
            Os anúncios aparecem aqui assim que forem aprovados pela moderação.
          </EmptyState>
        )}
        {top.total > shown.length ? (
          <div className="flex justify-center pt-1">
            <LinkButton href="/anuncios" variant="secondary" size="lg">Ver todos os {top.total} anúncios</LinkButton>
          </div>
        ) : null}

        {citiesWithAds.length ? (
          <section className="mt-6 border-t border-line pt-5" aria-labelledby="por-cidade">
            <h2 id="por-cidade" className="text-[15px] font-bold text-navy">Acompanhantes por cidade</h2>
            <ul className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
              {citiesWithAds.map((c) => (
                <li key={c.slug}><Link href={`/acompanhantes/${c.slug}`}>{c.name}</Link> <span className="text-muted">({coverage[c.slug].total})</span></li>
              ))}
              {topRegions.map((x) => (
                <li key={`${x.city.slug}-${x.region.slug}`}><Link href={`/acompanhantes/${x.city.slug}/${x.region.slug}`}>{x.region.name}, {x.city.name}</Link> <span className="text-muted">({x.n})</span></li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </main>
  );
}
