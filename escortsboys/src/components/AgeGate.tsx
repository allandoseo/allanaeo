'use client';

import { useEffect, useRef, useState } from 'react';

/** Barreira de maioridade. Grava o aceite em cookie por 1 ano; "Sair" leva para fora do site. */
export function AgeGate() {
  const [open, setOpen] = useState(true);
  const btn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    btn.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open) return null;
  const accept = () => {
    document.cookie = `eb_age=1; Max-Age=${365 * 86400}; Path=/; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
    setOpen(false);
  };
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="age-title" aria-describedby="age-desc" className="fixed inset-0 z-[100] flex items-center justify-center bg-navy/95 p-4">
      <div className="w-full max-w-md rounded bg-white p-6 sm:p-7">
        <span className="inline-block rounded border-2 border-navy px-2 py-0.5 text-sm font-bold text-navy">18+</span>
        <h2 id="age-title" className="mt-4 text-xl font-bold text-navy">Conteúdo para maiores de 18 anos</h2>
        <p id="age-desc" className="mt-2 text-sm leading-relaxed text-ink">
          Este site reúne anúncios de acompanhantes adultos publicados pelos próprios anunciantes. Ao continuar, você confirma ter 18 anos ou mais e concorda com os{' '}
          <a href="/termos">Termos de uso</a> e a <a href="/privacidade">Política de privacidade</a>.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <button ref={btn} type="button" onClick={accept} className="h-12 flex-1 basis-44 rounded bg-brand px-4 font-semibold text-white hover:bg-brand-dark">Tenho 18 anos ou mais</button>
          <a href="https://www.google.com.br" rel="nofollow noopener" className="flex h-12 flex-1 basis-28 items-center justify-center rounded border border-line font-semibold text-ink no-underline hover:no-underline">Sair</a>
        </div>
      </div>
    </div>
  );
}
