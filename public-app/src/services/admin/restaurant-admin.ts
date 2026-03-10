import {
  CompanyStatus,
  OfferType,
  OrderStatus,
  PlatformUserRole,
  Prisma,
  ProductAccessStatus,
  RestaurantContractStatus,
  SaaSProductCode,
  TableSessionStatus,
} from "@prisma/client";
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
  AdminDiningTable,
  AdminFeatureAccess,
  AdminInitialSetupPayload,
  AdminMenuProduct,
  AdminOffer,
  AdminOfferType,
  AdminOrder,
  AdminOrderStatus,
  AdminRestaurantSettings,
  AdminSessionPayload,
  AdminTableSession,
} from "@/types/admin";
import {
  ensureDefaultDiningTables,
  ensureRestaurantDigitalMenuToken,
} from "@/services/food/dining-room";

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

function canCompanyAccessFood(input: {
  companyStatus: CompanyStatus;
  productAccess: {
    status: ProductAccessStatus;
    contractEndsAt: Date | null;
  } | null;
}) {
  if (input.companyStatus !== "ACTIVE") {
    return false;
  }

  if (!input.productAccess) {
    return false;
  }

  if (input.productAccess.status !== "ACTIVE") {
    return false;
  }

  if (input.productAccess.contractEndsAt && input.productAccess.contractEndsAt.getTime() < Date.now()) {
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

function getOrderTypeLabel(orderType: "DELIVERY" | "PICKUP" | "DINE_IN") {
  if (orderType === "DELIVERY") {
    return "Entrega";
  }

  if (orderType === "PICKUP") {
    return "Retirada";
  }

  return "Mesa";
}

function getPaymentMethodLabel(
  paymentMethod: "CASH" | "PIX" | "CARD_ON_DELIVERY" | "PAY_ON_PICKUP",
  orderType: "DELIVERY" | "PICKUP" | "DINE_IN",
) {
  if (orderType === "DINE_IN" && paymentMethod === "PAY_ON_PICKUP") {
    return "Pagamento no caixa";
  }

  const labels = {
    CASH: "Dinheiro",
    PIX: "Pix",
    CARD_ON_DELIVERY: "Cartao na entrega",
    PAY_ON_PICKUP: "Pagar na retirada",
  } as const;

  return labels[paymentMethod];
}

function mapTableSessionStatus(status: TableSessionStatus): AdminTableSession["status"] {
  const labels: Record<TableSessionStatus, AdminTableSession["status"]> = {
    OPEN: "Aberta",
    CLOSED: "Encerrada",
    MERGED: "Mesclada",
    CANCELED: "Cancelada",
  };

  return labels[status];
}

function buildDigitalMenuUrl(token: string | null) {
  if (!token) {
    return null;
  }

  const baseUrl = process.env.PUBLIC_APP_BASE_URL?.trim() || process.env.NEXT_PUBLIC_APP_BASE_URL?.trim();

  if (!baseUrl) {
    return `/cardapio/${token}`;
  }

  return `${baseUrl.replace(/\/$/, "")}/cardapio/${token}`;
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

async function ensureFoodProduct(tx: Prisma.TransactionClient) {
  return tx.saaSProduct.upsert({
    where: { code: SaaSProductCode.FOOD },
    update: {},
    create: {
      code: SaaSProductCode.FOOD,
      name: "Food",
      description: "Operacao completa para cardapio, pedidos e delivery.",
    },
  });
}

async function ensurePlatformIdentityForRestaurant(
  restaurant: {
    id: string;
    companyId: string | null;
    slug: string;
    name: string;
    adminEmail: string | null;
    adminUserName: string | null;
    whatsapp: string;
    contract: {
      status: RestaurantContractStatus;
      startsAt: Date;
      endsAt: Date | null;
      monthlyPrice: Prisma.Decimal | null;
      notes: string | null;
    } | null;
  },
  options: {
    passwordHash: string;
    email: string;
    userName: string;
    mustChangePassword: boolean;
  },
) {
  return prisma.$transaction(async (tx) => {
    const foodProduct = await ensureFoodProduct(tx);
    let companyId = restaurant.companyId;

    if (!companyId) {
      const company = await tx.company.upsert({
        where: { slug: restaurant.slug },
        update: {
          name: restaurant.name,
          status: restaurant.contract?.status === "ACTIVE" ? "ACTIVE" : "INACTIVE",
          primaryContactName: options.userName,
          primaryContactEmail: options.email,
          primaryContactPhone: restaurant.whatsapp,
        },
        create: {
          name: restaurant.name,
          slug: restaurant.slug,
          status: restaurant.contract?.status === "ACTIVE" ? "ACTIVE" : "INACTIVE",
          primaryContactName: options.userName,
          primaryContactEmail: options.email,
          primaryContactPhone: restaurant.whatsapp,
        },
        select: {
          id: true,
        },
      });

      companyId = company.id;

      await tx.restaurant.update({
        where: { id: restaurant.id },
        data: {
          companyId,
        },
      });
    } else {
      await tx.company.update({
        where: { id: companyId },
        data: {
          name: restaurant.name,
          slug: restaurant.slug,
          primaryContactName: options.userName,
          primaryContactEmail: options.email,
          primaryContactPhone: restaurant.whatsapp,
        },
      });
    }

    await tx.companyProductAccess.upsert({
      where: {
        companyId_productId: {
          companyId,
          productId: foodProduct.id,
        },
      },
      update: {
        status: restaurant.contract?.status === "ACTIVE" ? "ACTIVE" : "INACTIVE",
        contractStartsAt: restaurant.contract?.startsAt ?? new Date(),
        contractEndsAt: restaurant.contract?.endsAt ?? null,
        monthlyPrice: restaurant.contract?.monthlyPrice ?? null,
        notes: restaurant.contract?.notes ?? null,
      },
      create: {
        companyId,
        productId: foodProduct.id,
        status: restaurant.contract?.status === "ACTIVE" ? "ACTIVE" : "INACTIVE",
        contractStartsAt: restaurant.contract?.startsAt ?? new Date(),
        contractEndsAt: restaurant.contract?.endsAt ?? null,
        monthlyPrice: restaurant.contract?.monthlyPrice ?? null,
        notes: restaurant.contract?.notes ?? null,
      },
    });

    await tx.platformUser.upsert({
      where: { email: options.email },
      update: {
        companyId,
        name: options.userName,
        passwordHash: options.passwordHash,
        role: PlatformUserRole.COMPANY_ADMIN,
        mustChangePassword: options.mustChangePassword,
        isActive: true,
        lastLoginAt: new Date(),
      },
      create: {
        companyId,
        email: options.email,
        passwordHash: options.passwordHash,
        name: options.userName,
        role: PlatformUserRole.COMPANY_ADMIN,
        mustChangePassword: options.mustChangePassword,
        isActive: true,
        lastLoginAt: new Date(),
      },
    });

    return companyId;
  });
}

export async function findRestaurantForAdminLogin(email: string, password: string) {
  const normalizedEmail = email.toLowerCase().trim();
  const platformUser = await prisma.platformUser.findUnique({
    where: {
      email: normalizedEmail,
    },
    select: {
      id: true,
      companyId: true,
      email: true,
      passwordHash: true,
      name: true,
      mustChangePassword: true,
      isActive: true,
      company: {
        select: {
          id: true,
          status: true,
          productAccesses: {
            where: {
              product: {
                code: SaaSProductCode.FOOD,
              },
            },
            select: {
              status: true,
              contractEndsAt: true,
            },
            take: 1,
          },
          restaurants: {
            orderBy: [{ createdAt: "asc" }],
            select: {
              slug: true,
              name: true,
              adminModuleEnabled: true,
              adminUserName: true,
              adminEmail: true,
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
          },
        },
      },
    },
  });

  if (platformUser?.passwordHash) {
    const passwordMatches = await verifyPassword(password, platformUser.passwordHash);

    if (passwordMatches) {
      if (!platformUser.isActive) {
        throw new Error("Acesso da empresa indisponivel. Verifique o status do contrato.");
      }

      if (!platformUser.company || !platformUser.companyId) {
        throw new Error("Empresa nao vinculada ao usuario administrativo.");
      }

      const productAccess = platformUser.company.productAccesses[0] ?? null;

      if (
        !canCompanyAccessFood({
          companyStatus: platformUser.company.status,
          productAccess,
        })
      ) {
        throw new Error("Acesso da empresa indisponivel. Verifique o status do contrato.");
      }

      const restaurant =
        platformUser.company.restaurants.find((entry) => entry.adminEmail === normalizedEmail) ??
        platformUser.company.restaurants[0];

      if (!restaurant) {
        throw new Error("Empresa sem operacao FOOD provisionada.");
      }

      if (!canRestaurantAccessAdmin(restaurant.contract)) {
        throw new Error("Acesso da empresa indisponivel. Verifique o status do contrato.");
      }

      await prisma.platformUser.update({
        where: { id: platformUser.id },
        data: {
          lastLoginAt: new Date(),
        },
      });

      return {
        slug: restaurant.slug,
        name: restaurant.name,
        adminUserName: platformUser.name || restaurant.adminUserName,
        adminEmail: platformUser.email,
        adminPasswordTemporary: restaurant.adminPasswordTemporary || platformUser.mustChangePassword,
        onboardingCompleted: restaurant.onboardingCompleted,
        whatsapp: restaurant.whatsapp,
        address: restaurant.address,
        city: restaurant.city,
        state: restaurant.state,
      };
    }
  }

  const restaurant = await prisma.restaurant.findFirst({
    where: {
      adminEmail: normalizedEmail,
    },
    select: {
      id: true,
      companyId: true,
      slug: true,
      name: true,
      adminModuleEnabled: true,
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
          startsAt: true,
          endsAt: true,
          canceledAt: true,
          monthlyPrice: true,
          notes: true,
        },
      },
    },
  });

  if (!restaurant || !restaurant.adminPassword) {
    return null;
  }

  const passwordMatches = await verifyPassword(password, restaurant.adminPassword);

  if (!passwordMatches) {
    return null;
  }

      if (!canRestaurantAccessAdmin(restaurant.contract)) {
        throw new Error("Acesso da empresa indisponivel. Verifique o status do contrato.");
      }

      if (!restaurant.adminModuleEnabled) {
        throw new Error("O pacote gerencial desta empresa esta desativado.");
      }

  const userName = restaurant.adminUserName ?? "Gerente";
  const passwordHash =
    restaurant.adminPassword.startsWith("scrypt:") ? restaurant.adminPassword : await hashPassword(password);

  if (restaurant.adminPassword && !restaurant.adminPassword.startsWith("scrypt:")) {
    await prisma.restaurant.update({
      where: { slug: restaurant.slug },
      data: {
        adminPassword: passwordHash,
      },
    });
  }

  await ensurePlatformIdentityForRestaurant(
    {
      id: restaurant.id,
      companyId: restaurant.companyId,
      slug: restaurant.slug,
      name: restaurant.name,
      adminEmail: restaurant.adminEmail,
      adminUserName: restaurant.adminUserName,
      whatsapp: restaurant.whatsapp,
      contract: restaurant.contract,
    },
    {
      passwordHash,
      email: normalizedEmail,
      userName,
      mustChangePassword: restaurant.adminPasswordTemporary || !restaurant.onboardingCompleted,
    },
  );

  return {
    slug: restaurant.slug,
    name: restaurant.name,
    adminUserName: userName,
    adminEmail: restaurant.adminEmail ?? normalizedEmail,
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
}): AdminSessionPayload {
  return {
    restaurantSlug: restaurant.slug,
    restaurantName: restaurant.name,
    userName: restaurant.adminUserName ?? "Gerente",
    userEmail: restaurant.adminEmail ?? "",
    platformName: PLATFORM_NAME,
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
      adminModuleEnabled: true,
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

  if (!restaurant.adminModuleEnabled) {
    throw new Error("O pacote gerencial desta empresa esta desativado.");
  }

  if (!restaurant.adminModuleEnabled) {
    throw new Error("O pacote gerencial desta empresa esta desativado.");
  }

  const geocodedPoint = await geocodeAddress([address, city, state, "Brasil"]);
  const passwordHash = await hashPassword(password);

  const updatedRestaurant = await prisma.$transaction(async (tx) => {
    const updated = await tx.restaurant.update({
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
        companyId: true,
      },
    });

    if (updated.companyId) {
      await tx.company.update({
        where: { id: updated.companyId },
        data: {
          name: companyName,
          primaryContactName: adminName,
          primaryContactEmail: email,
          primaryContactPhone: whatsapp,
        },
      });

      await tx.platformUser.upsert({
        where: { email },
        update: {
          companyId: updated.companyId,
          name: adminName,
          passwordHash,
          role: PlatformUserRole.COMPANY_ADMIN,
          mustChangePassword: false,
          isActive: true,
          lastLoginAt: new Date(),
        },
        create: {
          companyId: updated.companyId,
          email,
          passwordHash,
          name: adminName,
          role: PlatformUserRole.COMPANY_ADMIN,
          mustChangePassword: false,
          isActive: true,
          lastLoginAt: new Date(),
        },
      });
    }

    return updated;
  });

  return updatedRestaurant;
}

function mapOrder(order: {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string | null;
  customerNeighborhood: string | null;
  orderType: "DELIVERY" | "PICKUP" | "DINE_IN";
  paymentMethod: "CASH" | "PIX" | "CARD_ON_DELIVERY" | "PAY_ON_PICKUP";
  notes: string | null;
  total: Prisma.Decimal | number;
  status: OrderStatus;
  createdAt: Date;
  tableSession: {
    id: string;
    diningTable: {
      label: string;
    };
  } | null;
  items: Array<{ productName: string; quantity: number; customizations?: string | null }>;
}): AdminOrder {
  const isTableOrder = order.orderType === "DINE_IN";

  return {
    id: order.id,
    customer: order.customerName,
    phone: order.customerPhone,
    items: order.items.map((item) => ({
      name: item.customizations ? `${item.productName} (${item.customizations})` : item.productName,
      quantity: item.quantity,
    })),
    total: formatCurrency(decimalToNumber(order.total)),
    status: mapDbOrderStatusToAdmin(order.status),
    time: formatTime(order.createdAt),
    createdAt: order.createdAt.toISOString(),
    address: isTableOrder
      ? order.tableSession?.diningTable.label ?? "Mesa nao informada"
      : order.customerAddress || order.customerNeighborhood || "Endereco nao informado",
    channel: isTableOrder ? "TABLE" : "ONLINE",
    channelLabel: isTableOrder ? "Mesa" : "Online",
    orderTypeLabel: getOrderTypeLabel(order.orderType),
    paymentMethodLabel: getPaymentMethodLabel(order.paymentMethod, order.orderType),
    notes: order.notes,
    tableLabel: order.tableSession?.diningTable.label ?? null,
    tableSessionId: order.tableSession?.id ?? null,
  };
}

function mapDiningTable(table: {
  id: string;
  identifier: string;
  label: string;
  area: string | null;
  seats: number | null;
  sortOrder: number;
  isActive: boolean;
  sessions: Array<{
    id: string;
    openedAt: Date;
    orders: Array<{
      total: Prisma.Decimal | number;
      customerName: string;
    }>;
  }>;
}): AdminDiningTable {
  const openSession = table.sessions[0] ?? null;
  const sessionOrders = openSession?.orders ?? [];

  return {
    id: table.id,
    identifier: table.identifier,
    label: table.label,
    area: table.area ?? "",
    seats: table.seats,
    sortOrder: table.sortOrder,
    isActive: table.isActive,
    status: openSession ? "Ocupada" : "Livre",
    total: formatCurrency(
      sessionOrders.reduce((sum, order) => sum + decimalToNumber(order.total), 0),
    ),
    orderCount: sessionOrders.length,
    customerCount: new Set(sessionOrders.map((order) => order.customerName)).size,
    openedAt: openSession ? openSession.openedAt.toISOString() : null,
    openSessionId: openSession?.id ?? null,
  };
}

function mapTableSession(tableSession: {
  id: string;
  status: TableSessionStatus;
  openedAt: Date;
  closedAt: Date | null;
  notes: string | null;
  diningTable: {
    id: string;
    identifier: string;
    label: string;
  };
  orders: Array<{
    id: string;
    customerName: string;
    customerPhone: string;
    customerAddress: string | null;
    customerNeighborhood: string | null;
    orderType: "DELIVERY" | "PICKUP" | "DINE_IN";
    paymentMethod: "CASH" | "PIX" | "CARD_ON_DELIVERY" | "PAY_ON_PICKUP";
    notes: string | null;
    total: Prisma.Decimal | number;
    status: OrderStatus;
    createdAt: Date;
    items: Array<{
      productName: string;
      quantity: number;
      customizations: string | null;
    }>;
  }>;
}): AdminTableSession {
  const mappedOrders = tableSession.orders.map((order) =>
    mapOrder({
      ...order,
      tableSession: {
        id: tableSession.id,
        diningTable: {
          label: tableSession.diningTable.label,
        },
      },
    }),
  );

  return {
    id: tableSession.id,
    tableId: tableSession.diningTable.id,
    tableIdentifier: tableSession.diningTable.identifier,
    tableLabel: tableSession.diningTable.label,
    status: mapTableSessionStatus(tableSession.status),
    openedAt: tableSession.openedAt.toISOString(),
    closedAt: tableSession.closedAt ? tableSession.closedAt.toISOString() : null,
    total: formatCurrency(
      tableSession.orders.reduce((sum, order) => sum + decimalToNumber(order.total), 0),
    ),
    itemCount: tableSession.orders.reduce(
      (sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
      0,
    ),
    customerCount: new Set(tableSession.orders.map((order) => order.customerName)).size,
    notes: tableSession.notes,
    customerNames: [...new Set(tableSession.orders.map((order) => order.customerName))],
    orders: mappedOrders,
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

function buildMetrics(
  orders: Array<{
  total: Prisma.Decimal | number;
  status: OrderStatus;
  createdAt: Date;
}>,
  openTablesCount: number,
) {
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
      label: "Mesas abertas",
      value: String(openTablesCount),
      change: "Comandas em andamento",
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

function mapFeatureAccess(restaurant: {
  adminModuleEnabled: boolean;
  publicOrderingEnabled: boolean;
  digitalMenuEnabled: boolean;
  digitalMenuToken: string | null;
}): AdminFeatureAccess {
  return {
    adminEnabled: restaurant.adminModuleEnabled,
    publicOrderingEnabled: restaurant.publicOrderingEnabled,
    digitalMenuEnabled: restaurant.digitalMenuEnabled,
    digitalMenuUrl: restaurant.digitalMenuEnabled
      ? buildDigitalMenuUrl(restaurant.digitalMenuToken)
      : null,
  };
}

export async function getAdminBootstrap(
  slug: string,
  currentUserEmail?: string,
): Promise<AdminBootstrapPayload | null> {
  const restaurantIdentity = await prisma.restaurant.findUnique({
    where: { slug },
    select: {
      id: true,
      adminModuleEnabled: true,
      digitalMenuEnabled: true,
      digitalMenuToken: true,
    },
  });

  if (!restaurantIdentity) {
    return null;
  }

  if (restaurantIdentity.digitalMenuEnabled) {
    await ensureRestaurantDigitalMenuToken(
      prisma,
      restaurantIdentity.id,
      restaurantIdentity.digitalMenuToken,
    );
    await ensureDefaultDiningTables(prisma, restaurantIdentity.id);
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      companyId: true,
      name: true,
      adminModuleEnabled: true,
      publicOrderingEnabled: true,
      digitalMenuEnabled: true,
      digitalMenuToken: true,
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
          orderType: true,
          paymentMethod: true,
          notes: true,
          total: true,
          status: true,
          createdAt: true,
          tableSession: {
            select: {
              id: true,
              diningTable: {
                select: {
                  label: true,
                },
              },
            },
          },
          items: {
            select: {
              productName: true,
              quantity: true,
              customizations: true,
            },
          },
        },
      },
      diningTables: {
        orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
        select: {
          id: true,
          identifier: true,
          label: true,
          area: true,
          seats: true,
          sortOrder: true,
          isActive: true,
          sessions: {
            where: {
              status: "OPEN",
            },
            orderBy: {
              openedAt: "desc",
            },
            take: 1,
            select: {
              id: true,
              openedAt: true,
              orders: {
                where: {
                  orderType: "DINE_IN",
                },
                select: {
                  total: true,
                  customerName: true,
                },
              },
            },
          },
        },
      },
      tableSessions: {
        where: {
          status: {
            in: ["OPEN", "CLOSED", "MERGED"],
          },
        },
        orderBy: [{ openedAt: "desc" }],
        take: 40,
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
              customerName: true,
              customerPhone: true,
              customerAddress: true,
              customerNeighborhood: true,
              orderType: true,
              paymentMethod: true,
              notes: true,
              total: true,
              status: true,
              createdAt: true,
              items: {
                select: {
                  productName: true,
                  quantity: true,
                  customizations: true,
                },
              },
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

  if (!restaurant.adminModuleEnabled) {
    throw new Error("O pacote gerencial desta empresa esta desativado.");
  }

  const platformUser =
    restaurant.companyId && currentUserEmail
      ? await prisma.platformUser.findFirst({
          where: {
            companyId: restaurant.companyId,
            email: currentUserEmail.toLowerCase().trim(),
            isActive: true,
          },
          select: {
            name: true,
            email: true,
          },
        })
      : null;

  const onlineOrders = restaurant.orders
    .filter((order) => order.orderType !== "DINE_IN")
    .map(mapOrder);
  const tableOrders = restaurant.orders
    .filter((order) => order.orderType === "DINE_IN")
    .map(mapOrder);
  const tableSessions = restaurant.digitalMenuEnabled
    ? restaurant.tableSessions.map(mapTableSession)
    : [];
  const diningTables = restaurant.digitalMenuEnabled
    ? restaurant.diningTables.map(mapDiningTable)
    : [];

  return {
    session: mapRestaurantSession({
      ...restaurant,
      adminUserName: platformUser?.name ?? restaurant.adminUserName,
      adminEmail: platformUser?.email ?? restaurant.adminEmail,
    }),
    metrics: buildMetrics(
      restaurant.orders,
      restaurant.digitalMenuEnabled
        ? diningTables.filter((table) => table.status === "Ocupada").length
        : 0,
    ),
    categories: restaurant.categories.map(mapCategory),
    orders: onlineOrders,
    tableOrders,
    diningTables,
    tableSessions,
    featureAccess: mapFeatureAccess(restaurant),
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
