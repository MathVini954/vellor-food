import { formatCurrency, formatWhatsAppNumber } from "./format";
import type { ConfirmationOrder } from "@/types/public";

export type WhatsAppTarget = "app" | "web";

export function buildWhatsAppMessage(order: ConfirmationOrder) {
  const isDelivery = order.orderType === "DELIVERY";
  const items = order.items
    .map((item) =>
      [
        `- ${item.quantity}x ${item.productName} - ${formatCurrency(item.totalPrice)}`,
        item.customizations ? `  ${item.customizations}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
    )
    .join("\n");

  return [
    `Novo pedido - ${order.restaurant.name}`,
    "",
    `Cliente: ${order.customerName}`,
    `Telefone: ${order.customerPhone}`,
    "",
    `Tipo: ${isDelivery ? "Entrega" : "Retirada"}`,
    `Endereco: ${isDelivery ? order.customerAddress || "-" : "Retirada no local"}`,
    `Bairro: ${isDelivery ? order.customerNeighborhood || "-" : "-"}`,
    "",
    "Itens:",
    items,
    "",
    `Subtotal: ${formatCurrency(order.subtotal)}`,
    `Taxa de entrega: ${formatCurrency(order.deliveryFee)}`,
    `Total: ${formatCurrency(order.total)}`,
    "",
    `Pagamento: ${order.paymentMethodLabel}`,
    `Observacao: ${order.notes || "-"}`,
  ].join("\n");
}

export function buildWhatsAppUrl(order: ConfirmationOrder, target: WhatsAppTarget = "app") {
  const phone = formatWhatsAppNumber(order.restaurant.whatsapp);
  const message = buildWhatsAppMessage(order);
  const encodedMessage = encodeURIComponent(message);

  if (target === "web") {
    return `https://web.whatsapp.com/send?phone=${phone}&text=${encodedMessage}`;
  }

  return `https://wa.me/${phone}?text=${encodedMessage}`;
}
