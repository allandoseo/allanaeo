import type { Metadata } from 'next';
import { SearchResults } from '@/components/search/SearchResults';
import { Breadcrumbs } from '@/components/ui';
import { getCities } from '@/lib/repo';
import { parseFilters } from '@/lib/search';

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sp = await searchParams;
  const hasParams = Object.keys(sp).length > 0;
  return {
    title: 'Anúncios de acompanhantes masculinos',
    description: 'Busque e compare anúncios de acompanhantes masculinos por cidade, região, disponibilidade, modalidade de atendimento e valores.',
    alternates: { canonical: '/anuncios' },
    // Combinações de filtros não são indexadas (evita conteúdo duplicado); as páginas de cidade cumprem esse papel.
    robots: hasParams ? { index: false, follow: true } : undefined,
  };
}

export default async function AnunciosPage({ searchParams }: Props) {
  const f = parseFilters(await searchParams);
  const cities = await getCities();
  const city = cities.find((c) => c.slug === f.cidade);
  const region = city?.regions.find((r) => r.slug === f.regiao);
  const where = region ? `${region.name}, ${city!.name}` : city ? city.name : '';
  return (
    <main className="mx-auto flex w-full max-w-page flex-col gap-4 px-4 pb-12 pt-4 sm:px-6">
      <Breadcrumbs items={[{ href: '/', label: 'Início' }, ...(city ? [{ href: '/anuncios', label: 'Anúncios' }, { label: where }] : [{ label: 'Anúncios' }])]} />
      <h1 className="text-[22px] font-bold tracking-tight text-navy sm:text-2xl">
        {f.q ? <>Resultados para “{f.q}”{where ? ` em ${where}` : ''}</> : where ? `Acompanhantes masculinos em ${where}` : 'Anúncios de acompanhantes masculinos'}
      </h1>
      <SearchResults f={f} basePath="/anuncios" />
    </main>
  );
}
