'use client';

import { useRef, type ReactNode } from 'react';
import type { FormState } from '@/app/actions/types';
import { AdminForm } from './AdminForm';
import { IconClose } from '../icons';
import { cx } from '../ui';

type Action = (state: FormState, fd: FormData) => Promise<FormState>;

/** Botão que abre um <dialog> nativo com campo de motivo/resolução obrigatório. */
export function DecisionDialog({
  label, title, action, hidden, noteName = 'note', noteLabel = 'Motivo', required = true, tone = 'danger', submitLabel, children,
}: {
  label: string;
  title: string;
  action: Action;
  hidden: Record<string, string>;
  noteName?: string;
  noteLabel?: string;
  required?: boolean;
  tone?: 'danger' | 'ghost' | 'primary';
  submitLabel?: string;
  children?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = `dlg-${Object.values(hidden).join('-')}-${noteName}-${label}`.replace(/[^a-zA-Z0-9-]/g, '');
  const btn = { danger: 'border-danger text-danger hover:bg-red-50', ghost: 'border-line text-ink hover:border-steel', primary: 'border-brand text-brand hover:bg-sky' }[tone];
  return (
    <>
      <button type="button" onClick={() => ref.current?.showModal()} className={cx('inline-flex h-9 items-center rounded border bg-white px-3 text-[13px] font-semibold', btn)}>{label}</button>
      <dialog ref={ref} aria-labelledby={`${id}-t`} className="w-[min(480px,calc(100vw-32px))] rounded p-0 backdrop:bg-navy/70">
        <div className="flex flex-col gap-3 p-5">
          <div className="flex items-start justify-between gap-3">
            <h2 id={`${id}-t`} className="text-lg font-bold text-navy">{title}</h2>
            <button type="button" onClick={() => ref.current?.close()} aria-label="Fechar" className="flex h-9 w-9 items-center justify-center rounded text-muted hover:bg-canvas"><IconClose size={18} /></button>
          </div>
          {children}
          <AdminForm action={action} submitLabel={submitLabel ?? label} variant={tone === 'danger' ? 'danger' : 'primary'}>
            {Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
            <label htmlFor={`${id}-n`} className="text-[13px] font-semibold">{noteLabel}{required ? '' : ' (opcional)'}</label>
            <textarea id={`${id}-n`} name={noteName} rows={3} required={required} minLength={required ? 5 : undefined} maxLength={500} className="rounded border border-line px-3 py-2 text-sm" />
          </AdminForm>
        </div>
      </dialog>
    </>
  );
}
