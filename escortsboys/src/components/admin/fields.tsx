import type { ReactNode } from 'react';

const ctl = 'w-full rounded border border-line bg-white px-3 text-sm';

export function TextField({ id, name, label, defaultValue, required, type = 'text', hint, ...rest }: { id: string; name: string; label: string; defaultValue?: string | number; required?: boolean; type?: string; hint?: ReactNode; min?: number; max?: number; maxLength?: number; placeholder?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-[13px] font-semibold">{label}</label>
      <input id={id} name={name} type={type} defaultValue={defaultValue} required={required} className={`${ctl} h-10`} {...rest} />
      {hint ? <span className="text-xs text-muted">{hint}</span> : null}
    </div>
  );
}

export function AreaField({ id, name, label, defaultValue, rows = 4, hint }: { id: string; name: string; label: string; defaultValue?: string; rows?: number; hint?: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-[13px] font-semibold">{label}</label>
      <textarea id={id} name={name} rows={rows} defaultValue={defaultValue} className={`${ctl} py-2`} />
      {hint ? <span className="text-xs text-muted">{hint}</span> : null}
    </div>
  );
}

export function CheckField({ id, name, label, defaultChecked }: { id: string; name: string; label: string; defaultChecked?: boolean }) {
  return (
    <label htmlFor={id} className="flex min-h-8 items-center gap-2 text-sm">
      <input id={id} name={name} type="checkbox" defaultChecked={defaultChecked} className="h-[18px] w-[18px] accent-brand" /> {label}
    </label>
  );
}
