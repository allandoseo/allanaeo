'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AdPhoto } from '../AdPhoto';
import { IconChevronLeft, IconChevronRight, IconClose, IconExpand } from '../icons';
import { cx } from '../ui';
import type { Photo } from '@/lib/types';

/** Galeria com foto principal, miniaturas, navegação por teclado/toque e visualização ampliada. */
export function Gallery({ photos, name }: { photos: Photo[]; name: string }) {
  const [i, setI] = useState(0);
  const [zoom, setZoom] = useState(false);
  const n = photos.length;
  const go = useCallback((d: number) => setI((x) => (x + d + n) % n), [n]);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const touch = useRef<number | null>(null);

  useEffect(() => {
    if (!zoom) return;
    const trigger = opener.current;
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setZoom(false);
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; trigger?.focus(); };
  }, [zoom, go]);

  if (!n) return <div className="relative aspect-[4/3] overflow-hidden rounded bg-line"><AdPhoto sizes="100vw" /></div>;

  const swipe = {
    onTouchStart: (e: React.TouchEvent) => { touch.current = e.touches[0].clientX; },
    onTouchEnd: (e: React.TouchEvent) => {
      if (touch.current === null) return;
      const dx = e.changedTouches[0].clientX - touch.current;
      if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
      touch.current = null;
    },
  };
  const navBtn = 'absolute top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-navy shadow';

  return (
    <section aria-label={`Fotos de ${name}`} aria-roledescription="galeria" className="flex flex-col gap-2">
      <div className="grid gap-2 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="relative aspect-[4/5] overflow-hidden rounded bg-line sm:aspect-[4/3] lg:aspect-auto lg:h-[460px]" {...swipe}>
          <AdPhoto photo={photos[i]} priority sizes="(max-width: 1024px) 100vw, 840px" fit="contain" className="bg-navy/5" />
          {n > 1 ? (
            <>
              <button type="button" onClick={() => go(-1)} aria-label="Foto anterior" className={cx(navBtn, 'left-3')}><IconChevronLeft /></button>
              <button type="button" onClick={() => go(1)} aria-label="Próxima foto" className={cx(navBtn, 'right-3')}><IconChevronRight /></button>
            </>
          ) : null}
          <span className="absolute bottom-3 left-3 rounded-sm bg-navy/85 px-2 py-1 text-xs font-semibold text-white" aria-live="polite">{i + 1} / {n}</span>
          <button ref={opener} type="button" onClick={() => setZoom(true)} className="absolute bottom-3 right-3 flex h-9 items-center gap-1.5 rounded-sm bg-navy/85 px-3 text-xs font-semibold text-white">
            <IconExpand size={15} /> Ampliar
          </button>
        </div>
        <ul className="hidden grid-cols-2 gap-2 lg:grid lg:h-[460px] lg:grid-rows-2">
          {photos.slice(1, 5).map((p, k) => (
            <li key={p.id} className="relative overflow-hidden rounded bg-line">
              <button type="button" onClick={() => setI(k + 1)} aria-label={`Ver foto ${k + 2}`} className={cx('absolute inset-0', i === k + 1 && 'ring-2 ring-inset ring-brand')}>
                <AdPhoto photo={p} sizes="210px" />
              </button>
              {k === 3 && n > 5 ? <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-navy/60 text-sm font-semibold text-white">+{n - 5} fotos</span> : null}
            </li>
          ))}
        </ul>
      </div>
      {n > 1 ? (
        <ul className="flex gap-2 overflow-x-auto pb-1" aria-label="Miniaturas">
          {photos.map((p, k) => (
            <li key={p.id} className="shrink-0">
              <button type="button" onClick={() => setI(k)} aria-label={`Ver foto ${k + 1}`} aria-current={i === k} className={cx('relative block h-16 w-14 overflow-hidden rounded-sm border-2', i === k ? 'border-brand' : 'border-transparent')}>
                <AdPhoto photo={p} sizes="56px" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {zoom ? (
        <div role="dialog" aria-modal="true" aria-label={`Foto ${i + 1} de ${n} — ${name}`} className="fixed inset-0 z-[90] flex flex-col bg-navy/95" {...swipe}>
          <div className="flex items-center justify-between px-4 py-3 text-white">
            <span className="text-sm">{i + 1} / {n}</span>
            <button ref={closeBtn} type="button" onClick={() => setZoom(false)} aria-label="Fechar visualização ampliada" className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10"><IconClose /></button>
          </div>
          <div className="relative flex-1">
            <AdPhoto photo={photos[i]} sizes="100vw" fit="contain" />
            {n > 1 ? (
              <>
                <button type="button" onClick={() => go(-1)} aria-label="Foto anterior" className={cx(navBtn, 'left-3')}><IconChevronLeft /></button>
                <button type="button" onClick={() => go(1)} aria-label="Próxima foto" className={cx(navBtn, 'right-3')}><IconChevronRight /></button>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
