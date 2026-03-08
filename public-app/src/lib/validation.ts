import { z } from "zod";

export const identifyCustomerSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome."),
  phone: z.string().trim().min(8, "Informe um telefone valido."),
});

export const orderPayloadSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().positive(),
        customizations: z.array(z.string().trim().min(1)).optional(),
        selectedOptionIds: z.array(z.string().trim().min(1)).optional(),
      }),
    )
    .min(1, "Adicione ao menos um item ao carrinho."),
  customerName: z.string().trim().min(2, "Informe seu nome."),
  customerPhone: z.string().trim().min(8, "Informe seu telefone."),
  customerAddress: z.string().trim().optional().nullable(),
  customerNeighborhood: z.string().trim().optional().nullable(),
  orderType: z.enum(["DELIVERY", "PICKUP"]),
  paymentMethod: z.enum(["CASH", "PIX", "CARD_ON_DELIVERY", "PAY_ON_PICKUP"]),
  notes: z.string().trim().max(500).optional().nullable(),
});
