import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SearchResults } from '@/components/search/SearchResults';
import { Breadcrumbs } from '@/components/ui';
import { getCity, getCoverage, getSettings } from '@/lib/repo';
import { parseFilters } from '@/lib/search';
import { absoluteUrl } from '@/lib/site';

type Props = { params: Promise<{ cidade: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { cidade } = await params;
  const [city, coverage, settings, sp] = await Promise.all([getCity(cidade), getCoverage(), getSettings(), searchParams]);
  if (!city) return {};
  const n = coverage[city.slug]?.total ?? 0;
  const indexable = n >= settings.minAdsForIndex && Object.keys(sp).length === 0;
  return {
    title: `Acompanhantes masculinos em ${city.name} (${city.state})`,
    description: `${n} ${n === 1 ? 'anúncio' : 'anúncios'} de acompanhantes masculinos em ${city.name}. Compare fotos, regiões atendidas, disponibilidade e valores e fale direto com o anunciante.`,
    alternates: { canonical: `/acompanhantes/${city.slug}` },
    robots: indexable ? undefined : { index: false, follow: true },
    openGraph: { title: `Acompanhantes masculinos em ${city.name}`, url: absoluteUrl(`/acompanhantes/${city.slug}`) },
  };
}

export default async function CityPage({ params, searchParams }: Props) {
  const { cidade } = await params;
  const [city, coverage] = await Promise.all([getCity(cidade), getCoverage()]);
  if (!city) notFound();
  const sp = await searchParams;
  const f = parseFilters({ ...sp, cidade: city.slug, regiao: undefined });
  const cov = coverage[city.slug];
  const regions = city.regions.filter((r) => (cov?.regions[r.slug] ?? 0) > 0);
  const crumbs = [{ href: '/', label: 'Início' }, { href: '/anuncios', label: 'Anúncios' }, { label: city.name }];
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.label, item: absoluteUrl(c.href ?? `/acompanhantes/${city.slug}`) })),
  };
  return (
    <main className="mx-auto flex w-full max-w-page flex-col gap-4 px-4 pb-12 pt-4 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Breadcrumbs items={crumbs} />
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[22px] font-bold tracking-tight text-navy sm:text-2xl">Acompanhantes masculinos em {city.name}</h1>
        <p className="text-sm text-muted">{cov?.total ?? 0} anúncios ativos em {city.name} ({city.state}). Endereços exatos nunca são exibidos; os anunciantes informam apenas bairro e região atendida.</p>
      </div>
      {regions.length ? (
        <nav aria-label={`Regiões de ${city.name}`}>
          <ul className="flex flex-wrap gap-2">
            {regions.map((r) => (
              <li key={r.slug}><Link href={`/acompanhantes/${city.slug}/${r.slug}`} className="flex h-9 items-center rounded-full border border-line bg-white px-3.5 text-[13px] text-ink no-underline hover:border-brand hover:no-underline">{r.name} <span className="ml-1 text-muted">({cov.regions[r.slug]})</span></Link></li>
            ))}
          </ul>
        </nav>
      ) : null}
      <SearchResults f={f} basePath={`/acompanhantes/${city.slug}`} lockedCity />
    </main>
  );
}
