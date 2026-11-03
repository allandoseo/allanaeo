// Smoke test E2E: navega pelas rotas públicas e privadas, segue links internos,
// registra erros de console/HTTP e salva screenshots desktop + mobile.
// Uso: BASE_URL=http://localhost:3000 node scripts/smoke.mjs [--shots dir]
import { readFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

// Playwright é resolvido via NODE_PATH (instalação global) ou node_modules do projeto.
const { chromium } = createRequire(import.meta.url)('playwright');

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const shotsIdx = process.argv.indexOf('--shots');
const SHOTS = shotsIdx > -1 ? process.argv[shotsIdx + 1] : null;
if (SHOTS) mkdirSync(SHOTS, { recursive: true });

function creds() {
  try {
    const txt = readFileSync(path.join(process.cwd(), '.data', 'credenciais-locais.txt'), 'utf8');
    const get = (label) => txt.match(new RegExp(`${label}: (\\S+) / (\\S+)`))?.slice(1);
    return { admin: get('Admin'), advertiser: get('Anunciante de exemplo') };
  } catch {
    // Em produção o seed não cria usuários de teste: use ADMIN_EMAIL/ADMIN_PASSWORD do ambiente.
    return process.env.ADMIN_PASSWORD ? { admin: [process.env.ADMIN_EMAIL || 'admin@escortsboys.local', process.env.ADMIN_PASSWORD] } : {};
  }
}

const problems = [];
const visited = new Set();

async function visit(page, url, { crawl = false, shot } = {}) {
  const errors = [];
  const onConsole = (m) => { if (m.type() === 'error') errors.push(m.text()); };
  const onPageError = (e) => errors.push(String(e));
  page.on('console', onConsole);
  page.on('pageerror', onPageError);
  const res = await page.goto(BASE + url, { waitUntil: 'networkidle' }).catch((e) => ({ status: () => 0, err: e }));
  const status = res.status();
  page.off('console', onConsole);
  page.off('pageerror', onPageError);
  const benign = errors.filter((e) => !/Failed to load resource: the server responded with a status of 404/.test(e) || !url.includes('nao-existe'));
  if (status >= 400 && !url.includes('nao-existe')) problems.push(`${url} → HTTP ${status}`);
  if (benign.length) problems.push(`${url} → console: ${benign.join(' | ').slice(0, 300)}`);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1).catch(() => false);
  if (overflow) problems.push(`${url} → overflow horizontal em ${page.viewportSize().width}px`);
  if (SHOTS && shot) await page.screenshot({ path: path.join(SHOTS, `${shot}.png`), fullPage: true });
  let links = [];
  if (crawl) {
    links = await page.$$eval('a[href^="/"]', (as) => as.map((a) => a.getAttribute('href')));
  }
  console.log(`${String(status).padEnd(4)} ${url}${errors.length ? `  (${errors.length} erro(s) de console)` : ''}`);
  return links;
}

async function crawlFrom(page, starts, limit) {
  const queue = [...starts];
  while (queue.length && visited.size < limit) {
    const url = queue.shift();
    const key = url.split('#')[0];
    if (visited.has(key) || key.startsWith('/api/') || key.startsWith('/media/')) continue;
    visited.add(key);
    const links = await visit(page, key, { crawl: true });
    for (const l of links) {
      const k = l.split('#')[0];
      if (!visited.has(k) && !k.startsWith('/api/')) queue.push(k);
    }
  }
}

async function login(page, email, password) {
  await page.context().addCookies([{ name: 'eb_age', value: '1', url: BASE }]);
  await page.goto(`${BASE}/login`);
  await page.fill('#email', email);
  await page.fill('#password', password);
  await Promise.all([page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 15000 }), page.click('main button[type=submit]')]);
}


/** Fluxo completo: cadastro de anunciante → perfil → anúncio em 10 etapas com foto → moderação → anúncio público. */
async function advertiserFlow(browser, admin) {
  const stamp = Date.now().toString(36);
  const name = `Teste${stamp.slice(-5)}`;
  const email = `e2e-${stamp}@exemplo.com`;
  const password = 'senhaE2E123';
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  await ctx.addCookies([{ name: 'eb_age', value: '1', url: BASE }]);
  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', (e) => errors.push(String(e)));
  p.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  const step = async (label, fn) => {
    try { await fn(); } catch (e) { problems.push(`fluxo anunciante — ${label}: ${String(e.message || e).split('\n')[0]}`); throw e; }
  };

  // Foto de teste JPEG gerada pelo próprio navegador (800×1000, sem pessoas)
  const imgPage = await browser.newPage({ viewport: { width: 800, height: 1000 } });
  await imgPage.setContent('<body style="margin:0;background:#426F96"><div style="height:500px;background:#17324D"></div></body>');
  const jpeg = await imgPage.screenshot({ type: 'jpeg', quality: 80 });
  await imgPage.close();

  try {
    await step('cadastro (validação)', async () => {
      await p.goto(`${BASE}/cadastro?tipo=anunciante`);
      await p.click('main button[type=submit]');
      await p.waitForSelector('text=É necessário confirmar que você tem 18 anos', { timeout: 10000 });
    });
    await step('cadastro', async () => {
      await p.fill('#name', 'Pessoa de Teste');
      await p.fill('#email', email);
      await p.fill('#password', password);
      await p.fill('#confirm', password);
      await p.check('#adult');
      await p.check('#terms');
      await Promise.all([p.waitForURL(/\/painel\/perfil/, { timeout: 15000 }), p.click('main button[type=submit]')]);
    });
    await step('perfil', async () => {
      await p.fill('#publicName', name);
      await p.fill('#bio', 'Perfil criado pelo teste automatizado.');
      await p.selectOption('#citySlug', 'rio-de-janeiro');
      await p.click('button:has-text("Salvar perfil")');
      await p.waitForSelector('text=/salvo|atualizado/i', { timeout: 10000 });
    });
    const cont = async () => { await p.click('button:has-text("Continuar")'); await p.waitForTimeout(400); };
    await step('assistente etapa 1 (idade < 18 bloqueada)', async () => {
      await p.goto(`${BASE}/painel/anuncios/novo`);
      await p.fill('#w-name', name);
      await p.fill('#w-age', '17');
      await p.fill('#w-title', 'Atendimento discreto com hora marcada');
      await cont();
      await p.waitForSelector('text=A idade mínima para anunciar é 18 anos', { timeout: 8000 });
      await p.fill('#w-age', '27');
      await cont();
    });
    await step('assistente etapas 2–7', async () => {
      await p.selectOption('#w-city', 'rio-de-janeiro');
      await p.selectOption('#w-region', 'copacabana');
      await cont();
      await p.fill('#w-summary', 'Atendimento com agendamento e confirmação no dia.');
      await p.fill('#w-desc', 'Descrição criada pelo teste automatizado para validar o fluxo completo de publicação de anúncios na plataforma, do cadastro à moderação.');
      await cont();
      await cont(); // características (opcional)
      await p.check('text=Hotel ou motel');
      await cont();
      await cont(); // disponibilidade
      await cont(); // valores
    });
    await step('assistente etapa 8 (upload de foto)', async () => {
      await p.setInputFiles('#w-files', { name: 'foto.jpg', mimeType: 'image/jpeg', buffer: jpeg });
      await p.waitForSelector('#w-alt-0', { timeout: 15000 });
      await p.check('#w-consent');
      await cont();
    });
    await step('assistente etapa 9 (contato)', async () => {
      await p.fill('#w-whatsapp', '(21) 99999-0000');
      await p.check('#w-showWhatsapp');
      await cont();
    });
    await step('assistente etapa 10 (envio)', async () => {
      if (SHOTS) await p.screenshot({ path: path.join(SHOTS, 'painel-revisao.png'), fullPage: true });
      await Promise.all([p.waitForURL(/\/painel\/anuncios\?enviado=1/, { timeout: 15000 }), p.click('button:has-text("Enviar para moderação")')]);
    });
    for (const u of ['/painel', '/painel/perfil', '/painel/anuncios', '/painel/fotos', '/painel/disponibilidade', '/painel/mensagens', '/painel/estatisticas', '/painel/assinatura', '/painel/configuracoes']) {
      await visit(p, u, { shot: `painel-${u.split('/').filter(Boolean).slice(1).join('-') || 'visao-geral'}` });
    }
    const denied = await p.goto(`${BASE}/admin`);
    if (denied.status() !== 404) problems.push(`/admin com anunciante retornou ${denied.status()} (esperado 404)`);
    if (!admin) return;
    await step('moderação (aprovar)', async () => {
      const c = await browser.newContext({ viewport: { width: 1366, height: 900 } });
      const cp = await c.newPage();
      await login(cp, ...admin);
      await cp.goto(`${BASE}/admin/moderacao`);
      const row = cp.locator(`text=${name}`).first();
      await row.waitFor({ timeout: 10000 });
      await cp.locator('button:has-text("Aprovar e publicar")').first().click();
      await cp.waitForTimeout(1500);
      await c.close();
    });
    await step('anúncio publicado aparece na busca', async () => {
      await p.goto(`${BASE}/anuncios?q=${name}`);
      await p.waitForSelector(`article:has-text("${name}")`, { timeout: 10000 });
      await p.click(`article:has-text("${name}") >> text=Ver anúncio completo`);
      await p.waitForSelector('a[href*="canal=whatsapp"]', { timeout: 10000 });
      const href = await p.getAttribute('a[href*="canal=whatsapp"]', 'href');
      const r = await p.request.get(BASE + href, { maxRedirects: 0 });
      if (r.status() !== 302 || !String(r.headers().location).startsWith('https://wa.me/5521999990000')) throw new Error(`redirecionamento WhatsApp inesperado: ${r.status()} ${r.headers().location}`);
      const html = await (await p.request.get(p.url())).text();
      if (html.includes('99999')) throw new Error('telefone exposto no HTML público');
      if (SHOTS) await p.screenshot({ path: path.join(SHOTS, 'anuncio-real-publicado.png'), fullPage: true });
    });
    console.log(`OK  fluxo completo do anunciante (${email})`);
  } catch { /* já registrado */ } finally {
    const real = errors.filter((e) => !/status of 4\d\d/.test(e));
    if (real.length) problems.push(`fluxo anunciante → console: ${real.join(' | ').slice(0, 300)}`);
    await ctx.close();
  }
}

const browser = await chromium.launch();
try {
  // Visitante — desktop
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  await ctx.addCookies([{ name: 'eb_age', value: '1', url: BASE }]);
  const page = await ctx.newPage();
  const firstAd = await (async () => {
    await page.goto(`${BASE}/anuncios`);
    return page.$eval('article a[href^="/anuncio/"]', (a) => a.getAttribute('href')).catch(() => null);
  })();
  const shotsDesktop = [['/', 'home'], ['/anuncios', 'busca'], ['/anuncios?cidade=rio-de-janeiro&modo=hotel&ordem=atualizados', 'busca-filtrada'],
    ['/anuncios?q=zzzz', 'busca-vazia'], ['/acompanhantes/rio-de-janeiro', 'cidade'], ['/favoritos', 'favoritos'], ['/anunciar', 'anunciar'],
    ['/cadastro', 'cadastro'], ['/login', 'login'], ['/recuperar-senha', 'recuperar-senha'], ['/contato', 'contato'], ['/privacidade', 'privacidade'],
    ...(firstAd ? [[firstAd, 'anuncio']] : [])];
  for (const [u, s] of shotsDesktop) { visited.add(u); await visit(page, u, { shot: `desktop-${s}` }); }
  await crawlFrom(page, ['/', '/anuncios', '/sobre', '/termos', '/seguranca', '/diretrizes'], 120);
  await visit(page, '/rota-que-nao-existe');

  // Favorito como visitante (localStorage) aparece na página de favoritos
  if (firstAd) {
    await page.goto(BASE + firstAd);
    await page.click('button[aria-pressed]:has-text("Favoritar")');
    await page.goto(`${BASE}/favoritos`);
    await page.waitForSelector('text=anúncio salvo', { timeout: 8000 }).catch(() => problems.push('favorito local não apareceu em /favoritos'));
  }

  // Rotas privadas sem sessão devem redirecionar ao login
  for (const u of ['/painel', '/admin']) {
    await page.goto(BASE + u);
    if (!page.url().includes('/login')) problems.push(`${u} acessível sem login`);
  }

  // Mobile
  const m = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await m.addCookies([{ name: 'eb_age', value: '1', url: BASE }]);
  const mp = await m.newPage();
  for (const [u, s] of [['/', 'home'], ['/anuncios', 'busca'], ...(firstAd ? [[firstAd, 'anuncio']] : []), ['/cadastro', 'cadastro']]) await visit(mp, u, { shot: `mobile-${s}` });

  // Barreira de idade sem cookie
  const fresh = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const fp = await fresh.newPage();
  await fp.goto(BASE + '/');
  if (!(await fp.isVisible('text=Conteúdo para maiores de 18 anos'))) problems.push('barreira 18+ não exibida');
  if (SHOTS) await fp.screenshot({ path: path.join(SHOTS, 'desktop-age-gate.png') });
  await fp.click('text=Tenho 18 anos ou mais');
  if (await fp.isVisible('text=Conteúdo para maiores de 18 anos')) problems.push('barreira 18+ não fecha');

  const { admin, advertiser } = creds();
  // Anunciante
  if (advertiser) {
    const a = await browser.newContext({ viewport: { width: 1366, height: 900 } });
    const ap = await a.newPage();
    await login(ap, ...advertiser);
    for (const u of ['/painel', '/painel/perfil', '/painel/anuncios', '/painel/anuncios/novo', '/painel/fotos', '/painel/disponibilidade', '/painel/mensagens', '/painel/estatisticas', '/painel/assinatura', '/painel/configuracoes']) {
      await visit(ap, u, { shot: `painel-${u.split('/').filter(Boolean).slice(1).join('-') || 'visao-geral'}` });
    }
    const adminDenied = await ap.goto(`${BASE}/admin`);
    if (adminDenied.status() !== 404) problems.push(`/admin com anunciante retornou ${adminDenied.status()} (esperado 404)`);
  } else console.log('(sem anunciante de exemplo: em produção ele não é criado; o fluxo abaixo cria um anunciante novo)');

  // Admin
  if (admin) {
    const c = await browser.newContext({ viewport: { width: 1366, height: 900 } });
    const cp = await c.newPage();
    await login(cp, ...admin);
    for (const u of ['/admin', '/admin/moderacao', '/admin/anuncios', '/admin/denuncias', '/admin/verificacoes', '/admin/usuarios', '/admin/mensagens', '/admin/categorias', '/admin/cidades', '/admin/planos', '/admin/configuracoes']) {
      await visit(cp, u, { shot: `admin-${u.split('/').filter(Boolean).slice(1).join('-') || 'visao-geral'}` });
    }
  } else problems.push('credenciais de admin não encontradas');
  await advertiserFlow(browser, admin);
} finally {
  await browser.close();
}

console.log(`\nPáginas rastreadas: ${visited.size}`);
if (problems.length) {
  console.log(`\n${problems.length} problema(s):\n- ${problems.join('\n- ')}`);
  process.exit(1);
}
console.log('Nenhum problema encontrado.');
