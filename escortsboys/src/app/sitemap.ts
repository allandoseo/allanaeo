import type { MetadataRoute } from 'next';
import { getCities, getCoverage, getSettings, listPublicAds } from '@/lib/repo';
import { absoluteUrl } from '@/lib/site';

export const dynamic = 'force-dynamic';

/** Só entram páginas com conteúdo real: cidades/regiões acima do mínimo de anúncios e anúncios não demonstrativos. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [ads, cities, coverage, settings] = await Promise.all([listPublicAds(), getCities(), getCoverage(), getSettings()]);
  const min = settings.minAdsForIndex;
  const out: MetadataRoute.Sitemap = [
    { url: absoluteUrl('/'), changeFrequency: 'hourly', priority: 1 },
    { url: absoluteUrl('/anuncios'), changeFrequency: 'hourly', priority: 0.9 },
    { url: absoluteUrl('/anunciar'), changeFrequency: 'monthly', priority: 0.5 },
    ...['/sobre', '/seguranca', '/diretrizes', '/privacidade', '/termos', '/contato'].map((p) => ({ url: absoluteUrl(p), changeFrequency: 'yearly' as const, priority: 0.3 })),
  ];
  for (const c of cities) {
    const cov = coverage[c.slug];
    if (!cov || cov.total < min) continue;
    out.push({ url: absoluteUrl(`/acompanhantes/${c.slug}`), changeFrequency: 'daily', priority: 0.8 });
    for (const r of c.regions) if ((cov.regions[r.slug] ?? 0) >= min) out.push({ url: absoluteUrl(`/acompanhantes/${c.slug}/${r.slug}`), changeFrequency: 'daily', priority: 0.7 });
  }
  for (const ad of ads) if (!ad.isDemo) out.push({ url: absoluteUrl(`/anuncio/${ad.slug}`), lastModified: ad.updatedAt, changeFrequency: 'daily', priority: 0.6 });
  return out;
}
