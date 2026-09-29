# allanaeo

## Deploy Cloudflare: travando a conta de destino

Este projeto convive com mais de uma conta Cloudflare no mesmo navegador. Um
deploy publicado na conta errada é fácil de não perceber e chato de reverter,
então o deploy passa obrigatoriamente por uma guarda que confere a conta antes
de publicar qualquer coisa.

```bash
npm run setup:local   # uma vez, na sua máquina: login + trava da conta
npm run cf:verify     # confere a conta, sem publicar nada
npm run deploy        # roda cf:verify antes e só então publica
```

`predeploy` é um hook do npm: se a guarda falhar, `wrangler deploy` não executa.

---

### Caminho 1 — sua máquina (recomendado)

```bash
git clone https://github.com/allandoseo/allanaeo.git
cd allanaeo
npm run setup:local
```

O script faz logout de qualquer sessão anterior, abre o navegador para o login,
lê o `wrangler whoami`, **recusa se o e-mail não for o esperado**, grava o
`.env` com a conta escolhida e roda a guarda de ponta a ponta para provar que
funciona.

### Caminho 2 — CI ou container na nuvem

`wrangler login` **não funciona** sem navegador: o fluxo OAuth exige um callback
em `http://localhost:8976/oauth/callback`, e num container esse `localhost` é o
próprio container, inacessível do seu navegador. O login trava e o `whoami`
nunca autentica. Use um API Token.

Em *My Profile → API Tokens → Create Custom Token*, preencha:

| Campo | Valor |
| --- | --- |
| **Token name** | `allanaeo-deploy` |
| **Permissions** | `Account` · `Workers Scripts` · **Edit** |
| | `Account` · `Account Settings` · **Read** |
| | `User` · `User Details` · **Read** |
| | `Zone` · `Workers Routes` · **Edit** *(só se usar domínio próprio)* |
| **Account Resources** | `Include` · **a conta específica** — nunca *All accounts* |
| **Client IP Filtering** | vazio |
| **TTL** | opcional |

Duas escolhas acima não são detalhe:

- **`User → User Details → Read`** é o que faz o `whoami` imprimir o e-mail.
  Sem esse escopo a saída mostra só nome e ID da conta, e a checagem de e-mail
  da guarda não tem o que comparar.
- **`Account Resources` numa conta específica** é a trava na origem: um token
  em *All accounts* consegue publicar em qualquer conta sua, que é exatamente o
  acidente que este repositório tenta evitar.

Depois defina no ambiente: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`,
`CF_EXPECTED_ACCOUNT_ID` e `CF_EXPECTED_EMAIL`. O token é **segredo**: nunca vai
para o git, para um chat ou para um log.

---

### O que a guarda checa

Cada item aborta com exit 1:

- **Sem credencial ativa** — nem sessão OAuth nem `CLOUDFLARE_API_TOKEN` válido.
- **Conta esperada indefinida** — sem `CF_EXPECTED_ACCOUNT_ID` nem `account_id`
  no `wrangler.toml` não há o que verificar, então recusa (*fail-closed*).
- **Credencial de outra conta** — a conta esperada não está entre as alcançáveis.
- **Conta não fixada** — a credencial alcança várias contas e nenhuma foi
  fixada; sem isso o wrangler pode escolher a errada.
- **Fixada na conta errada** — `CLOUDFLARE_ACCOUNT_ID` diverge da esperada.
- **Usuário errado** — o e-mail do `whoami` não bate com `CF_EXPECTED_EMAIL`.

A guarda aceita sessão OAuth e API token indistintamente: o `wrangler whoami` é
a fonte da verdade. Configuração vem do ambiente ou do `.env` da raiz, com o
ambiente tendo prioridade. Se o `wrangler.toml` já traz `account_id`, ele é lido
como conta esperada e `CF_EXPECTED_ACCOUNT_ID` vira opcional.

> ⚠️ Nunca use `wrangler deploy --temporary` como atalho para a falta de login:
> ele publica numa **conta de preview aleatória e descartável**, o oposto do que
> esta guarda existe para garantir.
