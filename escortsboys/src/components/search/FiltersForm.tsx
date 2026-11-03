'use client';

import { useState } from 'react';
import { IconFilter } from '../icons';
import type { Category, City } from '@/lib/types';
import type { SearchFilters } from '@/lib/search';
import { cx } from '../ui';

const DISP = [
  { value: 'available_now', label: 'Disponível agora' },
  { value: 'available_today', label: 'Disponível hoje' },
  { value: 'by_appointment', label: 'Atende com agendamento' },
];

/** Formulário GET (funciona sem JavaScript). No celular fica num painel expansível. */
export function FiltersForm({ cities, categories, f, activeCount }: { cities: City[]; categories: Category[]; f: SearchFilters; activeCount: number }) {
  const [open, setOpen] = useState(false);
  const [city, setCity] = useState(f.cidade);
  const regions = cities.find((c) => c.slug === city)?.regions ?? [];
  const box = 'border-b border-line px-4 py-4';
  const lbl = 'mb-1.5 block text-xs font-semibold text-muted';
  const ctl = 'h-10 w-full rounded border border-line bg-white px-2 text-sm';

  return (
    <aside aria-label="Filtros de busca" className="w-full lg:w-[272px] lg:shrink-0">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-controls="filtros" className="flex h-11 w-full items-center justify-center gap-2 rounded border border-line bg-white text-sm font-semibold text-brand lg:hidden">
        <IconFilter size={18} /> {open ? 'Fechar filtros' : 'Filtrar resultados'}{activeCount ? ` (${activeCount})` : ''}
      </button>
      <form id="filtros" action="/anuncios" method="get" className={cx('mt-2 rounded border border-line bg-white lg:mt-0 lg:block', open ? 'block' : 'hidden')}>
        {f.q ? <input type="hidden" name="q" value={f.q} /> : null}
        {f.ordem !== 'relevantes' ? <input type="hidden" name="ordem" value={f.ordem} /> : null}
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="text-[15px] font-bold text-navy">Filtros</h2>
          <a href="/anuncios" className="text-[13px] font-semibold">Limpar</a>
        </div>
        <div className={box}>
          <label htmlFor="f-cidade" className={lbl}>Cidade</label>
          <select id="f-cidade" name="cidade" value={city} onChange={(e) => setCity(e.target.value)} className={ctl}>
            <option value="">Todas as cidades</option>
            {cities.map((c) => <option key={c.slug} value={c.slug}>{c.name} ({c.state})</option>)}
          </select>
          <label htmlFor="f-regiao" className={cx(lbl, 'mt-3')}>Bairro ou região</label>
          <select id="f-regiao" name="regiao" defaultValue={f.regiao} key={city} disabled={!regions.length} className={ctl}>
            <option value="">{regions.length ? 'Todas as regiões' : 'Escolha a cidade primeiro'}</option>
            {regions.map((r) => <option key={r.slug} value={r.slug}>{r.name}</option>)}
          </select>
        </div>
        <fieldset className={box}>
          <legend className={lbl}>Faixa etária</legend>
          <div className="flex items-center gap-2">
            <label htmlFor="f-imin" className="sr-only">Idade mínima</label>
            <input id="f-imin" name="idade_min" type="number" min={18} max={80} placeholder="18" defaultValue={f.idadeMin ?? ''} className={ctl} />
            <span className="text-muted">a</span>
            <label htmlFor="f-imax" className="sr-only">Idade máxima</label>
            <input id="f-imax" name="idade_max" type="number" min={18} max={80} placeholder="60" defaultValue={f.idadeMax ?? ''} className={ctl} />
          </div>
        </fieldset>
        <fieldset className={box}>
          <legend className={lbl}>Disponibilidade (status recente)</legend>
          {DISP.map((d) => (
            <label key={d.value} className="flex min-h-8 items-center gap-2.5 text-sm">
              <input type="checkbox" name="disp" value={d.value} defaultChecked={f.disponibilidade.includes(d.value as never)} className="h-[18px] w-[18px] accent-brand" /> {d.label}
            </label>
          ))}
        </fieldset>
        <fieldset className={box}>
          <legend className={lbl}>Modalidade de atendimento</legend>
          {categories.map((c) => (
            <label key={c.slug} className="flex min-h-8 items-center gap-2.5 text-sm">
              <input type="checkbox" name="modo" value={c.slug} defaultChecked={f.modalidades.includes(c.slug)} className="h-[18px] w-[18px] accent-brand" /> {c.name}
            </label>
          ))}
        </fieldset>
        <fieldset className={box}>
          <legend className={lbl}>Valor a partir de (quando informado)</legend>
          <div className="flex items-center gap-2">
            <label htmlFor="f-pmin" className="sr-only">Valor mínimo em reais</label>
            <input id="f-pmin" name="preco_min" type="number" min={0} step={10} placeholder="Mín. R$" defaultValue={f.precoMin ?? ''} className={ctl} />
            <label htmlFor="f-pmax" className="sr-only">Valor máximo em reais</label>
            <input id="f-pmax" name="preco_max" type="number" min={0} step={10} placeholder="Máx. R$" defaultValue={f.precoMax ?? ''} className={ctl} />
          </div>
        </fieldset>
        <fieldset className={box}>
          <legend className={lbl}>Perfil</legend>
          <label className="flex min-h-8 items-center gap-2.5 text-sm"><input type="checkbox" name="verificados" value="1" defaultChecked={f.verificados} className="h-[18px] w-[18px] accent-brand" /> Somente verificados</label>
          <label className="flex min-h-8 items-center gap-2.5 text-sm"><input type="checkbox" name="recentes" value="1" defaultChecked={f.recentes} className="h-[18px] w-[18px] accent-brand" /> Atualizados nas últimas 24 h</label>
        </fieldset>
        <div className="p-4">
          <button type="submit" className="h-11 w-full rounded bg-brand font-semibold text-white hover:bg-brand-dark">Aplicar filtros</button>
        </div>
      </form>
    </aside>
  );
}
