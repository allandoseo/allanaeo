import Link from 'next/link';
import { AdminPage, Td, Th } from '@/components/admin/AdminPage';
import { Card } from '@/components/ui';
import { formatDateTime } from '@/lib/format';
import { adminOverview } from '@/lib/repo';

export const metadata = { title: 'Visão geral' };

export default async function AdminHome() {
  const o = await adminOverview();
  const stats = [
    { label: 'Anúncios em análise', value: o.pendingAds, href: '/admin/moderacao', alert: o.pendingAds > 0 },
    { label: 'Denúncias abertas', value: o.openReports, href: '/admin/denuncias', alert: o.openReports > 0 },
    { label: 'Verificações pendentes', value: o.pendingVerifications, href: '/admin/verificacoes', alert: o.pendingVerifications > 0 },
    { label: 'Mensagens não tratadas', value: o.unreadMessages, href: '/admin/mensagens', alert: o.unreadMessages > 0 },
    { label: 'Anúncios ativos', value: o.activeAds, href: '/admin/anuncios?status=active' },
    { label: 'Usuários', value: o.users, href: '/admin/usuarios' },
    { label: 'Anunciantes', value: o.advertisers, href: '/admin/usuarios' },
  ];
  return (
    <AdminPage title="Visão geral" description="Indicadores calculados a partir dos dados atuais da plataforma.">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className={`rounded border bg-white p-4 no-underline hover:border-brand hover:no-underline ${s.alert ? 'border-brand' : 'border-line'}`}>
            <span className="block text-xs text-muted">{s.label}</span>
            <span className="mt-1 block text-2xl font-bold text-navy">{s.value}</span>
          </Link>
        ))}
      </div>
      <Card>
        <h2 className="border-b border-line px-4 py-3 text-base font-bold text-navy">Atividade recente da moderação</h2>
        {o.recentAudit.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead><tr><Th>Quando</Th><Th>Responsável</Th><Th>Ação</Th><Th>Alvo</Th><Th>Nota</Th></tr></thead>
              <tbody>
                {o.recentAudit.map((a) => (
                  <tr key={a.id}><Td className="whitespace-nowrap text-muted">{formatDateTime(a.createdAt)}</Td><Td>{a.actor}</Td><Td><code className="text-xs">{a.action}</code></Td><Td className="break-all">{a.target}</Td><Td className="text-muted">{a.note ?? '—'}</Td></tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="px-4 py-6 text-sm text-muted">Nenhuma ação registrada ainda.</p>}
      </Card>
    </AdminPage>
  );
}
