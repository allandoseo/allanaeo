import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AdCard, AvailabilityLine, PriceLabel } from '@/components/AdCard';
import { ContactActions } from '@/components/ad/ContactActions';
import { Gallery } from '@/components/ad/Gallery';
import { ReportDialog } from '@/components/ad/ReportDialog';
import { ShareButton } from '@/components/ad/ShareButton';
import { ViewTracker } from '@/components/ad/ViewTracker';
import { FavoriteButton } from '@/components/favorites';
import { IconCheckBadge, IconClock, IconPin, IconShield } from '@/components/icons';
import { Badge, Breadcrumbs, Card } from '@/components/ui';
import { WEEKDAYS } from '@/lib/availability';
import { formatBRL, formatDate, formatDateTime, timeAgo } from '@/lib/format';
import { getPublicAdBySlug, listPublicAds } from '@/lib/repo';
import { absoluteUrl } from '@/lib/site';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const ad = await getPublicAdBySlug((await params).slug);
  if (!ad) return { title: 'Anúncio não encontrado', robots: { index: false } };
  const where = [ad.regionName, ad.cityName].filter(Boolean).join(', ');
  const title = `${ad.publicName}${ad.age ? `, ${ad.age} anos` : ''} — acompanhante em ${where}`;
  const description = `${ad.summary} ${ad.modes.map((m) => m.name).join(', ')}. ${ad.showPrices && ad.priceFrom ? `A partir de ${formatBRL(ad.priceFrom)}.` : 'Consulte valores.'}`.slice(0, 160);
  const img = ad.photos[0];
  return {
    title,
    description,
    alternates: { canonical: `/anuncio/${ad.slug}` },
    robots: ad.isDemo ? { index: false, follow: true } : undefined,
    openGraph: {
      type: 'profile',
      title,
      description,
      url: absoluteUrl(`/anuncio/${ad.slug}`),
      images: img && !img.url.endsWith('.svg') ? [{ url: absoluteUrl(img.url), width: img.width, height: img.height, alt: img.alt }] : undefined,
    },
  };
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="p-5">
      <h2 className="mb-3 text-lg font-bold text-navy">{title}</h2>
      {children}
    </Card>
  );
}

export default async function AdPage({ params }: Props) {
  const ad = await getPublicAdBySlug((await params).slug);
  if (!ad) notFound();
  const all = await listPublicAds();
  const related = all.filter((a) => a.id !== ad.id && a.citySlug === ad.citySlug).sort((a, b) => Number(b.regionSlug === ad.regionSlug) - Number(a.regionSlug === ad.regionSlug)).slice(0, 2);
  const where = [ad.regionName, ad.cityName].filter(Boolean).join(' · ');
  const url = absoluteUrl(`/anuncio/${ad.slug}`);
  const scheduleByDay = WEEKDAYS.map((d, day) => ({ d, slots: ad.schedule.filter((s) => s.day === day) }));
  const crumbs = [
    { href: '/', label: 'Início' },
    { href: `/acompanhantes/${ad.citySlug}`, label: ad.cityName },
    ...(ad.regionSlug && ad.regionName ? [{ href: `/acompanhantes/${ad.citySlug}/${ad.regionSlug}`, label: ad.regionName }] : []),
    { label: ad.publicName },
  ];
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.label, item: c.href ? absoluteUrl(c.href) : url })),
  };

  const contactProps = { adId: ad.id, hasWhatsapp: ad.hasWhatsapp, hasPhone: ad.hasPhone, hasTelegram: ad.hasTelegram, isDemo: ad.isDemo };
  const hasContact = !ad.isDemo && (ad.hasWhatsapp || ad.hasPhone || ad.hasTelegram);

  return (
    <main className={`mx-auto flex w-full max-w-page flex-col gap-4 px-4 pt-4 sm:px-6 ${hasContact ? 'pb-28 lg:pb-12' : 'pb-12'}`}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ViewTracker adId={ad.id} />
      <Breadcrumbs items={crumbs} />

      {ad.isDemo ? (
        <p className="rounded border border-line bg-white px-3 py-2 text-[13px] text-muted">Este é um <strong className="text-ink">anúncio de exemplo</strong> para demonstrar a plataforma. Textos, horários e valores são fictícios e não representam uma pessoa real.</p>
      ) : null}

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h1 className="text-[26px] font-bold leading-tight tracking-tight text-navy sm:text-3xl">{ad.publicName}{ad.age ? `, ${ad.age} anos` : ''}</h1>
            {ad.verified ? <Badge tone="ok"><IconCheckBadge size={14} /> Perfil verificado</Badge> : <Badge>Verificação não realizada</Badge>}
            {ad.isDemo ? <Badge>Exemplo</Badge> : null}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
            <span className="flex items-center gap-1"><IconPin size={15} /> {where}</span>
            <span className="flex items-center gap-1"><IconClock size={15} /> Atualizado em {formatDateTime(ad.updatedAt)}</span>
          </div>
          <AvailabilityLine ad={ad} className="text-sm" />
        </div>
        <div className="flex gap-2">
          <FavoriteButton adId={ad.id} name={ad.publicName} variant="full" />
          <ShareButton url={url} title={`${ad.publicName} — EscortsBoys`} />
        </div>
      </header>

      <Gallery photos={ad.photos} name={ad.publicName} />

      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <Section title="Apresentação">
            <p className="text-[15px] font-medium leading-relaxed">{ad.title}</p>
            <div className="mt-2 whitespace-pre-line text-[15px] leading-relaxed">{ad.description}</div>
          </Section>

          <Section title="Informações do anúncio">
            <dl className="grid gap-x-6 gap-y-3.5 sm:grid-cols-2">
              <div><dt className="text-xs text-muted">Cidade e região</dt><dd className="mt-0.5 text-[15px] font-semibold">{where}</dd></div>
              {ad.areasServed.length ? <div><dt className="text-xs text-muted">Regiões atendidas</dt><dd className="mt-0.5 text-[15px] font-semibold">{ad.areasServed.join(', ')}</dd></div> : null}
              <div><dt className="text-xs text-muted">Modalidades de atendimento</dt><dd className="mt-0.5 text-[15px] font-semibold">{ad.modes.map((m) => m.name).join(', ') || '—'}</dd></div>
              {ad.characteristics.map((c) => (
                <div key={c.label}><dt className="text-xs text-muted">{c.label}</dt><dd className="mt-0.5 text-[15px] font-semibold">{c.value}</dd></div>
              ))}
            </dl>
            <p className="mt-4 text-xs text-muted">Informações declaradas pelo próprio anunciante. O endereço exato nunca é exibido.</p>
          </Section>

          <Section title="Disponibilidade e agenda">
            <AvailabilityLine ad={ad} className="mb-3 text-sm" />
            {ad.schedule.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[320px] border-collapse text-sm">
                  <caption className="sr-only">Agenda semanal informada</caption>
                  <thead><tr className="text-left text-xs text-muted"><th scope="col" className="border-b border-line py-2 pr-3 font-semibold">Dia</th><th scope="col" className="border-b border-line py-2 font-semibold">Horário</th></tr></thead>
                  <tbody>
                    {scheduleByDay.map(({ d, slots }) => (
                      <tr key={d}><th scope="row" className="border-b border-line py-2.5 pr-3 text-left font-normal">{d}</th><td className={`border-b border-line py-2.5 ${slots.length ? '' : 'text-muted'}`}>{slots.length ? slots.map((s) => `${s.from} – ${s.to === '23:59' ? '00:00' : s.to}`).join(', ') : 'Não atende'}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className="text-sm text-muted">Agenda semanal não informada. Consulte o anunciante.</p>}
          </Section>

          <Section title="Valores">
            {ad.prices.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[280px] border-collapse text-sm">
                  <caption className="sr-only">Tabela de valores</caption>
                  <tbody>
                    {ad.prices.map((p) => (
                      <tr key={p.label}><th scope="row" className="border-b border-line py-2.5 pr-3 text-left font-normal">{p.label}</th><td className="border-b border-line py-2.5 text-right font-bold">{p.amount !== null ? formatBRL(p.amount) : <span className="font-semibold text-muted">Consultar</span>}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className="text-sm text-muted">O anunciante preferiu não divulgar valores. Consulte diretamente.</p>}
          </Section>

          {ad.rules.length || ad.conditions ? (
            <Section title="Regras e condições de atendimento">
              {ad.rules.length ? <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed">{ad.rules.map((r) => <li key={r}>{r}</li>)}</ul> : null}
              {ad.conditions ? <p className="mt-3 whitespace-pre-line text-sm leading-relaxed">{ad.conditions}</p> : null}
            </Section>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-2 text-[13px] text-muted">
            <span>Publicado em {formatDate(ad.publishedAt ?? ad.updatedAt)} · código {ad.id.replace(/-/g, '').slice(-8).toUpperCase()}</span>
            <ReportDialog adId={ad.id} />
          </div>
        </div>

        <aside aria-label="Contato com o anunciante" className="flex w-full flex-col gap-3 lg:sticky lg:top-4 lg:w-[340px] lg:shrink-0">
          <Card className="flex flex-col gap-3.5 p-5">
            <div className="flex flex-col">
              <span className="text-xs text-muted">{ad.showPrices && ad.priceFrom !== null ? 'Valores' : 'Valores'}</span>
              <PriceLabel ad={ad} className="text-2xl text-navy" />
              <span className="text-xs text-muted">Atualizado {timeAgo(ad.updatedAt)}</span>
            </div>
            <ContactActions {...contactProps} />
            <ul className="flex flex-col gap-2 border-t border-line pt-3 text-[13px]">
              <li className="flex justify-between gap-3"><span className="text-muted">Região</span><span className="text-right">{where}</span></li>
              <li className="flex justify-between gap-3"><span className="text-muted">Modalidades</span><span className="text-right">{ad.modes.map((m) => m.name).join(', ')}</span></li>
              <li className="flex justify-between gap-3"><span className="text-muted">Fotos</span><span>{ad.photos.length}</span></li>
            </ul>
            <p className="flex gap-2 text-xs leading-relaxed text-muted"><IconShield size={16} className="shrink-0" /> Diga que viu o anúncio no EscortsBoys. Nunca faça pagamentos antecipados a desconhecidos. <Link href="/seguranca">Dicas de segurança</Link></p>
          </Card>
          {ad.profileSlug ? <Link href={`/perfil/${ad.profileSlug}`} className="text-[13px] font-semibold">Ver perfil público de {ad.publicName}</Link> : null}
        </aside>
      </div>

      {related.length ? (
        <section aria-labelledby="relacionados" className="mt-4 flex flex-col gap-3 border-t border-line pt-5">
          <h2 id="relacionados" className="text-lg font-bold text-navy">Outros anúncios em {ad.cityName}</h2>
          <div className="grid gap-4 xl:grid-cols-2">{related.map((r) => <AdCard key={r.id} ad={r} headingLevel="h3" />)}</div>
        </section>
      ) : null}

      {hasContact ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white p-3 lg:hidden" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
          <ContactActions {...contactProps} compact />
        </div>
      ) : null}
    </main>
  );
}
