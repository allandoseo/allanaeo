import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { exportUserData } from '@/lib/repo-painel';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const data = await exportUserData(user.id);
  if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="escortsboys-meus-dados-${new Date().toISOString().slice(0, 10)}.json"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
