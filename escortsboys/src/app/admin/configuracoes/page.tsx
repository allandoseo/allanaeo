import { AdminForm } from '@/components/admin/AdminForm';
import { AdminPage } from '@/components/admin/AdminPage';
import { AreaField, CheckField, TextField } from '@/components/admin/fields';
import { Card } from '@/components/ui';
import { settingsAction } from '@/app/actions/admin';
import { getSettings } from '@/lib/repo';

export const metadata = { title: 'Configurações' };

export default async function ConfiguracoesPage() {
  const s = await getSettings();
  return (
    <AdminPage title="Configurações gerais">
      <Card className="p-4">
        <AdminForm action={settingsAction} submitLabel="Salvar configurações" className="max-w-2xl">
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField id="s-name" name="siteName" label="Nome do site" defaultValue={s.siteName} required maxLength={60} />
            <TextField id="s-email" name="contactEmail" label="E-mail de contato" type="email" defaultValue={s.contactEmail} required />
          </div>
          <CheckField id="s-mod" name="moderationRequired" label="Exigir moderação antes de publicar anúncios novos ou com edições sensíveis" defaultChecked={s.moderationRequired} />
          <div className="grid gap-3 sm:grid-cols-3">
            <TextField id="s-min" name="minPhotos" label="Mínimo de fotos" type="number" min={1} max={12} defaultValue={s.minPhotos} required />
            <TextField id="s-max" name="maxPhotos" label="Máximo de fotos" type="number" min={1} max={30} defaultValue={s.maxPhotos} required />
            <TextField id="s-idx" name="minAdsForIndex" label="Mín. anúncios p/ indexar cidade" type="number" min={1} max={50} defaultValue={s.minAdsForIndex} required />
          </div>
          <AreaField id="s-notice" name="notice" label="Aviso global" rows={2} defaultValue={s.notice} hint="Opcional. Até 300 caracteres." />
        </AdminForm>
      </Card>
    </AdminPage>
  );
}
