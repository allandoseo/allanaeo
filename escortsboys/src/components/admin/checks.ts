import type { Ad } from '@/lib/types';

export type Check = { ok: boolean; label: string };

/** Checagens automáticas exibidas ao moderador (não substituem a análise humana). */
export function moderationChecks(ad: Ad): Check[] {
  const text = [ad.title, ad.summary, ad.description, ad.conditions, ...ad.rules].join(' ');
  const suspicious = /(\d[\s.-]?){8,}/.test(text) || /https?:\/\/|www\./i.test(text) || /[\w.+-]+@[\w-]+\.[\w.]+/.test(text);
  const hasContact = (ad.contact.showWhatsapp && !!ad.contact.whatsapp) || (ad.contact.showPhone && !!ad.contact.phone) || (ad.contact.showTelegram && !!ad.contact.telegram);
  return [
    { ok: ad.age !== null && ad.age >= 18, label: ad.age !== null ? `Idade declarada: ${ad.age} anos` : 'Idade não informada' },
    { ok: !!ad.imageConsentAt, label: ad.imageConsentAt ? 'Autorização de imagem registrada' : 'Sem autorização de imagem' },
    { ok: hasContact, label: hasContact ? 'Possui contato autorizado' : 'Sem contato autorizado' },
    { ok: ad.photos.length >= 1, label: `${ad.photos.length} foto(s)` },
    { ok: !suspicious, label: suspicious ? 'Texto com possível telefone, e-mail ou link' : 'Texto sem contatos embutidos' },
  ];
}
