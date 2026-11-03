'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { signupAction } from '@/app/actions/auth';
import type { FormState } from '@/app/actions/types';
import { Alert, Checkbox, Field, Input, cx } from '../ui';
import { SubmitButton } from './SubmitButton';

export function SignupForm({ defaultIntent }: { defaultIntent: 'user' | 'advertiser' }) {
  const [state, action] = useActionState<FormState, FormData>(signupAction, {});
  const [intent, setIntent] = useState<'user' | 'advertiser'>((state.values?.intent as 'user') ?? defaultIntent);
  const [pwd, setPwd] = useState('');
  const e = state.errors ?? {};
  const strength = [pwd.length >= 8, /[A-Za-z]/.test(pwd), /\d/.test(pwd), pwd.length >= 12].filter(Boolean).length;
  const opt = (v: 'user' | 'advertiser', title: string, desc: string) => (
    <label className={cx('flex flex-1 cursor-pointer flex-col gap-0.5 rounded border p-3 text-sm', intent === v ? 'border-brand bg-sky' : 'border-line')}>
      <span className="flex items-center gap-2 font-semibold"><input type="radio" name="intent" value={v} checked={intent === v} onChange={() => setIntent(v)} className="accent-brand" /> {title}</span>
      <span className="pl-6 text-xs text-muted">{desc}</span>
    </label>
  );
  return (
    <form action={action} noValidate className="flex flex-col gap-4">
      {state.message ? <Alert tone="error">{state.message}</Alert> : null}
      <fieldset className="flex flex-col gap-2 sm:flex-row">
        <legend className="mb-1.5 text-[13px] font-semibold">Tipo de conta</legend>
        {opt('user', 'Quero buscar', 'Salvar favoritos e acompanhar anúncios.')}
        {opt('advertiser', 'Quero anunciar', 'Criar perfil e publicar anúncios.')}
      </fieldset>
      <Field label="Nome" htmlFor="name" error={e.name} hint="Não aparece publicamente.">
        <Input id="name" name="name" autoComplete="name" required defaultValue={state.values?.name} error={e.name} />
      </Field>
      <Field label="E-mail" htmlFor="email" error={e.email}>
        <Input id="email" name="email" type="email" autoComplete="email" required defaultValue={state.values?.email} error={e.email} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Senha" htmlFor="password" error={e.password} hint="Mínimo 8 caracteres, com letra e número.">
          <Input id="password" name="password" type="password" autoComplete="new-password" required value={pwd} onChange={(ev) => setPwd(ev.target.value)} error={e.password} />
        </Field>
        <Field label="Confirmar senha" htmlFor="confirm" error={e.confirm}>
          <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required error={e.confirm} />
        </Field>
      </div>
      {pwd ? (
        <div aria-live="polite" className="flex items-center gap-2 text-xs text-muted">
          <div className="flex h-1.5 flex-1 gap-1">{[0, 1, 2, 3].map((i) => <span key={i} className={cx('flex-1 rounded-full', i < strength ? (strength >= 3 ? 'bg-ok' : 'bg-warn') : 'bg-line')} />)}</div>
          {strength >= 3 ? 'Senha forte' : 'Senha fraca'}
        </div>
      ) : null}
      <Checkbox id="adult" name="adult" label="Declaro que tenho 18 anos ou mais." error={e.adult} required />
      <Checkbox id="terms" name="terms" required error={e.terms} label={<>Li e aceito os <Link href="/termos" target="_blank">Termos de uso</Link>, a <Link href="/privacidade" target="_blank">Política de privacidade</Link> e as <Link href="/diretrizes" target="_blank">Diretrizes de conteúdo</Link>.</>} />
      <SubmitButton pendingText="Criando conta…">Criar conta</SubmitButton>
      <p className="text-center text-sm text-muted">Já tem conta? <Link href="/login">Entrar</Link></p>
    </form>
  );
}
