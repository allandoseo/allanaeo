'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { forgotAction } from '@/app/actions/auth';
import type { FormState } from '@/app/actions/types';
import { Alert, Field, Input } from '../ui';
import { SubmitButton } from './SubmitButton';

export function ForgotForm() {
  const [state, action] = useActionState<FormState, FormData>(forgotAction, {});
  if (state.ok) {
    return (
      <div className="flex flex-col gap-4">
        <Alert tone="ok">{state.message}</Alert>
        {state.devLink ? <Alert tone="warn">Ambiente de desenvolvimento sem serviço de e-mail. <Link href={state.devLink.replace(/^https?:\/\/[^/]+/, '')}>Abrir link de redefinição</Link></Alert> : null}
        <p className="text-sm text-muted">Não recebeu? Confira a caixa de spam ou <Link href="/recuperar-senha">tente novamente</Link>.</p>
        <Link href="/login" className="text-sm font-semibold">Voltar ao login</Link>
      </div>
    );
  }
  return (
    <form action={action} noValidate className="flex flex-col gap-4">
      <Field label="E-mail da conta" htmlFor="email" error={state.errors?.email}>
        <Input id="email" name="email" type="email" autoComplete="email" required defaultValue={state.values?.email} error={state.errors?.email} />
      </Field>
      <SubmitButton pendingText="Enviando…">Enviar link de redefinição</SubmitButton>
      <Link href="/login" className="text-center text-sm">Voltar ao login</Link>
    </form>
  );
}
