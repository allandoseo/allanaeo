import type { Availability } from '@/lib/types';

/** Por quanto tempo um status "disponível agora" é considerado confiável. */
export const AVAILABLE_NOW_TTL_HOURS = 4;
/** "Disponível hoje" vale até o fim do dia em que foi informado (horário de Brasília). */

export const AVAILABILITY_LABEL: Record<Availability, string> = {
  unknown: 'Disponibilidade não informada',
  available_now: 'Disponível agora',
  available_today: 'Disponível hoje',
  by_appointment: 'Atende com agendamento',
  unavailable: 'Indisponível no momento',
};

function brDate(d: Date) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(d);
}

/** Um status declarado é confiável apenas se foi atualizado recentemente. */
export function isAvailabilityReliable(status: Availability, updatedAt: string | null, now = new Date()): boolean {
  if (!updatedAt) return false;
  const at = new Date(updatedAt);
  if (status === 'available_now') return now.getTime() - at.getTime() <= AVAILABLE_NOW_TTL_HOURS * 3600_000;
  if (status === 'available_today' || status === 'unavailable') return brDate(at) === brDate(now);
  if (status === 'by_appointment') return now.getTime() - at.getTime() <= 14 * 24 * 3600_000;
  return false;
}

/** Status efetivo exibido ao público (expirado → não informado). */
export function effectiveAvailability(status: Availability, updatedAt: string | null, now = new Date()): Availability {
  return isAvailabilityReliable(status, updatedAt, now) ? status : 'unknown';
}

export const WEEKDAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
