import { NextResponse, type NextRequest } from 'next/server';

/** Barreira rápida: rotas privadas exigem cookie de sessão. A checagem completa (sessão válida e papel) ocorre no servidor. */
export function middleware(req: NextRequest) {
  const has = req.cookies.has('eb_session');
  if (!has) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.search = `?next=${encodeURIComponent(req.nextUrl.pathname + req.nextUrl.search)}`;
    return NextResponse.redirect(url);
  }
  const res = NextResponse.next();
  res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  res.headers.set('Cache-Control', 'private, no-store');
  return res;
}

export const config = { matcher: ['/painel/:path*', '/admin/:path*'] };
