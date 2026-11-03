import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomBytes, randomUUID } from 'node:crypto';
import type { Ad, Category, City, Database, Plan, Profile, ScheduleSlot, User } from '@/lib/types';
import { hashPassword } from '@/lib/password';
import { slugify } from '@/lib/slug';

const now = () => new Date().toISOString();

export const CITIES: City[] = [
  {
    slug: 'rio-de-janeiro', name: 'Rio de Janeiro', state: 'RJ', active: true,
    regions: ['Copacabana', 'Ipanema', 'Leblon', 'Botafogo', 'Flamengo', 'Barra da Tijuca', 'Recreio', 'Tijuca', 'Centro', 'Lapa', 'Niterói'].map((n) => ({ slug: slugify(n), name: n })),
  },
  {
    slug: 'sao-paulo', name: 'São Paulo', state: 'SP', active: true,
    regions: ['Jardins', 'Pinheiros', 'Vila Madalena', 'Moema', 'Itaim Bibi', 'Consolação', 'República', 'Vila Mariana', 'Santana', 'Tatuapé'].map((n) => ({ slug: slugify(n), name: n })),
  },
  {
    slug: 'belo-horizonte', name: 'Belo Horizonte', state: 'MG', active: true,
    regions: ['Savassi', 'Lourdes', 'Funcionários', 'Centro', 'Pampulha', 'Buritis'].map((n) => ({ slug: slugify(n), name: n })),
  },
  { slug: 'brasilia', name: 'Brasília', state: 'DF', active: true, regions: ['Asa Sul', 'Asa Norte', 'Lago Sul', 'Águas Claras'].map((n) => ({ slug: slugify(n), name: n })) },
  { slug: 'curitiba', name: 'Curitiba', state: 'PR', active: true, regions: ['Batel', 'Centro', 'Água Verde'].map((n) => ({ slug: slugify(n), name: n })) },
  { slug: 'porto-alegre', name: 'Porto Alegre', state: 'RS', active: true, regions: ['Moinhos de Vento', 'Cidade Baixa', 'Centro Histórico'].map((n) => ({ slug: slugify(n), name: n })) },
  { slug: 'salvador', name: 'Salvador', state: 'BA', active: true, regions: ['Barra', 'Rio Vermelho', 'Pituba'].map((n) => ({ slug: slugify(n), name: n })) },
  { slug: 'recife', name: 'Recife', state: 'PE', active: true, regions: ['Boa Viagem', 'Casa Forte', 'Graças'].map((n) => ({ slug: slugify(n), name: n })) },
];

export const CATEGORIES: Category[] = [
  { slug: 'local-proprio', name: 'Local próprio', description: 'Atende em local reservado próprio.', active: true },
  { slug: 'hotel', name: 'Hotel ou motel', description: 'Atende em hotel ou motel escolhido em comum acordo.', active: true },
  { slug: 'desloca-se', name: 'Desloca-se', description: 'Vai até o cliente dentro da região atendida.', active: true },
  { slug: 'eventos', name: 'Companhia para eventos', description: 'Acompanha em jantares e eventos sociais.', active: true },
  { slug: 'viagens', name: 'Viagens', description: 'Aceita acompanhar em viagens, mediante combinação.', active: true },
  { slug: 'online', name: 'Atendimento online', description: 'Chamadas de vídeo e conteúdo combinado previamente.', active: true },
];

export const PLANS: Plan[] = [
  { id: 'basico', name: 'Básico', description: 'Um anúncio ativo com fotos e contatos.', priceCents: null, periodDays: 30, features: ['1 anúncio ativo', 'Até 12 fotos', 'Atualização de disponibilidade', 'Estatísticas de visualizações e contatos'], highlight: false, active: true },
  { id: 'destaque', name: 'Destaque', description: 'Mais exposição nas listagens da sua cidade.', priceCents: null, periodDays: 30, features: ['Tudo do Básico', 'Prioridade na ordenação "Mais relevantes"', 'Até 3 anúncios ativos'], highlight: true, active: true },
  { id: 'premium', name: 'Premium', description: 'Para quem atende em mais de uma cidade.', priceCents: null, periodDays: 30, features: ['Tudo do Destaque', 'Anúncios em até 3 cidades', 'Suporte prioritário'], highlight: false, active: true },
];

const DEMO_PEOPLE: Array<[string, number, string, string, string[], number | null]> = [
  // nome, idade, cidade, região, modalidades, valor a partir de (exemplo)
  ['Rafael', 29, 'rio-de-janeiro', 'copacabana', ['local-proprio', 'hotel'], 300],
  ['Diego', 34, 'rio-de-janeiro', 'barra-da-tijuca', ['hotel', 'desloca-se'], null],
  ['Lucas', 26, 'rio-de-janeiro', 'botafogo', ['local-proprio'], 250],
  ['Thiago', 31, 'rio-de-janeiro', 'tijuca', ['desloca-se', 'hotel'], null],
  ['Gabriel', 38, 'rio-de-janeiro', 'leblon', ['hotel', 'eventos'], 450],
  ['Bruno', 27, 'rio-de-janeiro', 'centro', ['local-proprio', 'desloca-se'], 200],
  ['André', 41, 'rio-de-janeiro', 'ipanema', ['eventos', 'viagens'], null],
  ['Felipe', 24, 'rio-de-janeiro', 'copacabana', ['desloca-se'], 220],
  ['Marcos', 33, 'sao-paulo', 'jardins', ['local-proprio', 'hotel'], 350],
  ['Caio', 28, 'sao-paulo', 'pinheiros', ['desloca-se', 'online'], null],
  ['Henrique', 36, 'sao-paulo', 'moema', ['hotel', 'eventos', 'viagens'], 500],
  ['Vitor', 25, 'sao-paulo', 'consolacao', ['local-proprio'], 230],
  ['Leonardo', 30, 'sao-paulo', 'itaim-bibi', ['hotel'], null],
  ['Pedro', 32, 'belo-horizonte', 'savassi', ['local-proprio', 'desloca-se'], 260],
  ['Samuel', 29, 'belo-horizonte', 'lourdes', ['hotel', 'eventos'], null],
  ['Igor', 35, 'belo-horizonte', 'funcionarios', ['desloca-se'], 240],
];

const SUMMARIES = [
  'Atendimento discreto, com horário combinado previamente por mensagem.',
  'Prefiro primeiro contato por mensagem. Leia as regras antes de chamar.',
  'Atendo com agendamento e confirmação no dia. Respondo em horário comercial.',
  'Horários flexíveis; valores conforme duração e modalidade.',
  'Contato apenas pelos canais do anúncio. Sem chamadas de número oculto.',
];

const SCHEDULES: ScheduleSlot[][] = [
  [1, 2, 3, 4, 5].map((day) => ({ day, from: '14:00', to: '22:00' })),
  [5, 6].map((day) => ({ day, from: '16:00', to: '23:59' })),
  [1, 3, 5, 6].map((day) => ({ day, from: '10:00', to: '20:00' })),
];

function demoAd(i: number, owner: User, profile: Profile): Ad {
  const [name, age, city, region, modes, from] = DEMO_PEOPLE[i];
  const created = new Date(Date.now() - (i * 7 + 3) * 3600_000 * 6).toISOString();
  const updated = new Date(Date.now() - (i * 5 + 1) * 3600_000).toISOString();
  const photos = Array.from({ length: 3 + (i % 4) }, (_, k) => ({
    id: `demo-${i}-${k}`,
    url: `/demo/foto-${((i + k) % 6) + 1}.svg`,
    width: 800,
    height: 1000,
    alt: `Imagem ilustrativa do anúncio de exemplo ${name}`,
  }));
  return {
    id: `demo-ad-${i + 1}`,
    slug: `${slugify(name)}-${region}-exemplo-${i + 1}`,
    ownerId: owner.id,
    profileId: profile.id,
    title: `${name} — ${SUMMARIES[i % SUMMARIES.length].split(',')[0]}`,
    publicName: name,
    age,
    citySlug: city,
    regionSlug: region,
    areasServed: [CITIES.find((c) => c.slug === city)!.regions.find((r) => r.slug === region)!.name],
    summary: SUMMARIES[i % SUMMARIES.length],
    description:
      'Este é um anúncio de demonstração criado para apresentar o layout da plataforma. ' +
      'Os textos, horários e valores são fictícios e não correspondem a uma pessoa real. ' +
      'Em um anúncio real, este espaço traz a apresentação escrita pelo próprio anunciante.',
    characteristics: [
      { label: 'Idiomas', value: i % 3 === 0 ? 'Português, inglês' : 'Português' },
      { label: 'Público atendido', value: i % 2 === 0 ? 'Homens' : 'Homens e casais' },
      { label: 'Antecedência', value: `${(i % 3) + 1} hora(s)` },
    ],
    modes,
    availability: 'unknown',
    availabilityNote: '',
    availabilityUpdatedAt: null,
    schedule: SCHEDULES[i % SCHEDULES.length],
    prices: from === null ? [] : [
      { label: '1 hora', amount: from },
      { label: '2 horas', amount: from * 2 - 50 },
      { label: 'Pernoite', amount: null },
    ],
    showPrices: from !== null,
    rules: ['Atendimento exclusivo para maiores de 18 anos.', 'Confirmação do horário por mensagem antes do encontro.'],
    conditions: '',
    contact: { whatsapp: null, phone: null, telegram: null, showWhatsapp: false, showPhone: false, showTelegram: false },
    photos,
    imageConsentAt: created,
    status: 'active',
    moderationNote: null,
    isDemo: true,
    stats: { views: 0, contactClicks: 0, favorites: 0 },
    createdAt: created,
    updatedAt: updated,
    publishedAt: created,
    draftStep: 10,
  };
}

/** Garante a conta admin definida por ADMIN_EMAIL/ADMIN_PASSWORD (também em bancos já existentes). */
export async function ensureAdmin(db: Database): Promise<boolean> {
  const pwd = process.env.ADMIN_PASSWORD;
  if (!pwd) return false;
  const email = (process.env.ADMIN_EMAIL || 'admin@escortsboys.local').toLowerCase();
  const existing = db.users.find((u) => u.email === email);
  if (existing) {
    // Nunca promove automaticamente uma conta existente (alguém poderia ter se cadastrado com esse e-mail).
    if (existing.role !== 'admin') console.warn(`[escortsboys] ADMIN_EMAIL ${email} pertence a uma conta não-admin; promova manualmente.`);
    return false;
  }
  const t = now();
  db.users.push({ id: randomUUID(), email, name: 'Administração', passwordHash: await hashPassword(pwd), role: 'admin', status: 'active', ageConfirmedAt: t, termsAcceptedAt: t, createdAt: t, lastLoginAt: null });
  return true;
}

async function writeCredentialsNote(lines: string[]) {
  const dir = process.env.DATA_DIR || path.join(process.cwd(), '.data');
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, 'credenciais-locais.txt'), lines.join('\n') + '\n', 'utf8');
}

export async function createSeed(): Promise<Database> {
  const t = now();
  const db: Database = {
    version: 1,
    users: [],
    profiles: [],
    ads: [],
    cities: CITIES,
    categories: CATEGORIES,
    plans: PLANS,
    reports: [],
    favorites: [],
    sessions: [],
    passwordResets: [],
    dailyStats: [],
    contactMessages: [],
    settings: {
      siteName: 'EscortsBoys',
      contactEmail: 'contato@escortsboys.com.br',
      moderationRequired: true,
      minPhotos: 1,
      maxPhotos: 12,
      minAdsForIndex: 3,
      notice: '',
    },
    audit: [],
  };

  const isProd = process.env.NODE_ENV === 'production';
  const notes: string[] = ['Credenciais geradas para o armazenamento local (não usar em produção).'];

  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@escortsboys.local').toLowerCase();
  let adminPassword = process.env.ADMIN_PASSWORD || '';
  if (!adminPassword && !isProd) adminPassword = randomBytes(9).toString('base64url');
  if (adminPassword) {
    db.users.push({
      id: randomUUID(), email: adminEmail, name: 'Administração', passwordHash: await hashPassword(adminPassword),
      role: 'admin', status: 'active', ageConfirmedAt: t, termsAcceptedAt: t, createdAt: t, lastLoginAt: null,
    });
    if (!process.env.ADMIN_PASSWORD) notes.push(`Admin: ${adminEmail} / ${adminPassword}`);
  }

  const seedDemo = (process.env.SEED_DEMO ?? 'true') !== 'false';
  if (seedDemo) {
    // Anunciante de demonstração com acesso ao painel (somente fora de produção)
    let demoOwner: User | null = null;
    if (!isProd) {
      const pwd = randomBytes(9).toString('base64url');
      demoOwner = {
        id: randomUUID(), email: 'anunciante@exemplo.com', name: 'Anunciante de exemplo', passwordHash: await hashPassword(pwd),
        role: 'advertiser', status: 'active', ageConfirmedAt: t, termsAcceptedAt: t, createdAt: t, lastLoginAt: null,
      };
      db.users.push(demoOwner);
      notes.push(`Anunciante de exemplo: anunciante@exemplo.com / ${pwd}`);
    }
    DEMO_PEOPLE.forEach((p, i) => {
      const owner: User = i === 0 && demoOwner ? demoOwner : {
        id: randomUUID(), email: `exemplo-${i + 1}@exemplo.invalid`, name: p[0], passwordHash: '!', role: 'advertiser', status: 'active',
        ageConfirmedAt: t, termsAcceptedAt: t, createdAt: t, lastLoginAt: null,
      };
      if (owner !== demoOwner) db.users.push(owner);
      const profile: Profile = {
        id: randomUUID(), userId: owner.id, slug: `${slugify(p[0])}-exemplo-${i + 1}`, publicName: p[0],
        bio: 'Perfil de demonstração. Não representa uma pessoa real.', citySlug: p[2], avatarUrl: `/demo/foto-${(i % 6) + 1}.svg`,
        verification: 'none', verificationNote: null, isDemo: true, createdAt: t, updatedAt: t,
      };
      db.profiles.push(profile);
      db.ads.push(demoAd(i, owner, profile));
    });
  }

  if (!isProd && notes.length > 1) await writeCredentialsNote(notes);
  if (!isProd && notes.length > 1) console.info('[escortsboys] ' + notes.join('\n[escortsboys] '));
  return db;
}
