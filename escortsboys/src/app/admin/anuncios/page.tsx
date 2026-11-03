import Link from 'next/link';
import { AdminPage, STATUS_LABEL, STATUS_TONE, Td, Th } from '@/components/admin/AdminPage';
import { Badge, Card, EmptyState } from '@/components/ui';
import { formatDateTime } from '@/lib/format';
import { adminListAds } from '@/lib/repo';
import type { AdStatus } from '@/lib/types';

export const metadata = { title: 'Anúncios' };

const FILTERS: [string, string][] = [['all', 'Todos'], ['pending', 'Em análise'], ['active', 'Ativos'], ['paused', 'Pausados'], ['rejected', 'Rejeitados'], ['removed', 'Removidos'], ['draft', 'Rascunhos']];

export default async function AdminAnunciosPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const sp = await searchParams;
  const status = (FILTERS.some(([k]) => k === sp.status) ? sp.status : 'all') as AdStatus | 'all';
  const q = (sp.q ?? '').trim().toLowerCase();
  const rows = (await adminListAds(status)).filter(({ ad, owner }) => !q || [ad.title, ad.publicName, ad.slug, owner, ad.id].join(' ').toLowerCase().includes(q));
  return (
    <AdminPage title="Anúncios" description={`${rows.length} resultado(s)`}>
      <div className="flex flex-col gap-3">
        <nav aria-label="Filtrar por status" className="flex flex-wrap gap-1.5">
          {FILTERS.map(([k, l]) => (
            <Link key={k} href={`/admin/anuncios?status=${k}${q ? `&q=${encodeURIComponent(q)}` : ''}`} aria-current={status === k ? 'page' : undefined}
              className={`rounded border px-3 py-1.5 text-[13px] no-underline hover:no-underline ${status === k ? 'border-brand bg-brand text-white' : 'border-line bg-white text-ink'}`}>{l}</Link>
          ))}
        </nav>
        <form method="get" className="flex max-w-lg gap-2" role="search">
          <input type="hidden" name="status" value={status} />
          <label htmlFor="adm-q" className="sr-only">Buscar anúncios</label>
          <input id="adm-q" name="q" defaultValue={sp.q} placeholder="Título, nome, e-mail do dono ou ID" className="h-10 flex-1 rounded border border-line px-3 text-sm" />
          <button type="submit" className="h-10 rounded bg-brand px-4 text-sm font-semibold text-white">Buscar</button>
        </form>
      </div>
      {rows.length ? (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-sm">
            <thead><tr><Th>Anúncio</Th><Th>Dono</Th><Th>Status</Th><Th>Denúncias</Th><Th>Métricas</Th><Th>Atualizado</Th></tr></thead>
            <tbody>
              {rows.map(({ ad, owner, reports }) => (
                <tr key={ad.id}>
                  <Td><Link href={`/admin/anuncios/${ad.id}`} className="font-semibold">{ad.title || '(sem título)'}</Link><div className="text-xs text-muted">{ad.publicName}{ad.isDemo ? ' · exemplo' : ''}</div></Td>
                  <Td className="break-all text-muted">{owner}</Td>
                  <Td><Badge tone={STATUS_TONE[ad.status]}>{STATUS_LABEL[ad.status]}</Badge></Td>
                  <Td>{reports ? <Badge tone="danger">{reports}</Badge> : <span className="text-muted">0</span>}</Td>
                  <Td className="whitespace-nowrap text-xs text-muted">{ad.stats.views} vis. · {ad.stats.contactClicks} cont.</Td>
                  <Td className="whitespace-nowrap text-muted">{formatDateTime(ad.updatedAt)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : <EmptyState title="Nenhum anúncio encontrado">Ajuste o filtro ou a busca.</EmptyState>}
    </AdminPage>
  );
}
