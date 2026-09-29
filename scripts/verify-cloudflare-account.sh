#!/usr/bin/env bash
#
# Guarda de conta Cloudflare.
#
# Aborta antes de qualquer deploy se a credencial ativa nao pertencer
# a conta esperada, ou se a conta nao estiver fixada (risco de o wrangler
# publicar numa conta vizinha).
#
# Configuracao (variaveis de ambiente):
#   CLOUDFLARE_API_TOKEN     token gerado DENTRO da conta de destino  (obrigatorio)
#   CLOUDFLARE_ACCOUNT_ID    conta que o wrangler deve usar           (recomendado)
#   CF_EXPECTED_ACCOUNT_ID   conta esperada pela guarda               (obrigatorio, ou account_id no wrangler.toml)
#   CF_EXPECTED_EMAIL        e-mail esperado                          (opcional, exige escopo User Details:Read)
#
set -euo pipefail

WRANGLER_CMD="${WRANGLER_CMD:-npx --yes wrangler}"

red=$'\033[31m'; green=$'\033[32m'; yellow=$'\033[33m'; dim=$'\033[2m'; reset=$'\033[0m'

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

# ---------------------------------------------------------------- conta esperada
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
  "Defina CF_EXPECTED_ACCOUNT_ID no ambiente, ou fixe account_id no wrangler.toml." \
  "O Account ID aparece no painel da Cloudflare (Workers & Pages -> lateral direita)."
expected_id=$(printf '%s' "$expected_id" | tr '[:upper:]' '[:lower:]')

# ---------------------------------------------------------------- credencial
if [ -z "${CLOUDFLARE_API_TOKEN:-}" ] && [ -z "${CLOUDFLARE_API_KEY:-}" ]; then
  die "Nenhuma credencial Cloudflare no ambiente." \
    "Gere um token em My Profile -> API Tokens (template 'Edit Cloudflare Workers')" \
    "estando logado na conta de destino, e salve-o como CLOUDFLARE_API_TOKEN nas" \
    "variaveis do ambiente. Nunca cole o token em chat, commit ou log."
fi

# ---------------------------------------------------------------- quem somos
printf '%s  consultando wrangler whoami...%s\n' "$dim" "$reset"
whoami_out=$($WRANGLER_CMD whoami 2>&1 | strip_ansi || true)

if printf '%s' "$whoami_out" | grep -qi 'not authenticated'; then
  die "O wrangler nao reconheceu a credencial." \
    "O token pode estar expirado, revogado ou colado com espacos/quebras de linha." \
    "Saida do whoami:" "$whoami_out"
fi

reachable=$(printf '%s\n' "$whoami_out" | grep -oiE '\b[0-9a-f]{32}\b' | tr '[:upper:]' '[:lower:]' | sort -u)
[ -n "$reachable" ] || die "Nao consegui extrair nenhum Account ID do whoami." \
  "Saida recebida:" "$whoami_out"

# ---------------------------------------------------------------- a conta esperada esta no alcance?
if ! printf '%s\n' "$reachable" | grep -qx "$expected_id"; then
  die "O token NAO alcanca a conta esperada. Deploy abortado." \
    "esperada:  $expected_id" \
    "alcancada: $(printf '%s' "$reachable" | tr '\n' ' ')" \
    "Este token foi gerado em outra conta Cloudflare. Gere um novo estando logado" \
    "na conta correta e substitua CLOUDFLARE_API_TOKEN no ambiente."
fi
ok "token alcanca a conta esperada ($expected_id)"

# ---------------------------------------------------------------- a conta esta fixada?
pinned="${CLOUDFLARE_ACCOUNT_ID:-}"
pinned=$(printf '%s' "$pinned" | tr '[:upper:]' '[:lower:]')
if [ -n "$pinned" ]; then
  [ "$pinned" = "$expected_id" ] || die "CLOUDFLARE_ACCOUNT_ID aponta para a conta ERRADA. Deploy abortado." \
    "CLOUDFLARE_ACCOUNT_ID: $pinned" \
    "esperada:              $expected_id"
  ok "CLOUDFLARE_ACCOUNT_ID fixado na conta correta"
else
  count=$(printf '%s\n' "$reachable" | grep -c . || true)
  if [ "$count" -gt 1 ]; then
    die "O token alcanca $count contas e nenhuma esta fixada. Deploy abortado." \
      "Sem fixacao o wrangler pode publicar na conta errada." \
      "Defina CLOUDFLARE_ACCOUNT_ID=$expected_id no ambiente, ou account_id no wrangler.toml."
  fi
  warn "CLOUDFLARE_ACCOUNT_ID nao definido (o token so alcanca 1 conta, mas fixe-o de todo modo)"
fi

# ---------------------------------------------------------------- e-mail (opcional)
found_email=$(printf '%s\n' "$whoami_out" \
  | grep -oiE '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}' | head -1 || true)

if [ -n "${CF_EXPECTED_EMAIL:-}" ]; then
  if [ -z "$found_email" ]; then
    warn "whoami nao revelou e-mail: adicione o escopo 'User -> User Details: Read' ao token para checar isso tambem"
  else
    lhs=$(printf '%s' "$found_email" | tr '[:upper:]' '[:lower:]')
    rhs=$(printf '%s' "$CF_EXPECTED_EMAIL" | tr '[:upper:]' '[:lower:]')
    [ "$lhs" = "$rhs" ] || die "A credencial pertence a outro usuario Cloudflare. Deploy abortado." \
      "esperado: $rhs" "encontrado: $lhs"
    ok "e-mail confere ($lhs)"
  fi
fi

printf '\n%sConta Cloudflare verificada. Liberado para deploy.%s\n\n' "$green" "$reset"
