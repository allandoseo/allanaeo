import Link from 'next/link';
import { AdminPage, REASON_LABEL, STATUS_LABEL } from '@/components/admin/AdminPage';
import { DecisionDialog } from '@/components/admin/DecisionDialog';
import { Badge, Card, EmptyState } from '@/components/ui';
import { resolveReportAction } from '@/app/actions/admin';
import { formatDateTime } from '@/lib/format';
import { adminListReports } from '@/lib/repo';
import type { ReportStatus } from '@/lib/types';

export const metadata = { title: 'Denúncias' };

const FILTERS: [ReportStatus | 'all', string][] = [['open', 'Abertas'], ['resolved', 'Resolvidas'], ['dismissed', 'Arquivadas'], ['all', 'Todas']];
const PRIORITY: Record<string, number> = { minor: 0, non_consensual_images: 1, impersonation: 2, personal_data: 3, third_party: 4, fraud: 5, other: 6 };

export default async function DenunciasPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const sp = await searchParams;
  const status = (FILTERS.find(([k]) => k === sp.status)?.[0] ?? 'open') as ReportStatus | 'all';
  const rows = (await adminListReports(status)).sort((a, b) => (a.report.status === 'open' && b.report.status === 'open' ? PRIORITY[a.report.reason] - PRIORITY[b.report.reason] : 0));
  return (
    <AdminPage title="Denúncias" description="Denúncias de possível menor de idade têm prioridade máxima: remova o anúncio imediatamente e siga o protocolo de comunicação às autoridades.">
      <nav aria-label="Filtrar denúncias" className="flex flex-wrap gap-1.5">
        {FILTERS.map(([k, l]) => (
          <Link key={k} href={`/admin/denuncias?status=${k}`} aria-current={status === k ? 'page' : undefined}
            className={`rounded border px-3 py-1.5 text-[13px] no-underline hover:no-underline ${status === k ? 'border-brand bg-brand text-white' : 'border-line bg-white text-ink'}`}>{l}</Link>
        ))}
      </nav>
      {rows.length === 0 ? <EmptyState title="Nenhuma denúncia nesta lista" /> : null}
      {rows.map(({ report: r, adTitle, adSlug, adStatus }) => (
        <Card key={r.id} className={`flex flex-col gap-2 p-4 ${r.reason === 'minor' && r.status === 'open' ? 'border-danger' : ''}`}>
          <div className="flex flex-wrap items-center gap-2">
            {r.reason === 'minor' && r.status === 'open' ? <Badge tone="danger">PRIORIDADE MÁXIMA</Badge> : null}
            <h2 className="text-base font-bold text-navy">{REASON_LABEL[r.reason]}</h2>
            <Badge tone={r.status === 'open' ? 'warn' : 'neutral'}>{r.status === 'open' ? 'Aberta' : r.status === 'resolved' ? 'Resolvida' : 'Arquivada'}</Badge>
          </div>
          <p className="text-sm">
            Anúncio: <Link href={`/admin/anuncios/${r.adId}`}>{adTitle}</Link> <span className="text-muted">({STATUS_LABEL[adStatus] ?? adStatus})</span>
            {adSlug && adStatus === 'active' ? <> · <Link href={`/anuncio/${adSlug}`} target="_blank">ver público</Link></> : null}
          </p>
          {r.details ? <p className="whitespace-pre-line rounded-sm bg-canvas p-2.5 text-sm">{r.details}</p> : null}
          <p className="text-xs text-muted">Recebida em {formatDateTime(r.createdAt)}{r.reporterEmail ? ` · retorno: ${r.reporterEmail}` : ''}{r.reporterUserId ? ' · usuário autenticado' : ''}</p>
          {r.resolution ? <p className="text-xs text-muted">Resolução: {r.resolution}{r.resolvedAt ? ` (${formatDateTime(r.resolvedAt)})` : ''}</p> : null}
          {r.status === 'open' ? (
            <div className="flex flex-wrap gap-2 border-t border-line pt-3">
              {adStatus !== 'removed' ? <DecisionDialog label="Remover anúncio e resolver" title="Remover anúncio" action={resolveReportAction} hidden={{ reportId: r.id, adId: r.adId, op: 'remove' }} noteName="resolution" noteLabel="Resolução" /> : null}
              {adStatus === 'active' ? <DecisionDialog label="Pausar anúncio e resolver" title="Pausar anúncio" action={resolveReportAction} hidden={{ reportId: r.id, adId: r.adId, op: 'pause' }} noteName="resolution" noteLabel="Resolução" tone="ghost" /> : null}
              <DecisionDialog label="Arquivar" title="Arquivar denúncia (sem ação)" action={resolveReportAction} hidden={{ reportId: r.id, adId: r.adId, op: 'dismiss' }} noteName="resolution" noteLabel="Justificativa" tone="ghost" />
            </div>
          ) : null}
        </Card>
      ))}
    </AdminPage>
  );
}
