import Link from 'next/link';
import { AvailabilityForm } from '@/components/painel/AvailabilityForm';
import { AdStatusBadge } from '@/components/painel/status';
import { Card, EmptyState, LinkButton, PageHeading } from '@/components/ui';
import { requireUser } from '@/lib/auth';
import { AVAILABILITY_LABEL, AVAILABLE_NOW_TTL_HOURS, isAvailabilityReliable } from '@/lib/availability';
import { formatDateTime } from '@/lib/format';
import { listAdsByOwner } from '@/lib/repo';

export const metadata = { title: 'Disponibilidade' };

export default async function DisponibilidadePage() {
  const user = await requireUser('/painel/disponibilidade');
  const ads = await listAdsByOwner(user.id);
  return (
    <>
      <PageHeading title="Disponibilidade">
        O status aparece nos cards e no anúncio. “Disponível agora” expira automaticamente em {AVAILABLE_NOW_TTL_HOURS} horas para não mostrar informação desatualizada.
      </PageHeading>
      {!ads.length ? (
        <EmptyState title="Nenhum anúncio ainda" action={<LinkButton href="/painel/anuncios/novo">Criar anúncio</LinkButton>} />
      ) : (
        <>
          <Card className="p-5"><AvailabilityForm ads={ads.map((a) => ({ id: a.id, title: a.title || a.publicName || 'Anúncio sem título' }))} /></Card>
          <Card>
            <h2 className="border-b border-line px-4 py-3 text-base font-bold text-navy">Status atual</h2>
            <ul className="divide-y divide-line">
              {ads.map((a) => {
                const ok = isAvailabilityReliable(a.availability, a.availabilityUpdatedAt);
                return (
                  <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                    <span className="flex items-center gap-2 font-semibold">{a.title || a.publicName || 'Anúncio sem título'} <AdStatusBadge status={a.status} /></span>
                    <span className="text-right">
                      <span className={ok && (a.availability === 'available_now' || a.availability === 'available_today') ? 'font-semibold text-ok' : 'text-muted'}>
                        {AVAILABILITY_LABEL[ok ? a.availability : 'unknown']}{ok && a.availabilityNote ? ` · ${a.availabilityNote}` : ''}
                      </span>
                      <span className="block text-xs text-muted">
                        {a.availabilityUpdatedAt ? `Informado em ${formatDateTime(a.availabilityUpdatedAt)}${ok ? '' : ' (expirado)'}` : 'Nunca informado'}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="border-t border-line px-4 py-3 text-xs text-muted">A agenda semanal fixa é editada na etapa 6 de cada anúncio. <Link href="/painel/anuncios">Ir para meus anúncios</Link></p>
          </Card>
        </>
      )}
    </>
  );
}
