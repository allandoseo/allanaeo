'use client';

import { useActionState, type ReactNode } from 'react';
import type { FormState } from '@/app/actions/types';
import { Alert, cx } from '../ui';

type Action = (state: FormState, fd: FormData) => Promise<FormState>;

/** Formulário administrativo genérico: mostra sucesso/erros e desabilita o envio enquanto processa. */
export function AdminForm({
  action, children, submitLabel = 'Salvar', variant = 'primary', className, inline, confirmText,
}: {
  action: Action;
  children?: ReactNode;
  submitLabel?: string;
  variant?: 'primary' | 'danger' | 'ghost' | 'success';
  className?: string;
  inline?: boolean;
  confirmText?: string;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, {});
  const errors = Object.values(state.errors ?? {});
  const btn = {
    primary: 'bg-brand text-white border-brand hover:bg-brand-dark',
    success: 'bg-ok text-white border-ok',
    danger: 'bg-white text-danger border-danger hover:bg-red-50',
    ghost: 'bg-white text-ink border-line hover:border-steel',
  }[variant];
  return (
    <form
      action={formAction}
      onSubmit={(e) => { if (confirmText && !window.confirm(confirmText)) e.preventDefault(); }}
      className={cx(inline ? 'inline-flex flex-wrap items-center gap-2' : 'flex flex-col gap-3', className)}
    >
      {children}
      <button type="submit" disabled={pending} className={cx('inline-flex h-9 items-center justify-center rounded border px-3 text-[13px] font-semibold disabled:opacity-60', btn)}>
        {pending ? 'Processando…' : submitLabel}
      </button>
      {state.message && !inline ? <Alert tone={state.ok ? 'ok' : 'error'}>{state.message}</Alert> : null}
      {state.message && inline ? <span role="status" className={cx('text-xs', state.ok ? 'text-ok' : 'text-danger')}>{state.message}</span> : null}
      {errors.length ? (
        <Alert tone="error"><ul className="list-disc pl-4">{errors.map((e) => <li key={e}>{e}</li>)}</ul></Alert>
      ) : null}
    </form>
  );
}
