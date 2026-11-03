'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { reportAction } from '@/app/actions/public';
import type { FormState } from '@/app/actions/types';
import { IconClose, IconFlag } from '../icons';
import { Alert } from '../ui';

const REASONS: [string, string][] = [
  ['minor', 'Possível menor de idade'],
  ['non_consensual_images', 'Imagens sem consentimento'],
  ['impersonation', 'Uso da minha identidade / perfil falso'],
  ['third_party', 'Anúncio publicado por terceiros'],
  ['personal_data', 'Exposição de dados pessoais ou endereço'],
  ['fraud', 'Golpe ou cobrança antecipada'],
  ['other', 'Outro motivo'],
];

export function ReportDialog({ adId }: { adId: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [state, action, pending] = useActionState<FormState, FormData>(reportAction, {});
  const [key, setKey] = useState(0);
  useEffect(() => { if (state.ok) setTimeout(() => ref.current?.close(), 2500); }, [state]);

  return (
    <>
      <button type="button" onClick={() => { setKey((k) => k + 1); ref.current?.showModal(); }} className="inline-flex items-center gap-1.5 text-[13px] text-muted underline-offset-2 hover:text-danger hover:underline">
        <IconFlag size={15} /> Denunciar este anúncio
      </button>
      <dialog ref={ref} aria-labelledby="report-title" className="w-[min(520px,calc(100vw-32px))] rounded p-0 backdrop:bg-navy/70">
        <form key={key} action={action} className="flex flex-col gap-4 p-6">
          <div className="flex items-start justify-between gap-3">
            <h2 id="report-title" className="text-lg font-bold text-navy">Denunciar anúncio</h2>
            <button type="button" onClick={() => ref.current?.close()} aria-label="Fechar" className="flex h-9 w-9 items-center justify-center rounded text-muted hover:bg-canvas"><IconClose size={18} /></button>
          </div>
          <input type="hidden" name="adId" value={adId} />
          {state.message ? <Alert tone={state.ok ? 'ok' : 'error'}>{state.message}</Alert> : null}
          <fieldset className="flex flex-col gap-1.5">
            <legend className="mb-1 text-[13px] font-semibold">Motivo</legend>
            {REASONS.map(([v, l]) => (
              <label key={v} className="flex min-h-8 items-center gap-2.5 text-sm"><input type="radio" name="reason" value={v} required className="h-4 w-4 accent-brand" /> {l}</label>
            ))}
            {state.errors?.reason ? <p className="text-xs text-danger">{state.errors.reason}</p> : null}
          </fieldset>
          <div className="flex flex-col gap-1">
            <label htmlFor="report-details" className="text-[13px] font-semibold">Detalhes (opcional)</label>
            <textarea id="report-details" name="details" rows={3} maxLength={2000} className="rounded border border-line px-3 py-2 text-sm" />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="report-email" className="text-[13px] font-semibold">Seu e-mail para retorno (opcional)</label>
            <input id="report-email" name="email" type="email" className="h-11 rounded border border-line px-3 text-sm" />
            {state.errors?.email ? <p className="text-xs text-danger">{state.errors.email}</p> : null}
          </div>
          <p className="text-xs text-muted">Se você é a pessoa retratada e quer a remoção imediata, selecione o motivo correspondente. Casos envolvendo menores são encaminhados às autoridades.</p>
          <button type="submit" disabled={pending || state.ok} className="h-11 rounded bg-brand font-semibold text-white disabled:opacity-60">{pending ? 'Enviando…' : 'Enviar denúncia'}</button>
        </form>
      </dialog>
    </>
  );
}
