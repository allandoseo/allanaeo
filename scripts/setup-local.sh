#!/usr/bin/env bash
#
# Configura este repositorio na SUA maquina.
#
# O `wrangler login` e um fluxo OAuth que exige navegador na mesma maquina e um
# callback em http://localhost:8976/oauth/callback. Em container na nuvem esse
# localhost e o proprio container, inacessivel do seu navegador, e o login
# travaria para sempre. Aqui, na sua maquina, ele funciona.
#
# Uso:   npm run setup:local
#
set -euo pipefail

red=$'\033[31m'; green=$'\033[32m'; yellow=$'\033[33m'; cyan=$'\033[36m'
bold=$'\033[1m'; dim=$'\033[2m'; reset=$'\033[0m'

EXPECTED_EMAIL="${CF_EXPECTED_EMAIL:-allan.em.cristo.jesus@gmail.com}"

step() { printf '\n%s%s▸ %s%s\n' "$bold" "$cyan" "$1" "$reset"; }
ok()   { printf '%s✔%s %s\n' "$green" "$reset" "$1"; }
warn() { printf '%s▲%s %s\n' "$yellow" "$reset" "$1"; }
die()  { printf '\n%s✖ %s%s\n' "$red" "$1" "$reset" >&2; shift
         for l in "$@"; do printf '  %s\n' "$l" >&2; done; printf '\n' >&2; exit 1; }
strip_ansi() { sed -E $'s/\033\\[[0-9;]*[A-Za-z]//g'; }
lower() { printf '%s' "${1:-}" | tr '[:upper:]' '[:lower:]'; }

# ------------------------------------------------------------------ pre-requisitos
step "Verificando pre-requisitos"
[ -f package.json ] && [ -f scripts/verify-cloudflare-account.sh ] \
  || die "Rode este script da raiz do repositorio." "Ex.: cd allanaeo && npm run setup:local"
command -v node >/dev/null || die "Node.js nao encontrado." "Instale a versao LTS em https://nodejs.org"
command -v npm  >/dev/null || die "npm nao encontrado (vem junto com o Node.js)."
node_major=$(node -v | sed -E 's/^v([0-9]+).*/\1/')
[ "$node_major" -ge 18 ] || die "Node.js $(node -v) e antigo demais para o wrangler." "Use Node 18 ou superior."
ok "node $(node -v), npm $(npm -v)"

# ------------------------------------------------------------------ dependencias
step "Instalando dependencias (wrangler fixado no package.json)"
npm install --no-fund --no-audit
WR=node_modules/.bin/wrangler
[ -x "$WR" ] || die "wrangler nao foi instalado em node_modules/.bin." "Tente apagar node_modules e rodar 'npm install' de novo."
ok "wrangler $("$WR" --version 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)"

# ------------------------------------------------------------------ login limpo
step "Limpando qualquer sessao Cloudflare anterior"
"$WR" logout 2>&1 | grep -viE 'wrangler|^─+$|^$' || true
ok "sessao anterior removida"

step "Abrindo o navegador para login na Cloudflare"
printf '  Escolha a conta %s%s%s na tela de autorizacao.\n' "$bold" "$EXPECTED_EMAIL" "$reset"
printf '  %sSe o navegador nao abrir, copie a URL que aparecer abaixo.%s\n\n' "$dim" "$reset"
"$WR" login || die "O login foi cancelado ou falhou." \
  "Se o navegador nao abriu, copie a URL exibida e cole nele manualmente."

# ------------------------------------------------------------------ quem somos
step "Confirmando qual conta ficou ativa"
who=$("$WR" whoami 2>&1 | strip_ansi)
printf '%s\n' "$who" | grep -viE '^─+$|^$|Getting User settings' | sed 's/^/  /'

printf '%s' "$who" | grep -qiE 'not authenticated' \
  && die "O wrangler continua sem autenticacao apos o login." "Rode 'npm run setup:local' novamente."

email=$(printf '%s\n' "$who" | grep -oiE '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}' | head -1 || true)
accounts=$(printf '%s\n' "$who" | grep -oiE '\b[0-9a-f]{32}\b' | tr '[:upper:]' '[:lower:]' | sort -u)
[ -n "$accounts" ] || die "Nao consegui ler nenhum Account ID do whoami." "Saida:" "$who"

# ------------------------------------------------------------------ o e-mail e o certo?
step "Checando o dono da credencial"
if [ -z "$email" ]; then
  warn "o whoami nao expos e-mail nesta sessao; seguindo pelo Account ID"
else
  printf '  e-mail logado:  %s%s%s\n' "$bold" "$email" "$reset"
  printf '  e-mail esperado: %s\n' "$EXPECTED_EMAIL"
  if [ "$(lower "$email")" != "$(lower "$EXPECTED_EMAIL")" ]; then
    die "Voce logou na conta ERRADA." \
      "Rode 'npm run setup:local' de novo e, na tela da Cloudflare, troque de conta" \
      "antes de autorizar (pode ser preciso sair da conta atual no navegador primeiro)."
  fi
  ok "e-mail confere"
fi

# ------------------------------------------------------------------ qual conta usar
step "Fixando a conta de destino"
count=$(printf '%s\n' "$accounts" | grep -c .)
if [ "$count" -eq 1 ]; then
  account_id=$accounts
  ok "uma unica conta alcancavel: $account_id"
else
  printf '  Esta credencial alcanca %s contas:\n\n' "$count"
  printf '%s\n' "$who" | grep -iE '[0-9a-f]{32}' | sed 's/^/    /'
  printf '\n  Cole o Account ID que deve receber o deploy: '
  read -r account_id
  account_id=$(lower "$(printf '%s' "$account_id" | tr -d '[:space:]')")
  printf '%s\n' "$accounts" | grep -qx "$account_id" \
    || die "'$account_id' nao esta entre as contas alcancaveis." "Rode o setup de novo e cole um dos IDs listados."
  ok "conta escolhida: $account_id"
fi

# ------------------------------------------------------------------ grava o .env
step "Gravando .env (ignorado pelo git)"
if [ -f .env ]; then
  cp .env ".env.bak.$(date +%Y%m%d%H%M%S)"
  warn ".env anterior salvo como .env.bak.*"
fi
umask 077
cat > .env <<ENVFILE
# Gerado por scripts/setup-local.sh em $(date -u '+%Y-%m-%d %H:%M UTC')
# Ignorado pelo git. A sessao OAuth vive em ~/.config/.wrangler, nao aqui.
CLOUDFLARE_ACCOUNT_ID=$account_id
CF_EXPECTED_ACCOUNT_ID=$account_id
CF_EXPECTED_EMAIL=${email:-$EXPECTED_EMAIL}
ENVFILE
chmod 600 .env
ok ".env gravado com permissao 600"

# ------------------------------------------------------------------ prova real
step "Rodando a guarda de ponta a ponta"
npm run --silent cf:verify

printf '%s%s' "$green" "$bold"
cat <<DONE

  Pronto. Conta de deploy travada.

    e-mail      ${email:-<nao exposto pelo whoami>}
    Account ID  $account_id

  A partir de agora 'npm run deploy' verifica isso antes de publicar
  e aborta se a conta mudar.
DONE
printf '%s\n' "$reset"
