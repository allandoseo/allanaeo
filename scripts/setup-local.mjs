#!/usr/bin/env node
/**
 * Configura este repositorio na SUA maquina (Windows, macOS ou Linux).
 *
 * O `wrangler login` e um fluxo OAuth que exige navegador na mesma maquina e um
 * callback em http://localhost:8976/oauth/callback. Num container na nuvem esse
 * localhost e o proprio container, inacessivel do seu navegador, e o login
 * travaria para sempre. Aqui, na sua maquina, ele funciona.
 *
 * Uso:  npm run setup:local
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, copyFileSync, chmodSync } from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { parseWhoami, runWrangler, wranglerCommand } from './verify-cloudflare-account.mjs';

const color = !process.env.NO_COLOR;
const C = (n) => (color ? `\x1b[${n}m` : '');
const RED = C(31), GREEN = C(32), YELLOW = C(33), CYAN = C(36), BOLD = C(1), DIM = C(2), OFF = C(0);

const step = (m) => console.log(`\n${BOLD}${CYAN}\u25b8 ${m}${OFF}`);
const ok = (m) => console.log(`${GREEN}\u2714${OFF} ${m}`);
const warn = (m) => console.log(`${YELLOW}\u25b2${OFF} ${m}`);
const lower = (s) => String(s ?? '').trim().toLowerCase();

function die(title, ...lines) {
  console.error(`\n${RED}\u2716 ${title}${OFF}`);
  for (const l of lines) console.error(`  ${l}`);
  console.error('');
  process.exit(1);
}

const EXPECTED_EMAIL = process.env.CF_EXPECTED_EMAIL || 'allan.em.cristo.jesus@gmail.com';

/* --------------------------------------------------------- pre-requisitos */
step('Verificando pre-requisitos');

if (!existsSync('package.json') || !existsSync(path.join('scripts', 'verify-cloudflare-account.mjs'))) {
  die('Rode este script a partir da raiz do repositorio.',
    'Windows (PowerShell):  cd $HOME\\projetos\\allanaeo ; npm run setup:local',
    'macOS / Linux:         cd ~/projetos/allanaeo && npm run setup:local');
}

// Windows: System32 e read-only para o usuario e nao e lugar de repositorio.
const cwd = process.cwd();
if (process.platform === 'win32' && /\\Windows\\System32/i.test(cwd)) {
  die('Voce esta dentro de C:\\Windows\\System32, que nao aceita escrita.',
    'Mude para uma pasta sua antes de clonar:',
    '  cd $HOME ; mkdir -Force projetos ; cd projetos');
}

const major = Number(process.versions.node.split('.')[0]);
if (major < 18) die(`Node.js ${process.version} e antigo demais para o wrangler.`, 'Use Node 18 ou superior: https://nodejs.org');
ok(`node ${process.version} em ${cwd}`);

/* ---------------------------------------------------------- dependencias */
step('Instalando dependencias (wrangler fixado no package.json)');
const install = spawnSync('npm install --no-fund --no-audit', { shell: true, stdio: 'inherit' });
if (install.status !== 0) die('npm install falhou.', 'Veja o erro acima. Apagar node_modules e tentar de novo costuma resolver.');
ok(`wrangler pronto (${wranglerCommand()})`);

/* ------------------------------------------------------------ login limpo */
step('Limpando qualquer sessao Cloudflare anterior');
runWrangler('logout');
ok('sessao anterior removida');

step('Abrindo o navegador para login na Cloudflare');
console.log(`  Escolha a conta ${BOLD}${EXPECTED_EMAIL}${OFF} na tela de autorizacao.`);
console.log(`  ${DIM}Se o navegador nao abrir sozinho, copie a URL que aparecer abaixo.${OFF}\n`);

const login = spawnSync(`${wranglerCommand()} login`, { shell: true, stdio: 'inherit' });
if (login.status !== 0) {
  die('O login foi cancelado ou falhou.',
    'Se o navegador nao abriu, copie a URL exibida acima e cole nele manualmente.');
}

/* -------------------------------------------------------------- quem somos */
step('Confirmando qual conta ficou ativa');
const raw = runWrangler('whoami');
console.log(raw.split(/\r?\n/).filter((l) => l.trim() && !/^─+$/.test(l)).map((l) => `  ${l}`).join('\n'));

const who = parseWhoami(raw);
if (!who.authenticated) die('O wrangler continua sem autenticacao apos o login.', 'Rode  npm run setup:local  novamente.');
if (who.accounts.length === 0) die('Nao consegui ler nenhum Account ID do whoami.', 'Saida crua acima.');

/* ----------------------------------------------------- o e-mail e o certo? */
step('Checando o dono da credencial');
if (!who.email) {
  warn('o whoami nao expos e-mail nesta sessao; seguindo pelo Account ID');
} else {
  console.log(`  e-mail logado:   ${BOLD}${who.email}${OFF}`);
  console.log(`  e-mail esperado: ${EXPECTED_EMAIL}`);
  if (lower(who.email) !== lower(EXPECTED_EMAIL)) {
    die('Voce logou na conta ERRADA.',
      'Rode  npm run setup:local  de novo e, na tela da Cloudflare, troque de conta',
      'antes de autorizar (pode ser preciso sair da conta atual no navegador primeiro).');
  }
  ok('e-mail confere');
}

/* ----------------------------------------------------------- qual conta usar */
step('Fixando a conta de destino');
let accountId;
if (who.accounts.length === 1) {
  accountId = who.accounts[0];
  ok(`uma unica conta alcancavel: ${accountId}`);
} else {
  console.log(`  Esta credencial alcanca ${who.accounts.length} contas:\n`);
  console.log(raw.split(/\r?\n/).filter((l) => /[0-9a-f]{32}/i.test(l)).map((l) => `    ${l}`).join('\n'));
  const rl = readline.createInterface({ input: stdin, output: stdout });
  const answer = await rl.question('\n  Cole o Account ID que deve receber o deploy: ');
  rl.close();
  accountId = lower(answer).replace(/\s+/g, '');
  if (!who.accounts.includes(accountId)) {
    die(`'${accountId}' nao esta entre as contas alcancaveis.`, 'Rode o setup de novo e cole um dos IDs listados.');
  }
  ok(`conta escolhida: ${accountId}`);
}

/* --------------------------------------------------------------- grava .env */
step('Gravando .env (ignorado pelo git)');
if (existsSync('.env')) {
  const backup = `.env.bak.${new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)}`;
  copyFileSync('.env', backup);
  warn(`.env anterior salvo como ${backup}`);
}
writeFileSync('.env', [
  `# Gerado por scripts/setup-local.mjs em ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC`,
  '# Ignorado pelo git. A sessao OAuth vive em ~/.config/.wrangler, nao aqui.',
  `CLOUDFLARE_ACCOUNT_ID=${accountId}`,
  `CF_EXPECTED_ACCOUNT_ID=${accountId}`,
  `CF_EXPECTED_EMAIL=${who.email ?? EXPECTED_EMAIL}`,
  '',
].join('\n'), 'utf8');
// chmod e no-op no Windows, onde a ACL da pasta do usuario ja restringe acesso.
try { chmodSync('.env', 0o600); } catch { /* ignore */ }
ok('.env gravado');

/* ------------------------------------------------------------- prova real */
step('Rodando a guarda de ponta a ponta');
const verify = spawnSync('npm run --silent cf:verify', { shell: true, stdio: 'inherit' });
if (verify.status !== 0) die('A guarda reprovou logo apos o setup.', 'Leia a mensagem acima: ela diz exatamente o que esta divergindo.');

console.log(`${GREEN}${BOLD}
  Pronto. Conta de deploy travada.

    e-mail      ${who.email ?? '<nao exposto pelo whoami>'}
    Account ID  ${accountId}

  A partir de agora 'npm run deploy' verifica isso antes de publicar
  e aborta se a conta mudar.
${OFF}`);
