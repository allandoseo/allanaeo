import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SearchResults } from '@/components/search/SearchResults';
import { Breadcrumbs } from '@/components/ui';
import { getCity, getCoverage, getSettings } from '@/lib/repo';
import { parseFilters } from '@/lib/search';
import { absoluteUrl } from '@/lib/site';

type Props = { params: Promise<{ cidade: string; regiao: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

async function load(cidade: string, regiao: string) {
  const city = await getCity(cidade);
  const region = city?.regions.find((r) => r.slug === regiao);
  return city && region ? { city, region } : null;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { cidade, regiao } = await params;
  const [data, coverage, settings, sp] = await Promise.all([load(cidade, regiao), getCoverage(), getSettings(), searchParams]);
  if (!data) return {};
  const n = coverage[data.city.slug]?.regions[data.region.slug] ?? 0;
  const path = `/acompanhantes/${data.city.slug}/${data.region.slug}`;
  return {
    title: `Acompanhantes masculinos em ${data.region.name}, ${data.city.name}`,
    description: `${n} ${n === 1 ? 'anúncio' : 'anúncios'} de acompanhantes masculinos em ${data.region.name} (${data.city.name}). Fotos, disponibilidade, modalidades e valores informados pelos anunciantes.`,
    alternates: { canonical: path },
    robots: n >= settings.minAdsForIndex && Object.keys(sp).length === 0 ? undefined : { index: false, follow: true },
    openGraph: { url: absoluteUrl(path) },
  };
}

export default async function RegionPage({ params, searchParams }: Props) {
  const { cidade, regiao } = await params;
  const data = await load(cidade, regiao);
  if (!data) notFound();
  const { city, region } = data;
  const f = parseFilters({ ...(await searchParams), cidade: city.slug, regiao: region.slug });
  const crumbs = [{ href: '/', label: 'Início' }, { href: `/acompanhantes/${city.slug}`, label: city.name }, { label: region.name }];
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.label, item: absoluteUrl(c.href ?? `/acompanhantes/${city.slug}/${region.slug}`) })),
  };
  return (
    <main className="mx-auto flex w-full max-w-page flex-col gap-4 px-4 pb-12 pt-4 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Breadcrumbs items={crumbs} />
      <h1 className="text-[22px] font-bold tracking-tight text-navy sm:text-2xl">Acompanhantes masculinos em {region.name}, {city.name}</h1>
      <SearchResults f={f} basePath={`/acompanhantes/${city.slug}/${region.slug}`} lockedCity />
    </main>
  );
}
