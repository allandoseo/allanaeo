/** Barra horizontal simples (CSS), proporcional ao maior valor da série. */
export function Bar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2" title={`${label}: ${value}`}>
      <div className="h-2.5 flex-1 overflow-hidden rounded-sm bg-sky" aria-hidden="true"><div className="h-full bg-brand" style={{ width: `${pct}%` }} /></div>
      <span className="w-10 text-right tabular-nums">{value}</span>
    </div>
  );
}

export const shortDate = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;
