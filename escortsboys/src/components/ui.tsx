import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';
import { IconChevronLeft, IconChevronRight } from './icons';

export function cx(...c: Array<string | false | null | undefined>) {
  return c.filter(Boolean).join(' ');
}

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
const VARIANTS: Record<Variant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-dark border border-brand',
  secondary: 'bg-white text-brand border border-brand hover:bg-sky',
  ghost: 'bg-white text-ink border border-line hover:border-steel',
  danger: 'bg-white text-danger border border-danger hover:bg-red-50',
  success: 'bg-ok text-white border border-ok hover:brightness-95',
};
const SIZES = { sm: 'h-9 px-3 text-[13px]', md: 'h-11 px-4 text-sm', lg: 'h-12 px-5 text-[15px]' };
const btnBase = 'inline-flex items-center justify-center gap-2 rounded font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap';

export function Button({ variant = 'primary', size = 'md', className, ...rest }: ComponentProps<'button'> & { variant?: Variant; size?: keyof typeof SIZES }) {
  return <button type="button" className={cx(btnBase, VARIANTS[variant], SIZES[size], className)} {...rest} />;
}

export function LinkButton({ variant = 'primary', size = 'md', className, ...rest }: ComponentProps<typeof Link> & { variant?: Variant; size?: keyof typeof SIZES }) {
  return <Link className={cx(btnBase, VARIANTS[variant], SIZES[size], 'no-underline hover:no-underline', className)} {...rest} />;
}

export function Field({ label, htmlFor, error, hint, children, className }: { label: ReactNode; htmlFor: string; error?: string; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cx('flex flex-col gap-1', className)}>
      <label htmlFor={htmlFor} className="text-[13px] font-semibold text-ink">{label}</label>
      {children}
      {error ? <p id={`${htmlFor}-error`} className="text-xs font-medium text-danger">{error}</p> : hint ? <p className="text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

export const inputCls = (error?: string) =>
  cx('h-11 w-full rounded border bg-white px-3 text-[15px] text-ink placeholder:text-muted/80', error ? 'border-danger' : 'border-line focus:border-brand');

export function Input({ error, className, id, ...rest }: ComponentProps<'input'> & { error?: string }) {
  return <input id={id} aria-invalid={!!error || undefined} aria-describedby={error ? `${id}-error` : undefined} className={cx(inputCls(error), className)} {...rest} />;
}

export function Textarea({ error, className, id, ...rest }: ComponentProps<'textarea'> & { error?: string }) {
  return <textarea id={id} aria-invalid={!!error || undefined} aria-describedby={error ? `${id}-error` : undefined} className={cx('w-full rounded border bg-white px-3 py-2.5 text-[15px] leading-relaxed text-ink', error ? 'border-danger' : 'border-line focus:border-brand', className)} {...rest} />;
}

export function Select({ error, className, id, ...rest }: ComponentProps<'select'> & { error?: string }) {
  return <select id={id} aria-invalid={!!error || undefined} aria-describedby={error ? `${id}-error` : undefined} className={cx(inputCls(error), 'pr-8', className)} {...rest} />;
}

export function Checkbox({ label, error, id, ...rest }: ComponentProps<'input'> & { label: ReactNode; error?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="flex cursor-pointer items-start gap-2.5 text-sm leading-snug">
        <input id={id} type="checkbox" className="mt-0.5 h-[18px] w-[18px] shrink-0 accent-brand" aria-invalid={!!error || undefined} {...rest} />
        <span>{label}</span>
      </label>
      {error ? <p className="pl-7 text-xs font-medium text-danger">{error}</p> : null}
    </div>
  );
}

export function Badge({ tone = 'neutral', children, className }: { tone?: 'neutral' | 'brand' | 'ok' | 'warn' | 'danger'; children: ReactNode; className?: string }) {
  const tones = {
    neutral: 'border-line bg-white text-muted',
    brand: 'border-sky bg-sky text-brand',
    ok: 'border-green-200 bg-green-50 text-ok',
    warn: 'border-amber-200 bg-amber-50 text-warn',
    danger: 'border-red-200 bg-red-50 text-danger',
  };
  return <span className={cx('inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[11px] font-semibold leading-tight', tones[tone], className)}>{children}</span>;
}

export function Alert({ tone = 'info', children, className }: { tone?: 'info' | 'ok' | 'error' | 'warn'; children: ReactNode; className?: string }) {
  const tones = { info: 'border-sky bg-sky text-navy', ok: 'border-green-200 bg-green-50 text-ok', error: 'border-red-200 bg-red-50 text-danger', warn: 'border-amber-200 bg-amber-50 text-warn' };
  return <div role={tone === 'error' ? 'alert' : 'status'} className={cx('rounded border px-3 py-2.5 text-sm', tones[tone], className)}>{children}</div>;
}

export function Card({ children, className, ...rest }: ComponentProps<'section'>) {
  return <section className={cx('rounded border border-line bg-white', className)} {...rest}>{children}</section>;
}

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded border border-line bg-white px-6 py-12 text-center">
      <h2 className="text-lg font-bold text-navy">{title}</h2>
      {children ? <div className="max-w-md text-sm text-muted">{children}</div> : null}
      {action}
    </div>
  );
}

export function Breadcrumbs({ items }: { items: { href?: string; label: string }[] }) {
  return (
    <nav aria-label="Trilha de navegação" className="text-[13px] text-muted">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-1.5">
            {i > 0 && <span aria-hidden="true">›</span>}
            {it.href ? <Link href={it.href}>{it.label}</Link> : <span aria-current="page" className="text-ink">{it.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function Pagination({ page, pages, hrefFor }: { page: number; pages: number; hrefFor: (p: number) => string }) {
  if (pages <= 1) return null;
  const nums = Array.from(new Set([1, page - 1, page, page + 1, pages].filter((n) => n >= 1 && n <= pages))).sort((a, b) => a - b);
  const cell = 'flex h-10 min-w-10 items-center justify-center rounded border px-3 text-sm no-underline hover:no-underline';
  return (
    <nav aria-label="Paginação" className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
      {page > 1 ? <Link className={cx(cell, 'border-line bg-white text-ink')} href={hrefFor(page - 1)} rel="prev"><IconChevronLeft size={16} /> Anterior</Link> : null}
      {nums.map((n, i) => (
        <span key={n} className="flex items-center gap-1.5">
          {i > 0 && n - nums[i - 1] > 1 ? <span className="px-1 text-muted">…</span> : null}
          <Link href={hrefFor(n)} aria-current={n === page ? 'page' : undefined} className={cx(cell, n === page ? 'border-brand bg-brand font-semibold text-white' : 'border-line bg-white text-ink')}>{n}</Link>
        </span>
      ))}
      {page < pages ? <Link className={cx(cell, 'border-line bg-white text-brand')} href={hrefFor(page + 1)} rel="next">Próxima <IconChevronRight size={16} /></Link> : null}
    </nav>
  );
}

export function PageHeading({ title, children, actions }: { title: string; children?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-navy">{title}</h1>
        {children ? <div className="text-sm text-muted">{children}</div> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
