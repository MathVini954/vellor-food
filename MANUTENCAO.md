# Manutencao do Projeto

## Visao geral

Este repositorio hoje tem 3 camadas principais:

1. `src/` na raiz: painel gerencial do restaurante em React + Vite.
2. `public-app/`: app publico mobile-first em Next.js, com backend proprio em `src/app/api` e banco via Prisma/Postgres.
3. `public-app/src/app/dev/owner/`: painel dev-only do dono do SaaS para gerenciar restaurantes.

O nome do script `dev:mobile` pode induzir a erro: ele nao sobe um app nativo Android/iOS. Ele sobe o `public-app`, que e um app web responsivo focado em mobile.

## Estrutura atual

### Raiz do projeto

- `src/`
  Painel gerencial web.
- `public-app/`
  App publico do restaurante e backend principal do sistema.
- `scripts/`
  Scripts auxiliares da raiz. Hoje existe `start-mobile-dev.ps1`, que entra em `public-app`, sobe o banco local e inicia o Next.
- `dist/`
  Build gerado do painel Vite. Nao deve ser tratado como codigo-fonte.
- `node_modules/`
  Dependencias da raiz.

### Painel gerencial da raiz (`src/`)

- `src/App.tsx`
  Entrada principal do painel. Controla login, sessao, rotas internas do admin e sincronizacao com a API.
- `src/layouts/`
  Paginas/telas do painel gerencial.
- `src/components/`
  Componentes reutilizaveis do painel.
- `src/services/adminApi.ts`
  Cliente HTTP do painel. Consome a API administrativa do `public-app` em `http://localhost:3000/api/admin`.
- `src/types/`
  Tipagens do dashboard/admin.
- `src/data/mockData.ts`
  Dados mockados. Hoje parece legado ou apoio local, porque o fluxo principal ja usa API real.
- `src/lib/`
  Utilitarios locais do painel.

### Public app (`public-app/`)

- `public-app/src/app/`
  App Router do Next.js. Aqui vivem as paginas publicas e as rotas de API.
- `public-app/src/app/dev/owner/`
  Painel privado do dono do SaaS para criar e controlar restaurantes.
- `public-app/src/app/r/[slug]/`
  Rotas publicas do restaurante, mobile-first.
- `public-app/src/app/api/`
  Backend HTTP do projeto.
- `public-app/src/components/public/`
  Componentes do app publico.
- `public-app/src/services/public/`
  Servicos server-side para leitura de restaurante, menu, pedidos e confirmacao.
- `public-app/src/services/admin/`
  Servicos server-side usados pela API administrativa.
- `public-app/src/lib/`
  Prisma, formatacao, sessao, entrega, validacao, WhatsApp e geocoding.
- `public-app/prisma/`
  Schema, migrations e seed do banco.
- `public-app/public/`
  Assets estaticos do Next.
- `public-app/scripts/`
  Scripts locais do ambiente do `public-app`, incluindo postgres local.

## Onde estao as paginas

### Paginas do app gerencial

Ficam em `src/layouts/`:

- `LoginPage.tsx`
- `CreateRestaurantPage.tsx`
- `HomeDashboardPage.tsx`
- `OrdersManagementPage.tsx`
- `MenuManagementPage.tsx`
- `OffersManagementPage.tsx`
- `CustomersManagementPage.tsx`
- `SettingsPage.tsx`

As rotas internas do gerencial sao controladas em `src/App.tsx`:

- `/`
  Login
- `/criar-restaurante`
  Cadastro de restaurante
- `/admin/dashboard`
  Dashboard
- `/admin/pedidos`
  Pedidos
- `/admin/cardapio`
  Cardapio
- `/admin/ofertas`
  Ofertas
- `/admin/clientes`
  Clientes
- `/admin/configuracoes`
  Configuracoes

### Paginas do app mobile/publico

Ficam em `public-app/src/app/r/[slug]/`:

- `page.tsx`
  Home do restaurante
- `menu/page.tsx`
  Lista de categorias
- `menu/[categoryId]/page.tsx`
  Produtos da categoria
- `produto/[productId]/page.tsx`
  Detalhe do produto
- `identificacao/page.tsx`
  Identificacao do cliente
- `checkout/page.tsx`
  Checkout
- `meus-pedidos/page.tsx`
  Historico do cliente
- `pedido/[orderId]/confirmacao/page.tsx`
  Confirmacao do pedido

### Pagina do dono do SaaS

Fica em `public-app/src/app/dev/owner/page.tsx`:

- `/dev/owner?token=...`
  Console dev-only para criar restaurante, alterar status de contrato e excluir tenant

### O arquivo aberto agora

`public-app/src/app/r/[slug]/pedido/[orderId]/confirmacao/page.tsx`

Essa pagina:

- recebe `slug` e `orderId` da rota;
- busca o pedido com `getOrderConfirmationById`;
- mostra estado de erro se o pedido nao existir;
- monta o resumo do pedido;
- gera link de confirmacao via WhatsApp com `buildWhatsAppUrl`;
- oferece navegacao para acompanhar pedidos ou voltar ao cardapio.

## Onde esta o backend

### Backend do gerencial

O painel da raiz nao tem backend proprio.

Ele usa o backend do `public-app` via `src/services/adminApi.ts`, apontando para:

- `http://localhost:3000/api/admin`

As rotas administrativas reais ficam em:

- `public-app/src/app/api/admin/auth/login/route.ts`
- `public-app/src/app/api/admin/auth/register/route.ts`
- `public-app/src/app/api/admin/restaurants/[slug]/bootstrap/route.ts`
- `public-app/src/app/api/admin/restaurants/[slug]/products/...`
- `public-app/src/app/api/admin/restaurants/[slug]/offers/...`
- `public-app/src/app/api/admin/restaurants/[slug]/orders/[orderId]/status/route.ts`
- `public-app/src/app/api/admin/restaurants/[slug]/customers/[customerId]/block/route.ts`
- `public-app/src/app/api/admin/restaurants/[slug]/settings/...`

Regra pratica:

- frontend do gerencial: `src/`
- backend do gerencial: `public-app/src/app/api/admin/`

### Backend do mobile/publico

As rotas publicas de API ficam em:

- `public-app/src/app/api/public/restaurants/[slug]/identify/route.ts`
- `public-app/src/app/api/public/restaurants/[slug]/guest/route.ts`
- `public-app/src/app/api/public/restaurants/[slug]/delivery-quote/route.ts`
- `public-app/src/app/api/public/restaurants/[slug]/location-from-pin/route.ts`
- `public-app/src/app/api/public/restaurants/[slug]/orders/route.ts`

Regra pratica:

- frontend mobile/publico: `public-app/src/app/r/[slug]/`
- backend mobile/publico: `public-app/src/app/api/public/`

### Banco de dados

O banco esta centralizado no `public-app`:

- schema: `public-app/prisma/schema.prisma`
- client Prisma: `public-app/src/lib/prisma.ts`
- seed: `public-app/prisma/seed.cjs`
- historico de migrations: `public-app/prisma/migrations/README.md`

O banco atende tanto o app publico quanto o painel gerencial.

## Camada SaaS nova

Agora existe uma camada de controle acima do admin do restaurante:

- tela: `public-app/src/app/dev/owner/page.tsx`
- actions: `public-app/src/app/dev/owner/actions.ts`
- servicos: `public-app/src/services/platform/owner-dashboard.ts`
- controle de acesso: `public-app/src/lib/dev-owner.ts`
- contrato/status do restaurante: tabela `RestaurantContract`

Com isso, o restaurante:

- deixa de nascer pelo cadastro publico;
- pode ser ativado, inativado, suspenso ou cancelado pelo dono do SaaS;
- perde acesso ao painel admin se o contrato nao estiver ativo.

## O que funciona em cada pasta

### `src/`

Funciona como SPA administrativa. Faz login, carrega bootstrap do restaurante, exibe pedidos, produtos, ofertas, clientes e configuracoes.

### `public-app/src/app/r/`

Funciona como canal de vendas do restaurante. E o app web voltado ao cliente final.

### `public-app/src/app/api/`

Funciona como backend HTTP do sistema. Centraliza CRUD administrativo e fluxo publico de pedido.

### `public-app/src/services/public/`

Funciona como camada de consulta do lado servidor para o storefront publico.

### `public-app/src/services/admin/`

Funciona como camada de montagem de payload do admin. Exemplo: `getAdminBootstrap`.

### `public-app/prisma/`

Funciona como fonte de verdade do modelo de dados e migracoes.

### `scripts/` e `public-app/scripts/`

Funcionam como automacao local de desenvolvimento.

## Revisao de organizacao

Hoje a arquitetura funcional faz sentido, mas a organizacao do monorepo ainda esta confusa porque:

1. O painel admin fica na raiz, enquanto o backend dele fica dentro de `public-app`.
2. O nome `public-app` nao deixa claro que ele tambem contem o backend central.
3. O script `dev:mobile` sugere app nativo, mas na pratica sobe o Next web mobile-first.
4. Existem tipos e utilitarios parecidos nos dois apps, o que aumenta risco de duplicacao.
5. `dist/` esta no mesmo nivel do codigo-fonte e polui a leitura estrutural.
6. o historico de migrations foi corrigido, mas ficou com um no-op mantido por compatibilidade.

## Estrutura recomendada

Sem mover nada agora, a organizacao conceitual recomendada e:

```text
meu-ifood/
  apps/
    admin-web/        -> app atual da raiz (`src/`)
    storefront-web/   -> app atual `public-app/`
  packages/
    shared-types/     -> tipos compartilhados
    shared-utils/     -> formatacao/validacao compartilhada
  docs/
    arquitetura.md
    manutencao.md
  scripts/
```

## Ajustes recomendados sem quebrar o projeto

1. Renomear a documentacao e scripts para deixar claro:
   `mobile` = web mobile-first, nao app nativo.
2. Criar uma pasta `docs/` e manter este arquivo la no futuro.
3. Parar de versionar `dist/` se ele estiver indo para o git.
4. Consolidar tipos duplicados entre `src/types` e `public-app/src/types`.
5. Definir nomes consistentes:
   `admin`, `public`, `api`, `shared`.
6. Se o projeto crescer, migrar para workspace real com `apps/` e `packages/`.

## Resumo objetivo

- App gerencial: `src/`
- Paginas do gerencial: `src/layouts/`
- Backend do gerencial: `public-app/src/app/api/admin/`
- App mobile/publico: `public-app/src/app/r/[slug]/`
- Backend do mobile/publico: `public-app/src/app/api/public/`
- Painel do dono do SaaS: `public-app/src/app/dev/owner/`
- Banco dos dois: `public-app/prisma/`
