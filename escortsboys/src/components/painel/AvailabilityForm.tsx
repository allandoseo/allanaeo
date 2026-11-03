'use client';

import { useActionState } from 'react';
import { availabilityAction } from '@/app/actions/painel';
import type { FormState } from '@/app/actions/types';
import { AVAILABILITY_LABEL } from '@/lib/availability';
import type { Availability } from '@/lib/types';
import { Alert, Field, Input, Select, cx } from '../ui';
import { SubmitButton } from '../auth/SubmitButton';

const OPTIONS: { value: Availability; hint: string }[] = [
  { value: 'available_now', hint: 'Expira em 4 horas' },
  { value: 'available_today', hint: 'Vale até o fim do dia' },
  { value: 'by_appointment', hint: 'Vale por 14 dias' },
  { value: 'unavailable', hint: 'Vale até o fim do dia' },
];

export function AvailabilityForm({ ads }: { ads: { id: string; title: string }[] }) {
  const [state, action] = useActionState<FormState, FormData>(availabilityAction, {});
  return (
    <form action={action} className="flex flex-col gap-4">
      {state.message ? <Alert tone={state.ok ? 'ok' : 'error'}>{state.message}</Alert> : null}
      <fieldset>
        <legend className="mb-2 text-[13px] font-semibold">Status</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {OPTIONS.map((o) => (
            <label key={o.value} className={cx('flex cursor-pointer items-start gap-3 rounded border border-line p-3 has-[:checked]:border-brand has-[:checked]:bg-sky')}>
              <input type="radio" name="availability" value={o.value} required className="mt-1 accent-brand" />
              <span><span className="block text-sm font-semibold">{AVAILABILITY_LABEL[o.value]}</span><span className="text-xs text-muted">{o.hint}</span></span>
            </label>
          ))}
        </div>
        {state.errors?.availability ? <p className="mt-1 text-xs text-danger">{state.errors.availability}</p> : null}
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Observação curta (opcional)" htmlFor="av-note" hint="Ex.: até as 22h, somente com agendamento">
          <Input id="av-note" name="note" maxLength={120} />
        </Field>
        <Field label="Aplicar em" htmlFor="av-target">
          <Select id="av-target" name="target" defaultValue="all">
            <option value="all">Todos os meus anúncios</option>
            {ads.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}
          </Select>
        </Field>
      </div>
      <div className="sm:max-w-[240px]"><SubmitButton pendingText="Atualizando…">Atualizar disponibilidade</SubmitButton></div>
    </form>
  );
}
