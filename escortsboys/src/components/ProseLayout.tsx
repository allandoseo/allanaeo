import type { ReactNode } from 'react';
import { Breadcrumbs } from './ui';

export type ProseSection = { id: string; title: string; body: ReactNode };

/** Layout de texto institucional com sumário de âncoras (lateral fixo no desktop). */
export function ProseLayout({ title, intro, updated, sections, aside }: { title: string; intro?: ReactNode; updated?: string; sections: ProseSection[]; aside?: ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-page flex-col gap-4 px-4 pb-14 pt-4 sm:px-6">
      <Breadcrumbs items={[{ href: '/', label: 'Início' }, { label: title }]} />
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <nav aria-label="Nesta página" className="rounded border border-line bg-white p-4 lg:sticky lg:top-4 lg:w-[250px] lg:shrink-0">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Nesta página</p>
          <ol className="flex flex-col gap-1.5 text-sm">
            {sections.map((s) => <li key={s.id}><a href={`#${s.id}`}>{s.title}</a></li>)}
          </ol>
          {aside ? <div className="mt-4 border-t border-line pt-4">{aside}</div> : null}
        </nav>
        <article className="min-w-0 flex-1 rounded border border-line bg-white p-5 sm:p-8">
          <h1 className="text-[26px] font-bold tracking-tight text-navy">{title}</h1>
          {updated ? <p className="mt-1 text-xs text-muted">Última atualização: {updated}</p> : null}
          {intro ? <div className="mt-3 text-[15px] leading-relaxed text-ink">{intro}</div> : null}
          {sections.map((s) => (
            <section key={s.id} id={s.id} aria-labelledby={`${s.id}-h`} className="mt-8 scroll-mt-4">
              <h2 id={`${s.id}-h`} className="text-lg font-bold text-navy">{s.title}</h2>
              <div className="prose-eb mt-2 flex flex-col gap-3 text-[15px] leading-relaxed [&_li]:mb-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5">{s.body}</div>
            </section>
          ))}
        </article>
      </div>
    </main>
  );
}
