import { AdminForm } from '@/components/admin/AdminForm';
import { AdminPage } from '@/components/admin/AdminPage';
import { AreaField, CheckField, TextField } from '@/components/admin/fields';
import { Badge, Card } from '@/components/ui';
import { cityAction } from '@/app/actions/admin';
import { getCities, getCoverage } from '@/lib/repo';

export const metadata = { title: 'Cidades' };

export default async function CidadesPage() {
  const [cities, coverage] = await Promise.all([getCities(false), getCoverage()]);
  return (
    <AdminPage title="Cidades e regiões" description="Páginas de cidade só são indexadas quando atingem o mínimo de anúncios ativos definido em Configurações.">
      <Card className="p-4">
        <h2 className="mb-3 text-base font-bold text-navy">Nova cidade</h2>
        <AdminForm action={cityAction} submitLabel="Criar cidade" className="max-w-xl">
          <div className="grid gap-3 sm:grid-cols-[1fr_100px]">
            <TextField id="new-city-name" name="name" label="Nome" required maxLength={60} />
            <TextField id="new-city-uf" name="state" label="UF" required maxLength={2} placeholder="RJ" />
          </div>
          <AreaField id="new-city-regions" name="regions" label="Bairros e regiões" hint="Um por linha." />
          <CheckField id="new-city-active" name="active" label="Ativa" defaultChecked />
        </AdminForm>
      </Card>
      <ul className="flex flex-col gap-2">
        {cities.map((c) => (
          <li key={c.slug}>
            <Card>
              <details>
                <summary className="flex cursor-pointer flex-wrap items-center gap-2 px-4 py-3">
                  <span className="font-semibold text-navy">{c.name} ({c.state})</span>
                  <span className="text-xs text-muted">{c.regions.length} regiões · {coverage[c.slug]?.total ?? 0} anúncios ativos</span>
                  {c.active ? <Badge tone="ok">Ativa</Badge> : <Badge>Inativa</Badge>}
                  <span className="ml-auto text-[13px] text-brand">Editar</span>
                </summary>
                <div className="border-t border-line p-4">
                  <AdminForm action={cityAction} className="max-w-xl">
                    <input type="hidden" name="slug" value={c.slug} />
                    <div className="grid gap-3 sm:grid-cols-[1fr_100px]">
                      <TextField id={`c-${c.slug}-name`} name="name" label="Nome" defaultValue={c.name} required maxLength={60} />
                      <TextField id={`c-${c.slug}-uf`} name="state" label="UF" defaultValue={c.state} required maxLength={2} />
                    </div>
                    <AreaField id={`c-${c.slug}-regions`} name="regions" label="Bairros e regiões" rows={8} defaultValue={c.regions.map((r) => r.name).join('\n')}
                      hint="Um por linha. Remover uma região não altera anúncios existentes, mas ela deixa de aparecer nos filtros." />
                    <CheckField id={`c-${c.slug}-active`} name="active" label="Ativa" defaultChecked={c.active} />
                  </AdminForm>
                </div>
              </details>
            </Card>
          </li>
        ))}
      </ul>
    </AdminPage>
  );
}
