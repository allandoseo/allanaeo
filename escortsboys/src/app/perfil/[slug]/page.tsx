import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { AdCard } from '@/components/AdCard';
import { IconCheckBadge, IconPin } from '@/components/icons';
import { Badge, Breadcrumbs, Card } from '@/components/ui';
import { formatDate } from '@/lib/format';
import { getProfileBySlug } from '@/lib/repo';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getProfileBySlug((await params).slug);
  if (!data) return { title: 'Perfil não encontrado', robots: { index: false } };
  return {
    title: `${data.profile.publicName} — perfil de anunciante em ${data.cityName}`,
    description: data.profile.bio.slice(0, 155) || `Anúncios ativos de ${data.profile.publicName} em ${data.cityName}.`,
    alternates: { canonical: `/perfil/${data.profile.slug}` },
    robots: data.profile.isDemo ? { index: false, follow: true } : undefined,
  };
}

export default async function PerfilPage({ params }: Props) {
  const data = await getProfileBySlug((await params).slug);
  if (!data) notFound();
  const { profile: p, ads, cityName } = data;
  const contacts = { whatsapp: ads.some((a) => a.hasWhatsapp), phone: ads.some((a) => a.hasPhone), telegram: ads.some((a) => a.hasTelegram) };
  return (
    <main className="mx-auto flex w-full max-w-page flex-col gap-4 px-4 pb-12 pt-4 sm:px-6">
      <Breadcrumbs items={[{ href: '/', label: 'Início' }, { href: `/acompanhantes/${p.citySlug}`, label: cityName }, { label: p.publicName }]} />
      <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-full bg-line">
          {p.avatarUrl ? <Image src={p.avatarUrl} alt={`Foto de perfil de ${p.publicName}`} fill sizes="112px" unoptimized={p.avatarUrl.endsWith('.svg')} className="object-cover" /> : null}
        </div>
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-navy">{p.publicName}</h1>
            {p.verification === 'verified' ? <Badge tone="ok"><IconCheckBadge size={14} /> Verificado</Badge> : <Badge>Verificação não realizada</Badge>}
            {p.isDemo ? <Badge>Exemplo</Badge> : null}
          </div>
          <p className="flex items-center gap-1 text-sm text-muted"><IconPin size={15} /> {cityName}</p>
          {p.bio ? <p className="whitespace-pre-line text-[15px] leading-relaxed">{p.bio}</p> : null}
          <p className="text-xs text-muted">No EscortsBoys desde {formatDate(p.createdAt)} · {ads.length} {ads.length === 1 ? 'anúncio ativo' : 'anúncios ativos'}</p>
          <p className="text-xs text-muted">
            Contatos autorizados: {[contacts.whatsapp && 'WhatsApp', contacts.phone && 'Telefone', contacts.telegram && 'Telegram'].filter(Boolean).join(', ') || 'nenhum no momento'} — disponíveis em cada anúncio.
          </p>
        </div>
      </Card>
      <h2 className="text-lg font-bold text-navy">Anúncios ativos</h2>
      <div className="grid gap-4 xl:grid-cols-2">{ads.map((ad) => <AdCard key={ad.id} ad={ad} headingLevel="h3" />)}</div>
    </main>
  );
}
