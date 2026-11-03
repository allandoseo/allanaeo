import { describe, expect, it } from 'vitest';
import { effectiveAvailability, isAvailabilityReliable } from '@/lib/availability';
import { hashPassword, verifyPassword } from '@/lib/password';

describe('disponibilidade', () => {
  const now = new Date('2026-11-03T15:00:00-03:00');
  it('"disponível agora" expira em 4 horas', () => {
    expect(isAvailabilityReliable('available_now', '2026-11-03T13:00:00-03:00', now)).toBe(true);
    expect(isAvailabilityReliable('available_now', '2026-11-03T10:30:00-03:00', now)).toBe(false);
  });
  it('"disponível hoje" vale só no mesmo dia (horário de Brasília)', () => {
    expect(isAvailabilityReliable('available_today', '2026-11-03T08:00:00-03:00', now)).toBe(true);
    expect(isAvailabilityReliable('available_today', '2026-11-02T23:00:00-03:00', now)).toBe(false);
  });
  it('status sem data nunca é exibido como confiável', () => {
    expect(effectiveAvailability('available_now', null, now)).toBe('unknown');
  });
});

describe('senhas', () => {
  it('hash e verificação scrypt', async () => {
    const h = await hashPassword('segredo123');
    expect(h.startsWith('scrypt$')).toBe(true);
    expect(await verifyPassword('segredo123', h)).toBe(true);
    expect(await verifyPassword('errada', h)).toBe(false);
  });
});
