import { Badge } from '../ui';
import type { AdStatus, Verification } from '@/lib/types';

export const AD_STATUS: Record<AdStatus, { label: string; tone: 'neutral' | 'brand' | 'ok' | 'warn' | 'danger' }> = {
  draft: { label: 'Rascunho', tone: 'neutral' },
  pending: { label: 'Em análise', tone: 'brand' },
  active: { label: 'Ativo', tone: 'ok' },
  paused: { label: 'Pausado', tone: 'warn' },
  rejected: { label: 'Rejeitado', tone: 'danger' },
  removed: { label: 'Removido', tone: 'danger' },
};

export function AdStatusBadge({ status }: { status: AdStatus }) {
  const s = AD_STATUS[status];
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

export const VERIFICATION: Record<Verification, { label: string; tone: 'neutral' | 'brand' | 'ok' | 'danger' }> = {
  none: { label: 'Não verificado', tone: 'neutral' },
  pending: { label: 'Verificação em análise', tone: 'brand' },
  verified: { label: 'Verificado', tone: 'ok' },
  rejected: { label: 'Verificação recusada', tone: 'danger' },
};
