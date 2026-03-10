import { PaymentMethod, PaymentStatus, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { calculateDeliveryQuote } from "@/lib/delivery";
import { prisma } from "@/lib/prisma";
import { slugifyPhone } from "@/lib/format";
import {
  findCustomizationOption,
  parseProductCustomizationConfig,
} from "@/lib/product-customization";
import {
  customerCookieName,
  dineInAccessCookieName,
  guestCookieName,
  tableSessionCookieName,
} from "@/lib/session";
import { orderPayloadSchema } from "@/lib/validation";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { findOrCreateOpenTableSession } from "@/services/food/dining-room";
import { getRestaurantBySlugOrThrow } from "@/services/public/restaurants";

const paymentMethodLabelMap: Record<PaymentMethod, string> = {
  CASH: "Dinheiro",
  PIX: "Pix",
  CARD_ON_DELIVERY: "Cartao na entrega",
  PAY_ON_PICKUP: "Pagar na retirada",
};
const BLOCKED_CUSTOMER_ERROR = "Este cliente esta bloqueado para novos pedidos neste restaurante.";

function getPaymentMethodLabel(
  paymentMethod: PaymentMethod,
  orderType: "DELIVERY" | "PICKUP" | "DINE_IN",
) {
  if (orderType === "DINE_IN" && paymentMethod === "PAY_ON_PICKUP") {
    return "Pagamento no caixa";
  }

  return paymentMethodLabelMap[paymentMethod];
}

function buildCustomizationSummary(customizations: string[] | undefined) {
  if (!customizations?.length) {
    return null;
  }

  return `Personalizacao: ${customizations.join(", ")}`;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await context.params;
    const restaurant = await getRestaurantBySlugOrThrow(slug);
    const body = await request.json();
    const parsed = orderPayloadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dados invalidos para o pedido." },
        { status: 400 },
      );
    }

    if (!restaurant.isOpen) {
      return NextResponse.json(
        { error: "O restaurante esta fechado no momento." },
        { status: 400 },
      );
    }

    const isDineInOrder = parsed.data.orderType === "DINE_IN";

    if (!isDineInOrder && !restaurant.publicOrderingEnabled) {
      return NextResponse.json(
        { error: "O app publico deste restaurante esta desativado." },
        { status: 403 },
      );
    }

    if (isDineInOrder && !restaurant.digitalMenuEnabled) {
      return NextResponse.json(
        { error: "O cardapio digital deste restaurante esta desativado." },
        { status: 403 },
      );
    }

    if (!isDineInOrder && !restaurant.whatsapp) {
      return NextResponse.json(
        { error: "O restaurante ainda nao configurou o WhatsApp para pedidos online." },
        { status: 400 },
      );
    }

    if (parsed.data.orderType === "DELIVERY" && !restaurant.deliveryActive) {
      return NextResponse.json(
        { error: "A entrega esta desativada para este restaurante." },
        { status: 400 },
      );
    }

    if (parsed.data.orderType === "PICKUP" && !restaurant.pickupActive) {
      return NextResponse.json(
        { error: "A retirada esta desativada para este restaurante." },
        { status: 400 },
      );
    }

    if (parsed.data.paymentMethod === "CASH" && !restaurant.acceptCash) {
      return NextResponse.json(
        { error: "O restaurante nao aceita dinheiro no momento." },
        { status: 400 },
      );
    }

    if (parsed.data.paymentMethod === "PIX" && !restaurant.acceptPix) {
      return NextResponse.json(
        { error: "O restaurante nao aceita Pix no momento." },
        { status: 400 },
      );
    }

    if (
      parsed.data.paymentMethod === "CARD_ON_DELIVERY" &&
      !restaurant.acceptCardOnDelivery
    ) {
      return NextResponse.json(
        { error: "O restaurante nao aceita cartao na entrega no momento." },
        { status: 400 },
      );
    }

    if (
      parsed.data.paymentMethod === "PAY_ON_PICKUP" &&
      !restaurant.pickupActive &&
      !isDineInOrder
    ) {
      return NextResponse.json(
        { error: "Pagamento na retirada indisponivel sem retirada ativa." },
        { status: 400 },
      );
    }

    if (isDineInOrder && parsed.data.paymentMethod !== "PAY_ON_PICKUP") {
      return NextResponse.json(
        { error: "Pedidos de mesa usam pagamento separado no caixa." },
        { status: 400 },
      );
    }

    const normalizedPhone = slugifyPhone(parsed.data.customerPhone);
    const productIds = parsed.data.items.map((item) => item.productId);

    const products = await prisma.product.findMany({
      where: {
        restaurantId: restaurant.id,
        id: { in: productIds },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        price: true,
        customizationOptions: true,
      },
    });

    if (products.length !== productIds.length) {
      return NextResponse.json(
        { error: "Um ou mais itens do carrinho nao estao mais disponiveis." },
        { status: 400 },
      );
    }

    const productMap = new Map(products.map((product) => [product.id, product]));
    const itemPricing = parsed.data.items.map((item) => {
      const product = productMap.get(item.productId)!;
      const customizationConfig = parseProductCustomizationConfig(product.customizationOptions);
      const selectedOptionIds = (item.selectedOptionIds ?? []).filter(
        (optionId, index, current) => current.indexOf(optionId) === index,
      );

      for (const group of customizationConfig.additionalGroups) {
        if (!group.required) {
          continue;
        }

        const hasSelection = selectedOptionIds.some((optionId) =>
          group.options.some((option) => option.id === optionId),
        );

        if (!hasSelection) {
          throw new Error(`Selecione uma opcao obrigatoria para ${group.name}.`);
        }
      }

      const extrasTotal = selectedOptionIds.reduce((total, optionId) => {
        if (optionId.startsWith("remove:")) {
          return total;
        }

        const found = findCustomizationOption(customizationConfig, optionId);
        return total + (found?.option.price ?? 0);
      }, 0);

      const unitPrice = Number(product.price) + extrasTotal;

      return {
        item,
        product,
        unitPrice,
        totalPrice: unitPrice * item.quantity,
      };
    });

    const subtotal = itemPricing.reduce((total, item) => total + item.totalPrice, 0);

    if (!isDineInOrder && subtotal < restaurant.minimumOrderValue) {
      return NextResponse.json(
        {
          error: `O pedido minimo e ${restaurant.minimumOrderValue.toFixed(2)}.`,
        },
        { status: 400 },
      );
    }

    if (
      parsed.data.orderType === "DELIVERY" &&
      (!parsed.data.customerAddress || !parsed.data.customerNeighborhood)
    ) {
      return NextResponse.json(
        { error: "Endereco e bairro sao obrigatorios para entrega." },
        { status: 400 },
      );
    }

    let deliveryQuote = null;

    if (parsed.data.orderType === "DELIVERY") {
      try {
        deliveryQuote = await calculateDeliveryQuote({
          restaurant: {
            address: restaurant.address,
            city: restaurant.city,
            state: restaurant.state,
            latitude: restaurant.latitude,
            longitude: restaurant.longitude,
            deliveryFee: restaurant.deliveryFee,
            freeDeliveryRadiusKm: restaurant.freeDeliveryRadiusKm,
          },
          customerAddress: parsed.data.customerAddress ?? "",
          customerNeighborhood: parsed.data.customerNeighborhood ?? "",
        });
      } catch (deliveryError) {
        return NextResponse.json(
          {
            error:
              deliveryError instanceof Error
                ? deliveryError.message
                : "Nao foi possivel calcular a entrega para este endereco.",
          },
          { status: 400 },
        );
      }
    }

    const deliveryFee =
      parsed.data.orderType === "DELIVERY" ? deliveryQuote?.deliveryFee ?? restaurant.deliveryFee : 0;

    const total = subtotal + deliveryFee;
    const requestedTableId = parsed.data.tableId?.trim() || null;
    const requestedTableIdentifier = parsed.data.tableIdentifier?.trim() || null;

    if (isDineInOrder && !requestedTableId && !requestedTableIdentifier) {
      return NextResponse.json(
        { error: "Selecione a mesa para abrir ou continuar a comanda." },
        { status: 400 },
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const existingCustomer = await tx.customer.findUnique({
        where: {
          restaurantId_phone: {
            restaurantId: restaurant.id,
            phone: normalizedPhone,
          },
        },
      });

      if (existingCustomer?.isBlocked) {
        throw new Error(BLOCKED_CUSTOMER_ERROR);
      }

      const customer = existingCustomer
        ? await tx.customer.update({
            where: { id: existingCustomer.id },
            data: {
              name: parsed.data.customerName,
              address: parsed.data.customerAddress,
              neighborhood: parsed.data.customerNeighborhood,
            },
          })
        : await tx.customer.create({
            data: {
              restaurantId: restaurant.id,
              name: parsed.data.customerName,
              phone: normalizedPhone,
              address: parsed.data.customerAddress,
              neighborhood: parsed.data.customerNeighborhood,
            },
          });

      let tableSession:
        | {
            id: string;
            diningTable: {
              label: string;
            };
          }
        | null = null;

      if (isDineInOrder) {
        const diningTable = await tx.diningTable.findFirst({
          where: {
            restaurantId: restaurant.id,
            isActive: true,
            OR: [
              ...(requestedTableId ? [{ id: requestedTableId }] : []),
              ...(requestedTableIdentifier
                ? [{ identifier: { equals: requestedTableIdentifier, mode: "insensitive" as const } }]
                : []),
            ],
          },
          select: {
            id: true,
            label: true,
          },
        });

        if (!diningTable) {
          throw new Error("Mesa nao encontrada ou indisponivel.");
        }

        const openedTableSession = await findOrCreateOpenTableSession(tx, {
          restaurantId: restaurant.id,
          tableId: diningTable.id,
          requestedSessionId: parsed.data.tableSessionId ?? null,
        });

        tableSession = {
          id: openedTableSession.id,
          diningTable: {
            label: diningTable.label,
          },
        };
      }

      const order = await tx.order.create({
        data: {
          restaurantId: restaurant.id,
          customerId: customer.id,
          tableSessionId: tableSession?.id ?? null,
          customerName: parsed.data.customerName,
          customerPhone: normalizedPhone,
          customerAddress: parsed.data.customerAddress,
          customerNeighborhood: parsed.data.customerNeighborhood,
          subtotal: new Prisma.Decimal(subtotal),
          deliveryFee: new Prisma.Decimal(deliveryFee),
          total: new Prisma.Decimal(total),
          status: "NEW",
          orderType: parsed.data.orderType,
          paymentMethod: parsed.data.paymentMethod,
          paymentStatus: PaymentStatus.PENDING,
          notes: parsed.data.notes,
          items: {
            create: itemPricing.map(({ item, product, unitPrice, totalPrice }) => {
              return {
                productId: product.id,
                productName: product.name,
                unitPrice: new Prisma.Decimal(unitPrice),
                quantity: item.quantity,
                totalPrice: new Prisma.Decimal(totalPrice),
                customizations: buildCustomizationSummary(item.customizations),
              };
            }),
          },
        },
        include: {
          items: true,
        },
      });

      return { customer, order, tableSession };
    });

    const confirmationOrder = {
      id: result.order.id,
      customerName: result.order.customerName,
      customerPhone: result.order.customerPhone,
      customerAddress: result.order.customerAddress,
      customerNeighborhood: result.order.customerNeighborhood,
      subtotal,
      deliveryFee,
      total,
      orderType: result.order.orderType,
      paymentMethod: result.order.paymentMethod,
      paymentMethodLabel: getPaymentMethodLabel(result.order.paymentMethod, result.order.orderType),
      notes: result.order.notes,
      tableLabel: result.tableSession?.diningTable.label ?? null,
      restaurant: {
        name: restaurant.name,
        whatsapp: restaurant.whatsapp,
      },
      items: result.order.items.map((item) => ({
        id: item.id,
        productName: item.productName,
        quantity: item.quantity,
        totalPrice: Number(item.totalPrice),
        customizations: item.customizations,
      })),
    };

    const response = NextResponse.json({
      orderId: result.order.id,
      whatsappUrl: isDineInOrder ? null : buildWhatsAppUrl(confirmationOrder),
      whatsappWebUrl: isDineInOrder ? null : buildWhatsAppUrl(confirmationOrder, "web"),
      customer: {
        id: result.customer.id,
        name: result.customer.name,
        phone: result.customer.phone,
        address: result.customer.address,
        neighborhood: result.customer.neighborhood,
      },
      tableSession: result.tableSession
        ? {
            id: result.tableSession.id,
            tableLabel: result.tableSession.diningTable.label,
          }
        : null,
    });

    response.cookies.set(customerCookieName(slug), result.customer.id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    response.cookies.delete(guestCookieName(slug));

    if (result.tableSession) {
      response.cookies.set(tableSessionCookieName(slug), result.tableSession.id, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 12,
      });
      response.cookies.set(dineInAccessCookieName(slug), "1", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 12,
      });
    }

    return response;
  } catch (error) {
    if (error instanceof Error && error.message === BLOCKED_CUSTOMER_ERROR) {
      return NextResponse.json(
        {
          error: error.message,
        },
        { status: 403 },
      );
    }

    if (error instanceof Error && error.message.startsWith("Selecione uma opcao obrigatoria")) {
      return NextResponse.json(
        {
          error: error.message,
        },
        { status: 400 },
      );
    }

    if (error instanceof Error && error.message === "Mesa nao encontrada ou indisponivel.") {
      return NextResponse.json(
        {
          error: error.message,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Nao foi possivel criar o pedido.",
      },
      { status: 500 },
    );
  }
}
