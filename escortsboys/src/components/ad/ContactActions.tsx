'use client';

import { useState } from 'react';
import { formatPhoneBR } from '@/lib/format';
import { IconPhone, IconSend, IconWhatsapp } from '../icons';
import { cx } from '../ui';

type Props = { adId: string; hasWhatsapp: boolean; hasPhone: boolean; hasTelegram: boolean; isDemo: boolean; compact?: boolean };

/**
 * Contatos não ficam no HTML: o WhatsApp/Telegram passam por /api/contato (registra o clique e redireciona)
 * e o telefone é revelado sob demanda. Isso reduz coleta automatizada de números.
 */
export function ContactActions({ adId, hasWhatsapp, hasPhone, hasTelegram, isDemo, compact }: Props) {
  const [phone, setPhone] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  if (isDemo) {
    return <p className="rounded border border-line bg-canvas px-3 py-2.5 text-[13px] text-muted">Anúncio de exemplo: os botões de contato ficam ativos apenas em anúncios reais.</p>;
  }
  if (!hasWhatsapp && !hasPhone && !hasTelegram) {
    return <p className="text-[13px] text-muted">O anunciante não autorizou a exibição de contatos no momento.</p>;
  }

  const reveal = async () => {
    setLoading(true);
    setErr('');
    try {
      const res = await fetch(`/api/contato/${encodeURIComponent(adId)}?canal=telefone`, { method: 'POST' });
      if (!res.ok) throw new Error();
      setPhone(((await res.json()) as { phone: string }).phone);
    } catch {
      setErr('Não foi possível carregar o telefone. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const big = compact ? 'h-12 flex-1' : 'h-12 w-full';
  return (
    <div className={cx('flex gap-2', compact ? 'flex-row' : 'flex-col')}>
      {hasWhatsapp ? (
        <a href={`/api/contato/${encodeURIComponent(adId)}?canal=whatsapp`} rel="nofollow noopener" target="_blank" className={cx(big, 'flex items-center justify-center gap-2 rounded bg-brand font-semibold text-white no-underline hover:bg-brand-dark hover:no-underline')}>
          <IconWhatsapp size={19} /> {compact ? 'WhatsApp' : 'Conversar no WhatsApp'}
        </a>
      ) : null}
      {hasPhone ? (
        phone ? (
          <a href={`tel:+${phone}`} className={cx(big, 'flex items-center justify-center gap-2 rounded border border-brand font-semibold text-brand no-underline hover:no-underline')}>
            <IconPhone size={18} /> {formatPhoneBR(phone)}
          </a>
        ) : (
          <button type="button" onClick={reveal} disabled={loading} className={cx(big, 'flex items-center justify-center gap-2 rounded border border-brand bg-white font-semibold text-brand disabled:opacity-60')}>
            <IconPhone size={18} /> {loading ? 'Carregando…' : compact ? 'Ligar' : 'Ver telefone'}
          </button>
        )
      ) : null}
      {hasTelegram && !compact ? (
        <a href={`/api/contato/${encodeURIComponent(adId)}?canal=telegram`} rel="nofollow noopener" target="_blank" className="flex h-12 w-full items-center justify-center gap-2 rounded border border-line font-semibold text-ink no-underline hover:border-brand hover:no-underline">
          <IconSend size={18} /> Telegram
        </a>
      ) : null}
      {err ? <p role="alert" className="text-xs text-danger">{err}</p> : null}
    </div>
  );
}
