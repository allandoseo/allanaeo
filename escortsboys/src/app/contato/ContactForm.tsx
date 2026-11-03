'use client';

import { SUBJECTS } from './subjects';
import { useActionState } from 'react';
import { contactAction } from '@/app/actions/public';
import type { FormState } from '@/app/actions/types';
import { SubmitButton } from '@/components/auth/SubmitButton';
import { Alert, Field, Input, Select, Textarea } from '@/components/ui';


export function ContactForm({ subject, plan }: { subject: string; plan?: string }) {
  const [state, action] = useActionState<FormState, FormData>(contactAction, {});
  const e = state.errors ?? {};
  const v = state.values ?? {};
  if (state.ok) return <Alert tone="ok">{state.message}</Alert>;
  return (
    <form action={action} noValidate className="flex flex-col gap-4">
      {state.message ? <Alert tone="error">{state.message}</Alert> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome" htmlFor="c-name" error={e.name}>
          <Input id="c-name" name="name" autoComplete="name" required defaultValue={v.name} error={e.name} />
        </Field>
        <Field label="E-mail para resposta" htmlFor="c-email" error={e.email}>
          <Input id="c-email" name="email" type="email" autoComplete="email" required defaultValue={v.email} error={e.email} />
        </Field>
      </div>
      <Field label="Assunto" htmlFor="c-subject" error={e.subject}>
        <Select id="c-subject" name="subject" defaultValue={v.subject || subject} error={e.subject}>
          {SUBJECTS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </Select>
      </Field>
      <Field label="Mensagem" htmlFor="c-message" error={e.message} hint="Para remoção, informe o link do anúncio e o motivo.">
        <Textarea id="c-message" name="message" rows={6} required maxLength={4000} defaultValue={v.message || (plan ? `Tenho interesse no plano ${plan}.` : '')} error={e.message} />
      </Field>
      <div aria-hidden="true" className="absolute -left-[9999px]">
        <label htmlFor="c-website">Não preencha</label>
        <input id="c-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <SubmitButton pendingText="Enviando…">Enviar mensagem</SubmitButton>
    </form>
  );
}
