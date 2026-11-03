'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { resetAction } from '@/app/actions/auth';
import type { FormState } from '@/app/actions/types';
import { Alert, Field, Input } from '../ui';
import { SubmitButton } from './SubmitButton';

export function ResetForm({ token }: { token: string }) {
  const [state, action] = useActionState<FormState, FormData>(resetAction, {});
  const e = state.errors ?? {};
  return (
    <form action={action} noValidate className="flex flex-col gap-4">
      {state.message ? <Alert tone="error">{state.message} <Link href="/recuperar-senha">Solicitar novo link</Link></Alert> : null}
      <input type="hidden" name="token" value={token} />
      <Field label="Nova senha" htmlFor="password" error={e.password} hint="Mínimo 8 caracteres, com letra e número.">
        <Input id="password" name="password" type="password" autoComplete="new-password" required error={e.password} />
      </Field>
      <Field label="Confirmar nova senha" htmlFor="confirm" error={e.confirm}>
        <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required error={e.confirm} />
      </Field>
      <SubmitButton pendingText="Salvando…">Salvar nova senha</SubmitButton>
    </form>
  );
}
