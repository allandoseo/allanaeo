#!/usr/bin/env bash
#
# Guarda de conta Cloudflare.
#
# Aborta antes de qualquer deploy se a credencial ativa nao pertencer a conta
# esperada, ou se a conta nao estiver fixada (risco de publicar numa conta
# vizinha). Aceita as duas formas de credencial:
#
#   * sessao OAuth   -> `wrangler login`, tipico na maquina do dev
#   * API token      -> CLOUDFLARE_API_TOKEN, tipico em CI / container
#
# Configuracao (variaveis de ambiente, ou arquivo .env na raiz):
#   CLOUDFLARE_ACCOUNT_ID    conta que o wrangler deve usar        (recomendado)
#   CF_EXPECTED_ACCOUNT_ID   conta esperada  (ou account_id no wrangler.toml)
#   CF_EXPECTED_EMAIL        e-mail esperado                        (opcional)
#   CLOUDFLARE_API_TOKEN     credencial, quando nao houver sessao OAuth
#
set -euo pipefail

red=$'\033[31m'; green=$'\033[32m'; yellow=$'\033[33m'; bold=$'\033[1m'
dim=$'\033[2m'; reset=$'\033[0m'

die() {
  printf '\n%s✖ %s%s\n' "$red" "$1" "$reset" >&2
  shift
  for line in "$@"; do printf '  %s\n' "$line" >&2; done
  printf '\n' >&2
  exit 1
}
ok()   { printf '%s✔%s %s\n' "$green" "$reset" "$1"; }
warn() { printf '%s▲%s %s\n' "$yellow" "$reset" "$1"; }

strip_ansi() { sed -E $'s/\033\\[[0-9;]*[A-Za-z]//g'; }
lower() { printf '%s' "${1:-}" | tr '[:upper:]' '[:lower:]'; }

# --------------------------------------------------------------- .env opcional
# Variaveis ja exportadas no ambiente tem prioridade sobre o arquivo.
if [ -f .env ]; then
  while IFS='=' read -r key val || [ -n "$key" ]; do
    key=${key#export }
    key=$(printf '%s' "$key" | tr -d '[:space:]')
    case "$key" in
      CLOUDFLARE_API_TOKEN|CLOUDFLARE_ACCOUNT_ID|CF_EXPECTED_ACCOUNT_ID|CF_EXPECTED_EMAIL) ;;
      *) continue ;;
    esac
    val=${val%$'\r'}; val=${val%\"}; val=${val#\"}; val=${val%\'}; val=${val#\'}
    [ -n "${!key:-}" ] || export "$key=$val"
  done < .env
fi

# ------------------------------------------------------------------- o wrangler
if [ -z "${WRANGLER_CMD:-}" ]; then
  if [ -x node_modules/.bin/wrangler ]; then
    WRANGLER_CMD="node_modules/.bin/wrangler"
  else
    WRANGLER_CMD="npx --yes wrangler"
  fi
fi

# -------------------------------------------------------------- conta esperada
expected_id="${CF_EXPECTED_ACCOUNT_ID:-${1:-}}"
if [ -z "$expected_id" ]; then
  for cfg in wrangler.toml wrangler.jsonc wrangler.json; do
    [ -f "$cfg" ] || continue
    expected_id=$(grep -oE '"?account_id"?[[:space:]]*[:=][[:space:]]*"[0-9a-fA-F]{32}"' "$cfg" \
                  | grep -oiE '[0-9a-f]{32}' | head -1 || true)
    [ -n "$expected_id" ] && { printf '%s  conta esperada lida de %s%s\n' "$dim" "$cfg" "$reset"; break; }
  done
fi
[ -n "$expected_id" ] || die "Nao sei qual conta esperar, entao nao posso garantir nada." \
  "Rode 'npm run setup:local' para configurar isso automaticamente," \
  "ou defina CF_EXPECTED_ACCOUNT_ID, ou fixe account_id no wrangler.toml." \
  "O Account ID aparece no painel da Cloudflare (Workers & Pages -> lateral direita)."
expected_id=$(lower "$expected_id")

# ------------------------------------------------------------------- quem somos
# O whoami e a fonte da verdade: cobre sessao OAuth e API token de uma vez.
printf '%s  consultando wrangler whoami...%s\n' "$dim" "$reset"
whoami_out=$($WRANGLER_CMD whoami 2>&1 | strip_ansi || true)

if printf '%s' "$whoami_out" | grep -qiE 'not authenticated|please run .?wrangler login'; then
  die "Nenhuma credencial Cloudflare ativa." \
    "Na sua maquina:  npm run setup:local   (abre o navegador e faz login)" \
    "Em CI/container: defina CLOUDFLARE_API_TOKEN, gerado DENTRO da conta de destino" \
    "                 (My Profile -> API Tokens -> 'Edit Cloudflare Workers')." \
    "Se voce ja logou, o token pode estar expirado, revogado, ou colado com espacos."
fi

if [ -n "${CLOUDFLARE_API_TOKEN:-}" ]; then
  kind="API token"
elif printf '%s' "$whoami_out" | grep -qi 'oauth'; then
  kind="sessao OAuth"
else
  kind="credencial reconhecida pelo wrangler"
fi
printf '%s  usando %s%s\n' "$dim" "$kind" "$reset"

reachable=$(printf '%s\n' "$whoami_out" | grep -oiE '\b[0-9a-f]{32}\b' | tr '[:upper:]' '[:lower:]' | sort -u)
[ -n "$reachable" ] || die "Nao consegui extrair nenhum Account ID do whoami." \
  "Saida recebida:" "$whoami_out"

# ------------------------------------------- a conta esperada esta no alcance?
if ! printf '%s\n' "$reachable" | grep -qx "$expected_id"; then
  die "A credencial NAO alcanca a conta esperada. Deploy abortado." \
    "esperada:  $expected_id" \
    "alcancada: $(printf '%s' "$reachable" | tr '\n' ' ')" \
    "Esta credencial pertence a outra conta Cloudflare. Faca 'wrangler logout' e" \
    "logue na conta correta, ou substitua CLOUDFLARE_API_TOKEN por um token gerado nela."
fi
ok "credencial alcanca a conta esperada ($expected_id)"

# -------------------------------------------------------- a conta esta fixada?
pinned=$(lower "${CLOUDFLARE_ACCOUNT_ID:-}")
if [ -n "$pinned" ]; then
  [ "$pinned" = "$expected_id" ] || die "CLOUDFLARE_ACCOUNT_ID aponta para a conta ERRADA. Deploy abortado." \
    "CLOUDFLARE_ACCOUNT_ID: $pinned" \
    "esperada:              $expected_id"
  ok "CLOUDFLARE_ACCOUNT_ID fixado na conta correta"
else
  count=$(printf '%s\n' "$reachable" | grep -c . || true)
  if [ "$count" -gt 1 ]; then
    die "A credencial alcanca $count contas e nenhuma esta fixada. Deploy abortado." \
      "Sem fixacao o wrangler pode publicar na conta errada." \
      "Defina CLOUDFLARE_ACCOUNT_ID=$expected_id no ambiente ou no .env."
  fi
  warn "CLOUDFLARE_ACCOUNT_ID nao definido (a credencial so alcanca 1 conta, mas fixe-o de todo modo)"
fi

# ---------------------------------------------------------- e-mail (opcional)
found_email=$(printf '%s\n' "$whoami_out" \
  | grep -oiE '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}' | head -1 || true)

if [ -n "${CF_EXPECTED_EMAIL:-}" ]; then
  if [ -z "$found_email" ]; then
    warn "whoami nao revelou e-mail: adicione o escopo 'User -> User Details: Read' ao token para checar isso tambem"
  else
    got=$(lower "$found_email"); want=$(lower "$CF_EXPECTED_EMAIL")
    [ "$got" = "$want" ] || die "A credencial pertence a outro usuario Cloudflare. Deploy abortado." \
      "esperado:   $want" "encontrado: $got"
    ok "e-mail confere ($got)"
  fi
elif [ -n "$found_email" ]; then
  printf '%s  e-mail da credencial: %s%s\n' "$dim" "$found_email" "$reset"
fi

printf '\n%s%sConta Cloudflare verificada. Liberado para deploy.%s\n\n' "$green" "$bold" "$reset"
