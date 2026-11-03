import { redirect } from 'next/navigation';
import { AdWizard } from '@/components/painel/AdWizard';
import { emptyWizard } from '@/components/painel/wizard-data';
import { Breadcrumbs, PageHeading } from '@/components/ui';
import { requireUser } from '@/lib/auth';
import { getCategories, getCities, getProfileByUser, getSettings } from '@/lib/repo';

export const metadata = { title: 'Criar anúncio' };

export default async function NovoAnuncioPage({ searchParams }: { searchParams: Promise<{ etapa?: string }> }) {
  const user = await requireUser('/painel/anuncios/novo');
  const profile = await getProfileByUser(user.id);
  if (!profile) redirect('/painel/perfil?criar=1');
  const [cities, categories, settings, sp] = await Promise.all([getCities(), getCategories(), getSettings(), searchParams]);
  return (
    <>
      <Breadcrumbs items={[{ href: '/painel', label: 'Painel' }, { href: '/painel/anuncios', label: 'Meus anúncios' }, { label: 'Novo anúncio' }]} />
      <PageHeading title="Criar anúncio">O rascunho é salvo a cada etapa concluída.</PageHeading>
      <AdWizard adId={null} status={null} initial={emptyWizard(profile)} initialStep={Number(sp.etapa) || 1} savedAt={null} cities={cities} categories={categories} maxPhotos={settings.maxPhotos} />
    </>
  );
}
