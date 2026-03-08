# Arquitetura Vellor

## Objetivo

A Vellor deve ser uma plataforma com:

1. painel do dono da plataforma
2. painel do cliente, que ja entra no produto certo
3. app publico do cliente, quando o produto tiver frente publica

O Food e apenas um dos produtos da Vellor. Outros SaaS terao codigo proprio, deploy proprio e regra propria, mas todos serao administrados pelo mesmo painel do dono.

---

## Estrutura de acesso

### 1. Dono da plataforma

Dominio:

- `owner.vellor.com`

Uso:

- criar empresas
- ativar/inativar contrato
- ativar produtos por empresa
- acompanhar onboarding
- suspender acesso
- excluir empresa
- ver auditoria

### 2. Painel do cliente

Dominio:

- `admin.vellor.com`

Uso:

- o cliente faz login uma vez
- o sistema descobre a empresa dele
- o sistema descobre qual produto ele tem ativo
- o sistema redireciona direto para o produto correto

Exemplo:

- empresa contratou apenas Food
- login em `admin.vellor.com`
- redirecionamento automatico para o admin do Food

### 3. App publico do cliente

Dominio inicial:

- `app.vellor.com`

Exemplo no Food:

- `app.vellor.com/r/bistro-da-esquina`

Evolucao futura opcional:

- `bistro-da-esquina.app.vellor.com`
- dominio proprio do cliente

---

## Separacao correta dos sistemas

### A. Owner Console

Projeto separado.

Responsavel por:

- empresas
- produtos contratados
- contratos
- billing
- suporte
- logs
- auditoria

Esse painel nao deve ficar dentro do app publico do Food no longo prazo.

### B. Platform Core

Servico central da plataforma.

Responsavel por:

- autenticacao da plataforma
- empresas
- usuarios da plataforma
- contratos
- quais produtos cada empresa possui
- provisionamento dos produtos

### C. SaaS Food

Produto separado da plataforma.

Responsavel por:

- operacao do restaurante
- cardapio
- pedidos
- clientes
- configuracoes do Food

---

## Modelo de dados da plataforma

Essas tabelas devem existir no core da Vellor.

### `Company`

Representa a empresa cliente da Vellor.

Campos principais:

- `id`
- `name`
- `slug`
- `document`
- `status`
- `createdAt`
- `updatedAt`

### `PlatformUser`

Usuarios da plataforma.

Campos principais:

- `id`
- `name`
- `email`
- `passwordHash`
- `role`
- `isActive`

Roles esperados:

- `OWNER`
- `COMPANY_ADMIN`
- `COMPANY_OPERATOR`

### `CompanyUser`

Liga usuario a empresa.

Campos principais:

- `id`
- `companyId`
- `platformUserId`
- `role`

### `SaaSProduct`

Catalogo de produtos da Vellor.

Exemplos:

- `FOOD`
- `CRM`
- `AGENDA`
- `CATALOGO`

Campos principais:

- `id`
- `code`
- `name`
- `status`

### `CompanyProductAccess`

Define quais produtos a empresa contratou.

Campos principais:

- `id`
- `companyId`
- `productId`
- `status`
- `startsAt`
- `endsAt`
- `planName`

### `Subscription`

Informacao comercial/contratual.

Campos principais:

- `id`
- `companyId`
- `productId`
- `status`
- `billingCycle`
- `price`
- `startedAt`
- `endsAt`
- `canceledAt`

### `ProvisioningJob`

Controla a criacao tecnica da empresa em cada produto.

Campos principais:

- `id`
- `companyId`
- `productId`
- `status`
- `payload`
- `errorMessage`
- `createdAt`

### `AuditLog`

Rastro de seguranca e operacao.

Campos principais:

- `id`
- `actorUserId`
- `companyId`
- `productId`
- `action`
- `metadata`
- `createdAt`

---

## Modelo de dados do Food

No Food, a empresa nao deve ser mais a entidade raiz global da plataforma.

O correto e:

- a empresa existe no Platform Core
- o Food guarda apenas a parte especifica dele

### Estrutura sugerida

#### `FoodTenant`

Liga a empresa da plataforma ao produto Food.

Campos:

- `id`
- `companyId`
- `companyProductAccessId`
- `status`

#### `FoodRestaurantProfile`

Dados operacionais do restaurante dentro do produto Food.

Campos:

- `id`
- `foodTenantId`
- `displayName`
- `slug`
- `whatsapp`
- `address`
- `city`
- `state`
- `branding`

#### Tabelas operacionais do Food

- `FoodCategory`
- `FoodProduct`
- `FoodCustomer`
- `FoodOrder`
- `FoodOrderItem`
- `FoodOffer`
- `FoodDeliveryArea`

Resumo:

- `Company` = entidade da plataforma
- `FoodRestaurantProfile` = identidade operacional do produto Food

---

## Fluxo ideal de provisionamento

### Fluxo do dono

1. dono entra em `owner.vellor.com`
2. cria a empresa
3. define quais produtos ela contratou
4. o core cria os registros centrais
5. o core abre um `ProvisioningJob`
6. cada produto provisiona seu tenant interno
7. o cliente recebe acesso inicial

### Fluxo do cliente

1. cliente entra em `admin.vellor.com`
2. faz login
3. o core identifica a empresa
4. o core encontra o produto ativo
5. o sistema redireciona automaticamente para o produto correto

### Fluxo do cliente final no Food

1. cliente final entra em `app.vellor.com/r/slug`
2. usa o app publico do restaurante
3. pedido cai no admin do produto Food

---

## Estrategia de autenticacao

### Owner

Separada e mais forte.

Minimo esperado:

- email e senha
- cookie `httpOnly`
- sessao propria
- auditoria

Desejavel:

- 2FA
- limite por IP
- alerta de login

### Cliente

Autenticacao central da plataforma.

Fluxo:

1. login em `admin.vellor.com`
2. sessao de plataforma
3. redirecionamento para o produto certo

### Produto

Cada produto pode:

- confiar na sessao da plataforma
- ou receber um token assinado do core

---

## Hospedagem recomendada

### Vellor Owner Console

- projeto separado
- deploy separado
- dominio: `owner.vellor.com`

### Vellor Admin Gateway

- projeto separado
- deploy separado
- dominio: `admin.vellor.com`

### Food Public

- projeto separado
- deploy separado
- dominio: `app.vellor.com`

### Food Admin

Pode ser:

1. um app proprio do produto
2. ou uma rota entregue pelo admin gateway

No curto prazo, pode continuar separado como esta hoje.

---

## O que fazer com o projeto atual

Hoje o projeto atual esta assim:

- raiz = admin do Food
- `public-app` = app publico + backend + console do dono

Isso serve para iniciar, mas nao e a estrutura final da Vellor.

### Fase 1

Objetivo:

- estabilizar o Food
- separar o console do dono da forma mais limpa possivel

Acoes:

- manter `admin` e `public-app` funcionando
- remover o console do dono de dentro do `public-app` no longo prazo
- criar projeto proprio do owner

### Fase 2

Objetivo:

- criar o Platform Core

Acoes:

- criar `Company`
- criar `PlatformUser`
- criar `CompanyProductAccess`
- criar `Subscription`
- criar `AuditLog`

### Fase 3

Objetivo:

- transformar o Food em produto da plataforma

Acoes:

- `Restaurant` deixa de ser raiz global
- criar `FoodTenant`
- criar `FoodRestaurantProfile`
- migrar o resto para o dominio do Food

---

## Estrutura final recomendada de repositorios

### `vellor-owner-console`

Seu painel.

### `vellor-platform-core`

Core da plataforma.

### `vellor-food-admin`

Painel do cliente do produto Food.

### `vellor-food-public`

App publico + API do produto Food.

Outros SaaS futuros seguiriam o mesmo padrao:

- `vellor-crm-admin`
- `vellor-crm-public`
- `vellor-agenda-admin`
- etc

---

## Decisao recomendada

Se a Vellor vai vender mais de um SaaS, a decisao correta e:

1. separar o owner console
2. criar um core da plataforma
3. parar de usar `Restaurant` como entidade global
4. tratar o Food como apenas um produto

Essa e a estrutura certa para vender, crescer e administrar varios nichos sem misturar tudo em um unico app.
