import { PaymentMethod, Prisma } from "@prisma/client";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  parseProductCustomizationConfig,
  summarizeCustomizationConfig,
} from "@/lib/product-customization";
import type {
  ConfirmationOrder,
  MenuCategoryPreview,
  MenuCategorySection,
  MenuProductCard,
  PublicCategoryPageData,
  PublicCustomerSession,
  PublicDiningTable,
  PublicOffer,
  PublicOrderSummary,
  PublicProductDetail,
  PublicRestaurant,
  RestaurantDiscoveryData,
  PublicTableSessionOrder,
  PublicTableSessionSummary,
} from "@/types/public";

function decimalToNumber(value: { toNumber(): number } | number) {
  return typeof value === "number" ? value : value.toNumber();
}

function mapDiningTable(table: {
  id: string;
  identifier: string;
  label: string;
  area: string | null;
  seats: number | null;
}): PublicDiningTable {
  return {
    id: table.id,
    identifier: table.identifier,
    label: table.label,
    area: table.area,
    seats: table.seats,
  };
}

function getPaymentMethodLabel(paymentMethod: PaymentMethod, orderType: "DELIVERY" | "PICKUP" | "DINE_IN") {
  if (orderType === "DINE_IN" && paymentMethod === "PAY_ON_PICKUP") {
    return "Pagamento no caixa";
  }

  const paymentMethodLabelMap: Record<PaymentMethod, string> = {
    CASH: "Dinheiro",
    PIX: "Pix",
    CARD_ON_DELIVERY: "Cartao na entrega",
    PAY_ON_PICKUP: "Pagar na retirada",
  };

  return paymentMethodLabelMap[paymentMethod];
}

function mapPublicOrderSummary(order: {
  id: string;
  status: "NEW" | "ACCEPTED" | "PREPARING" | "SENT" | "DELIVERED" | "CANCELED";
  createdAt: Date;
  total: Prisma.Decimal | number;
  orderType: "DELIVERY" | "PICKUP" | "DINE_IN";
  paymentMethod: PaymentMethod;
  restaurant: {
    name: string;
  };
  items: Array<{
    id: string;
    productName: string;
    quantity: number;
  }>;
}): PublicOrderSummary {
  return {
    id: order.id,
    status: order.status,
    statusLabel: orderStatusLabelMap[order.status],
    createdAt: order.createdAt.toISOString(),
    total: decimalToNumber(order.total),
    orderType: order.orderType,
    paymentMethodLabel: getPaymentMethodLabel(order.paymentMethod, order.orderType),
    itemCount: order.items.reduce((total, item) => total + item.quantity, 0),
    restaurantName: order.restaurant.name,
    items: order.items,
  };
}

function mapProductCard(product: {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  price: { toNumber(): number } | number;
  imageUrl: string | null;
  customizationOptions?: Prisma.JsonValue | null;
  category: { name: string };
}): MenuProductCard {
  const customizationConfig = parseProductCustomizationConfig(product.customizationOptions);

  return {
    id: product.id,
    categoryId: product.categoryId,
    categoryName: product.category.name,
    name: product.name,
    description: product.description,
    price: decimalToNumber(product.price),
    imageUrl: product.imageUrl,
    customizationOptions: summarizeCustomizationConfig(customizationConfig),
    customizationConfig,
  };
}

function mapCategoryPreview(category: {
  id: string;
  name: string;
  sortOrder: number;
  products: Array<{ id: string; imageUrl: string | null }>;
}): MenuCategoryPreview | null {
  if (!category.products.length) {
    return null;
  }

  return {
    id: category.id,
    name: category.name,
    sortOrder: category.sortOrder,
    productCount: category.products.length,
    imageUrl: category.products[0]?.imageUrl ?? null,
  };
}

async function getActiveCategoryRecordsBySlug(slug: string) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    select: {
      categories: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          name: true,
          sortOrder: true,
          products: {
            where: { isActive: true },
            orderBy: [{ name: "asc" }],
            select: {
              id: true,
              name: true,
              description: true,
              price: true,
              imageUrl: true,
              categoryId: true,
              customizationOptions: true,
            },
          },
        },
      },
    },
  });

  if (!restaurant) {
    notFound();
  }

  return restaurant.categories.filter((category) => category.products.length > 0);
}

export async function getRestaurantBySlug(slug: string): Promise<PublicRestaurant | null> {
  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      whatsapp: true,
      address: true,
      city: true,
      state: true,
      latitude: true,
      longitude: true,
      logoUrl: true,
      primaryColor: true,
      secondaryColor: true,
      bannerUrl: true,
      welcomeMessage: true,
      workingHours: true,
      deliveryFee: true,
      freeDeliveryRadiusKm: true,
      minimumOrderValue: true,
      isOpen: true,
      deliveryActive: true,
      pickupActive: true,
      acceptCash: true,
      acceptPix: true,
      acceptCardOnDelivery: true,
      publicOrderingEnabled: true,
      digitalMenuEnabled: true,
      pixKey: true,
      diningTables: {
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
        select: {
          id: true,
          identifier: true,
          label: true,
          area: true,
          seats: true,
        },
      },
    },
  });

  if (!restaurant) {
    return null;
  }

  return {
    ...restaurant,
    latitude: restaurant.latitude == null ? null : decimalToNumber(restaurant.latitude),
    longitude: restaurant.longitude == null ? null : decimalToNumber(restaurant.longitude),
    deliveryFee: decimalToNumber(restaurant.deliveryFee),
    freeDeliveryRadiusKm: decimalToNumber(restaurant.freeDeliveryRadiusKm),
    minimumOrderValue: decimalToNumber(restaurant.minimumOrderValue),
    diningTables: restaurant.diningTables.map(mapDiningTable),
  };
}

export async function getRestaurantBySlugOrThrow(slug: string) {
  const restaurant = await getRestaurantBySlug(slug);

  if (!restaurant) {
    notFound();
  }

  return restaurant;
}

export async function getRestaurantByDigitalMenuToken(token: string) {
  const restaurantRecord = await prisma.restaurant.findFirst({
    where: {
      digitalMenuToken: token,
      digitalMenuEnabled: true,
    },
    select: {
      slug: true,
    },
  });

  if (!restaurantRecord) {
    return null;
  }

  return getRestaurantBySlug(restaurantRecord.slug);
}

export async function getMenuByRestaurantSlug(slug: string): Promise<MenuCategorySection[]> {
  const categories = await getActiveCategoryRecordsBySlug(slug);

  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    sortOrder: category.sortOrder,
    products: category.products.map((product) => ({
      id: product.id,
      categoryId: product.categoryId,
      categoryName: category.name,
      name: product.name,
      description: product.description,
      price: decimalToNumber(product.price),
      imageUrl: product.imageUrl,
      customizationOptions: summarizeCustomizationConfig(
        parseProductCustomizationConfig(product.customizationOptions),
      ),
      customizationConfig: parseProductCustomizationConfig(product.customizationOptions),
    })),
  }));
}

export async function getCategoryPreviewsByRestaurantSlug(
  slug: string,
): Promise<MenuCategoryPreview[]> {
  const categories = await getActiveCategoryRecordsBySlug(slug);

  return categories
    .map((category) =>
      mapCategoryPreview({
        id: category.id,
        name: category.name,
        sortOrder: category.sortOrder,
        products: category.products.map((product) => ({
          id: product.id,
          imageUrl: product.imageUrl,
        })),
      }),
    )
    .filter((category): category is MenuCategoryPreview => Boolean(category));
}

export async function getRestaurantDiscoveryBySlug(
  slug: string,
): Promise<RestaurantDiscoveryData> {
  const categories = await getCategoryPreviewsByRestaurantSlug(slug);
  const offersRaw = await prisma.offer.findMany({
    where: {
      restaurant: { slug },
      isActive: true,
      endDate: { gte: new Date() },
    },
    orderBy: [{ startDate: "desc" }, { endDate: "asc" }],
    take: 6,
    select: {
      id: true,
      name: true,
      type: true,
      discountLabel: true,
      appliesTo: true,
      endDate: true,
      productIds: true,
      categoryIds: true,
    },
  });

  const offerProductIds = [...new Set(offersRaw.flatMap((offer) => offer.productIds))];
  const offerCategoryIds = [...new Set(offersRaw.flatMap((offer) => offer.categoryIds))];
  const offerProductsRaw =
    offerProductIds.length || offerCategoryIds.length
      ? await prisma.product.findMany({
          where: {
            restaurant: { slug },
            isActive: true,
            OR: [
              ...(offerProductIds.length ? [{ id: { in: offerProductIds } }] : []),
              ...(offerCategoryIds.length ? [{ categoryId: { in: offerCategoryIds } }] : []),
            ],
          },
          select: {
            id: true,
            categoryId: true,
            imageUrl: true,
          },
        })
      : [];

  const popularProductsRaw = await prisma.product.findMany({
    where: {
      restaurant: { slug },
      isActive: true,
      category: { isActive: true },
    },
    orderBy: [{ orderItems: { _count: "desc" } }, { updatedAt: "desc" }, { name: "asc" }],
    take: 4,
    select: {
      id: true,
      categoryId: true,
      name: true,
      description: true,
      price: true,
      imageUrl: true,
      customizationOptions: true,
      category: {
        select: {
          name: true,
        },
      },
    },
  });

  const popularProducts = popularProductsRaw.map(mapProductCard);
  const popularProductIds = popularProducts.map((product) => product.id);
  const offers: PublicOffer[] = offersRaw.map((offer) => {
    const imageUrls = offerProductsRaw
      .filter(
        (product) =>
          offer.productIds.includes(product.id) || offer.categoryIds.includes(product.categoryId),
      )
      .map((product) => product.imageUrl)
      .filter((imageUrl): imageUrl is string => Boolean(imageUrl));

    return {
      id: offer.id,
      name: offer.name,
      type: offer.type,
      discountLabel: offer.discountLabel,
      appliesTo: offer.appliesTo,
      endDate: offer.endDate.toISOString().slice(0, 10),
      imageUrls: [...new Set(imageUrls)].slice(0, 6),
    };
  });

  const recommendedProductsRaw = await prisma.product.findMany({
    where: {
      restaurant: { slug },
      isActive: true,
      category: { isActive: true },
      ...(popularProductIds.length ? { id: { notIn: popularProductIds } } : {}),
    },
    orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
    take: 6,
    select: {
      id: true,
      categoryId: true,
      name: true,
      description: true,
      price: true,
      imageUrl: true,
      customizationOptions: true,
      category: {
        select: {
          name: true,
        },
      },
    },
  });

  const recommendedProducts = recommendedProductsRaw.map(mapProductCard);

  if (recommendedProducts.length >= 4) {
    return {
      categories,
      popularProducts,
      recommendedProducts: recommendedProducts.slice(0, 4),
      offers,
    };
  }

  const fallbackProductsRaw = await prisma.product.findMany({
    where: {
      restaurant: { slug },
      isActive: true,
      category: { isActive: true },
    },
    orderBy: [{ name: "asc" }],
    take: 10,
    select: {
      id: true,
      categoryId: true,
      name: true,
      description: true,
      price: true,
      imageUrl: true,
      customizationOptions: true,
      category: {
        select: {
          name: true,
        },
      },
    },
  });

  const seenProducts = new Set(recommendedProducts.map((product) => product.id));
  const fallbackProducts = fallbackProductsRaw
    .map(mapProductCard)
    .filter((product) => !seenProducts.has(product.id))
    .slice(0, 4 - recommendedProducts.length);

  return {
    categories,
    popularProducts,
    recommendedProducts: [...recommendedProducts, ...fallbackProducts],
    offers,
  };
}

export async function getCategoryPageByRestaurantSlug(
  slug: string,
  categoryId: string,
): Promise<PublicCategoryPageData | null> {
  const category = await prisma.category.findFirst({
    where: {
      id: categoryId,
      isActive: true,
      restaurant: { slug },
    },
    select: {
      id: true,
      name: true,
      sortOrder: true,
      products: {
        where: { isActive: true },
        orderBy: [{ name: "asc" }],
        select: {
          id: true,
          categoryId: true,
          name: true,
          description: true,
          price: true,
          imageUrl: true,
          customizationOptions: true,
        },
      },
    },
  });

  if (!category) {
    return null;
  }

  return {
    id: category.id,
    name: category.name,
    sortOrder: category.sortOrder,
    productCount: category.products.length,
    imageUrl: category.products[0]?.imageUrl ?? null,
    products: category.products.map((product) => ({
      id: product.id,
      categoryId: product.categoryId,
      categoryName: category.name,
      name: product.name,
      description: product.description,
      price: decimalToNumber(product.price),
      imageUrl: product.imageUrl,
      customizationOptions: summarizeCustomizationConfig(
        parseProductCustomizationConfig(product.customizationOptions),
      ),
      customizationConfig: parseProductCustomizationConfig(product.customizationOptions),
    })),
  };
}

export async function getProductDetailsByRestaurantSlug(
  slug: string,
  productId: string,
): Promise<PublicProductDetail | null> {
  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      isActive: true,
      restaurant: { slug },
      category: { isActive: true },
    },
    select: {
      id: true,
      categoryId: true,
      name: true,
      description: true,
      price: true,
      imageUrl: true,
      customizationOptions: true,
      category: {
        select: {
          name: true,
        },
      },
      restaurant: {
        select: {
          name: true,
          deliveryFee: true,
          freeDeliveryRadiusKm: true,
          minimumOrderValue: true,
          isOpen: true,
        },
      },
    },
  });

  if (!product) {
    return null;
  }

  const [relatedProductsRaw, relatedCategoriesRaw] = await Promise.all([
    prisma.product.findMany({
      where: {
        restaurant: { slug },
        isActive: true,
        categoryId: product.categoryId,
        id: { not: product.id },
      },
      orderBy: [{ orderItems: { _count: "desc" } }, { name: "asc" }],
      take: 4,
      select: {
        id: true,
        categoryId: true,
        name: true,
        description: true,
        price: true,
        imageUrl: true,
        customizationOptions: true,
        category: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.category.findMany({
      where: {
        restaurant: { slug },
        isActive: true,
        id: { not: product.categoryId },
        products: { some: { isActive: true } },
      },
      orderBy: { sortOrder: "asc" },
      take: 5,
      select: {
        id: true,
        name: true,
        sortOrder: true,
        products: {
          where: { isActive: true },
          orderBy: [{ name: "asc" }],
          select: {
            id: true,
            imageUrl: true,
          },
        },
      },
    }),
  ]);

  return {
    id: product.id,
    categoryId: product.categoryId,
    categoryName: product.category.name,
    name: product.name,
    description: product.description,
    price: decimalToNumber(product.price),
    imageUrl: product.imageUrl,
    customizationOptions: summarizeCustomizationConfig(
      parseProductCustomizationConfig(product.customizationOptions),
    ),
    customizationConfig: parseProductCustomizationConfig(product.customizationOptions),
    restaurantName: product.restaurant.name,
    deliveryFee: decimalToNumber(product.restaurant.deliveryFee),
    freeDeliveryRadiusKm: decimalToNumber(product.restaurant.freeDeliveryRadiusKm),
    minimumOrderValue: decimalToNumber(product.restaurant.minimumOrderValue),
    isRestaurantOpen: product.restaurant.isOpen,
    relatedProducts: relatedProductsRaw.map(mapProductCard),
    relatedCategories: relatedCategoriesRaw
      .map(mapCategoryPreview)
      .filter((category): category is MenuCategoryPreview => Boolean(category)),
  };
}

export async function getCustomerByRestaurantAndId(restaurantId: string, customerId: string) {
  const customer = await prisma.customer.findFirst({
    where: {
      id: customerId,
      restaurantId,
    },
    select: {
      id: true,
      name: true,
      phone: true,
      address: true,
      neighborhood: true,
    },
  });

  if (!customer) {
    return null;
  }

  const session: PublicCustomerSession = {
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    address: customer.address,
    neighborhood: customer.neighborhood,
  };

  return session;
}

export async function getOrderConfirmationById(
  slug: string,
  orderId: string,
): Promise<ConfirmationOrder | null> {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      restaurant: { slug },
    },
    select: {
      id: true,
      customerName: true,
      customerPhone: true,
      customerAddress: true,
      customerNeighborhood: true,
      subtotal: true,
      deliveryFee: true,
      total: true,
      orderType: true,
      paymentMethod: true,
      notes: true,
      tableSession: {
        select: {
          diningTable: {
            select: {
              label: true,
            },
          },
        },
      },
      restaurant: {
        select: {
          name: true,
          whatsapp: true,
        },
      },
      items: {
        select: {
          id: true,
          productName: true,
          quantity: true,
          totalPrice: true,
          customizations: true,
        },
      },
    },
  });

  if (!order) {
    return null;
  }

  return {
    id: order.id,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    customerAddress: order.customerAddress,
    customerNeighborhood: order.customerNeighborhood,
    subtotal: decimalToNumber(order.subtotal),
    deliveryFee: decimalToNumber(order.deliveryFee),
    total: decimalToNumber(order.total),
    orderType: order.orderType,
    paymentMethod: order.paymentMethod,
    paymentMethodLabel: getPaymentMethodLabel(order.paymentMethod, order.orderType),
    notes: order.notes,
    tableLabel: order.tableSession?.diningTable.label ?? null,
    restaurant: order.restaurant,
    items: order.items.map((item) => ({
      id: item.id,
      productName: item.productName,
      quantity: item.quantity,
      totalPrice: decimalToNumber(item.totalPrice),
      customizations: item.customizations,
    })),
  };
}

const orderStatusLabelMap = {
  NEW: "Novo",
  ACCEPTED: "Aceito",
  PREPARING: "Em preparo",
  SENT: "Saiu para entrega",
  DELIVERED: "Entregue",
  CANCELED: "Cancelado",
} as const;

export async function getOrdersByRestaurantAndCustomerId(
  restaurantId: string,
  customerId: string,
): Promise<PublicOrderSummary[]> {
  const orders = await prisma.order.findMany({
    where: {
      restaurantId,
      customerId,
      orderType: {
        not: "DINE_IN",
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      status: true,
      createdAt: true,
      total: true,
      orderType: true,
      paymentMethod: true,
      restaurant: {
        select: {
          name: true,
        },
      },
      items: {
        select: {
          id: true,
          productName: true,
          quantity: true,
        },
      },
    },
  });

  return orders.map(mapPublicOrderSummary);
}

export async function getTableSessionByRestaurantAndId(
  restaurantId: string,
  tableSessionId: string,
): Promise<PublicTableSessionSummary | null> {
  const tableSession = await prisma.tableSession.findFirst({
    where: {
      id: tableSessionId,
      restaurantId,
    },
    select: {
      id: true,
      status: true,
      openedAt: true,
      closedAt: true,
      notes: true,
      diningTable: {
        select: {
          id: true,
          identifier: true,
          label: true,
        },
      },
      orders: {
        where: {
          orderType: "DINE_IN",
        },
        orderBy: {
          createdAt: "asc",
        },
        select: {
          id: true,
          status: true,
          createdAt: true,
          total: true,
          orderType: true,
          paymentMethod: true,
          notes: true,
          customerName: true,
          restaurant: {
            select: {
              name: true,
            },
          },
          items: {
            select: {
              id: true,
              productName: true,
              quantity: true,
            },
          },
        },
      },
    },
  });

  if (!tableSession) {
    return null;
  }

  const orders: PublicTableSessionOrder[] = tableSession.orders.map((order) => ({
    ...mapPublicOrderSummary(order),
    customerName: order.customerName,
    notes: order.notes,
  }));

  return {
    id: tableSession.id,
    tableId: tableSession.diningTable.id,
    tableLabel: tableSession.diningTable.label,
    tableIdentifier: tableSession.diningTable.identifier,
    openedAt: tableSession.openedAt.toISOString(),
    closedAt: tableSession.closedAt ? tableSession.closedAt.toISOString() : null,
    status: tableSession.status,
    total: orders.reduce((sum, order) => sum + order.total, 0),
    itemCount: orders.reduce((sum, order) => sum + order.itemCount, 0),
    customerCount: new Set(orders.map((order) => order.customerName)).size,
    notes: tableSession.notes,
    customerNames: [...new Set(orders.map((order) => order.customerName))],
    orders,
  };
}
