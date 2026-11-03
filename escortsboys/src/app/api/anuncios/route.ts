import { NextResponse, type NextRequest } from 'next/server';
import { getPublicAdsByIds } from '@/lib/repo';

/** Dados públicos de anúncios por id (usado pela página de favoritos). */
export async function GET(req: NextRequest) {
  const ids = (req.nextUrl.searchParams.get('ids') ?? '').split(',').filter(Boolean).slice(0, 200);
  const ads = await getPublicAdsByIds(ids);
  return NextResponse.json({ ads }, { headers: { 'Cache-Control': 'no-store' } });
}
