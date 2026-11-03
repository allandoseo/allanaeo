import { AdminForm } from '@/components/admin/AdminForm';
import { AdminPage } from '@/components/admin/AdminPage';
import { CheckField, TextField } from '@/components/admin/fields';
import { Badge, Card } from '@/components/ui';
import { categoryAction } from '@/app/actions/admin';
import { getCategories } from '@/lib/repo';

export const metadata = { title: 'Categorias' };

export default async function CategoriasPage() {
  const cats = await getCategories(false);
  return (
    <AdminPage title="Categorias (modalidades de atendimento)" description="O identificador (slug) é gerado a partir do nome na criação e não muda depois, para não quebrar filtros e anúncios existentes.">
      <Card className="p-4">
        <h2 className="mb-3 text-base font-bold text-navy">Nova categoria</h2>
        <AdminForm action={categoryAction} submitLabel="Criar categoria" className="max-w-xl">
          <TextField id="new-cat-name" name="name" label="Nome" required maxLength={60} />
          <TextField id="new-cat-desc" name="description" label="Descrição" maxLength={200} />
          <CheckField id="new-cat-active" name="active" label="Ativa" defaultChecked />
        </AdminForm>
      </Card>
      <ul className="flex flex-col gap-2">
        {cats.map((c) => (
          <li key={c.slug}>
            <Card>
              <details className="group">
                <summary className="flex cursor-pointer flex-wrap items-center gap-2 px-4 py-3">
                  <span className="font-semibold text-navy">{c.name}</span>
                  <code className="text-xs text-muted">{c.slug}</code>
                  {c.active ? <Badge tone="ok">Ativa</Badge> : <Badge>Inativa</Badge>}
                  <span className="ml-auto text-[13px] text-brand">Editar</span>
                </summary>
                <div className="border-t border-line p-4">
                  <AdminForm action={categoryAction} className="max-w-xl">
                    <input type="hidden" name="slug" value={c.slug} />
                    <TextField id={`cat-${c.slug}-name`} name="name" label="Nome" defaultValue={c.name} required maxLength={60} />
                    <TextField id={`cat-${c.slug}-desc`} name="description" label="Descrição" defaultValue={c.description} maxLength={200} />
                    <CheckField id={`cat-${c.slug}-active`} name="active" label="Ativa (aparece nos filtros e no formulário de anúncio)" defaultChecked={c.active} />
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
