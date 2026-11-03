import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AdPhoto } from '@/components/AdPhoto';
import { AdminForm } from '@/components/admin/AdminForm';
import { AdminPage, REASON_LABEL, STATUS_LABEL, STATUS_TONE } from '@/components/admin/AdminPage';
import { DecisionDialog } from '@/components/admin/DecisionDialog';
import { moderationChecks } from '@/components/admin/checks';
import { Badge, Card } from '@/components/ui';
import { moderateAction } from '@/app/actions/admin';
import { WEEKDAYS } from '@/lib/availability';
import { formatBRL, formatDateTime, formatPhoneBR } from '@/lib/format';
import { adminGetAd } from '@/lib/repo';

export const metadata = { title: 'Detalhe do anúncio' };

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return <div className="grid gap-1 border-b border-line py-2 text-sm sm:grid-cols-[180px_1fr]"><dt className="text-muted">{k}</dt><dd className="min-w-0 break-words">{v || '—'}</dd></div>;
}

export default async function AdminAdDetail({ params }: { params: Promise<{ id: string }> }) {
  const data = await adminGetAd((await params).id);
  if (!data) notFound();
  const { ad, owner, profile, reports, cityName } = data;
  const c = ad.contact;
  return (
    <AdminPage
      title={ad.title || '(sem título)'}
      description={<>ID {ad.id} · <Badge tone={STATUS_TONE[ad.status]}>{STATUS_LABEL[ad.status]}</Badge>{ad.isDemo ? <> · <Badge>Exemplo</Badge></> : null}</>}
      actions={ad.status === 'active' && ad.slug ? <Link href={`/anuncio/${ad.slug}`} className="text-sm font-semibold">Ver página pública</Link> : null}
    >
      <Card className="flex flex-wrap items-center gap-2 p-4">
        {ad.status !== 'active' && ad.status !== 'removed' ? (
          <AdminForm action={moderateAction} submitLabel="Aprovar e publicar" variant="success" inline>
            <input type="hidden" name="adId" value={ad.id} /><input type="hidden" name="decision" value="approve" />
          </AdminForm>
        ) : null}
        {ad.status === 'active' ? <DecisionDialog label="Pausar" title="Pausar anúncio" action={moderateAction} hidden={{ adId: ad.id, decision: 'pause' }} required={false} tone="ghost" noteLabel="Nota" /> : null}
        {ad.status !== 'rejected' && ad.status !== 'removed' ? <DecisionDialog label="Rejeitar" title="Rejeitar anúncio" action={moderateAction} hidden={{ adId: ad.id, decision: 'reject' }} noteLabel="Motivo (enviado ao anunciante)" /> : null}
        {ad.status !== 'removed' ? <DecisionDialog label="Remover" title="Remover anúncio da plataforma" action={moderateAction} hidden={{ adId: ad.id, decision: 'remove' }} noteLabel="Motivo da remoção" /> : null}
        {ad.moderationNote ? <p className="w-full text-xs text-muted">Nota de moderação atual: {ad.moderationNote}</p> : null}
      </Card>

      <Card className="p-4">
        <h2 className="mb-2 text-base font-bold text-navy">Checagens automáticas</h2>
        <ul className="grid gap-1 text-[13px] sm:grid-cols-2">
          {moderationChecks(ad).map((ch) => <li key={ch.label} className={ch.ok ? 'text-ok' : 'font-semibold text-danger'}>{ch.ok ? '✓' : '✕'} {ch.label}</li>)}
        </ul>
      </Card>

      {ad.photos.length ? (
        <Card className="p-4">
          <h2 className="mb-2 text-base font-bold text-navy">Fotos ({ad.photos.length})</h2>
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
            {ad.photos.map((p) => <li key={p.id} className="relative aspect-[4/5] overflow-hidden rounded-sm bg-line"><AdPhoto photo={p} sizes="160px" /></li>)}
          </ul>
        </Card>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="p-4">
          <h2 className="mb-1 text-base font-bold text-navy">Dados do anúncio</h2>
          <dl>
            <Row k="Nome público / idade" v={`${ad.publicName || '—'} · ${ad.age ?? '—'} anos`} />
            <Row k="Cidade / região" v={`${cityName} · ${ad.regionSlug ?? '—'}`} />
            <Row k="Regiões atendidas" v={ad.areasServed.join(', ')} />
            <Row k="Modalidades" v={ad.modes.join(', ')} />
            <Row k="Resumo" v={ad.summary} />
            <Row k="Descrição" v={<span className="whitespace-pre-line">{ad.description}</span>} />
            <Row k="Características" v={ad.characteristics.map((x) => `${x.label}: ${x.value}`).join(' · ')} />
            <Row k="Regras" v={ad.rules.join(' · ')} />
            <Row k="Condições" v={ad.conditions} />
            <Row k="Valores" v={ad.showPrices ? ad.prices.map((p) => `${p.label}: ${p.amount !== null ? formatBRL(p.amount) : 'consultar'}`).join(' · ') : 'Não exibidos'} />
            <Row k="Agenda" v={ad.schedule.map((s) => `${WEEKDAYS[s.day]} ${s.from}–${s.to}`).join(', ')} />
            <Row k="Autorização de imagem" v={ad.imageConsentAt ? formatDateTime(ad.imageConsentAt) : 'Não registrada'} />
            <Row k="Criado / atualizado" v={`${formatDateTime(ad.createdAt)} · ${formatDateTime(ad.updatedAt)}`} />
          </dl>
        </Card>
        <div className="flex flex-col gap-4">
          <Card className="p-4">
            <h2 className="mb-1 text-base font-bold text-navy">Contato (privado)</h2>
            <dl>
              <Row k="WhatsApp" v={c.whatsapp ? `${formatPhoneBR(c.whatsapp)} ${c.showWhatsapp ? '(exibido)' : '(oculto)'}` : null} />
              <Row k="Telefone" v={c.phone ? `${formatPhoneBR(c.phone)} ${c.showPhone ? '(exibido)' : '(oculto)'}` : null} />
              <Row k="Telegram" v={c.telegram ? `@${c.telegram} ${c.showTelegram ? '(exibido)' : '(oculto)'}` : null} />
            </dl>
          </Card>
          <Card className="p-4">
            <h2 className="mb-1 text-base font-bold text-navy">Dono</h2>
            <dl>
              <Row k="E-mail" v={owner?.email} />
              <Row k="Status da conta" v={owner?.status === 'suspended' ? 'Suspensa' : 'Ativa'} />
              <Row k="Perfil público" v={profile ? <>{profile.publicName} · verificação: {profile.verification}</> : null} />
            </dl>
            {owner ? <Link href={`/admin/usuarios?q=${encodeURIComponent(owner.email)}`} className="mt-2 inline-block text-[13px] font-semibold">Gerenciar usuário</Link> : null}
          </Card>
          <Card className="p-4">
            <h2 className="mb-2 text-base font-bold text-navy">Denúncias ({reports.length})</h2>
            {reports.length ? (
              <ul className="flex flex-col gap-2 text-sm">
                {reports.map((r) => (
                  <li key={r.id} className="border-b border-line pb-2">
                    <span className={r.reason === 'minor' ? 'font-bold text-danger' : 'font-semibold'}>{REASON_LABEL[r.reason]}</span> · {r.status} · {formatDateTime(r.createdAt)}
                    {r.details ? <p className="text-muted">{r.details}</p> : null}
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted">Nenhuma denúncia.</p>}
            {reports.some((r) => r.status === 'open') ? <Link href="/admin/denuncias" className="mt-2 inline-block text-[13px] font-semibold">Tratar denúncias</Link> : null}
          </Card>
        </div>
      </div>
    </AdminPage>
  );
}
