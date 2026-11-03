'use client';

import { useState } from 'react';
import { IconShare } from '../icons';

export function ShareButton({ url, title }: { url: string; title: string }) {
  const [msg, setMsg] = useState('');
  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setMsg('Link copiado');
    } catch (e) {
      if ((e as DOMException)?.name === 'AbortError') return;
      setMsg('Copie o link na barra do navegador');
    }
    setTimeout(() => setMsg(''), 3000);
  };
  return (
    <button type="button" onClick={share} className="inline-flex h-11 items-center justify-center gap-2 rounded border border-line bg-white px-4 text-sm font-semibold text-brand hover:border-brand">
      <IconShare size={18} /> <span aria-live="polite">{msg || 'Compartilhar'}</span>
    </button>
  );
}
