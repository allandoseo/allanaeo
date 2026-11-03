'use client';

import { useActionState } from 'react';
import { changePasswordAction, deleteAccountAction, updateNameAction } from '@/app/actions/painel';
import type { FormState } from '@/app/actions/types';
import { Alert, Field, Input } from '../ui';
import { SubmitButton } from '../auth/SubmitButton';

export function NameForm({ name }: { name: string }) {
  const [state, action] = useActionState<FormState, FormData>(updateNameAction, {});
  return (
    <form action={action} noValidate className="flex flex-col gap-3">
      {state.message ? <Alert tone={state.ok ? 'ok' : 'error'}>{state.message}</Alert> : null}
      <Field label="Nome (não aparece publicamente)" htmlFor="acc-name" error={state.errors?.name}>
        <Input id="acc-name" name="name" maxLength={80} defaultValue={state.values?.name ?? name} error={state.errors?.name} />
      </Field>
      <div className="sm:max-w-[200px]"><SubmitButton pendingText="Salvando…">Salvar nome</SubmitButton></div>
    </form>
  );
}

export function PasswordForm() {
  const [state, action] = useActionState<FormState, FormData>(changePasswordAction, {});
  const e = state.errors ?? {};
  return (
    <form action={action} noValidate className="flex flex-col gap-3" key={state.ok ? 'ok' : 'form'}>
      {state.message ? <Alert tone={state.ok ? 'ok' : 'error'}>{state.message}</Alert> : null}
      <Field label="Senha atual" htmlFor="pw-cur" error={e.current}>
        <Input id="pw-cur" name="current" type="password" autoComplete="current-password" error={e.current} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nova senha" htmlFor="pw-new" error={e.password} hint="Mínimo 8 caracteres, com letra e número.">
          <Input id="pw-new" name="password" type="password" autoComplete="new-password" error={e.password} />
        </Field>
        <Field label="Confirmar nova senha" htmlFor="pw-conf" error={e.confirm}>
          <Input id="pw-conf" name="confirm" type="password" autoComplete="new-password" error={e.confirm} />
        </Field>
      </div>
      <div className="sm:max-w-[200px]"><SubmitButton pendingText="Alterando…">Alterar senha</SubmitButton></div>
    </form>
  );
}

export function DeleteAccountForm() {
  const [state, action] = useActionState<FormState, FormData>(deleteAccountAction, {});
  return (
    <form action={action} noValidate className="flex flex-col gap-3">
      {state.message ? <Alert tone="error">{state.message}</Alert> : null}
      <p className="text-sm">Remove sua conta, perfil, anúncios (incluindo fotos e contatos) e favoritos. Registros mínimos de moderação podem ser mantidos pelo prazo legal.</p>
      <Field label="Para confirmar, digite EXCLUIR" htmlFor="del-confirm" error={state.errors?.confirm}>
        <Input id="del-confirm" name="confirm" autoComplete="off" error={state.errors?.confirm} className="sm:max-w-[240px]" />
      </Field>
      <div className="sm:max-w-[240px]">
        <button type="submit" className="flex h-12 w-full items-center justify-center rounded border border-danger bg-white font-semibold text-danger hover:bg-red-50">Excluir minha conta</button>
      </div>
    </form>
  );
}
