'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { SORT_OPTIONS, type SortKey } from '@/lib/search';

export function SortSelect({ value }: { value: SortKey }) {
  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams();
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="ordem" className="text-[13px] text-muted">Ordenar por</label>
      <select
        id="ordem"
        value={value}
        onChange={(e) => {
          const p = new URLSearchParams(params.toString());
          if (e.target.value === 'relevantes') p.delete('ordem'); else p.set('ordem', e.target.value);
          p.delete('pagina');
          const qs = p.toString();
          router.push(qs ? `${path}?${qs}` : path);
        }}
        className="h-9 rounded border border-line bg-white px-2 text-[13px]"
      >
        {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}
