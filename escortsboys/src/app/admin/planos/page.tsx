import { AdminForm } from '@/components/admin/AdminForm';
import { AdminPage } from '@/components/admin/AdminPage';
import { AreaField, CheckField, TextField } from '@/components/admin/fields';
import { Badge, Card } from '@/components/ui';
import { planAction } from '@/app/actions/admin';
import { formatBRL } from '@/lib/format';
import { getPlans } from '@/lib/repo';
import type { Plan } from '@/lib/types';

export const metadata = { title: 'Planos' };

function PlanFields({ p, prefix }: { p?: Plan; prefix: string }) {
  return (
    <>
      {p ? <input type="hidden" name="id" value={p.id} /> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField id={`${prefix}-name`} name="name" label="Nome" defaultValue={p?.name} required maxLength={40} />
        <TextField id={`${prefix}-price`} name="price" label="Preço (R$)" defaultValue={p?.priceCents != null ? (p.priceCents / 100).toFixed(2).replace('.', ',') : ''} hint="Deixe vazio para exibir “Valor a definir”." placeholder="a definir" />
      </div>
      <TextField id={`${prefix}-desc`} name="description" label="Descrição" defaultValue={p?.description} maxLength={200} />
      <TextField id={`${prefix}-period`} name="periodDays" label="Período (dias)" type="number" min={1} max={365} defaultValue={p?.periodDays ?? 30} required />
      <AreaField id={`${prefix}-features`} name="features" label="Recursos" defaultValue={p?.features.join('\n')} hint="Um por linha." />
      <div className="flex flex-wrap gap-4">
        <CheckField id={`${prefix}-highlight`} name="highlight" label="Destacar na página Anuncie" defaultChecked={p?.highlight} />
        <CheckField id={`${prefix}-active`} name="active" label="Ativo" defaultChecked={p ? p.active : true} />
      </div>
    </>
  );
}

export default async function PlanosPage() {
  const plans = await getPlans(false);
  return (
    <AdminPage title="Planos" description="Valores e condições exibidos na página Anuncie. Cobrança ainda não integrada a um meio de pagamento.">
      <ul className="flex flex-col gap-2">
        {plans.map((p) => (
          <li key={p.id}>
            <Card>
              <details>
                <summary className="flex cursor-pointer flex-wrap items-center gap-2 px-4 py-3">
                  <span className="font-semibold text-navy">{p.name}</span>
                  <span className="text-sm">{p.priceCents != null ? formatBRL(p.priceCents / 100) : 'Valor a definir'} / {p.periodDays} dias</span>
                  {p.highlight ? <Badge tone="brand">Destaque</Badge> : null}
                  {p.active ? <Badge tone="ok">Ativo</Badge> : <Badge>Inativo</Badge>}
                  <span className="ml-auto text-[13px] text-brand">Editar</span>
                </summary>
                <div className="border-t border-line p-4">
                  <AdminForm action={planAction} className="max-w-2xl"><PlanFields p={p} prefix={`plan-${p.id}`} /></AdminForm>
                </div>
              </details>
            </Card>
          </li>
        ))}
      </ul>
      <Card className="p-4">
        <h2 className="mb-3 text-base font-bold text-navy">Novo plano</h2>
        <AdminForm action={planAction} submitLabel="Criar plano" className="max-w-2xl"><PlanFields prefix="plan-new" /></AdminForm>
      </Card>
    </AdminPage>
  );
}
