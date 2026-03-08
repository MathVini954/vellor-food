import { OfferType, OrderStatus, Prisma, RestaurantContractStatus } from "@prisma/client";
import { geocodeAddress } from "@/lib/geocoding";
import { hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/format";
import {
  parseProductCustomizationConfig,
  summarizeCustomizationConfig,
} from "@/lib/product-customization";
import type {
  AdminBootstrapPayload,
  AdminCategoryOption,
  AdminCustomer,
  AdminInitialSetupPayload,
  AdminMenuProduct,
  AdminOffer,
  AdminOfferType,
  AdminOrder,
  AdminOrderStatus,
  AdminRestaurantSettings,
  AdminSessionPayload,
} from "@/types/admin";

const PLATFORM_NAME = "MesaPilot Gestao";

function canRestaurantAccessAdmin(contract: {
  status: RestaurantContractStatus;
  endsAt: Date | null;
  canceledAt: Date | null;
} | null) {
  if (!contract) {
    return true;
  }

  if (contract.status !== "ACTIVE") {
    return false;
  }

  if (contract.canceledAt) {
    return false;
  }

  if (contract.endsAt && contract.endsAt.getTime() < Date.now()) {
    return false;
  }

  return true;
}

function decimalToNumber(value: Prisma.Decimal | number) {
  return typeof value === "number" ? value : value.toNumber();
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

export function formatDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function parseCurrencyInput(value: string) {
  const normalized = value.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function parsePhoneInput(value: string) {
  return value.replace(/\D/g, "");
}

export function mapDbOrderStatusToAdmin(status: OrderStatus): AdminOrderStatus {
  const map: Record<OrderStatus, AdminOrderStatus> = {
    NEW: "Novo",
    ACCEPTED: "Aceito",
    PREPARING: "Em preparo",
    SENT: "Enviado",
    DELIVERED: "Entregue",
    CANCELED: "Cancelado",
  };

  return map[status];
}

export function mapAdminOrderStatusToDb(status: AdminOrderStatus): OrderStatus {
  const map: Record<AdminOrderStatus, OrderStatus> = {
    Novo: "NEW",
    Aceito: "ACCEPTED",
    "Em preparo": "PREPARING",
    Enviado: "SENT",
    Entregue: "DELIVERED",
    Cancelado: "CANCELED",
  };

  return map[status];
}

export function mapDbOfferTypeToAdmin(type: OfferType): AdminOfferType {
  const map: Record<OfferType, AdminOfferType> = {
    ALL_ITEMS: "Desconto em todos os itens",
    CATEGORY: "Desconto em categoria",
    DISH_OF_THE_DAY: "Prato do dia",
    SPECIFIC_PROMOTION: "Promocao especifica",
  };

  return map[type];
}

export function mapAdminOfferTypeToDb(type: AdminOfferType): OfferType {
  const map: Record<AdminOfferType, OfferType> = {
    "Desconto em todos os itens": "ALL_ITEMS",
    "Desconto em categoria": "CATEGORY",
    "Prato do dia": "DISH_OF_THE_DAY",
    "Promocao especifica": "SPECIFIC_PROMOTION",
  };

  return map[type];
}

export async function findRestaurantForAdminLogin(email: string, password: string) {
  const restaurant = await prisma.restaurant.findFirst({
    where: {
      adminEmail: email.toLowerCase().trim(),
    },
    select: {
      slug: true,
      name: true,
      adminUserName: true,
      adminEmail: true,
      adminPassword: true,
      adminPasswordTemporary: true,
      onboardingCompleted: true,
      whatsapp: true,
      address: true,
      city: true,
      state: true,
      contract: {
        select: {
          status: true,
          endsAt: true,
          canceledAt: true,
        },
      },
    },
  });

  if (!restaurant) {
    return null;
  }

  const passwordMatches = await verifyPassword(password, restaurant.adminPassword);

  if (!passwordMatches) {
    return null;
  }

  if (!canRestaurantAccessAdmin(restaurant.contract)) {
    throw new Error("Acesso da empresa indisponivel. Verifique o status do contrato.");
  }

  if (restaurant.adminPassword && !restaurant.adminPassword.startsWith("scrypt:")) {
    await prisma.restaurant.update({
      where: { slug: restaurant.slug },
      data: {
        adminPassword: await hashPassword(password),
      },
    });
  }

  return {
    slug: restaurant.slug,
    name: restaurant.name,
    adminUserName: restaurant.adminUserName,
    adminEmail: restaurant.adminEmail,
    adminPasswordTemporary: restaurant.adminPasswordTemporary,
    onboardingCompleted: restaurant.onboardingCompleted,
    whatsapp: restaurant.whatsapp,
    address: restaurant.address,
    city: restaurant.city,
    state: restaurant.state,
  };
}

export function mapRestaurantSession(restaurant: {
  slug: string;
  name: string;
  adminUserName: string | null;
  adminEmail: string | null;
  accessToken: string;
}): AdminSessionPayload {
  return {
    restaurantSlug: restaurant.slug,
    restaurantName: restaurant.name,
    userName: restaurant.adminUserName ?? "Gerente",
    userEmail: restaurant.adminEmail ?? "",
    platformName: PLATFORM_NAME,
    accessToken: restaurant.accessToken,
  };
}

export function mapRestaurantInitialSetup(input: {
  setupToken: string;
  slug: string;
  name: string;
  adminUserName: string | null;
  adminEmail: string | null;
  whatsapp: string;
  address: string | null;
  city: string | null;
  state: string | null;
}): AdminInitialSetupPayload {
  return {
    setupToken: input.setupToken,
    restaurantSlug: input.slug,
    companyName: input.name,
    adminName: input.adminUserName ?? "",
    adminEmail: input.adminEmail ?? "",
    whatsapp: input.whatsapp,
    address: input.address ?? "",
    city: input.city ?? "",
    state: input.state ?? "",
  };
}

export async function completeRestaurantInitialSetup(input: {
  slug: string;
  email: string;
  companyName: string;
  adminName: string;
  whatsapp: string;
  address: string;
  city: string;
  state: string;
  password: string;
}) {
  const slug = input.slug.trim();
  const email = input.email.trim().toLowerCase();
  const companyName = input.companyName.trim();
  const adminName = input.adminName.trim();
  const whatsapp = parsePhoneInput(input.whatsapp);
  const address = input.address.trim();
  const city = input.city.trim();
  const state = input.state.trim().toUpperCase();
  const password = input.password;

  if (!slug || !email || !companyName || !adminName || !whatsapp || !address || !city || !state || !password) {
    throw new Error("Preencha os campos obrigatorios para concluir o cadastro inicial.");
  }

  if (state.length !== 2) {
    throw new Error("Informe a UF com 2 letras.");
  }

  if (password.trim().length < 6) {
    throw new Error("Defina uma senha com pelo menos 6 caracteres.");
  }

  const restaurant = await prisma.restaurant.findFirst({
    where: {
      slug,
      adminEmail: email,
    },
    select: {
      slug: true,
      adminEmail: true,
      adminUserName: true,
      adminPasswordTemporary: true,
      onboardingCompleted: true,
      contract: {
        select: {
          status: true,
          endsAt: true,
          canceledAt: true,
        },
      },
    },
  });

  if (!restaurant) {
    throw new Error("Empresa nao encontrada para concluir o setup.");
  }

  if (!restaurant.adminPasswordTemporary && restaurant.onboardingCompleted) {
    throw new Error("O setup inicial desta empresa ja foi concluido.");
  }

  if (!canRestaurantAccessAdmin(restaurant.contract)) {
    throw new Error("Acesso da empresa indisponivel. Verifique o status do contrato.");
  }

  const geocodedPoint = await geocodeAddress([address, city, state, "Brasil"]);
  const passwordHash = await hashPassword(password);

  const updatedRestaurant = await prisma.restaurant.update({
    where: { slug },
    data: {
      name: companyName,
      adminUserName: adminName,
      whatsapp,
      adminPassword: passwordHash,
      adminPasswordTemporary: false,
      onboardingCompleted: true,
      address,
      city,
      state,
      latitude: geocodedPoint ? new Prisma.Decimal(geocodedPoint.latitude) : null,
      longitude: geocodedPoint ? new Prisma.Decimal(geocodedPoint.longitude) : null,
      welcomeMessage: `Bem-vindo a operacao de ${companyName}.`,
      isOpen: true,
      deliveryActive: true,
      pickupActive: true,
    },
    select: {
      slug: true,
      name: true,
      adminUserName: true,
      adminEmail: true,
    },
  });

  return updatedRestaurant;
}

function mapOrder(order: {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string | null;
  customerNeighborhood: string | null;
  total: Prisma.Decimal | number;
  status: OrderStatus;
  createdAt: Date;
  items: Array<{ productName: string; quantity: number }>;
}): AdminOrder {
  return {
    id: order.id,
    customer: order.customerName,
    phone: order.customerPhone,
    items: order.items.map((item) => ({
      name: item.productName,
      quantity: item.quantity,
    })),
    total: formatCurrency(decimalToNumber(order.total)),
    status: mapDbOrderStatusToAdmin(order.status),
    time: formatTime(order.createdAt),
    createdAt: order.createdAt.toISOString(),
    address: order.customerAddress || order.customerNeighborhood || "Endereco nao informado",
  };
}

function mapProduct(product: {
  id: string;
  name: string;
  description: string | null;
  price: Prisma.Decimal | number;
  imageUrl: string | null;
  isActive: boolean;
  customizationOptions: Prisma.JsonValue | null;
  category: { name: string };
}): AdminMenuProduct {
  const customizationConfig = parseProductCustomizationConfig(product.customizationOptions);

  return {
    id: product.id,
    name: product.name,
    description: product.description ?? "",
    price: formatCurrency(decimalToNumber(product.price)),
    category: product.category.name,
    status: product.isActive ? "Ativo" : "Inativo",
    imageUrl: product.imageUrl ?? "",
    customizationOptions: summarizeCustomizationConfig(customizationConfig),
    customizationConfig,
  };
}

function mapOffer(offer: {
  id: string;
  name: string;
  type: OfferType;
  discountLabel: string;
  appliesTo: string;
  productIds: string[];
  categoryIds: string[];
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}): AdminOffer {
  return {
    id: offer.id,
    name: offer.name,
    type: mapDbOfferTypeToAdmin(offer.type),
    discount: offer.discountLabel,
    appliesTo: offer.appliesTo,
    startDate: formatDateInput(offer.startDate),
    endDate: formatDateInput(offer.endDate),
    status: offer.isActive ? "Ativa" : "Inativa",
    productIds: offer.productIds,
    categoryIds: offer.categoryIds,
  };
}

function mapCategory(category: { id: string; name: string }): AdminCategoryOption {
  return {
    id: category.id,
    name: category.name,
  };
}

function mapCustomer(customer: {
  id: string;
  name: string;
  phone: string;
  neighborhood: string | null;
  address: string | null;
  isBlocked: boolean;
  orders: Array<{
    id: string;
    createdAt: Date;
    total: Prisma.Decimal | number;
    status: OrderStatus;
  }>;
}): AdminCustomer {
  const sortedOrders = [...customer.orders].sort(
    (left, right) => right.createdAt.getTime() - left.createdAt.getTime(),
  );
  const lastOrder = sortedOrders[0];

  return {
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    locality: customer.neighborhood ?? "Nao informado",
    address: customer.address ?? "Nao informado",
    totalOrders: sortedOrders.length,
    lastOrder: lastOrder ? formatDate(lastOrder.createdAt) : "Sem pedidos",
    status: customer.isBlocked ? "Bloqueado" : "Ativo",
    orderHistory: sortedOrders.map((order) => ({
      id: order.id,
      date: formatDate(order.createdAt),
      total: formatCurrency(decimalToNumber(order.total)),
      status: mapDbOrderStatusToAdmin(order.status),
    })),
  };
}

function buildMetrics(orders: Array<{
  total: Prisma.Decimal | number;
  status: OrderStatus;
  createdAt: Date;
}>) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const todaysOrders = orders.filter(
    (order) => order.createdAt >= startOfDay && order.createdAt <= endOfDay,
  );
  const revenue = todaysOrders
    .filter((order) => order.status !== "CANCELED")
    .reduce((sum, order) => sum + decimalToNumber(order.total), 0);

  return [
    {
      label: "Pedidos de hoje",
      value: String(todaysOrders.length),
      change: `${todaysOrders.length} no dia`,
      trend: "up" as const,
    },
    {
      label: "Pedidos novos",
      value: String(todaysOrders.filter((order) => order.status === "NEW").length),
      change: "Aguardando aceite",
      trend: "neutral" as const,
    },
    {
      label: "Em preparo",
      value: String(todaysOrders.filter((order) => order.status === "PREPARING").length),
      change: "Operacao ativa",
      trend: "neutral" as const,
    },
    {
      label: "Faturamento do dia",
      value: formatCurrency(revenue),
      change: "Receita acumulada",
      trend: "up" as const,
    },
  ];
}

function mapSettings(restaurant: {
  name: string;
  logoUrl: string | null;
  whatsapp: string;
  address: string | null;
  city: string | null;
  state: string | null;
  latitude: Prisma.Decimal | number | null;
  longitude: Prisma.Decimal | number | null;
  workingHours: string | null;
  minimumOrderValue: Prisma.Decimal | number;
  deliveryFee: Prisma.Decimal | number;
  freeDeliveryRadiusKm: Prisma.Decimal | number;
  deliveryActive: boolean;
  pickupActive: boolean;
  acceptCash: boolean;
  acceptPix: boolean;
  acceptCardOnDelivery: boolean;
  pixKey: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  bannerUrl: string | null;
  welcomeMessage: string | null;
}): AdminRestaurantSettings {
  return {
    restaurant: {
      name: restaurant.name,
      logo: restaurant.logoUrl ?? "",
      whatsapp: restaurant.whatsapp,
      address: restaurant.address ?? "",
      city: restaurant.city ?? "",
      state: restaurant.state ?? "",
    },
    operation: {
      workingHours: restaurant.workingHours ?? "",
      minimumOrder: formatCurrency(decimalToNumber(restaurant.minimumOrderValue)),
      deliveryFee: formatCurrency(decimalToNumber(restaurant.deliveryFee)),
      freeDeliveryRadiusKm: decimalToNumber(restaurant.freeDeliveryRadiusKm).toFixed(1).replace(".", ","),
      deliveryActive: restaurant.deliveryActive,
      pickupActive: restaurant.pickupActive,
    },
    payment: {
      cash: restaurant.acceptCash,
      pix: restaurant.acceptPix,
      cardOnDelivery: restaurant.acceptCardOnDelivery,
    },
    appearance: {
      primaryColor: restaurant.primaryColor ?? "#0f172a",
      secondaryColor: restaurant.secondaryColor ?? "#f97316",
      banner: restaurant.bannerUrl ?? "",
      welcomeMessage: restaurant.welcomeMessage ?? "",
    },
  };
}

export async function getAdminBootstrap(
  slug: string,
  accessToken: string,
): Promise<AdminBootstrapPayload | null> {
  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    select: {
      slug: true,
      name: true,
      adminUserName: true,
      adminEmail: true,
      logoUrl: true,
      whatsapp: true,
      address: true,
      city: true,
      state: true,
      latitude: true,
      longitude: true,
      workingHours: true,
      minimumOrderValue: true,
      deliveryFee: true,
      freeDeliveryRadiusKm: true,
      deliveryActive: true,
      pickupActive: true,
      acceptCash: true,
      acceptPix: true,
      acceptCardOnDelivery: true,
      pixKey: true,
      primaryColor: true,
      secondaryColor: true,
      bannerUrl: true,
      welcomeMessage: true,
      categories: {
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        select: {
          id: true,
          name: true,
        },
      },
      orders: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          customerName: true,
          customerPhone: true,
          customerAddress: true,
          customerNeighborhood: true,
          total: true,
          status: true,
          createdAt: true,
          items: {
            select: {
              productName: true,
              quantity: true,
            },
          },
        },
      },
      products: {
        orderBy: [{ category: { sortOrder: "asc" } }, { name: "asc" }],
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          imageUrl: true,
          isActive: true,
          customizationOptions: true,
          category: {
            select: {
              name: true,
            },
          },
        },
      },
      offers: {
        orderBy: [{ isActive: "desc" }, { startDate: "desc" }],
        select: {
          id: true,
          name: true,
          type: true,
          discountLabel: true,
          appliesTo: true,
          productIds: true,
          categoryIds: true,
          startDate: true,
          endDate: true,
          isActive: true,
        },
      },
      customers: {
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          name: true,
          phone: true,
          neighborhood: true,
          address: true,
          isBlocked: true,
          orders: {
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              createdAt: true,
              total: true,
              status: true,
            },
          },
        },
      },
    },
  });

  if (!restaurant) {
    return null;
  }

  return {
    session: mapRestaurantSession({
      ...restaurant,
      accessToken,
    }),
    metrics: buildMetrics(restaurant.orders),
    categories: restaurant.categories.map(mapCategory),
    orders: restaurant.orders.map(mapOrder),
    products: restaurant.products.map(mapProduct),
    offers: restaurant.offers.map(mapOffer),
    customers: restaurant.customers.map(mapCustomer),
    settings: mapSettings(restaurant),
  };
}

export async function ensureCategoryForRestaurant(restaurantId: string, categoryName: string) {
  const normalizedName = categoryName.trim();
  const existingCategory = await prisma.category.findFirst({
    where: {
      restaurantId,
      name: {
        equals: normalizedName,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
    },
  });

  if (existingCategory) {
    return existingCategory.id;
  }

  const lastCategory = await prisma.category.findFirst({
    where: { restaurantId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  const category = await prisma.category.create({
    data: {
      restaurantId,
      name: normalizedName,
      sortOrder: (lastCategory?.sortOrder ?? 0) + 1,
      isActive: true,
    },
    select: {
      id: true,
    },
  });

  return category.id;
}
