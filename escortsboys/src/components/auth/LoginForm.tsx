'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { loginAction } from '@/app/actions/auth';
import type { FormState } from '@/app/actions/types';
import { Alert, Checkbox, Field, Input } from '../ui';
import { SubmitButton } from './SubmitButton';

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState<FormState, FormData>(loginAction, {});
  const e = state.errors ?? {};
  return (
    <form action={action} noValidate className="flex flex-col gap-4">
      {state.message ? <Alert tone="error">{state.message}</Alert> : null}
      <input type="hidden" name="next" value={next ?? ''} />
      <Field label="E-mail" htmlFor="email" error={e.email}>
        <Input id="email" name="email" type="email" autoComplete="email" required defaultValue={state.values?.email} error={e.email} />
      </Field>
      <Field label="Senha" htmlFor="password" error={e.password}>
        <Input id="password" name="password" type="password" autoComplete="current-password" required error={e.password} />
      </Field>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Checkbox id="remember" name="remember" label="Manter conectado" defaultChecked />
        <Link href="/recuperar-senha" className="text-sm">Esqueci minha senha</Link>
      </div>
      <SubmitButton pendingText="Entrando…">Entrar</SubmitButton>
      <p className="text-center text-sm text-muted">Ainda não tem conta? <Link href="/cadastro">Cadastre-se</Link></p>
    </form>
  );
}
