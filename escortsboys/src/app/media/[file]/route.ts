import { promises as fs } from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { DATA_DIR } from '@/lib/db/store';

const TYPES: Record<string, string> = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };

export async function GET(_: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const m = /^([0-9a-f-]{36})\.(jpg|png|webp)$/.exec(file);
  if (!m) return new NextResponse('Not found', { status: 404 });
  try {
    const buf = await fs.readFile(path.join(DATA_DIR, 'uploads', file));
    return new NextResponse(new Uint8Array(buf), {
      headers: { 'Content-Type': TYPES[m[2]], 'Cache-Control': 'public, max-age=31536000, immutable', 'X-Content-Type-Options': 'nosniff' },
    });
  } catch {
    return new NextResponse('Not found', { status: 404 });
  }
}
