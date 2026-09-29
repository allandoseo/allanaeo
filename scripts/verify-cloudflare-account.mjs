#!/usr/bin/env node
/**
 * Guarda de conta Cloudflare.
 *
 * Aborta antes de qualquer deploy se a credencial ativa nao pertencer a conta
 * esperada, ou se a conta nao estiver fixada (risco de publicar numa conta
 * vizinha). Aceita as duas formas de credencial:
 *
 *   - sessao OAuth  -> `wrangler login`, tipico na maquina do dev
 *   - API token     -> CLOUDFLARE_API_TOKEN, tipico em CI / container
 *
 * Node puro, sem dependencias: roda igual em Windows, macOS e Linux.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const color = !process.env.NO_COLOR;
const C = (n) => (color ? `\x1b[${n}m` : '');
const RED = C(31), GREEN = C(32), YELLOW = C(33), BOLD = C(1), DIM = C(2), OFF = C(0);

const stripAnsi = (s) => s.replace(/\x1b\[[0-9;]*[A-Za-z]/g, '');
const lower = (s) => String(s ?? '').trim().toLowerCase();
const ok = (m) => console.log(`${GREEN}✔${OFF} ${m}`);
const warn = (m) => console.log(`${YELLOW}▲${OFF} ${m}`);
const note = (m) => console.log(`${DIM}  ${m}${OFF}`);

function die(title, ...lines) {
  console.error(`\n${RED}✖ ${title}${OFF}`);
  for (const l of lines) console.error(`  ${l}`);
  console.error('');
  process.exit(1);
}

/* ------------------------------------------------------- .env opcional
 * Variaveis ja presentes no ambiente tem prioridade sobre o arquivo. */
const ENV_KEYS = new Set([
  'CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ACCOUNT_ID',
  'CF_EXPECTED_ACCOUNT_ID', 'CF_EXPECTED_EMAIL',
]);

function loadEnvFile(file = '.env') {
  if (!existsSync(file)) return;
  for (let line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    line = line.trim();
    if (!line || line.startsWith('#')) continue;
    if (line.startsWith('export ')) line = line.slice(7).trim();
    const eq = line.indexOf('=');
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    if (!ENV_KEYS.has(key)) continue;
    let val = line.slice(eq + 1).trim();
    const quoted = (val.startsWith('"') && val.endsWith('"')) ||
                   (val.startsWith("'") && val.endsWith("'"));
    if (quoted && val.length >= 2) val = val.slice(1, -1);
    if (!process.env[key]) process.env[key] = val;
  }
}

/* ------------------------------------------------------------ wrangler */
export function wranglerCommand() {
  if (process.env.WRANGLER_CMD) return process.env.WRANGLER_CMD;
  const bin = path.join('node_modules', '.bin',
    process.platform === 'win32' ? 'wrangler.cmd' : 'wrangler');
  return existsSync(bin) ? JSON.stringify(bin) : 'npx --yes wrangler';
}

export function runWrangler(args) {
  // shell: true resolve o .cmd do Windows; os argumentos sao literais fixos.
  const r = spawnSync(`${wranglerCommand()} ${args}`, {
    shell: true, encoding: 'utf8', windowsHide: true,
  });
  return stripAnsi(`${r.stdout ?? ''}${r.stderr ?? ''}`);
}

/* ------------------------------------------ leitura do whoami (exportada) */
const ACCOUNT_ID = /\b[0-9a-f]{32}\b/gi;
const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;

export function parseWhoami(out) {
  return {
    authenticated: !/not authenticated|please run .?wrangler login/i.test(out),
    accounts: [...new Set((out.match(ACCOUNT_ID) ?? []).map((a) => a.toLowerCase()))],
    email: (out.match(EMAIL) ?? [null])[0],
    oauth: /oauth/i.test(out),
  };
}

export function expectedAccountFromConfig() {
  for (const cfg of ['wrangler.toml', 'wrangler.jsonc', 'wrangler.json']) {
    if (!existsSync(cfg)) continue;
    const m = readFileSync(cfg, 'utf8')
      .match(/"?account_id"?\s*[:=]\s*"([0-9a-fA-F]{32})"/);
    if (m) return { id: m[1].toLowerCase(), source: cfg };
  }
  return null;
}

/* ------------------------------------------------------------------ main */
export function verify({ argvId } = {}) {
  loadEnvFile();

  let expected = lower(process.env.CF_EXPECTED_ACCOUNT_ID || argvId || '');
  if (!expected) {
    const fromCfg = expectedAccountFromConfig();
    if (fromCfg) { expected = fromCfg.id; note(`conta esperada lida de ${fromCfg.source}`); }
  }
  if (!expected) {
    die('Nao sei qual conta esperar, entao nao posso garantir nada.',
      'Rode  npm run setup:local  para configurar isso automaticamente,',
      'ou defina CF_EXPECTED_ACCOUNT_ID, ou fixe account_id no wrangler.toml.',
      'O Account ID aparece no painel da Cloudflare (Workers & Pages -> lateral direita).');
  }

  note('consultando wrangler whoami...');
  const who = parseWhoami(runWrangler('whoami'));

  if (!who.authenticated) {
    die('Nenhuma credencial Cloudflare ativa.',
      'Na sua maquina:   npm run setup:local   (abre o navegador e faz login)',
      'Em CI/container:  defina CLOUDFLARE_API_TOKEN, gerado DENTRO da conta de destino',
      '                  (My Profile -> API Tokens -> Create Custom Token).',
      'Se voce ja logou, a credencial pode estar expirada, revogada ou com espacos extras.');
  }

  note(`usando ${process.env.CLOUDFLARE_API_TOKEN ? 'API token'
        : who.oauth ? 'sessao OAuth' : 'credencial reconhecida pelo wrangler'}`);

  if (who.accounts.length === 0) {
    die('Nao consegui extrair nenhum Account ID do whoami.',
      'Rode  npm run cf:whoami  para ver a saida crua.');
  }

  /* a conta esperada esta ao alcance? */
  if (!who.accounts.includes(expected)) {
    die('A credencial NAO alcanca a conta esperada. Deploy abortado.',
      `esperada:  ${expected}`,
      `alcancada: ${who.accounts.join(' ')}`,
      'Esta credencial pertence a outra conta Cloudflare. Rode  npm run setup:local',
      'e logue na conta correta, ou troque CLOUDFLARE_API_TOKEN por um token gerado nela.');
  }
  ok(`credencial alcanca a conta esperada (${expected})`);

  /* a conta esta fixada? */
  const pinned = lower(process.env.CLOUDFLARE_ACCOUNT_ID);
  if (pinned) {
    if (pinned !== expected) {
      die('CLOUDFLARE_ACCOUNT_ID aponta para a conta ERRADA. Deploy abortado.',
        `CLOUDFLARE_ACCOUNT_ID: ${pinned}`, `esperada:              ${expected}`);
    }
    ok('CLOUDFLARE_ACCOUNT_ID fixado na conta correta');
  } else if (who.accounts.length > 1) {
    die(`A credencial alcanca ${who.accounts.length} contas e nenhuma esta fixada. Deploy abortado.`,
      'Sem fixacao o wrangler pode publicar na conta errada.',
      `Defina CLOUDFLARE_ACCOUNT_ID=${expected} no ambiente ou no .env.`);
  } else {
    warn('CLOUDFLARE_ACCOUNT_ID nao definido (a credencial so alcanca 1 conta, mas fixe-o de todo modo)');
  }

  /* dono da credencial */
  const wantEmail = lower(process.env.CF_EXPECTED_EMAIL);
  if (wantEmail) {
    if (!who.email) {
      warn("whoami nao revelou e-mail: adicione o escopo 'User -> User Details: Read' ao token para checar isso tambem");
    } else if (lower(who.email) !== wantEmail) {
      die('A credencial pertence a outro usuario Cloudflare. Deploy abortado.',
        `esperado:   ${wantEmail}`, `encontrado: ${lower(who.email)}`);
    } else {
      ok(`e-mail confere (${lower(who.email)})`);
    }
  } else if (who.email) {
    note(`e-mail da credencial: ${who.email}`);
  }

  console.log(`\n${GREEN}${BOLD}Conta Cloudflare verificada. Liberado para deploy.${OFF}\n`);
  return { accountId: expected, email: who.email };
}

// fileURLToPath e obrigatorio aqui: no Windows, url.pathname vira "/C:/..."
// e a comparacao com argv[1] nunca bateria.
const invokedDirectly = process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (invokedDirectly) verify({ argvId: process.argv[2] });
