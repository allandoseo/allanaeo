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
    return {};
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
  await page.goto(`${BASE}/login`);
  await page.fill('#email', email);
  await page.fill('#password', password);
  await Promise.all([page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 15000 }), page.click('button[type=submit]')]);
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
  } else problems.push('credenciais do anunciante de exemplo não encontradas (.data/credenciais-locais.txt)');

  // Admin
  if (admin) {
    const c = await browser.newContext({ viewport: { width: 1366, height: 900 } });
    const cp = await c.newPage();
    await login(cp, ...admin);
    for (const u of ['/admin', '/admin/moderacao', '/admin/anuncios', '/admin/denuncias', '/admin/verificacoes', '/admin/usuarios', '/admin/mensagens', '/admin/categorias', '/admin/cidades', '/admin/planos', '/admin/configuracoes']) {
      await visit(cp, u, { shot: `admin-${u.split('/').filter(Boolean).slice(1).join('-') || 'visao-geral'}` });
    }
  } else problems.push('credenciais de admin não encontradas');
} finally {
  await browser.close();
}

console.log(`\nPáginas rastreadas: ${visited.size}`);
if (problems.length) {
  console.log(`\n${problems.length} problema(s):\n- ${problems.join('\n- ')}`);
  process.exit(1);
}
console.log('Nenhum problema encontrado.');
