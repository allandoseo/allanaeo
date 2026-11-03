# EscortsBoys

Plataforma de anúncios e descoberta de acompanhantes masculinos adultos (18+), organizada como um portal de classificados: busca por cidade e região, cards horizontais comparáveis, página de anúncio completa, favoritos, área do anunciante e moderação.

> Projeto independente dentro do repositório `allanaeo`. Não altera o site estático em `../public` nem o Worker da Cloudflare.

## Stack

| Camada | Escolha |
| --- | --- |
| Framework | Next.js 15 (App Router, Server Components, Server Actions) + React 19 + TypeScript estrito |
| Estilo | Tailwind CSS 3 com tokens da marca (`tailwind.config.ts`), fonte Inter auto-hospedada |
| Validação | Zod — os mesmos esquemas no cliente e no servidor (`src/lib/validation.ts`) |
| Dados | Interface única em `src/lib/repo.ts`. Adaptador **local** (JSON em `.data/`) para desenvolvimento; esquema **Supabase/PostgreSQL** com RLS em `supabase/migrations` para produção |
| Autenticação | Sessão própria no servidor: senha com scrypt, token aleatório em cookie `httpOnly` (hash SHA-256 no banco), papéis `user` / `advertiser` / `admin` |
| Testes | Vitest (unidade) + script Playwright de smoke E2E (`scripts/smoke.mjs`) |

## Como rodar

```bash
cd escortsboys
cp .env.example .env.local   # ajuste SITE_URL e, se quiser, ADMIN_PASSWORD
npm install
npm run dev                  # http://localhost:3000
```

No primeiro acesso o armazenamento local é criado em `.data/db.json` com cidades, modalidades, planos (sem preço) e 16 **anúncios de exemplo** — todos marcados como "Exemplo", sem verificação, sem disponibilidade declarada e com contatos desativados. As credenciais geradas para o admin e para um anunciante de exemplo ficam em `.data/credenciais-locais.txt` (nunca versionado). Para recomeçar do zero, apague a pasta `.data/`. Com `ADMIN_PASSWORD` definido, a conta admin é criada no carregamento do banco se ainda não existir (uma conta já existente com o mesmo e-mail nunca é promovida automaticamente). Em `NODE_ENV=production` o seed não cria usuários de teste.

| Comando | O que faz |
| --- | --- |
| `npm run dev` | servidor de desenvolvimento |
| `npm run build && npm start` | build e servidor de produção |
| `npm test` | testes unitários (busca, filtros, validações, disponibilidade, senhas) |
| `npm run typecheck` / `npm run lint` | TypeScript e ESLint |
| `npm run test:e2e` | smoke E2E com Playwright contra `BASE_URL` (padrão `http://localhost:3000`): rastreia links internos, checa console/HTTP/overflow, barreira 18+, proteção de rotas e o fluxo completo cadastro → perfil → anúncio com foto → moderação → anúncio público. Contra `npm start`, rode servidor e teste com o mesmo `ADMIN_PASSWORD` |

## Rotas

**Público:** `/` (busca + anúncios na primeira dobra) · `/anuncios` (filtros combinados, ordenação, paginação) · `/acompanhantes/[cidade]` e `/acompanhantes/[cidade]/[regiao]` (páginas indexáveis) · `/anuncio/[slug]` · `/perfil/[slug]` · `/favoritos` · `/anunciar` · `/sobre` `/contato` `/privacidade` `/termos` `/seguranca` `/diretrizes`

**Conta:** `/cadastro` · `/login` · `/recuperar-senha` → `/recuperar-senha/nova?token=`

**Anunciante (`/painel`, exige sessão):** visão geral, perfil, anúncios (pausar, reativar, excluir), assistente de 10 etapas em `/painel/anuncios/novo` e `/painel/anuncios/[id]/editar` (rascunho, validação por etapa, pré-visualização), fotos, disponibilidade, mensagens e contatos, estatísticas, assinatura, configurações (exportar dados, excluir conta).

**Administração (`/admin`, papel admin; outros papéis recebem 404):** visão geral, fila de moderação, anúncios, denúncias, verificações, usuários, mensagens, categorias, cidades, planos, configurações. Toda ação administrativa vai para o log de auditoria.

**API interna:** `/api/favoritos`, `/api/anuncios`, `/api/anuncios/[id]/view`, `/api/contato/[id]` (registra clique e redireciona para WhatsApp/Telegram; revela telefone sob demanda), `/api/upload`, `/media/[arquivo]`.

## Decisões de produto e segurança

- **Fundo de funil:** anúncios aparecem logo abaixo de uma faixa de busca compacta; nada exige login para consultar.
- **Nada inventado:** campos refletem só o que o anunciante cadastrou. Sem valor → "Consultar valores". Métricas do painel mostram "—" até haver dados reais. Planos sem preço mostram "Valor a definir".
- **Disponibilidade confiável:** "Disponível agora" expira em 4 h, "Disponível hoje" vale até o fim do dia (horário de Brasília); depois disso o anúncio mostra "Disponibilidade não informada" (`src/lib/availability.ts`).
- **Verificação:** o selo só aparece com `verification = verified`, definido por um admin. Perfis de exemplo não podem ser verificados.
- **Privacidade:** contatos não vão para o HTML; endereço exato não existe no modelo de dados; texto livre bloqueia telefone, e-mail e links; exportação e exclusão de conta (LGPD) no painel.
- **Conteúdo:** barreira 18+ (cookie `eb_age`), declaração de maioridade e aceite de termos no cadastro, idade mínima 18 validada no cliente, no servidor e no banco, autorização de imagem obrigatória, moderação antes da publicação, denúncia em todo anúncio com prioridade para "possível menor".
- **SEO:** title, description e canonical por página; Open Graph; `sitemap.xml` e `robots.txt` dinâmicos; JSON-LD (WebSite + SearchAction, BreadcrumbList); páginas de cidade e região só são indexáveis acima de `minAdsForIndex` anúncios e sem filtros; combinações de filtros e anúncios de exemplo recebem `noindex`.

## Produção: o que depende de serviços externos

1. **Banco e storage (Supabase):** aplicar `supabase/migrations/0001_schema.sql` e `supabase/seed.sql`, configurar `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` (somente no servidor) e implementar o adaptador Supabase das funções de `src/lib/repo.ts`. O adaptador local é de processo único e serve para desenvolvimento e demonstração.
2. **E-mail transacional:** `RESEND_API_KEY` + `EMAIL_FROM` para recuperação de senha. Sem isso, em desenvolvimento o link aparece na tela e no log.
3. **Pagamentos dos planos:** gateway a definir (Pagar.me, Mercado Pago, Stripe…), respeitando as políticas de conteúdo adulto de cada provedor. Hoje o botão de plano abre o formulário de contato.
4. **Verificação de identidade:** fluxo manual (documentos no bucket privado `verification-docs`) ou provedor de KYC.
5. **Hospedagem:** um runtime Node com sistema de arquivos persistente (se usar o adaptador local) ou qualquer plataforma Next.js com Supabase. Confira se os termos do provedor permitem conteúdo adulto.
6. **Limitador de requisições:** hoje fica em memória; com várias instâncias, use Redis/Upstash.
