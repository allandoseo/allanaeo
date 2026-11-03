import { Alert, Badge, Card, LinkButton, PageHeading, cx } from '@/components/ui';
import { requireUser } from '@/lib/auth';
import { formatBRL } from '@/lib/format';
import { getPlans } from '@/lib/repo';

export const metadata = { title: 'Assinatura' };

export default async function AssinaturaPage() {
  await requireUser('/painel/assinatura');
  const plans = await getPlans();
  return (
    <>
      <PageHeading title="Assinatura">Plano atual: <strong className="text-ink">sem plano pago</strong></PageHeading>
      <Alert tone="info">O pagamento on-line ainda não está habilitado (depende da integração com um gateway de pagamento). Para contratar, escolha o plano e nossa equipe responde com as condições.</Alert>
      {plans.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {plans.map((p) => (
            <Card key={p.id} className={cx('flex flex-col gap-3 p-5', p.highlight && 'border-brand')}>
              <div className="flex items-center gap-2"><h2 className="text-lg font-bold text-navy">{p.name}</h2>{p.highlight ? <Badge tone="brand">Recomendado</Badge> : null}</div>
              <p className="text-sm text-muted">{p.description}</p>
              <p className="text-xl font-bold">{p.priceCents !== null ? `${formatBRL(p.priceCents / 100)}` : 'Valor a definir'} <span className="text-sm font-normal text-muted">/ {p.periodDays} dias</span></p>
              <ul className="list-disc space-y-1 pl-5 text-sm">{p.features.map((f) => <li key={f}>{f}</li>)}</ul>
              <LinkButton href={`/contato?assunto=anuncio&plano=${encodeURIComponent(p.id)}`} variant={p.highlight ? 'primary' : 'secondary'} className="mt-auto">Escolher plano</LinkButton>
            </Card>
          ))}
        </div>
      ) : <p className="text-sm text-muted">Nenhum plano disponível no momento.</p>}
    </>
  );
}
