'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useFavorites } from '@/components/favorites';
import { AdPhoto } from '@/components/AdPhoto';
import { EmptyState, LinkButton } from '@/components/ui';
import { IconPin } from '@/components/icons';
import type { PublicAd } from '@/lib/types';
import { formatBRL, timeAgo } from '@/lib/format';

export function FavoritesList() {
  const { ids, ready, toggle } = useFavorites();
  const [ads, setAds] = useState<PublicAd[] | null>(null);
  const [error, setError] = useState(false);
  const key = ids.join(',');

  useEffect(() => {
    if (!ready) return;
    if (!key) { setAds([]); return; }
    let alive = true;
    fetch(`/api/anuncios?ids=${encodeURIComponent(key)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: { ads: PublicAd[] }) => alive && setAds(d.ads))
      .catch(() => alive && setError(true));
    return () => { alive = false; };
  }, [ready, key]);

  if (error) return <EmptyState title="Não foi possível carregar seus favoritos" action={<LinkButton href="/favoritos">Tentar novamente</LinkButton>} />;
  if (!ready || ads === null) {
    return (
      <div className="grid gap-3" aria-busy="true" aria-label="Carregando favoritos">
        {[0, 1, 2].map((i) => <div key={i} className="h-36 animate-pulse rounded border border-line bg-white" />)}
      </div>
    );
  }
  const missing = ids.length - ads.length;
  if (!ads.length) {
    return (
      <EmptyState title={ids.length ? 'Os anúncios salvos não estão mais disponíveis' : 'Você ainda não salvou anúncios'} action={<LinkButton href="/anuncios">Explorar anúncios</LinkButton>}>
        Toque no coração de um anúncio para guardá-lo aqui e comparar depois.
      </EmptyState>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted">{ads.length} {ads.length === 1 ? 'anúncio salvo' : 'anúncios salvos'}{missing > 0 ? ` · ${missing} não está(ão) mais disponível(is)` : ''}</p>
      <ul className="grid gap-3 xl:grid-cols-2">
        {ads.map((ad) => (
          <li key={ad.id} className="flex overflow-hidden rounded border border-line bg-white">
            <Link href={`/anuncio/${ad.slug}`} className="relative block w-28 shrink-0 bg-line sm:w-36" aria-label={`Abrir anúncio de ${ad.publicName}`}>
              <AdPhoto photo={ad.photos[0]} sizes="144px" />
            </Link>
            <div className="flex min-w-0 flex-1 flex-col gap-1 p-3.5">
              <Link href={`/anuncio/${ad.slug}`} className="text-base font-bold text-navy">{ad.publicName}{ad.age ? `, ${ad.age}` : ''}</Link>
              <span className="flex items-center gap-1 text-[13px] text-muted"><IconPin size={14} /> {[ad.regionName, ad.cityName].filter(Boolean).join(' · ')}</span>
              <span className="text-sm font-semibold">{ad.showPrices && ad.priceFrom !== null ? `A partir de ${formatBRL(ad.priceFrom)}` : 'Consultar valores'}</span>
              <span className="text-[11px] text-muted">Atualizado {timeAgo(ad.updatedAt)}</span>
              <div className="mt-auto flex flex-wrap gap-2 pt-1.5">
                <LinkButton href={`/anuncio/${ad.slug}`} size="sm">Ver detalhes</LinkButton>
                <button type="button" onClick={() => toggle(ad.id)} className="h-9 rounded border border-line px-3 text-[13px] font-semibold text-muted hover:border-danger hover:text-danger">Remover</button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
