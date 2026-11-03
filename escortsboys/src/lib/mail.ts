import 'server-only';

/**
 * Envio de e-mail transacional. Com RESEND_API_KEY + EMAIL_FROM configurados, usa a API da Resend.
 * Sem credenciais, registra o conteúdo no log do servidor (apenas para desenvolvimento).
 */
export async function sendMail(to: string, subject: string, text: string): Promise<{ delivered: boolean }> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (key && from) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, subject, text }),
    });
    if (!res.ok) console.error('[mail] falha no envio', res.status, await res.text().catch(() => ''));
    return { delivered: res.ok };
  }
  if (process.env.NODE_ENV !== 'production') console.info(`[mail:dev] Para: ${to}\nAssunto: ${subject}\n${text}`);
  else console.warn('[mail] RESEND_API_KEY/EMAIL_FROM não configurados — e-mail não enviado.');
  return { delivered: false };
}
