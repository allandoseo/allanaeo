import Link from 'next/link';
import { requestVerificationAction } from '@/app/actions/painel';
import { AvatarUpload } from '@/components/painel/AvatarUpload';
import { ProfileForm } from '@/components/painel/ProfileForm';
import { VERIFICATION } from '@/components/painel/status';
import { SubmitButton } from '@/components/auth/SubmitButton';
import { Alert, Badge, Card, PageHeading } from '@/components/ui';
import { requireUser } from '@/lib/auth';
import { getCities, getProfileByUser, listAdsByOwner } from '@/lib/repo';

export const metadata = { title: 'Meu perfil' };

export default async function PerfilPage({ searchParams }: { searchParams: Promise<{ bemvindo?: string; criar?: string }> }) {
  const user = await requireUser('/painel/perfil');
  const [profile, cities, sp, ads] = await Promise.all([getProfileByUser(user.id), getCities(), searchParams, listAdsByOwner(user.id)]);
  const hasActive = ads.some((a) => a.status === 'active');
  return (
    <>
      <PageHeading title="Meu perfil">
        {profile && hasActive ? <>Perfil público: <Link href={`/perfil/${profile.slug}`}>/perfil/{profile.slug}</Link></> : 'O perfil público aparece quando houver pelo menos um anúncio ativo.'}
      </PageHeading>
      {sp.bemvindo ? <Alert tone="ok">Conta criada. Complete seu perfil para criar o primeiro anúncio.</Alert> : null}
      {sp.criar && !profile ? <Alert tone="info">Antes de anunciar, crie seu perfil de anunciante.</Alert> : null}

      <Card className="p-5">
        <h2 className="mb-4 text-base font-bold text-navy">Dados públicos</h2>
        <ProfileForm cities={cities} initial={{ publicName: profile?.publicName ?? '', bio: profile?.bio ?? '', citySlug: profile?.citySlug ?? '' }} />
      </Card>

      {profile ? (
        <>
          <Card className="p-5">
            <h2 className="mb-4 text-base font-bold text-navy">Foto de perfil</h2>
            <AvatarUpload initial={profile.avatarUrl} />
          </Card>
          <Card className="flex flex-col gap-3 p-5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-navy">Verificação de perfil</h2>
              <Badge tone={VERIFICATION[profile.verification].tone}>{VERIFICATION[profile.verification].label}</Badge>
            </div>
            <p className="text-sm leading-relaxed text-ink">
              O selo “Verificado” só aparece depois que a equipe de moderação confere, manualmente, um documento oficial com foto e uma foto de confirmação sua.
              Os documentos não são publicados e são descartados após a análise.
            </p>
            {profile.verification === 'pending' ? (
              <Alert tone="info">Pedido registrado. A equipe entrará em contato pelo e-mail da conta com as instruções de envio seguro dos documentos.</Alert>
            ) : profile.verification === 'verified' ? (
              <Alert tone="ok">Perfil verificado.</Alert>
            ) : (
              <>
                {profile.verification === 'rejected' && profile.verificationNote ? <Alert tone="error">Motivo da recusa: {profile.verificationNote}</Alert> : null}
                {profile.isDemo ? <p className="text-xs text-muted">Perfis de exemplo não podem ser verificados.</p> : (
                  <form action={requestVerificationAction} className="sm:max-w-[240px]">
                    <SubmitButton pendingText="Enviando pedido…">Solicitar verificação</SubmitButton>
                  </form>
                )}
              </>
            )}
          </Card>
        </>
      ) : null}
    </>
  );
}
