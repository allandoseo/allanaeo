'use client';

import { useRef, useState, useTransition } from 'react';
import { submitAdAction, wizardStepAction } from '@/app/actions/painel';
import { AdCard } from '../AdCard';
import { AdPhoto } from '../AdPhoto';
import { IconChevronLeft, IconChevronRight, IconTrash, IconUpload } from '../icons';
import { Alert, Button, Card, Checkbox, Field, Input, Select, Textarea, cx } from '../ui';
import { uploadPhoto } from './upload';
import { AVAILABILITY_LABEL, WEEKDAYS } from '@/lib/availability';
import { formatDateTime } from '@/lib/format';
import type { AdStatus, Availability, Category, Characteristic, City, Photo, PriceItem, PublicAd, ScheduleSlot } from '@/lib/types';
import { AD_STEPS, validateStep, type FieldErrors } from '@/lib/validation';

export interface WizardData {
  publicName: string;
  age: string;
  title: string;
  citySlug: string;
  regionSlug: string;
  areasServed: string[];
  summary: string;
  description: string;
  characteristics: Characteristic[];
  modes: string[];
  availability: Availability;
  availabilityNote: string;
  schedule: ScheduleSlot[];
  showPrices: boolean;
  prices: PriceItem[];
  rules: string[];
  conditions: string;
  photos: Photo[];
  imageConsent: boolean;
  contact: { whatsapp: string; phone: string; telegram: string; showWhatsapp: boolean; showPhone: boolean; showTelegram: boolean };
}

type Props = {
  adId: string | null;
  status: AdStatus | null;
  initial: WizardData;
  initialStep: number;
  savedAt: string | null;
  cities: City[];
  categories: Category[];
  maxPhotos: number;
};

const CHAR_SUGGESTIONS = ['Altura', 'Idiomas', 'Público atendido', 'Biotipo', 'Cor dos olhos', 'Cor do cabelo', 'Tatuagens', 'Antecedência'];
const PRICE_SUGGESTIONS = ['30 minutos', '1 hora', '2 horas', 'Pernoite', 'Diária', 'Chamada de vídeo'];

/** Remove linhas vazias antes de validar/enviar. */
function clean(d: WizardData): WizardData {
  return {
    ...d,
    characteristics: d.characteristics.filter((c) => c.label.trim() || c.value.trim()),
    prices: d.prices.filter((p) => p.label.trim() || p.amount !== null),
    rules: d.rules.filter((r) => r.trim()),
  };
}

function stepOf(field: string): number {
  const root = field.split('.')[0];
  return AD_STEPS.find((s) => (s.fields as readonly string[]).includes(root))?.n ?? 10;
}

export function AdWizard({ adId: initialId, status, initial, initialStep, savedAt: initialSaved, cities, categories, maxPhotos }: Props) {
  const [adId, setAdId] = useState(initialId);
  const [d, setD] = useState<WizardData>(initial);
  const [step, setStep] = useState(Math.min(10, Math.max(1, initialStep)));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState<{ tone: 'ok' | 'error' | 'info'; text: string } | null>(null);
  const [savedAt, setSavedAt] = useState(initialSaved);
  const [pending, start] = useTransition();
  const top = useRef<HTMLDivElement>(null);
  const live = status === 'active' || status === 'paused' || status === 'pending';

  const set = <K extends keyof WizardData>(k: K, v: WizardData[K]) => setD((x) => ({ ...x, [k]: v }));
  const err = (k: string) => errors[k];
  const city = cities.find((c) => c.slug === d.citySlug);

  const goTo = (n: number) => {
    setStep(n);
    setErrors({});
    const path = adId ? `/painel/anuncios/${adId}/editar?etapa=${n}` : `/painel/anuncios/novo?etapa=${n}`;
    window.history.replaceState(null, '', path);
    top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const applyResult = (r: { adId: string | null; savedAt?: string; message?: string; errors?: FieldErrors }) => {
    if (r.adId && r.adId !== adId) setAdId(r.adId);
    if (r.savedAt) setSavedAt(r.savedAt);
    if (r.errors) setErrors(r.errors);
    if (r.message) setMessage({ tone: 'error', text: r.message });
  };

  const next = () => {
    const payload = clean(d);
    const local = validateStep(step, payload);
    setErrors(local);
    setMessage(null);
    if (Object.keys(local).length) return;
    start(async () => {
      const r = await wizardStepAction(adId, payload, step);
      applyResult(r);
      if (r.ok) {
        const id = r.adId ?? adId;
        setStep(step + 1);
        setErrors({});
        window.history.replaceState(null, '', id ? `/painel/anuncios/${id}/editar?etapa=${step + 1}` : `/painel/anuncios/novo?etapa=${step + 1}`);
        top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  };

  const saveDraft = () => {
    setMessage(null);
    start(async () => {
      const r = await wizardStepAction(adId, clean(d), step, true);
      applyResult(r);
      if (r.ok) {
        setMessage({ tone: 'ok', text: 'Rascunho salvo.' });
        if (r.adId) window.history.replaceState(null, '', `/painel/anuncios/${r.adId}/editar?etapa=${step}`);
      }
    });
  };

  const submit = () => {
    setMessage(null);
    start(async () => {
      const r = await submitAdAction(adId, clean(d));
      // Em caso de sucesso a action redireciona; aqui só chegam erros.
      applyResult(r);
      if (r.errors && Object.keys(r.errors).length) {
        const first = Math.min(...Object.keys(r.errors).map(stepOf));
        setStep(first);
        top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  };

  // Pendências por etapa (para a revisão)
  const pendencias = AD_STEPS.filter((s) => s.n < 10).map((s) => ({ ...s, errs: validateStep(s.n, clean(d)) })).filter((s) => Object.keys(s.errs).length);

  const preview: PublicAd = {
    id: adId ?? 'preview', slug: '', title: d.title, publicName: d.publicName || 'Seu nome', age: Number(d.age) >= 18 ? Number(d.age) : null,
    citySlug: d.citySlug, cityName: city?.name ?? 'Cidade', regionSlug: d.regionSlug || null, regionName: city?.regions.find((r) => r.slug === d.regionSlug)?.name ?? null,
    areasServed: d.areasServed, summary: d.summary || 'Resumo do anúncio', description: d.description, characteristics: d.characteristics,
    modes: d.modes.map((slug) => ({ slug, name: categories.find((c) => c.slug === slug)?.name ?? slug })),
    availability: d.availability, availabilityReliable: d.availability !== 'unknown', availabilityNote: d.availabilityNote, availabilityUpdatedAt: new Date().toISOString(),
    schedule: d.schedule, prices: d.showPrices ? d.prices : [], showPrices: d.showPrices,
    priceFrom: d.showPrices ? (d.prices.map((p) => p.amount).filter((n): n is number => n !== null).sort((a, b) => a - b)[0] ?? null) : null,
    rules: d.rules, conditions: d.conditions, hasWhatsapp: d.contact.showWhatsapp && !!d.contact.whatsapp, hasPhone: d.contact.showPhone && !!d.contact.phone,
    hasTelegram: d.contact.showTelegram && !!d.contact.telegram, photos: d.photos, verified: false, isDemo: false, profileSlug: '', updatedAt: new Date().toISOString(), publishedAt: null,
  };

  return (
    <div ref={top} className="flex scroll-mt-4 flex-col gap-4">
      <ol aria-label="Etapas do anúncio" className="flex flex-wrap gap-1.5">
        {AD_STEPS.map((s) => (
          <li key={s.n}>
            <button
              type="button"
              onClick={() => goTo(s.n)}
              aria-current={s.n === step ? 'step' : undefined}
              className={cx(
                'h-9 rounded-sm border px-2.5 text-[13px] font-semibold',
                s.n === step ? 'border-brand bg-brand text-white' : s.n < step ? 'border-line bg-sky text-navy' : 'border-line bg-white text-muted hover:text-ink',
              )}
            >
              {s.n}. {s.label}
            </button>
          </li>
        ))}
      </ol>
      <div className="h-1 overflow-hidden rounded-full bg-line" aria-hidden="true"><div className="h-full bg-brand transition-all" style={{ width: `${step * 10}%` }} /></div>

      {live ? <Alert tone="info">Este anúncio já foi enviado. Alterações em textos, fotos ou localização passam por nova análise antes de aparecer no site. As mudanças só são salvas ao clicar em “Salvar e enviar” na revisão.</Alert> : null}
      {message ? <Alert tone={message.tone}>{message.text}</Alert> : null}

      <div className="flex flex-col gap-5 xl:flex-row xl:items-start">
        <Card className="flex min-w-0 flex-1 flex-col gap-5 p-5 sm:p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-bold text-navy">Etapa {step} de 10 · {AD_STEPS[step - 1].label}</h2>
            <span className="text-xs text-muted" aria-live="polite">{savedAt && !live ? `Rascunho salvo em ${formatDateTime(savedAt)}` : ''}</span>
          </div>

          {step === 1 ? (
            <div className="flex flex-col gap-4">
              <Field label="Nome público" htmlFor="w-name" error={err('publicName')} hint="Aparece no título do anúncio. Não use nome completo.">
                <Input id="w-name" value={d.publicName} maxLength={40} onChange={(e) => set('publicName', e.target.value)} error={err('publicName')} />
              </Field>
              <Field label="Idade" htmlFor="w-age" error={err('age')} hint="Somente maiores de 18 anos podem anunciar.">
                <Input id="w-age" type="number" inputMode="numeric" min={18} max={80} value={d.age} onChange={(e) => set('age', e.target.value)} error={err('age')} className="max-w-[140px]" />
              </Field>
              <Field label="Título do anúncio" htmlFor="w-title" error={err('title')} hint={`${d.title.length}/90 · Ex.: Atendimento discreto na Zona Sul`}>
                <Input id="w-title" value={d.title} maxLength={90} onChange={(e) => set('title', e.target.value)} error={err('title')} />
              </Field>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Cidade" htmlFor="w-city" error={err('citySlug')}>
                  <Select id="w-city" value={d.citySlug} onChange={(e) => setD((x) => ({ ...x, citySlug: e.target.value, regionSlug: '', areasServed: [] }))} error={err('citySlug')}>
                    <option value="">Selecione</option>
                    {cities.map((c) => <option key={c.slug} value={c.slug}>{c.name} ({c.state})</option>)}
                  </Select>
                </Field>
                <Field label="Bairro ou região principal" htmlFor="w-region" error={err('regionSlug')}>
                  <Select id="w-region" value={d.regionSlug} disabled={!city} onChange={(e) => set('regionSlug', e.target.value)} error={err('regionSlug')}>
                    <option value="">{city ? 'Selecione' : 'Escolha a cidade primeiro'}</option>
                    {city?.regions.map((r) => <option key={r.slug} value={r.slug}>{r.name}</option>)}
                  </Select>
                </Field>
              </div>
              <TagInput
                id="w-areas"
                label="Outras regiões atendidas (opcional)"
                hint="Até 10. Apenas bairros ou regiões — nunca endereço."
                values={d.areasServed}
                max={10}
                suggestions={(city?.regions ?? []).map((r) => r.name)}
                onChange={(v) => set('areasServed', v)}
                error={err('areasServed')}
              />
              <Alert tone="info">Nunca informe endereço residencial, número, ponto de referência ou localização exata. O anúncio mostra só bairro e região.</Alert>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="flex flex-col gap-4">
              <Field label="Resumo (aparece no card da listagem)" htmlFor="w-summary" error={err('summary')} hint={`${d.summary.length}/220 · mínimo 20`}>
                <Textarea id="w-summary" rows={3} maxLength={220} value={d.summary} onChange={(e) => set('summary', e.target.value)} error={err('summary')} />
              </Field>
              <Field label="Apresentação completa" htmlFor="w-desc" error={err('description')} hint={`${d.description.length}/4000 · mínimo 80. Não inclua telefone, e-mail ou links — use a etapa Contato.`}>
                <Textarea id="w-desc" rows={10} maxLength={4000} value={d.description} onChange={(e) => set('description', e.target.value)} error={err('description')} />
              </Field>
            </div>
          ) : null}

          {step === 4 ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted">Informe só o que quiser divulgar. Tudo é opcional.</p>
              {d.characteristics.map((c, i) => (
                <div key={i} className="flex flex-wrap items-end gap-2">
                  <Field label="Característica" htmlFor={`w-cl-${i}`} className="min-w-[160px] flex-1" error={err(`characteristics.${i}.label`)}>
                    <Input id={`w-cl-${i}`} value={c.label} maxLength={30} onChange={(e) => set('characteristics', d.characteristics.map((x, k) => (k === i ? { ...x, label: e.target.value } : x)))} />
                  </Field>
                  <Field label="Valor" htmlFor={`w-cv-${i}`} className="min-w-[160px] flex-[2]" error={err(`characteristics.${i}.value`)}>
                    <Input id={`w-cv-${i}`} value={c.value} maxLength={60} onChange={(e) => set('characteristics', d.characteristics.map((x, k) => (k === i ? { ...x, value: e.target.value } : x)))} />
                  </Field>
                  <Button variant="ghost" aria-label={`Remover ${c.label || 'característica'}`} onClick={() => set('characteristics', d.characteristics.filter((_, k) => k !== i))}><IconTrash size={16} /></Button>
                </div>
              ))}
              <div className="flex flex-wrap gap-2">
                {CHAR_SUGGESTIONS.filter((s) => !d.characteristics.some((c) => c.label === s)).map((s) => (
                  <Button key={s} variant="ghost" size="sm" disabled={d.characteristics.length >= 15} onClick={() => set('characteristics', [...d.characteristics, { label: s, value: '' }])}>+ {s}</Button>
                ))}
                <Button variant="secondary" size="sm" disabled={d.characteristics.length >= 15} onClick={() => set('characteristics', [...d.characteristics, { label: '', value: '' }])}>+ Outra</Button>
              </div>
            </div>
          ) : null}

          {step === 5 ? (
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-sm text-muted">Selecione como você atende.</legend>
              {categories.map((c) => (
                <label key={c.slug} className={cx('flex cursor-pointer items-start gap-3 rounded border p-3', d.modes.includes(c.slug) ? 'border-brand bg-sky' : 'border-line')}>
                  <input type="checkbox" className="mt-0.5 h-[18px] w-[18px] accent-brand" checked={d.modes.includes(c.slug)} onChange={(e) => set('modes', e.target.checked ? [...d.modes, c.slug] : d.modes.filter((m) => m !== c.slug))} />
                  <span><span className="block text-sm font-semibold">{c.name}</span><span className="text-xs text-muted">{c.description}</span></span>
                </label>
              ))}
              {err('modes') ? <p className="text-xs font-medium text-danger">{err('modes')}</p> : null}
            </fieldset>
          ) : null}

          {step === 6 ? (
            <div className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Status atual" htmlFor="w-avail" error={err('availability')} hint="“Disponível agora” vale por 4 horas; “hoje” até o fim do dia.">
                  <Select id="w-avail" value={d.availability} onChange={(e) => set('availability', e.target.value as Availability)}>
                    {(['unknown', 'available_now', 'available_today', 'by_appointment', 'unavailable'] as Availability[]).map((a) => (
                      <option key={a} value={a}>{a === 'unknown' ? 'Não informar agora' : AVAILABILITY_LABEL[a]}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Observação curta (opcional)" htmlFor="w-anote" error={err('availabilityNote')} hint="Ex.: 14h às 22h">
                  <Input id="w-anote" maxLength={120} value={d.availabilityNote} onChange={(e) => set('availabilityNote', e.target.value)} />
                </Field>
              </div>
              <fieldset>
                <legend className="mb-2 text-[13px] font-semibold">Agenda semanal</legend>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[420px] border-collapse text-sm">
                    <thead><tr className="text-left text-xs text-muted"><th className="py-2 font-semibold">Dia</th><th className="py-2 font-semibold">Atende</th><th className="py-2 font-semibold">Das</th><th className="py-2 font-semibold">Até</th></tr></thead>
                    <tbody>
                      {WEEKDAYS.map((label, day) => {
                        const slot = d.schedule.find((s) => s.day === day);
                        const update = (patch: Partial<ScheduleSlot> | null) => {
                          const others = d.schedule.filter((s) => s.day !== day);
                          set('schedule', patch === null ? others : [...others, { day, from: slot?.from ?? '14:00', to: slot?.to ?? '22:00', ...patch }].sort((a, b) => a.day - b.day));
                        };
                        return (
                          <tr key={day} className="border-t border-line">
                            <th scope="row" className="py-2 pr-2 text-left font-normal">{label}</th>
                            <td className="py-2 pr-2"><input type="checkbox" aria-label={`Atende ${label}`} className="h-[18px] w-[18px] accent-brand" checked={!!slot} onChange={(e) => update(e.target.checked ? {} : null)} /></td>
                            <td className="py-2 pr-2"><input type="time" aria-label={`${label}: início`} disabled={!slot} value={slot?.from ?? ''} onChange={(e) => update({ from: e.target.value })} className="h-10 rounded border border-line px-2 disabled:bg-canvas" /></td>
                            <td className="py-2"><input type="time" aria-label={`${label}: fim`} disabled={!slot} value={slot?.to ?? ''} onChange={(e) => update({ to: e.target.value })} className="h-10 rounded border border-line px-2 disabled:bg-canvas" /></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {Object.keys(errors).some((k) => k.startsWith('schedule')) ? <p className="text-xs font-medium text-danger">Confira os horários da agenda.</p> : null}
              </fieldset>
            </div>
          ) : null}

          {step === 7 ? (
            <div className="flex flex-col gap-4">
              <Checkbox id="w-showprices" label="Exibir valores no anúncio" checked={d.showPrices} onChange={(e) => set('showPrices', e.target.checked)} />
              {d.showPrices ? (
                <div className="flex flex-col gap-2">
                  {d.prices.map((p, i) => (
                    <div key={i} className="flex flex-wrap items-end gap-2">
                      <Field label="Descrição" htmlFor={`w-pl-${i}`} className="min-w-[160px] flex-[2]" error={err(`prices.${i}.label`)}>
                        <Input id={`w-pl-${i}`} value={p.label} maxLength={40} onChange={(e) => set('prices', d.prices.map((x, k) => (k === i ? { ...x, label: e.target.value } : x)))} />
                      </Field>
                      <Field label="Valor em R$ (vazio = consultar)" htmlFor={`w-pa-${i}`} className="min-w-[160px] flex-1" error={err(`prices.${i}.amount`)}>
                        <Input id={`w-pa-${i}`} type="number" inputMode="numeric" min={1} step={1} value={p.amount ?? ''} onChange={(e) => set('prices', d.prices.map((x, k) => (k === i ? { ...x, amount: e.target.value === '' ? null : Math.round(Number(e.target.value)) } : x)))} />
                      </Field>
                      <Button variant="ghost" aria-label={`Remover valor ${p.label}`} onClick={() => set('prices', d.prices.filter((_, k) => k !== i))}><IconTrash size={16} /></Button>
                    </div>
                  ))}
                  <div className="flex flex-wrap gap-2">
                    {PRICE_SUGGESTIONS.filter((s) => !d.prices.some((p) => p.label === s)).map((s) => (
                      <Button key={s} variant="ghost" size="sm" disabled={d.prices.length >= 10} onClick={() => set('prices', [...d.prices, { label: s, amount: null }])}>+ {s}</Button>
                    ))}
                    <Button variant="secondary" size="sm" disabled={d.prices.length >= 10} onClick={() => set('prices', [...d.prices, { label: '', amount: null }])}>+ Outro</Button>
                  </div>
                </div>
              ) : <p className="text-sm text-muted">O anúncio mostrará “Consultar valores”.</p>}
              <fieldset className="flex flex-col gap-2 border-t border-line pt-4">
                <legend className="mb-1 text-[13px] font-semibold">Regras de atendimento</legend>
                {d.rules.map((r, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="flex-1">
                      <label htmlFor={`w-rule-${i}`} className="sr-only">Regra {i + 1}</label>
                      <Input id={`w-rule-${i}`} value={r} maxLength={160} onChange={(e) => set('rules', d.rules.map((x, k) => (k === i ? e.target.value : x)))} error={err(`rules.${i}`)} />
                      {err(`rules.${i}`) ? <p id={`w-rule-${i}-error`} className="mt-1 text-xs text-danger">{err(`rules.${i}`)}</p> : null}
                    </div>
                    <Button variant="ghost" aria-label={`Remover regra ${i + 1}`} onClick={() => set('rules', d.rules.filter((_, k) => k !== i))}><IconTrash size={16} /></Button>
                  </div>
                ))}
                <div><Button variant="secondary" size="sm" disabled={d.rules.length >= 12} onClick={() => set('rules', [...d.rules, ''])}>+ Adicionar regra</Button></div>
              </fieldset>
              <Field label="Condições e informações adicionais (opcional)" htmlFor="w-cond" error={err('conditions')} hint={`${d.conditions.length}/1000`}>
                <Textarea id="w-cond" rows={4} maxLength={1000} value={d.conditions} onChange={(e) => set('conditions', e.target.value)} error={err('conditions')} />
              </Field>
            </div>
          ) : null}

          {step === 8 ? <PhotosStep photos={d.photos} max={maxPhotos} consent={d.imageConsent} onPhotos={(p) => set('photos', p)} onConsent={(v) => set('imageConsent', v)} errors={errors} /> : null}

          {step === 9 ? (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-muted">Os contatos não aparecem no código da página: o WhatsApp abre por redirecionamento e o telefone só é revelado quando o visitante clica. Informe e autorize pelo menos um.</p>
              {([
                ['whatsapp', 'showWhatsapp', 'WhatsApp', 'DDD + número, ex.: (21) 99999-9999', 'tel'],
                ['phone', 'showPhone', 'Telefone para ligação', 'DDD + número', 'tel'],
                ['telegram', 'showTelegram', 'Usuário do Telegram', 'Ex.: @seuusuario', 'text'],
              ] as const).map(([k, show, label, hint, type]) => (
                <div key={k} className="flex flex-col gap-2 rounded border border-line p-3">
                  <Field label={label} htmlFor={`w-${k}`} error={err(`contact.${k}`)} hint={hint}>
                    <Input id={`w-${k}`} type={type} value={d.contact[k]} onChange={(e) => set('contact', { ...d.contact, [k]: e.target.value })} error={err(`contact.${k}`)} />
                  </Field>
                  <Checkbox id={`w-${show}`} label="Exibir no anúncio" checked={d.contact[show]} onChange={(e) => set('contact', { ...d.contact, [show]: e.target.checked })} />
                </div>
              ))}
              {err('contact') ? <p className="text-xs font-medium text-danger">{err('contact')}</p> : null}
            </div>
          ) : null}

          {step === 10 ? (
            <div className="flex flex-col gap-4">
              {pendencias.length ? (
                <Alert tone="warn">
                  <p className="font-semibold">Complete as etapas antes de enviar:</p>
                  <ul className="mt-1 list-disc pl-5">
                    {pendencias.map((p) => (
                      <li key={p.n}><button type="button" className="font-semibold underline" onClick={() => goTo(p.n)}>{p.n}. {p.label}</button> — {Object.values(p.errs)[0]}</li>
                    ))}
                  </ul>
                </Alert>
              ) : <Alert tone="ok">Tudo preenchido. Confira a pré-visualização e envie.</Alert>}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Pré-visualização do card</p>
                <div inert className="max-w-[720px]"><AdCard ad={preview} /></div>
              </div>
              <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                <div><dt className="text-xs text-muted">Modalidades</dt><dd>{preview.modes.map((m) => m.name).join(', ') || '—'}</dd></div>
                <div><dt className="text-xs text-muted">Agenda</dt><dd>{d.schedule.length ? d.schedule.map((s) => `${WEEKDAYS[s.day].slice(0, 3)} ${s.from}–${s.to}`).join(', ') : 'Não informada'}</dd></div>
                <div><dt className="text-xs text-muted">Contatos exibidos</dt><dd>{[preview.hasWhatsapp && 'WhatsApp', preview.hasPhone && 'Telefone', preview.hasTelegram && 'Telegram'].filter(Boolean).join(', ') || 'Nenhum'}</dd></div>
                <div><dt className="text-xs text-muted">Fotos</dt><dd>{d.photos.length}</dd></div>
              </dl>
              <p className="text-xs text-muted">Ao enviar, você confirma que as informações são verdadeiras, que tem 18 anos ou mais e que o anúncio segue as Diretrizes de conteúdo.</p>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4">
            <Button variant="ghost" onClick={() => goTo(step - 1)} disabled={step === 1 || pending}><IconChevronLeft size={16} /> Voltar</Button>
            <div className="flex flex-wrap gap-2">
              {!live ? <Button variant="secondary" onClick={saveDraft} disabled={pending}>{pending ? 'Salvando…' : 'Salvar rascunho'}</Button> : null}
              {step < 10 ? (
                <Button onClick={next} disabled={pending}>{pending ? 'Validando…' : 'Continuar'} <IconChevronRight size={16} /></Button>
              ) : (
                <Button onClick={submit} disabled={pending || pendencias.length > 0}>{pending ? 'Enviando…' : live ? 'Salvar e enviar' : 'Enviar para moderação'}</Button>
              )}
            </div>
          </div>
        </Card>

        {step < 10 ? (
          <aside aria-label="Pré-visualização" className="flex w-full flex-col gap-2 xl:sticky xl:top-4 xl:w-[400px] xl:shrink-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Pré-visualização</p>
            <div inert><AdCard ad={preview} /></div>
            <p className="text-xs text-muted">O selo de verificado só aparece depois que a equipe valida seus documentos.</p>
          </aside>
        ) : null}
      </div>
    </div>
  );
}

function TagInput({ id, label, hint, values, max, suggestions, onChange, error }: { id: string; label: string; hint: string; values: string[]; max: number; suggestions: string[]; onChange: (v: string[]) => void; error?: string }) {
  const [text, setText] = useState('');
  const add = (v: string) => {
    const t = v.trim().slice(0, 40);
    if (t.length < 2 || values.includes(t) || values.length >= max) return;
    onChange([...values, t]);
    setText('');
  };
  return (
    <div className="flex flex-col gap-2">
      <Field label={label} htmlFor={id} error={error} hint={hint}>
        <div className="flex gap-2">
          <Input id={id} value={text} maxLength={40} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(text); } }} />
          <Button variant="secondary" onClick={() => add(text)} disabled={values.length >= max}>Adicionar</Button>
        </div>
      </Field>
      {values.length ? (
        <ul className="flex flex-wrap gap-1.5" aria-label="Regiões adicionadas">
          {values.map((v) => (
            <li key={v}><button type="button" onClick={() => onChange(values.filter((x) => x !== v))} aria-label={`Remover ${v}`} className="rounded-sm bg-sky px-2 py-1 text-xs text-navy">{v} ✕</button></li>
          ))}
        </ul>
      ) : null}
      {suggestions.filter((s) => !values.includes(s)).length ? (
        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs text-muted">Sugestões:</span>
          {suggestions.filter((s) => !values.includes(s)).slice(0, 12).map((s) => (
            <button key={s} type="button" onClick={() => add(s)} disabled={values.length >= max} className="rounded-sm border border-line px-2 py-0.5 text-xs text-ink hover:border-brand disabled:opacity-50">+ {s}</button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

type Queued = { key: string; name: string; progress: number; error?: string };

function PhotosStep({ photos, max, consent, onPhotos, onConsent, errors }: { photos: Photo[]; max: number; consent: boolean; onPhotos: (p: Photo[]) => void; onConsent: (v: boolean) => void; errors: FieldErrors }) {
  const [queue, setQueue] = useState<Queued[]>([]);
  const input = useRef<HTMLInputElement>(null);
  const current = useRef(photos);
  current.current = photos;

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const slots = max - current.current.length;
    const list = Array.from(files);
    const accepted = list.slice(0, Math.max(0, slots));
    const rejected = list.slice(accepted.length).map((f, i) => ({ key: `x${Date.now()}${i}`, name: f.name, progress: 0, error: `Limite de ${max} fotos atingido.` }));
    const items = accepted.map((f, i) => ({ key: `${Date.now()}-${i}`, name: f.name, progress: 0 }));
    setQueue((q) => [...q.filter((x) => !x.error && x.progress < 100), ...items, ...rejected]);
    if (input.current) input.current.value = '';
    for (let i = 0; i < accepted.length; i++) {
      const it = items[i];
      try {
        const photo = await uploadPhoto(accepted[i], (p) => setQueue((q) => q.map((x) => (x.key === it.key ? { ...x, progress: p } : x))));
        onPhotos([...current.current, photo]);
        setQueue((q) => q.filter((x) => x.key !== it.key));
      } catch (e) {
        setQueue((q) => q.map((x) => (x.key === it.key ? { ...x, error: (e as Error).message } : x)));
      }
    }
  };

  const move = (i: number, d: number) => {
    const p = [...photos];
    const j = i + d;
    if (j < 0 || j >= p.length) return;
    [p[i], p[j]] = [p[j], p[i]];
    onPhotos(p);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-center gap-2 rounded border border-dashed border-steel bg-canvas p-6 text-center">
        <IconUpload size={26} className="text-steel" />
        <p className="font-semibold text-navy">Envie fotos do seu dispositivo</p>
        <p className="text-xs text-muted">JPG, PNG ou WebP · até 10 MB · mínimo 400 × 400 px · {photos.length}/{max} fotos</p>
        <input ref={input} id="w-files" type="file" multiple accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => onFiles(e.target.files)} />
        <Button onClick={() => input.current?.click()} disabled={photos.length >= max}>Selecionar fotos</Button>
      </div>
      {queue.length ? (
        <ul className="flex flex-col gap-1.5" aria-live="polite">
          {queue.map((q) => (
            <li key={q.key} className="flex flex-col gap-1 rounded border border-line px-3 py-2 text-sm">
              <span className="flex justify-between gap-2"><span className="truncate">{q.name}</span><span className={q.error ? 'text-danger' : 'text-muted'}>{q.error ? 'Erro' : `${q.progress}%`}</span></span>
              {q.error ? <span className="text-xs text-danger">{q.error}</span> : <span className="h-1 overflow-hidden rounded-full bg-line"><span className="block h-full bg-brand" style={{ width: `${q.progress}%` }} /></span>}
            </li>
          ))}
        </ul>
      ) : null}
      {photos.length ? (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((p, i) => (
            <li key={p.id} className="flex flex-col gap-2 rounded border border-line p-2">
              <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-line">
                <AdPhoto photo={p} sizes="240px" />
                {i === 0 ? <span className="absolute left-2 top-2 rounded-sm bg-brand px-1.5 py-0.5 text-[11px] font-semibold text-white">Capa</span> : null}
              </div>
              <label htmlFor={`w-alt-${i}`} className="text-xs font-semibold">Descrição da foto (acessibilidade)</label>
              <input id={`w-alt-${i}`} value={p.alt} maxLength={140} onChange={(e) => onPhotos(photos.map((x, k) => (k === i ? { ...x, alt: e.target.value } : x)))} placeholder="Ex.: foto de corpo inteiro em ambiente interno" className="h-9 rounded border border-line px-2 text-sm" />
              <div className="flex flex-wrap gap-1.5">
                <Button size="sm" variant="ghost" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Mover foto ${i + 1} para a esquerda`}><IconChevronLeft size={15} /></Button>
                <Button size="sm" variant="ghost" onClick={() => move(i, 1)} disabled={i === photos.length - 1} aria-label={`Mover foto ${i + 1} para a direita`}><IconChevronRight size={15} /></Button>
                {i > 0 ? <Button size="sm" variant="ghost" onClick={() => onPhotos([p, ...photos.filter((_, k) => k !== i)])}>Usar como capa</Button> : null}
                <Button size="sm" variant="danger" onClick={() => onPhotos(photos.filter((_, k) => k !== i))} aria-label={`Remover foto ${i + 1}`}><IconTrash size={15} /></Button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
      {errors.photos ? <p className="text-xs font-medium text-danger">{errors.photos}</p> : null}
      <ul className="list-disc space-y-1 pl-5 text-xs text-muted">
        <li>Envie apenas fotos suas, recentes e autorizadas. Não é obrigatório mostrar o rosto.</li>
        <li>Proibido: menores de idade, terceiros sem autorização, documentos, placas, fachadas ou qualquer dado que identifique endereço.</li>
      </ul>
      <Checkbox
        id="w-consent"
        checked={consent}
        onChange={(e) => onConsent(e.target.checked)}
        error={errors.imageConsent}
        label="Declaro que sou a pessoa retratada ou que tenho autorização expressa de todas as pessoas que aparecem nas fotos, todas maiores de 18 anos, e que posso publicá-las."
      />
    </div>
  );
}
