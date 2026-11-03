import { NextResponse, type NextRequest } from 'next/server';
import { getAdContact, recordContact } from '@/lib/repo';
import { rateLimit } from '@/lib/rate-limit';

function ip(req: NextRequest) {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'local';
}

/** WhatsApp / Telegram: registra o clique e redireciona. O número não aparece no HTML do anúncio. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const canal = req.nextUrl.searchParams.get('canal');
  const c = await getAdContact(id);
  if (!c) return NextResponse.redirect(new URL('/anuncios', req.url));
  if (!rateLimit(`contact-click:${ip(req)}`, 60, 3600_000)) return new NextResponse('Muitas solicitações', { status: 429 });
  if (canal === 'whatsapp' && c.whatsapp) {
    await recordContact(id);
    const text = encodeURIComponent(`Olá, ${c.publicName}! Vi seu anúncio no EscortsBoys.`);
    return NextResponse.redirect(`https://wa.me/${c.whatsapp}?text=${text}`, { status: 302, headers: { 'X-Robots-Tag': 'noindex' } });
  }
  if (canal === 'telegram' && c.telegram) {
    await recordContact(id);
    return NextResponse.redirect(`https://t.me/${c.telegram}`, { status: 302, headers: { 'X-Robots-Tag': 'noindex' } });
  }
  return NextResponse.redirect(new URL('/anuncios', req.url));
}

/** Telefone: revelado sob demanda via POST (não indexável, com limite por IP). */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!rateLimit(`phone-reveal:${ip(req)}`, 30, 3600_000)) return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  const c = await getAdContact(id);
  if (!c?.phone) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  await recordContact(id);
  return NextResponse.json({ phone: c.phone }, { headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
}
