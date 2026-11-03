import { describe, expect, it } from 'vitest';
import { adSchema, signupSchema, validateStep } from '@/lib/validation';
import { normalizePhoneBR } from '@/lib/format';
import { slugify } from '@/lib/slug';

const validAd = {
  publicName: 'Rafael', age: 25, title: 'Atendimento discreto na Zona Sul', citySlug: 'rio-de-janeiro', regionSlug: 'copacabana',
  summary: 'Atendimento com hora marcada e confirmação.', description: 'x'.repeat(90), modes: ['hotel'],
  photos: [{ id: 'a', url: '/media/a.jpg', width: 800, height: 1000, alt: '' }], imageConsent: true,
  contact: { whatsapp: '(21) 99999-0000', phone: '', telegram: '', showWhatsapp: true, showPhone: false, showTelegram: false },
};

describe('cadastro', () => {
  const ok = { name: 'Ana', email: 'ANA@exemplo.com ', password: 'senha1234', confirm: 'senha1234', adult: 'on', terms: 'on' };
  it('aceita dados válidos e normaliza e-mail', () => {
    const r = signupSchema.safeParse(ok);
    expect(r.success && r.data.email).toBe('ana@exemplo.com');
  });
  it('exige maioridade, termos e senhas iguais', () => {
    const r = signupSchema.safeParse({ ...ok, adult: undefined, terms: undefined, confirm: 'outra123' });
    expect(r.success).toBe(false);
    const paths = r.success ? [] : r.error.issues.map((i) => i.path.join('.'));
    expect(paths).toEqual(expect.arrayContaining(['adult', 'terms']));
  });
  it('rejeita senha fraca', () => {
    expect(signupSchema.safeParse({ ...ok, password: 'abcdefgh', confirm: 'abcdefgh' }).success).toBe(false);
  });
});

describe('anúncio', () => {
  it('aceita anúncio completo e normaliza o WhatsApp', () => {
    const r = adSchema.safeParse(validAd);
    expect(r.success).toBe(true);
    expect(r.success && r.data.contact.whatsapp).toBe('5521999990000');
  });
  it('bloqueia menores de 18', () => {
    expect(validateStep(1, { ...validAd, age: 17 })).toHaveProperty('age');
  });
  it('bloqueia telefone e links no texto livre', () => {
    expect(adSchema.safeParse({ ...validAd, description: `Me chame no 21 99999 0000 ${'x'.repeat(80)}` }).success).toBe(false);
    expect(adSchema.safeParse({ ...validAd, summary: 'Veja mais em https://exemplo.com agora' }).success).toBe(false);
  });
  it('exige autorização de imagem e ao menos um contato autorizado', () => {
    expect(adSchema.safeParse({ ...validAd, imageConsent: false }).success).toBe(false);
    expect(adSchema.safeParse({ ...validAd, contact: { ...validAd.contact, showWhatsapp: false } }).success).toBe(false);
  });
});

describe('utilitários', () => {
  it('slugify remove acentos', () => expect(slugify('São Paulo — Jardins')).toBe('sao-paulo-jardins'));
  it('telefone brasileiro', () => {
    expect(normalizePhoneBR('21 3333-4444')).toBe('552133334444');
    expect(normalizePhoneBR('123')).toBeNull();
  });
});
