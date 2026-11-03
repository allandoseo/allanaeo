import { notFound, redirect } from 'next/navigation';
import { AdWizard } from '@/components/painel/AdWizard';
import { AdStatusBadge } from '@/components/painel/status';
import { adToWizard } from '@/components/painel/wizard-data';
import { Alert, Breadcrumbs, PageHeading } from '@/components/ui';
import { requireUser } from '@/lib/auth';
import { getCategories, getCities, getOwnAd, getProfileByUser, getSettings } from '@/lib/repo';

export const metadata = { title: 'Editar anúncio' };

export default async function EditarAnuncioPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ etapa?: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/painel/anuncios/${id}/editar`);
  if (!(await getProfileByUser(user.id))) redirect('/painel/perfil?criar=1');
  const ad = await getOwnAd(user.id, id);
  if (!ad) notFound();
  const [cities, categories, settings, sp] = await Promise.all([getCities(), getCategories(), getSettings(), searchParams]);
  const step = Number(sp.etapa) || (ad.status === 'draft' ? Math.min(10, ad.draftStep) : 1);
  return (
    <>
      <Breadcrumbs items={[{ href: '/painel', label: 'Painel' }, { href: '/painel/anuncios', label: 'Meus anúncios' }, { label: 'Editar' }]} />
      <PageHeading title={ad.status === 'draft' ? 'Continuar anúncio' : 'Editar anúncio'}>
        <span className="flex items-center gap-2">Status: <AdStatusBadge status={ad.status} /></span>
      </PageHeading>
      {ad.status === 'rejected' && ad.moderationNote ? <Alert tone="error">Rejeitado pela moderação: {ad.moderationNote}</Alert> : null}
      <AdWizard adId={ad.id} status={ad.status} initial={adToWizard(ad)} initialStep={step} savedAt={ad.status === 'draft' ? ad.updatedAt : null} cities={cities} categories={categories} maxPhotos={settings.maxPhotos} />
    </>
  );
}
