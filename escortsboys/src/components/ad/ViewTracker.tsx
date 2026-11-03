'use client';

import { useEffect } from 'react';

/** Conta uma visualização por sessão do navegador (sem cookies de rastreamento nem dados pessoais). */
export function ViewTracker({ adId }: { adId: string }) {
  useEffect(() => {
    const key = `eb_v_${adId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch { /* sem sessionStorage: conta mesmo assim */ }
    const url = `/api/anuncios/${encodeURIComponent(adId)}/view`;
    if (!navigator.sendBeacon?.(url)) fetch(url, { method: 'POST', keepalive: true }).catch(() => undefined);
  }, [adId]);
  return null;
}
