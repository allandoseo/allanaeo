'use client';

import { useActionState } from 'react';
import { saveProfileAction } from '@/app/actions/painel';
import type { FormState } from '@/app/actions/types';
import type { City } from '@/lib/types';
import { Alert, Field, Input, Select, Textarea } from '../ui';
import { SubmitButton } from '../auth/SubmitButton';

export function ProfileForm({ cities, initial }: { cities: City[]; initial: { publicName: string; bio: string; citySlug: string } }) {
  const [state, action] = useActionState<FormState, FormData>(saveProfileAction, {});
  const v = state.values ?? initial;
  const e = state.errors ?? {};
  return (
    <form action={action} noValidate className="flex flex-col gap-4">
      {state.message ? <Alert tone={state.ok ? 'ok' : 'error'}>{state.message}</Alert> : null}
      <Field label="Nome público" htmlFor="publicName" error={e.publicName} hint="Use um nome artístico ou apenas o primeiro nome. Não use nome completo.">
        <Input id="publicName" name="publicName" maxLength={40} required defaultValue={v.publicName} error={e.publicName} />
      </Field>
      <Field label="Cidade principal" htmlFor="citySlug" error={e.citySlug}>
        <Select id="citySlug" name="citySlug" required defaultValue={v.citySlug} error={e.citySlug}>
          <option value="">Selecione</option>
          {cities.map((c) => <option key={c.slug} value={c.slug}>{c.name} ({c.state})</option>)}
        </Select>
      </Field>
      <Field label="Apresentação do perfil" htmlFor="bio" error={e.bio} hint="Até 1.500 caracteres. Não inclua telefone, endereço ou links.">
        <Textarea id="bio" name="bio" rows={5} maxLength={1500} defaultValue={v.bio} error={e.bio} />
      </Field>
      <div className="sm:max-w-[220px]"><SubmitButton pendingText="Salvando…">Salvar perfil</SubmitButton></div>
    </form>
  );
}
