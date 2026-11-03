import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth';
import { addFavorites, listFavoriteIds, removeFavorite } from '@/lib/repo';

const body = z.object({ ids: z.array(z.string().max(64)).max(500) });

export async function GET() {
  const u = await getCurrentUser();
  if (!u) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  return NextResponse.json({ ids: await listFavoriteIds(u.id) });
}

/** Adiciona (e mescla favoritos locais após o login). */
export async function POST(req: NextRequest) {
  const u = await getCurrentUser();
  if (!u) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  return NextResponse.json({ ids: await addFavorites(u.id, parsed.data.ids) });
}

export async function DELETE(req: NextRequest) {
  const u = await getCurrentUser();
  if (!u) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  return NextResponse.json({ ids: await removeFavorite(u.id, id) });
}
