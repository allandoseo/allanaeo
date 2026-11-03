import type { ReactNode } from 'react';

export function AdminPage({ title, description, actions, children }: { title: string; description?: ReactNode; actions?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy">{title}</h1>
          {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
        </div>
        {actions}
      </div>
      {children}
    </div>
  );
}

export function Th({ children, className = '' }: { children?: ReactNode; className?: string }) {
  return <th scope="col" className={`whitespace-nowrap border-b border-line bg-canvas px-3 py-2.5 text-left text-xs font-semibold text-muted ${className}`}>{children}</th>;
}
export function Td({ children, className = '' }: { children?: ReactNode; className?: string }) {
  return <td className={`border-b border-line px-3 py-3 align-top ${className}`}>{children}</td>;
}

export const STATUS_LABEL: Record<string, string> = {
  draft: 'Rascunho', pending: 'Em análise', active: 'Ativo', paused: 'Pausado', rejected: 'Rejeitado', removed: 'Removido',
};
export const STATUS_TONE: Record<string, 'neutral' | 'brand' | 'ok' | 'warn' | 'danger'> = {
  draft: 'neutral', pending: 'brand', active: 'ok', paused: 'warn', rejected: 'danger', removed: 'danger',
};
export const REASON_LABEL: Record<string, string> = {
  minor: 'Possível menor de idade',
  non_consensual_images: 'Imagens sem consentimento',
  impersonation: 'Identidade falsa / uso de identidade',
  third_party: 'Anúncio de terceiros',
  personal_data: 'Exposição de dados pessoais',
  fraud: 'Golpe ou cobrança antecipada',
  other: 'Outro motivo',
};
export const ROLE_LABEL: Record<string, string> = { user: 'Usuário', advertiser: 'Anunciante', admin: 'Administrador' };
