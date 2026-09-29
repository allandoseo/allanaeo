# allanaeo

## Deploy Cloudflare: travando a conta de destino

Este repositório usa mais de uma conta Cloudflare no mesmo navegador. Um deploy
publicado na conta errada é difícil de perceber e chato de reverter, então o
deploy passa obrigatoriamente por uma guarda que verifica a conta antes de
qualquer publicação.

### Por que não usamos `wrangler login`

`wrangler login` é um fluxo OAuth que exige um navegador na mesma máquina e um
callback em `http://localhost:8976/oauth/callback`. Em sessões de CI ou em
containers na nuvem esse `localhost` é o próprio container, inacessível do seu
navegador — o login trava indefinidamente e o `whoami` nunca autentica.

Em vez disso usamos **API Token**, que é mais seguro para este objetivo: o token
nasce dentro de uma conta específica e não tem como escorregar para outra.

### Configuração

1. Faça login na Cloudflare **com a conta de destino**.
2. Vá em *My Profile → API Tokens → Create Token*, template
   **Edit Cloudflare Workers**.
3. Adicione também o escopo **User → User Details: Read** — é isso que permite à
   guarda conferir o e-mail dono da credencial.
4. Copie o Account ID em *Workers & Pages* (barra lateral direita).
5. Defina as variáveis:

   | Variável                 | Papel                                             |
   | ------------------------ | ------------------------------------------------- |
   | `CLOUDFLARE_API_TOKEN`   | credencial (**segredo**)                          |
   | `CLOUDFLARE_ACCOUNT_ID`  | conta que o wrangler usa — a trava real           |
   | `CF_EXPECTED_ACCOUNT_ID` | conta que a guarda espera                         |
   | `CF_EXPECTED_EMAIL`      | opcional: e-mail dono da credencial               |

   Localmente, copie `.env.example` para `.env`. Em sessões na nuvem, use as
   variáveis de ambiente da sessão. **Nunca** comite o token nem cole em chat.

### Uso

```bash
npm run cf:verify   # verifica a conta, sem publicar nada
npm run deploy      # roda cf:verify via predeploy e só então publica
```

`predeploy` é um hook do npm: se a guarda falhar, `wrangler deploy` não executa.

### O que a guarda checa

Cada item aborta o deploy com exit 1:

- **Credencial ausente** — nenhum `CLOUDFLARE_API_TOKEN` no ambiente.
- **Conta esperada indefinida** — sem `CF_EXPECTED_ACCOUNT_ID` nem `account_id`
  no `wrangler.toml` não há o que verificar, então recusa (*fail-closed*).
- **Credencial inválida** — o wrangler não autenticou (token expirado, revogado,
  ou colado com espaços/quebras de linha).
- **Token de outra conta** — a conta esperada não está entre as que o token
  alcança.
- **Conta não fixada** — o token alcança várias contas e nenhuma foi fixada; sem
  isso o wrangler pode escolher a errada.
- **Fixada na conta errada** — `CLOUDFLARE_ACCOUNT_ID` divergente da esperada.
- **Usuário errado** — o e-mail do `whoami` não bate com `CF_EXPECTED_EMAIL`.

Se `wrangler.toml` já traz `account_id`, a guarda o lê como conta esperada e
`CF_EXPECTED_ACCOUNT_ID` se torna opcional.

> ⚠️ Nunca use `wrangler deploy --temporary` como atalho para a falta de login:
> ele publica numa **conta de preview aleatória e descartável**, o oposto do que
> esta guarda existe para garantir.
