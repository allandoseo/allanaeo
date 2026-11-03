import Link from 'next/link';
import { AdStatusBadge, VERIFICATION } from '@/components/painel/status';
import { Badge, Card, EmptyState, LinkButton, PageHeading } from '@/components/ui';
import { requireUser } from '@/lib/auth';
import { isAvailabilityReliable, AVAILABILITY_LABEL } from '@/lib/availability';
import { formatDateTime, timeAgo } from '@/lib/format';
import { getOwnerStats, getProfileByUser, listAdsByOwner } from '@/lib/repo';

export const metadata = { title: 'Visão geral' };

function Metric({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-[26px] font-bold leading-tight text-navy">{value}</p>
      <p className="mt-0.5 text-xs text-muted">{hint}</p>
    </Card>
  );
}

export default async function PainelHome() {
  const user = await requireUser('/painel');
  const [profile, ads, stats] = await Promise.all([getProfileByUser(user.id), listAdsByOwner(user.id), getOwnerStats(user.id, 30)]);

  if (!profile) {
    return (
      <>
        <PageHeading title={`Olá, ${user.name.split(' ')[0]}`} />
        <EmptyState title="Crie seu perfil de anunciante" action={<LinkButton href="/painel/perfil?criar=1">Criar perfil</LinkButton>}>
          O perfil define seu nome público e a cidade principal. Depois você cria o anúncio com fotos, valores e contatos.
        </EmptyState>
      </>
    );
  }

  const last = ads[0]?.updatedAt;
  const counts = ads.reduce<Record<string, number>>((acc, a) => ((acc[a.status] = (acc[a.status] ?? 0) + 1), acc), {});
  const statusSummary = [
    counts.active && `${counts.active} ativo(s)`,
    counts.pending && `${counts.pending} em análise`,
    counts.paused && `${counts.paused} pausado(s)`,
    counts.draft && `${counts.draft} rascunho(s)`,
    counts.rejected && `${counts.rejected} rejeitado(s)`,
  ].filter(Boolean).join(' · ');
  const fmt = (n: number) => (stats.hasData ? n.toLocaleString('pt-BR') : '—');
  const hint = stats.hasData ? 'Últimos 30 dias' : 'Sem dados ainda';

  const todo: { label: string; href: string; cta: string }[] = [];
  if (profile.verification === 'none' || profile.verification === 'rejected') todo.push({ label: 'Verificação de perfil não solicitada', href: '/painel/perfil', cta: 'Solicitar' });
  if (ads.some((a) => a.status !== 'draft' && !a.schedule.length)) todo.push({ label: 'Há anúncio sem agenda semanal', href: '/painel/anuncios', cta: 'Completar' });
  if (ads.some((a) => a.status === 'active' && !isAvailabilityReliable(a.availability, a.availabilityUpdatedAt))) todo.push({ label: 'Disponibilidade desatualizada (aparece como “não informada”)', href: '/painel/disponibilidade', cta: 'Atualizar' });
  if (ads.some((a) => a.status === 'draft')) todo.push({ label: 'Você tem rascunho não enviado', href: '/painel/anuncios', cta: 'Continuar' });
  if (ads.some((a) => a.status === 'rejected')) todo.push({ label: 'Anúncio rejeitado pela moderação', href: '/painel/anuncios', cta: 'Ver motivo' });

  return (
    <>
      <PageHeading title="Visão geral" actions={<><LinkButton href="/painel/disponibilidade" variant="ghost">Atualizar disponibilidade</LinkButton><LinkButton href="/painel/anuncios/novo">Novo anúncio</LinkButton></>}>
        Perfil público: <strong className="text-ink">{profile.publicName}</strong> · <Badge tone={VERIFICATION[profile.verification].tone}>{VERIFICATION[profile.verification].label}</Badge>
      </PageHeading>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Metric label="Visualizações" value={fmt(stats.totals.views)} hint={hint} />
        <Metric label="Cliques em contato" value={fmt(stats.totals.contacts)} hint={hint} />
        <Metric label="Favoritos recebidos" value={fmt(stats.totals.favorites)} hint={hint} />
        <Card className="p-4">
          <p className="text-xs text-muted">Status dos anúncios</p>
          <p className="mt-2 text-sm font-semibold text-navy">{statusSummary || 'Nenhum anúncio'}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted">Última atualização</p>
          <p className="mt-2 text-sm font-semibold text-navy">{last ? formatDateTime(last) : '—'}</p>
          {last ? <p className="text-xs text-muted">{timeAgo(last)}</p> : null}
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="text-base font-bold text-navy">Meus anúncios</h2>
          <Link href="/painel/anuncios" className="text-[13px] font-semibold">Gerenciar todos</Link>
        </div>
        {ads.length ? (
          <ul className="divide-y divide-line">
            {ads.slice(0, 5).map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{a.title || a.publicName || 'Anúncio sem título'}</p>
                  <p className="text-xs text-muted">Atualizado {timeAgo(a.updatedAt)} · {AVAILABILITY_LABEL[isAvailabilityReliable(a.availability, a.availabilityUpdatedAt) ? a.availability : 'unknown']}</p>
                </div>
                <div className="flex items-center gap-3">
                  <AdStatusBadge status={a.status} />
                  <Link href={`/painel/anuncios/${a.id}/editar`} className="text-sm font-semibold">{a.status === 'draft' ? 'Continuar' : 'Editar'}</Link>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-4 py-6 text-sm text-muted">Você ainda não criou anúncios. <Link href="/painel/anuncios/novo">Criar o primeiro anúncio</Link>.</p>
        )}
      </Card>

      <Card className="p-4">
        <h2 className="text-base font-bold text-navy">Pendências</h2>
        {todo.length ? (
          <ul className="mt-2 divide-y divide-line text-sm">
            {todo.map((t) => (
              <li key={t.label} className="flex flex-wrap items-center justify-between gap-2 py-2.5"><span>{t.label}</span><Link href={t.href} className="font-semibold">{t.cta}</Link></li>
            ))}
          </ul>
        ) : <p className="mt-2 text-sm text-muted">Nenhuma pendência no momento.</p>}
      </Card>
    </>
  );
}
