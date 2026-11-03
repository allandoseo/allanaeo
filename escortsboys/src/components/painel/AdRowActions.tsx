'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { adStatusAction } from '@/app/actions/painel';
import { SubmitButton } from '../auth/SubmitButton';
import type { AdStatus } from '@/lib/types';

const linkBtn = 'inline-flex h-9 items-center rounded border border-line bg-white px-3 text-[13px] font-semibold no-underline hover:border-brand hover:no-underline';

export function AdRowActions({ adId, slug, status, title }: { adId: string; slug: string; status: AdStatus; title: string }) {
  const dlg = useRef<HTMLDialogElement>(null);
  return (
    <div className="flex flex-wrap gap-2">
      <Link href={`/painel/anuncios/${adId}/editar`} className={`${linkBtn} text-brand`}>{status === 'draft' ? 'Continuar' : 'Editar'}</Link>
      {status === 'active' && slug ? <Link href={`/anuncio/${slug}`} className={`${linkBtn} text-ink`}>Ver público</Link> : null}
      {status === 'active' ? (
        <form action={adStatusAction}><input type="hidden" name="adId" value={adId} /><input type="hidden" name="action" value="pause" />
          <button type="submit" className={`${linkBtn} text-warn`}>Pausar</button></form>
      ) : null}
      {status === 'paused' ? (
        <form action={adStatusAction}><input type="hidden" name="adId" value={adId} /><input type="hidden" name="action" value="resume" />
          <button type="submit" className={`${linkBtn} text-ok`}>Reativar</button></form>
      ) : null}
      <button type="button" onClick={() => dlg.current?.showModal()} className={`${linkBtn} text-danger`}>Excluir</button>
      <dialog ref={dlg} aria-labelledby={`del-${adId}`} className="w-[min(440px,calc(100vw-32px))] rounded p-0 backdrop:bg-navy/70">
        <form action={adStatusAction} className="flex flex-col gap-4 p-6">
          <h2 id={`del-${adId}`} className="text-lg font-bold text-navy">Excluir anúncio?</h2>
          <p className="text-sm">“{title}” deixará de aparecer no site e será removido dos favoritos de quem o salvou. Esta ação não pode ser desfeita.</p>
          <input type="hidden" name="adId" value={adId} />
          <input type="hidden" name="action" value="delete" />
          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" onClick={() => dlg.current?.close()} className="h-11 rounded border border-line px-4 text-sm font-semibold">Cancelar</button>
            <div className="w-40"><SubmitButton pendingText="Excluindo…">Excluir</SubmitButton></div>
          </div>
        </form>
      </dialog>
    </div>
  );
}
