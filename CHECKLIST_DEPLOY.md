# Checklist de Deploy

Legenda:

- `[ok]` pronto ou praticamente pronto
- `[parcial]` existe, mas precisa ajuste
- `[falta]` ainda nao esta fechado

## 1. Arquitetura de publicacao

- `[ok]` `public-app/` concentra frontend publico + backend HTTP + acesso ao banco
- `[ok]` painel admin da raiz pode ser publicado separadamente como app estatico
- `[ok]` area dev-only do dono do SaaS existe em `public-app/src/app/dev/owner`
- `[parcial]` a separacao entre `admin` e `public-app` funciona, mas ainda esta confusa na estrutura do repositorio
- `[falta]` decidir estrategia final de deploy:
  - opcao A: publicar `public-app` e `admin` separadamente
  - opcao B: no futuro migrar admin para dentro do Next e unificar deploy

## 2. Banco de dados

- `[ok]` Prisma configurado em `public-app/prisma/schema.prisma`
- `[ok]` migrations presentes em `public-app/prisma/migrations`
- `[ok]` seed presente em `public-app/prisma/seed.cjs`
- `[ok]` banco remoto ja foi provisionado no Supabase
- `[ok]` `DATABASE_URL` remota ja foi configurada no `public-app/.env`
- `[falta]` validar fluxo real:
  - `prisma generate`
  - `prisma migrate deploy`
  - seed inicial se necessario
- `[falta]` definir politica de backup e restauracao

## 3. Public app (`public-app`)

- `[ok]` app em Next.js com App Router
- `[ok]` rotas publicas implementadas em `public-app/src/app/r/[slug]`
- `[ok]` API publica implementada em `public-app/src/app/api/public`
- `[ok]` API admin implementada em `public-app/src/app/api/admin`
- `[ok]` console do dono do SaaS implementado em `public-app/src/app/dev/owner`
- `[parcial]` falta validacao de build e start em ambiente limpo de producao
- `[falta]` testar deploy real em provedor
- `[falta]` configurar variaveis de ambiente no host
- `[falta]` definir dominio publico final

## 4. Painel gerencial (`src/` da raiz)

- `[ok]` painel gerencial em React + Vite
- `[ok]` rotas internas do painel existem e consomem a API admin
- `[ok]` endpoint da API agora aceita configuracao por `VITE_ADMIN_API_BASE_URL`
- `[ok]` exemplo de ambiente da raiz criado em `.env.example`
- `[falta]` publicar o painel em host estatico
- `[falta]` definir dominio/subdominio do admin
- `[falta]` validar CORS se admin e backend ficarem em dominios diferentes

## 5. Autenticacao e seguranca

- `[ok]` existem rotas de login e registro admin
- `[ok]` cadastro e login admin usam hash de senha
- `[ok]` login antigo em texto puro agora e migrado para hash no primeiro login bem-sucedido
- `[ok]` sessao/token assinado foi adicionada ao fluxo admin
- `[ok]` rotas administrativas exigem autenticacao por header `Authorization`
- `[ok]` acesso so por `slug` foi endurecido com validacao do token contra o restaurante
- `[parcial]` rate limit foi adicionado para login e cadastro admin, mas ainda nao cobre todos os endpoints sensiveis
- `[parcial]` CORS admin agora e configuravel por ambiente, mas ainda depende de valor correto em producao
- `[falta]` revisar validacao de payload nas rotas admin de forma mais profunda

## 6. Uploads e arquivos

- `[parcial]` o sistema lida com `imageUrl`, `bannerUrl` e `logoUrl`, mas nao ficou claro um storage de producao
- `[falta]` definir onde imagens serao armazenadas:
  - Cloudinary
  - S3
  - storage do host
- `[falta]` garantir URLs persistentes em producao
- `[falta]` validar fallback para imagens ausentes

## 7. Integracoes externas

- `[ok]` existe geracao de link de WhatsApp
- `[ok]` existe integracao com geocoding e consulta IBGE
- `[parcial]` depende de disponibilidade externa e possiveis limites/rate limit
- `[falta]` validar comportamento quando a API externa falhar
- `[falta]` documentar timeout, retry e fallback dessas integracoes

## 8. Qualidade e testes

- `[parcial]` o fluxo principal parece implementado, mas nao ha suite formal de testes automatizados
- `[falta]` rodar testes manuais completos de ponta a ponta
- `[falta]` criar pelo menos um smoke test dos fluxos criticos
- `[falta]` validar em ambiente limpo:
  - criar restaurante
  - login admin
  - criar produto
  - criar oferta
  - importar bairros
  - identificar cliente
  - calcular entrega
  - fechar pedido
  - abrir confirmacao
  - atualizar status do pedido no admin

## 9. Observabilidade e manutencao

- `[falta]` configurar logs de backend
- `[falta]` configurar monitoramento de erros
- `[falta]` configurar alerta para indisponibilidade
- `[falta]` documentar processo de rollback
- `[falta]` documentar rotina de manutencao do banco

## 10. Build e pipeline

- `[ok]` scripts principais existem
- `[parcial]` falta pipeline automatizada de deploy
- `[ok]` build da raiz validado
- `[ok]` build do `public-app` validado
- `[falta]` criar pipeline CI/CD ou fluxo manual documentado
- `[falta]` travar processo de deploy com checklist minimo

## 11. O que esta mais perto de bloquear deploy

Itens mais criticos antes de colocar cliente real usando:

1. Storage real de imagens, se upload for parte do fluxo
2. Teste completo do fluxo de pedido
3. Monitoramento, logs e backup
4. Pipeline de deploy
5. endurecer a area do dono do SaaS se ela for exposta fora do ambiente dev

## 12. Ordem recomendada de execucao

### Fase 1: deixar publicavel para teste privado

- `[ok]` subir Postgres de producao
- `[ok]` configurar `DATABASE_URL`
- `[falta]` publicar `public-app`
- `[falta]` publicar painel admin
- `[ok]` ajustar `VITE_ADMIN_API_BASE_URL`
- `[falta]` rodar migrations
- `[falta]` testar fluxos ponta a ponta

### Fase 2: deixar seguro para uso real

- `[ok]` hash de senha
- `[ok]` sessao/token real no admin
- `[ok]` autorizacao nas rotas admin
- `[parcial]` rate limit
- `[falta]` logs e monitoramento

### Fase 3: endurecer operacao

- `[falta]` backups
- `[falta]` storage de imagem robusto
- `[falta]` smoke tests
- `[falta]` pipeline de deploy
- `[falta]` documentacao operacional

## 13. Veredito sincero

Estado atual:

- para demo local: `[ok]`
- para teste interno controlado: `[ok]`
- para staging publico: `[parcial]`
- para producao com clientes reais: `[parcial]`

O projeto ja tem base suficiente para ser hospedado rapidamente em ambiente de teste. Para producao real, o principal trabalho restante esta em seguranca, configuracao de ambiente e validacao operacional.
