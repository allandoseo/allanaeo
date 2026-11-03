import Image from 'next/image';
import { AdRowActions } from '@/components/painel/AdRowActions';
import { AdStatusBadge } from '@/components/painel/status';
import { Alert, Card, EmptyState, LinkButton, PageHeading } from '@/components/ui';
import { requireUser } from '@/lib/auth';
import { formatDateTime } from '@/lib/format';
import { getCities, getProfileByUser, listAdsByOwner } from '@/lib/repo';
import { IconCamera } from '@/components/icons';

export const metadata = { title: 'Meus anúncios' };

const OK_MSG: Record<string, string> = {
  pause: 'Anúncio pausado. Ele não aparece nas buscas até ser reativado.',
  resume: 'Anúncio reativado.',
  delete: 'Anúncio excluído.',
};

export default async function MeusAnuncios({ searchParams }: { searchParams: Promise<{ enviado?: string; ok?: string }> }) {
  const user = await requireUser('/painel/anuncios');
  const [ads, profile, cities, sp] = await Promise.all([listAdsByOwner(user.id), getProfileByUser(user.id), getCities(false), searchParams]);
  const cityName = (s: string) => cities.find((c) => c.slug === s)?.name ?? '—';
  return (
    <>
      <PageHeading title="Meus anúncios" actions={<LinkButton href={profile ? '/painel/anuncios/novo' : '/painel/perfil?criar=1'}>Novo anúncio</LinkButton>}>
        {ads.length} {ads.length === 1 ? 'anúncio' : 'anúncios'}
      </PageHeading>
      {sp.enviado ? <Alert tone="ok">Anúncio enviado. Quando a moderação estiver ativa, ele aparece no site após a aprovação — normalmente em até 24 horas.</Alert> : null}
      {sp.ok && OK_MSG[sp.ok] ? <Alert tone="ok">{OK_MSG[sp.ok]}</Alert> : null}
      {!ads.length ? (
        <EmptyState title="Você ainda não tem anúncios" action={<LinkButton href={profile ? '/painel/anuncios/novo' : '/painel/perfil?criar=1'}>{profile ? 'Criar anúncio' : 'Criar perfil'}</LinkButton>}>
          O assistente leva cerca de 10 minutos e salva rascunho automaticamente a cada etapa.
        </EmptyState>
      ) : (
        <ul className="flex flex-col gap-3">
          {ads.map((a) => (
            <li key={a.id}>
              <Card className="flex flex-col gap-3 p-4 sm:flex-row">
                <div className="relative h-28 w-full shrink-0 overflow-hidden rounded-sm bg-line sm:w-24">
                  {a.photos[0] ? <Image src={a.photos[0].url} alt="" fill sizes="96px" unoptimized={a.photos[0].url.endsWith('.svg')} className="object-cover" /> : <span className="flex h-full items-center justify-center text-steel"><IconCamera /></span>}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-bold text-navy">{a.title || a.publicName || 'Anúncio sem título'}</h2>
                    <AdStatusBadge status={a.status} />
                  </div>
                  <p className="text-xs text-muted">
                    {a.citySlug ? cityName(a.citySlug) : 'Cidade não definida'} · Atualizado em {formatDateTime(a.updatedAt)}
                    {a.status === 'draft' ? ` · etapa ${a.draftStep} de 10` : ''}
                  </p>
                  {a.status === 'rejected' && a.moderationNote ? <Alert tone="error">Motivo: {a.moderationNote}. Corrija e envie novamente.</Alert> : null}
                  {a.status === 'pending' ? <p className="text-xs text-muted">Aguardando análise da moderação.</p> : null}
                  {a.status === 'paused' && a.moderationNote ? <Alert tone="warn">Pausado pela moderação: {a.moderationNote}</Alert> : null}
                  <dl className="flex flex-wrap gap-x-5 gap-y-1 text-xs">
                    <div className="flex gap-1"><dt className="text-muted">Visualizações</dt><dd className="font-semibold">{a.stats.views}</dd></div>
                    <div className="flex gap-1"><dt className="text-muted">Contatos</dt><dd className="font-semibold">{a.stats.contactClicks}</dd></div>
                    <div className="flex gap-1"><dt className="text-muted">Favoritos</dt><dd className="font-semibold">{a.stats.favorites}</dd></div>
                    <div className="flex gap-1"><dt className="text-muted">Fotos</dt><dd className="font-semibold">{a.photos.length}</dd></div>
                  </dl>
                  <div className="pt-1"><AdRowActions adId={a.id} slug={a.slug} status={a.status} title={a.title || a.publicName || 'Anúncio'} /></div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
