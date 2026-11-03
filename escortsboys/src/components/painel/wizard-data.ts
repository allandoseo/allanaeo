import type { Ad, Profile } from '@/lib/types';
import type { WizardData } from './AdWizard';

export function adToWizard(ad: Ad): WizardData {
  return {
    publicName: ad.publicName,
    age: ad.age ? String(ad.age) : '',
    title: ad.title,
    citySlug: ad.citySlug,
    regionSlug: ad.regionSlug ?? '',
    areasServed: ad.areasServed,
    summary: ad.summary,
    description: ad.description,
    characteristics: ad.characteristics,
    modes: ad.modes,
    availability: ad.availability,
    availabilityNote: ad.availabilityNote,
    schedule: ad.schedule,
    showPrices: ad.showPrices,
    prices: ad.prices,
    rules: ad.rules,
    conditions: ad.conditions,
    photos: ad.photos,
    imageConsent: !!ad.imageConsentAt,
    contact: {
      whatsapp: ad.contact.whatsapp ?? '',
      phone: ad.contact.phone ?? '',
      telegram: ad.contact.telegram ?? '',
      showWhatsapp: ad.contact.showWhatsapp,
      showPhone: ad.contact.showPhone,
      showTelegram: ad.contact.showTelegram,
    },
  };
}

export function emptyWizard(profile: Profile): WizardData {
  return {
    publicName: profile.publicName, age: '', title: '', citySlug: profile.citySlug, regionSlug: '', areasServed: [], summary: '', description: '',
    characteristics: [], modes: [], availability: 'unknown', availabilityNote: '', schedule: [], showPrices: false, prices: [],
    rules: ['Atendimento exclusivo para maiores de 18 anos.'], conditions: '', photos: [], imageConsent: false,
    contact: { whatsapp: '', phone: '', telegram: '', showWhatsapp: true, showPhone: false, showTelegram: false },
  };
}
