# Plano de Execucao Vellor

## Objetivo

Transformar o estado atual do projeto em uma plataforma Vellor com:

1. console do dono separado
2. core central da plataforma
3. produto Food desacoplado da entidade global de empresa
4. estrutura pronta para suportar outros SaaS

Este plano parte do que ja existe hoje e define uma ordem de execucao segura.

---

## Estado atual

Hoje o projeto esta assim:

- raiz: admin do Food
- `public-app`: app publico do Food + backend + console do dono
- banco: Prisma + Supabase
- entidade principal do sistema: `Restaurant`

Problema principal:

- o projeto ainda esta organizado como um unico SaaS de restaurante
- mas a Vellor precisa ser uma plataforma que gerencia varios SaaS

---

## Meta final

### Camadas finais

1. `owner.vellor.com`
   painel exclusivo do dono

2. `admin.vellor.com`
   entrada unica do cliente, ja redirecionando para o produto certo

3. `app.vellor.com`
   frente publica dos produtos que tiverem app publico

4. `platform-core`
   banco e servicos centrais da plataforma

5. `food-admin` e `food-public`
   produto Food desacoplado

---

## Principios de execucao

1. Nao quebrar o Food atual enquanto a plataforma nasce.
2. Separar primeiro o que e mais sensivel: owner e core.
3. Migrar o modelo de dados sem perder operacao.
4. Criar a camada de plataforma antes de abrir novos SaaS.

---

## Fase 0 - Estabilizacao imediata

### Objetivo

Congelar a base atual do Food e endurecer o minimo necessario para producao controlada.

### Entregaveis

- console do dono com login real
- sessao mais segura
- variaveis de ambiente organizadas
- checklist de deploy atualizado
- backup do banco e processo de restauracao documentado

### Tarefas

1. Remover dependencia operacional do token na URL do dono.
2. Garantir `OWNER_CONSOLE_*` na Vercel.
3. Revisar `ADMIN_ALLOWED_ORIGIN`.
4. Revisar todos os segredos expostos em conversas e rotacionar:
   - senha do Supabase
   - `ADMIN_AUTH_SECRET`
   - `OWNER_CONSOLE_SECRET`
   - token legado do owner
5. Criar rotina simples de backup do banco.

### Critério de aceite

- owner entra por login
- admin entra normalmente
- publico funciona
- banco e secrets rotacionados

---

## Fase 1 - Separar o Owner Console

### Objetivo

Retirar o console do dono de dentro do `public-app`.

### Resultado esperado

Novo projeto:

- `vellor-owner-console`

Dominio:

- `owner.vellor.com`

### Escopo

O owner console sera responsavel por:

- criar empresa
- ativar/inativar contrato
- definir produtos ativos por empresa
- acompanhar onboarding
- suspender/cancelar empresa
- ver auditoria basica

### Tarefas

1. Criar novo repositorio/projeto `vellor-owner-console`.
2. Migrar a UI atual do dono para esse projeto.
3. Mover o backend do owner para esse projeto ou para o core.
4. Remover `/dev/owner` do `public-app`.
5. Configurar subdominio proprio.

### Decisao tecnica

Nesta fase, o owner console ainda pode falar diretamente com o banco da plataforma, desde que:

- seja um banco separado do produto
- tenha autenticacao propria

### Critério de aceite

- dono acessa apenas `owner.vellor.com`
- `public-app` nao tem mais console do dono
- criacao de empresa continua funcionando

---

## Fase 2 - Criar o Platform Core

### Objetivo

Criar a camada central da plataforma Vellor.

### Novo projeto

- `vellor-platform-core`

### Responsabilidades

- empresas
- usuarios da plataforma
- contratos
- produtos SaaS
- acesso por empresa
- provisionamento
- auditoria

### Tabelas minimas

1. `Company`
2. `PlatformUser`
3. `CompanyUser`
4. `SaaSProduct`
5. `CompanyProductAccess`
6. `Subscription`
7. `ProvisioningJob`
8. `AuditLog`

### Tarefas

1. Criar schema inicial da plataforma.
2. Criar autenticacao do owner.
3. Criar autenticacao de cliente da plataforma.
4. Criar API de empresas.
5. Criar API de contratos.
6. Criar API de produtos contratados.
7. Criar API de provisionamento.

### Critério de aceite

- a empresa existe no core
- o owner nao cria mais empresa no banco do Food
- produtos passam a ser ativados por `CompanyProductAccess`

---

## Fase 3 - Criar o Admin Gateway do cliente

### Objetivo

Criar a entrada unica do cliente.

### Novo projeto

- `vellor-admin-gateway`

### Dominio

- `admin.vellor.com`

### Funcao

O cliente faz login uma unica vez e o sistema:

1. identifica a empresa
2. descobre o produto ativo
3. redireciona para o admin certo

### Tarefas

1. Criar login da plataforma para cliente.
2. Criar lookup de empresa e produtos ativos.
3. Criar regra de redirecionamento automatico.
4. Criar suporte para primeiro acesso da empresa.

### Exemplo

- empresa contratou apenas Food
- login em `admin.vellor.com`
- redirecionamento para `food-admin`

### Critério de aceite

- cliente nao precisa saber URL tecnica do produto
- login centralizado funciona

---

## Fase 4 - Transformar o Food em produto da plataforma

### Objetivo

Parar de usar `Restaurant` como entidade global da empresa.

### Estrutura alvo

No core:

- `Company`

No produto Food:

- `FoodTenant`
- `FoodRestaurantProfile`
- `FoodCategory`
- `FoodProduct`
- `FoodCustomer`
- `FoodOrder`
- `FoodOrderItem`

### Tarefas

1. Criar mapeamento `Company -> FoodTenant`.
2. Criar `FoodRestaurantProfile`.
3. Mover configuracoes operacionais do Food para esse perfil.
4. Ajustar admin e publico do Food para trabalhar com `FoodTenant`.
5. Criar migracao de dados do `Restaurant` atual para a nova estrutura.

### Decisao importante

`Restaurant` deixa de ser a raiz da plataforma e vira:

- ou um perfil do produto Food
- ou uma camada transitória durante a migração

### Critério de aceite

- empresa existe no core
- Food consome empresa provisionada
- dados operacionais do Food ficam isolados do core

---

## Fase 5 - Provisionamento padronizado para novos SaaS

### Objetivo

Permitir que a Vellor crie outros SaaS sem repetir arquitetura do zero.

### Modelo esperado

Cada novo SaaS deve seguir o mesmo contrato:

1. a empresa nasce no core
2. o produto e ativado em `CompanyProductAccess`
3. um `ProvisioningJob` cria o tenant interno do produto
4. o cliente acessa pelo `admin.vellor.com`

### Tarefas

1. Definir contrato padrao de provisionamento.
2. Definir payload padrao por produto.
3. Definir webhook ou fila de provisionamento.
4. Criar documentacao base para novos produtos.

### Critério de aceite

- novo SaaS pode ser adicionado sem mexer na raiz do Food

---

## Ordem recomendada

### Ordem real de implementacao

1. estabilizar e endurecer o Food atual
2. separar o owner console
3. criar o platform core
4. criar o admin gateway
5. migrar o Food para tenant de plataforma
6. abrir caminho para novos SaaS

Essa ordem evita reescrever tudo de uma vez e reduz risco de parada.

---

## Backlog objetivo por prioridade

### Prioridade 1

- separar owner console
- criar login proprio do owner
- rotacionar segredos
- remover dependencia operacional de token legado

### Prioridade 2

- criar schema do platform core
- criar `Company`
- criar `PlatformUser`
- criar `CompanyProductAccess`

### Prioridade 3

- criar `admin.vellor.com`
- login central do cliente
- redirecionamento para produto

### Prioridade 4

- migrar Food para `FoodTenant`
- tirar `Restaurant` do papel de entidade global

### Prioridade 5

- estrutura padrao para novos SaaS

---

## Riscos principais

### 1. Misturar o core com o Food

Se isso continuar, qualquer novo SaaS vai herdar modelagem errada.

### 2. Tentar migrar tudo de uma vez

Isso aumenta risco de quebrar o produto que ja vende.

### 3. Deixar o owner console dentro do app publico

Isso e ruim para seguranca, arquitetura e operacao.

### 4. Manter `Restaurant` como entidade global

Isso prende toda a plataforma ao nicho Food.

---

## Decisao recomendada agora

A proxima decisao correta e:

### iniciar a Fase 1

Ou seja:

1. criar projeto separado do owner console
2. tirar o owner do `public-app`
3. preparar o terreno para o `platform-core`

---

## Entrega pratica sugerida

### Sprint 1

- separar owner console
- login real do owner
- subdominio `owner.vellor.com`

### Sprint 2

- iniciar `platform-core`
- tabelas `Company`, `PlatformUser`, `CompanyProductAccess`

### Sprint 3

- integrar owner console ao core
- criar fluxo de provisionamento do Food

### Sprint 4

- criar `admin.vellor.com`
- login centralizado do cliente

### Sprint 5

- migrar o Food para tenant de plataforma

---

## Resultado final esperado

Ao final desse plano, a Vellor tera:

- um painel exclusivo do dono
- um core central de empresas e contratos
- um gateway unico para clientes
- o Food como produto desacoplado
- base pronta para CRM, agenda, catalogo e outros SaaS
