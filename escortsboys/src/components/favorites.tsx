'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { IconHeart } from './icons';
import { cx } from './ui';

const KEY = 'eb_favoritos';

type Ctx = { ids: string[]; has: (id: string) => boolean; toggle: (id: string) => Promise<void>; ready: boolean; loggedIn: boolean };
const FavoritesContext = createContext<Ctx | null>(null);

function readLocal(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string').slice(0, 500) : [];
  } catch {
    return [];
  }
}
function writeLocal(ids: string[]) {
  try { localStorage.setItem(KEY, JSON.stringify(ids)); } catch { /* armazenamento indisponível */ }
}

/** Favoritos: locais para visitantes; sincronizados com a conta quando há sessão (mesclando os locais no login). */
export function FavoritesProvider({ loggedIn, children }: { loggedIn: boolean; children: React.ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const synced = useRef(false);

  useEffect(() => {
    const local = readLocal();
    if (!loggedIn) {
      setIds(local);
      setReady(true);
      return;
    }
    if (synced.current) return;
    synced.current = true;
    (async () => {
      try {
        const res = await fetch('/api/favoritos', {
          method: local.length ? 'POST' : 'GET',
          headers: { 'Content-Type': 'application/json' },
          body: local.length ? JSON.stringify({ ids: local }) : undefined,
        });
        if (res.ok) {
          const data = (await res.json()) as { ids: string[] };
          setIds(data.ids);
          writeLocal([]);
        } else setIds(local);
      } catch {
        setIds(local);
      } finally {
        setReady(true);
      }
    })();
  }, [loggedIn]);

  const toggle = useCallback(async (id: string) => {
    const on = ids.includes(id);
    const next = on ? ids.filter((x) => x !== id) : [...ids, id];
    setIds(next);
    if (!loggedIn) return writeLocal(next);
    try {
      const res = await fetch(on ? `/api/favoritos?id=${encodeURIComponent(id)}` : '/api/favoritos', {
        method: on ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: on ? undefined : JSON.stringify({ ids: [id] }),
      });
      if (!res.ok) throw new Error();
      setIds(((await res.json()) as { ids: string[] }).ids);
    } catch {
      setIds(ids); // desfaz em caso de erro
    }
  }, [ids, loggedIn]);

  const value = useMemo(() => ({ ids, has: (id: string) => ids.includes(id), toggle, ready, loggedIn }), [ids, toggle, ready, loggedIn]);
  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const c = useContext(FavoritesContext);
  if (!c) throw new Error('useFavorites fora do provider');
  return c;
}

export function FavoriteButton({ adId, name, variant = 'icon', className }: { adId: string; name: string; variant?: 'icon' | 'full'; className?: string }) {
  const { has, toggle } = useFavorites();
  const on = has(adId);
  const label = on ? `Remover ${name} dos favoritos` : `Salvar ${name} nos favoritos`;
  if (variant === 'full') {
    return (
      <button type="button" onClick={() => toggle(adId)} aria-pressed={on} className={cx('inline-flex h-11 items-center justify-center gap-2 rounded border border-line bg-white px-4 text-sm font-semibold text-brand hover:border-brand', className)}>
        <IconHeart size={18} filled={on} /> {on ? 'Salvo nos favoritos' : 'Favoritar'}
      </button>
    );
  }
  return (
    <button type="button" onClick={() => toggle(adId)} aria-pressed={on} aria-label={label} title={label} className={cx('flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white text-brand shadow-sm hover:border-brand', className)}>
      <IconHeart size={19} filled={on} />
    </button>
  );
}

export function FavoritesCount() {
  const { ids, ready } = useFavorites();
  return ready && ids.length ? <span className="ml-1 rounded-sm bg-sky px-1.5 text-xs font-semibold text-brand">{ids.length}</span> : null;
}
