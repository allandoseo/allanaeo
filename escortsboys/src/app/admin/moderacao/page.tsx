import Link from 'next/link';
import { AdPhoto } from '@/components/AdPhoto';
import { AdminForm } from '@/components/admin/AdminForm';
import { AdminPage } from '@/components/admin/AdminPage';
import { DecisionDialog } from '@/components/admin/DecisionDialog';
import { moderationChecks } from '@/components/admin/checks';
import { Badge, Card, EmptyState } from '@/components/ui';
import { moderateAction } from '@/app/actions/admin';
import { formatDateTime } from '@/lib/format';
import { adminListAds } from '@/lib/repo';

export const metadata = { title: 'Fila de moderação' };

export default async function ModeracaoPage() {
  const rows = (await adminListAds('pending')).sort((a, b) => a.ad.updatedAt.localeCompare(b.ad.updatedAt));
  return (
    <AdminPage title="Fila de moderação" description="Anúncios novos ou editados aguardando análise. Os mais antigos aparecem primeiro.">
      {rows.length === 0 ? <EmptyState title="Nenhum anúncio aguardando análise">A fila está vazia.</EmptyState> : null}
      {rows.map(({ ad, owner, profile, reports }) => {
        const checks = moderationChecks(ad);
        return (
          <Card key={ad.id} className="flex flex-col gap-3 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-navy"><Link href={`/admin/anuncios/${ad.id}`}>{ad.title || '(sem título)'}</Link></h2>
                <p className="text-xs text-muted">{ad.publicName} · {owner} · enviado em {formatDateTime(ad.updatedAt)}{ad.publishedAt ? ' · edição de anúncio já publicado' : ' · primeiro envio'}</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {profile?.verification === 'verified' ? <Badge tone="ok">Perfil verificado</Badge> : <Badge>Perfil não verificado</Badge>}
                {reports ? <Badge tone="danger">{reports} denúncia(s)</Badge> : null}
              </div>
            </div>
            {ad.photos.length ? (
              <ul className="flex gap-2 overflow-x-auto" aria-label="Fotos enviadas">
                {ad.photos.map((p) => <li key={p.id} className="relative h-28 w-24 shrink-0 overflow-hidden rounded-sm bg-line"><AdPhoto photo={p} sizes="96px" /></li>)}
              </ul>
            ) : null}
            <p className="line-clamp-3 text-sm">{ad.summary}</p>
            <ul className="grid gap-1 text-[13px] sm:grid-cols-2">
              {checks.map((c) => <li key={c.label} className={c.ok ? 'text-ok' : 'font-semibold text-danger'}>{c.ok ? '✓' : '✕'} {c.label}</li>)}
            </ul>
            <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3">
              <AdminForm action={moderateAction} submitLabel="Aprovar e publicar" variant="success" inline>
                <input type="hidden" name="adId" value={ad.id} />
                <input type="hidden" name="decision" value="approve" />
              </AdminForm>
              <DecisionDialog label="Rejeitar" title={`Rejeitar “${ad.title}”`} action={moderateAction} hidden={{ adId: ad.id, decision: 'reject' }} noteLabel="Motivo (enviado ao anunciante)" />
              <Link href={`/admin/anuncios/${ad.id}`} className="text-[13px] font-semibold">Ver detalhes completos</Link>
            </div>
          </Card>
        );
      })}
    </AdminPage>
  );
}
