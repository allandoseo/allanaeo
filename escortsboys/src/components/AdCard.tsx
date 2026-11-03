import Link from 'next/link';
import { AVAILABILITY_LABEL } from '@/lib/availability';
import { formatBRL, timeAgo } from '@/lib/format';
import type { PublicAd } from '@/lib/types';
import { AdPhoto } from './AdPhoto';
import { FavoriteButton } from './favorites';
import { IconCheckBadge, IconPin } from './icons';
import { Badge, cx } from './ui';

export function AvailabilityLine({ ad, className }: { ad: Pick<PublicAd, 'availability' | 'availabilityReliable' | 'availabilityNote' | 'availabilityUpdatedAt'>; className?: string }) {
  if (!ad.availabilityReliable || ad.availability === 'unknown') {
    return <p className={cx('text-[13px] text-muted', className)}>Disponibilidade não informada</p>;
  }
  const good = ad.availability === 'available_now' || ad.availability === 'available_today';
  return (
    <p className={cx('flex items-center gap-1.5 text-[13px] font-semibold', good ? 'text-ok' : 'text-muted', className)}>
      <span className={cx('h-2 w-2 shrink-0 rounded-full', good ? 'bg-ok' : 'bg-muted')} aria-hidden="true" />
      {AVAILABILITY_LABEL[ad.availability]}
      {ad.availabilityNote ? <span className="font-normal">· {ad.availabilityNote}</span> : null}
      {ad.availabilityUpdatedAt ? <span className="font-normal text-muted">(informado {timeAgo(ad.availabilityUpdatedAt)})</span> : null}
    </p>
  );
}

export function PriceLabel({ ad, className }: { ad: Pick<PublicAd, 'priceFrom' | 'showPrices'>; className?: string }) {
  return (
    <span className={cx('font-bold text-ink', className)}>
      {ad.showPrices && ad.priceFrom !== null ? <>A partir de {formatBRL(ad.priceFrom)}</> : 'Consultar valores'}
    </span>
  );
}

/** Card horizontal de listagem: foto à esquerda, informações comerciais organizadas à direita. */
export function AdCard({ ad, priority = false, headingLevel = 'h2' }: { ad: PublicAd; priority?: boolean; headingLevel?: 'h2' | 'h3' }) {
  const H = headingLevel;
  const href = `/anuncio/${ad.slug}`;
  const place = [ad.regionName, ad.cityName].filter(Boolean).join(' · ');
  return (
    <article className="flex flex-col overflow-hidden rounded border border-line bg-white min-[440px]:flex-row">
      <div className="relative aspect-[4/3] w-full shrink-0 bg-line min-[440px]:aspect-auto min-[440px]:min-h-[236px] min-[440px]:w-[42%] min-[440px]:max-w-[240px]">
        <Link href={href} tabIndex={-1} aria-hidden="true" className="absolute inset-0">
          <AdPhoto photo={ad.photos[0]} priority={priority} sizes="(max-width: 440px) 100vw, 240px" />
        </Link>
        <span className="pointer-events-none absolute bottom-2 left-2 rounded-sm bg-navy/85 px-1.5 py-0.5 text-[11px] font-semibold text-white">{ad.photos.length} {ad.photos.length === 1 ? 'foto' : 'fotos'}</span>
        <FavoriteButton adId={ad.id} name={ad.publicName} className="absolute right-2 top-2" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-4">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <H className="text-lg font-bold leading-tight text-navy">
            <Link href={href} className="text-navy">{ad.publicName}</Link>
          </H>
          {ad.age ? <span className="text-sm text-muted">{ad.age} anos</span> : null}
          {ad.verified ? <Badge tone="ok"><IconCheckBadge size={13} /> Verificado</Badge> : null}
          {ad.isDemo ? <Badge>Exemplo</Badge> : null}
        </div>
        <p className="flex items-center gap-1 text-[13px] text-muted"><IconPin size={14} /> {place}</p>
        <AvailabilityLine ad={ad} />
        <p className="line-clamp-2 text-sm leading-snug text-ink">{ad.summary}</p>
        {ad.modes.length ? (
          <ul className="flex flex-wrap gap-1.5" aria-label="Modalidades de atendimento">
            {ad.modes.map((m) => <li key={m.slug} className="rounded-sm bg-sky px-2 py-0.5 text-xs text-brand">{m.name}</li>)}
          </ul>
        ) : null}
        {ad.areasServed.length ? <p className="text-xs text-muted">Atende: {ad.areasServed.join(', ')}</p> : null}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-line pt-2.5">
          <div className="flex flex-col">
            <PriceLabel ad={ad} className="text-[15px]" />
            <span className="text-[11px] text-muted">Atualizado {timeAgo(ad.updatedAt)}</span>
          </div>
          <Link href={href} className="rounded bg-brand px-3.5 py-2.5 text-[13px] font-semibold text-white no-underline hover:bg-brand-dark hover:no-underline">
            Ver anúncio completo
          </Link>
        </div>
      </div>
    </article>
  );
}

export function AdGrid({ ads }: { ads: PublicAd[] }) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {ads.map((ad, i) => <AdCard key={ad.id} ad={ad} priority={i < 2} />)}
    </div>
  );
}
