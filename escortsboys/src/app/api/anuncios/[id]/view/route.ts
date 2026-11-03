import { NextResponse, type NextRequest } from 'next/server';
import { recordView } from '@/lib/repo';

const BOT = /bot|crawl|spider|slurp|preview|headless/i;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!BOT.test(req.headers.get('user-agent') ?? '')) await recordView((await params).id);
  return new NextResponse(null, { status: 204 });
}
