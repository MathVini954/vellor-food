# Historico das migrations

Este projeto passou por um ajuste manual de ordem no historico das migrations para alinhar:

- banco remoto no Supabase
- schema atual do Prisma
- estado real do projeto apos a introducao da area SaaS do dono da plataforma

## Migrations relevantes

- `20260307090000_init_public_app`
  Base inicial correta do app publico.
- `20260307103000_connect_admin_mobile`
  Extensoes para conectar o painel admin ao mesmo backend.
- `20260307104000_order_item_product_nullable`
  Ajuste de integridade em `OrderItem.productId`.
- `20260308030000_add_restaurant_contract`
  Controle de contrato/status do restaurante para o dono do SaaS.
- `20260308034500_sync_database_to_current_schema`
  Sincronizacao final do banco com o `schema.prisma` atual.

## Sobre `20260307124713_init_public_app`

Essa migration foi mantida como no-op por compatibilidade historica.

Ela nao deve ser removida enquanto existirem bancos que ja registraram esse nome em `_prisma_migrations`.

## Regra daqui para frente

1. Novas alteracoes de banco devem nascer no `schema.prisma`.
2. Gere migrations novas sem editar as antigas.
3. Nao remova migrations antigas ja aplicadas em ambientes reais.

