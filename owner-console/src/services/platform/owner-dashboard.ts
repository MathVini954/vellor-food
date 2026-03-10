import {
  CompanyStatus,
  PlatformUserRole,
  Prisma,
  ProvisioningJobStatus,
  ProductAccessStatus,
  RestaurantContractStatus,
  SaaSProductCode,
} from "@prisma/client";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import {
  ensureDefaultDiningTables,
  ensureRestaurantDigitalMenuToken,
} from "@/services/food/dining-room";
import { runProvisioningJob } from "@/services/platform/provisioning";

function slugifyCompanyName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

async function generateUniqueCompanySlug(name: string) {
  const baseSlug = slugifyCompanyName(name) || "empresa";
  let candidate = baseSlug;
  let suffix = 2;

  while (await prisma.company.findUnique({ where: { slug: candidate }, select: { id: true } })) {
    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

function parseDecimalInput(value: string | null | undefined) {
  const normalized = String(value ?? "")
    .replace(/[^\d,.-]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toCompanyStatus(status: RestaurantContractStatus): CompanyStatus {
  return status as unknown as CompanyStatus;
}

function toProductAccessStatus(status: RestaurantContractStatus): ProductAccessStatus {
  return status as unknown as ProductAccessStatus;
}

function toRestaurantContractStatus(status: ProductAccessStatus): RestaurantContractStatus {
  return status as unknown as RestaurantContractStatus;
}

function getProductMetadata(productCode: SaaSProductCode) {
  if (productCode === "BARBER") {
    return {
      name: "Barber",
      description: "Gestao de barbearia, agenda e servicos.",
    };
  }

  return {
    name: "Food",
    description: "Operacao completa para cardapio, pedidos e delivery.",
  };
}

function hasProvisioningUrl(productCode: SaaSProductCode) {
  if (productCode === "BARBER") {
    return Boolean(process.env.BARBER_PROVISIONING_URL?.trim());
  }

  return Boolean(process.env.FOOD_PROVISIONING_URL?.trim());
}

async function ensureProduct(tx: Prisma.TransactionClient, productCode: SaaSProductCode) {
  const metadata = getProductMetadata(productCode);

  return tx.saaSProduct.upsert({
    where: { code: productCode },
    update: {
      name: metadata.name,
      description: metadata.description,
    },
    create: {
      code: productCode,
      name: metadata.name,
      description: metadata.description,
    },
  });
}

function getPublicAppBaseUrl() {
  const explicitBaseUrl = process.env.PUBLIC_APP_BASE_URL?.trim();

  if (explicitBaseUrl) {
    return explicitBaseUrl.replace(/\/$/, "");
  }

  const provisioningUrl = process.env.FOOD_PROVISIONING_URL?.trim();

  if (!provisioningUrl) {
    return null;
  }

  try {
    return new URL(provisioningUrl).origin.replace(/\/$/, "");
  } catch {
    return null;
  }
}

function getFoodAdminAppBaseUrl() {
  return process.env.FOOD_ADMIN_APP_URL?.trim()?.replace(/\/$/, "") ?? null;
}

function buildPublicRestaurantUrl(slug: string) {
  const baseUrl = getPublicAppBaseUrl();

  if (!baseUrl) {
    return null;
  }

  return `${baseUrl}/r/${slug}`;
}

function buildDigitalMenuUrl(token: string | null | undefined) {
  if (!token) {
    return null;
  }

  const baseUrl = getPublicAppBaseUrl();

  if (!baseUrl) {
    return null;
  }

  return `${baseUrl}/cardapio/${token}`;
}

function buildFoodAdminUrl(slug: string) {
  const baseUrl = getFoodAdminAppBaseUrl();

  if (!baseUrl) {
    return null;
  }

  return `${baseUrl}/admin/${slug}/dashboard`;
}

function buildQrCodeUrl(value: string | null) {
  if (!value) {
    return null;
  }

  return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(value)}`;
}

export type ManagedCompanyRecord = {
  id: string;
  companyId: string;
  foodTenantId: string | null;
  productCode: SaaSProductCode;
  name: string;
  slug: string;
  whatsapp: string;
  adminEmail: string | null;
  adminUserName: string | null;
  adminPasswordTemporary: boolean;
  onboardingCompleted: boolean;
  city: string | null;
  state: string | null;
  createdAt: Date;
  contract: {
    status: RestaurantContractStatus;
    startsAt: Date;
    endsAt: Date | null;
    canceledAt: Date | null;
    monthlyPrice: Prisma.Decimal | null;
    notes: string | null;
  } | null;
  _count: {
    products: number;
    orders: number;
    customers: number;
  };
  featureAccess: {
    adminEnabled: boolean;
    publicOrderingEnabled: boolean;
    digitalMenuEnabled: boolean;
  };
  links: {
    publicUrl: string | null;
    adminUrl: string | null;
    digitalMenuUrl: string | null;
    digitalMenuQrCodeUrl: string | null;
  };
  lastProvisioningJob: {
    id: string;
    status: ProvisioningJobStatus;
    createdAt: Date;
    finishedAt: Date | null;
    errorMessage: string | null;
  } | null;
};

export type ManagedProvisioningJobRecord = {
  id: string;
  companyId: string;
  companyName: string;
  companySlug: string;
  productCode: SaaSProductCode;
  productName: string;
  status: ProvisioningJobStatus;
  requestedByEmail: string | null;
  createdAt: Date;
  startedAt: Date | null;
  finishedAt: Date | null;
  errorMessage: string | null;
};

export type ManagedCompanyDetail = {
  id: string;
  companyId: string;
  foodTenantId: string | null;
  name: string;
  slug: string;
  legalName: string | null;
  status: CompanyStatus;
  createdAt: Date;
  updatedAt: Date;
  primaryContactName: string | null;
  primaryContactEmail: string | null;
  primaryContactPhone: string | null;
  adminUser: {
    id: string;
    name: string;
    email: string;
    mustChangePassword: boolean;
    isActive: boolean;
    lastLoginAt: Date | null;
  } | null;
  contract: {
    status: RestaurantContractStatus;
    startsAt: Date;
    endsAt: Date | null;
    canceledAt: Date | null;
    monthlyPrice: Prisma.Decimal | null;
    notes: string | null;
  } | null;
  featureAccess: {
    adminEnabled: boolean;
    publicOrderingEnabled: boolean;
    digitalMenuEnabled: boolean;
  };
  links: {
    publicUrl: string | null;
    adminUrl: string | null;
    digitalMenuUrl: string | null;
    digitalMenuQrCodeUrl: string | null;
  };
  restaurant: {
    id: string;
    name: string;
    slug: string;
    whatsapp: string;
    adminEmail: string | null;
    adminUserName: string | null;
    adminPasswordTemporary: boolean;
    onboardingCompleted: boolean;
    address: string | null;
    city: string | null;
    state: string | null;
    logoUrl: string | null;
    bannerUrl: string | null;
    isOpen: boolean;
    deliveryActive: boolean;
    pickupActive: boolean;
    counts: {
      categories: number;
      products: number;
      orders: number;
      customers: number;
      offers: number;
      diningTables: number;
      openTableSessions: number;
    };
    totals: {
      grossRevenue: Prisma.Decimal | null;
      paidRevenue: Prisma.Decimal | null;
      last30DaysOrders: number;
    };
    recentOrders: Array<{
      id: string;
      customerName: string;
      total: Prisma.Decimal;
      status: string;
      orderType: string;
      paymentStatus: string;
      createdAt: Date;
      tableSessionId: string | null;
    }>;
  } | null;
  provisioningJobs: ManagedProvisioningJobRecord[];
};

export type ManagedCompanyOrderRecord = {
  id: string;
  customerName: string;
  customerPhone: string;
  total: Prisma.Decimal;
  status: string;
  orderType: string;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: Date;
  notes: string | null;
  address: string | null;
  neighborhood: string | null;
  tableSessionId: string | null;
  tableLabel: string | null;
  itemCount: number;
  items: Array<{
    id: string;
    productName: string;
    quantity: number;
    totalPrice: Prisma.Decimal;
    customizations: string | null;
  }>;
};

export async function listManagedCompanies(query?: string) {
  const companies = await prisma.company.findMany({
    orderBy: [{ createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      primaryContactPhone: true,
      createdAt: true,
      productAccesses: {
        orderBy: [{ createdAt: "asc" }],
        take: 1,
        select: {
          status: true,
          contractStartsAt: true,
          contractEndsAt: true,
          monthlyPrice: true,
          notes: true,
          product: {
            select: {
              code: true,
            },
          },
        },
      },
      provisioningJobs: {
        orderBy: [{ createdAt: "desc" }],
        take: 1,
        select: {
          id: true,
          status: true,
          createdAt: true,
          finishedAt: true,
          errorMessage: true,
        },
      },
      platformUsers: {
        where: {
          role: PlatformUserRole.COMPANY_ADMIN,
        },
        orderBy: [{ createdAt: "asc" }],
        take: 1,
        select: {
          email: true,
          name: true,
          mustChangePassword: true,
        },
      },
      restaurants: {
        orderBy: [{ createdAt: "asc" }],
        take: 1,
        select: {
          id: true,
          slug: true,
          adminPasswordTemporary: true,
          onboardingCompleted: true,
          adminModuleEnabled: true,
          publicOrderingEnabled: true,
          digitalMenuEnabled: true,
          digitalMenuToken: true,
          city: true,
          state: true,
          _count: {
            select: {
              products: true,
              orders: true,
              customers: true,
            },
          },
        },
      },
    },
  });

  const normalizedQuery = query?.trim().toLowerCase() ?? "";

  return companies
    .filter((company) => {
      if (!normalizedQuery) {
        return true;
      }

      const companyAdmin = company.platformUsers[0] ?? null;

      return [
        company.name,
        company.slug,
        company.primaryContactPhone ?? "",
        companyAdmin?.email ?? "",
        companyAdmin?.name ?? "",
      ].some((value) => value.toLowerCase().includes(normalizedQuery));
    })
    .map((company) => {
    const productAccess = company.productAccesses[0] ?? null;
    const companyAdmin = company.platformUsers[0] ?? null;
    const foodTenant = company.restaurants[0] ?? null;
    const digitalMenuUrl = buildDigitalMenuUrl(foodTenant?.digitalMenuToken);

    return {
      id: company.id,
      companyId: company.id,
      foodTenantId: foodTenant?.id ?? null,
      productCode: productAccess?.product.code ?? "FOOD",
      name: company.name,
      slug: company.slug,
      whatsapp: company.primaryContactPhone ?? "",
      adminEmail: companyAdmin?.email ?? null,
      adminUserName: companyAdmin?.name ?? null,
      adminPasswordTemporary: foodTenant?.adminPasswordTemporary ?? companyAdmin?.mustChangePassword ?? true,
      onboardingCompleted: foodTenant?.onboardingCompleted ?? false,
      city: foodTenant?.city ?? null,
      state: foodTenant?.state ?? null,
      createdAt: company.createdAt,
      contract: productAccess
        ? {
            status: toRestaurantContractStatus(productAccess.status),
            startsAt: productAccess.contractStartsAt,
            endsAt: productAccess.contractEndsAt,
            canceledAt: productAccess.status === "CANCELED" ? productAccess.contractEndsAt : null,
            monthlyPrice: productAccess.monthlyPrice,
            notes: productAccess.notes,
          }
        : null,
      _count: {
        products: foodTenant?._count.products ?? 0,
        orders: foodTenant?._count.orders ?? 0,
        customers: foodTenant?._count.customers ?? 0,
      },
      featureAccess: {
        adminEnabled: foodTenant?.adminModuleEnabled ?? true,
        publicOrderingEnabled: foodTenant?.publicOrderingEnabled ?? true,
        digitalMenuEnabled: foodTenant?.digitalMenuEnabled ?? false,
      },
      links: {
        publicUrl: foodTenant ? buildPublicRestaurantUrl(foodTenant.slug ?? company.slug) : null,
        adminUrl: foodTenant ? buildFoodAdminUrl(foodTenant.slug ?? company.slug) : null,
        digitalMenuUrl,
        digitalMenuQrCodeUrl: buildQrCodeUrl(digitalMenuUrl),
      },
      lastProvisioningJob: company.provisioningJobs[0] ?? null,
    } satisfies ManagedCompanyRecord;
    });
}

export async function listRecentProvisioningJobs(limit = 10) {
  const jobs = await prisma.provisioningJob.findMany({
    orderBy: [{ createdAt: "desc" }],
    take: limit,
    select: {
      id: true,
      status: true,
      requestedByEmail: true,
      createdAt: true,
      startedAt: true,
      finishedAt: true,
      errorMessage: true,
      product: {
        select: {
          code: true,
          name: true,
        },
      },
      company: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });

  return jobs.map((job) => ({
    id: job.id,
    companyId: job.company.id,
    companyName: job.company.name,
    companySlug: job.company.slug,
    productCode: job.product.code,
    productName: job.product.name,
    status: job.status,
    requestedByEmail: job.requestedByEmail,
    createdAt: job.createdAt,
    startedAt: job.startedAt,
    finishedAt: job.finishedAt,
    errorMessage: job.errorMessage,
  })) satisfies ManagedProvisioningJobRecord[];
}

export async function getManagedCompanyDetail(companyId: string) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: {
      id: true,
      name: true,
      slug: true,
      legalName: true,
      status: true,
      primaryContactName: true,
      primaryContactEmail: true,
      primaryContactPhone: true,
      createdAt: true,
      updatedAt: true,
      productAccesses: {
        where: {
          product: {
            code: SaaSProductCode.FOOD,
          },
        },
        orderBy: [{ createdAt: "asc" }],
        take: 1,
        select: {
          status: true,
          contractStartsAt: true,
          contractEndsAt: true,
          monthlyPrice: true,
          notes: true,
        },
      },
      platformUsers: {
        where: {
          role: PlatformUserRole.COMPANY_ADMIN,
        },
        orderBy: [{ createdAt: "asc" }],
        take: 1,
        select: {
          id: true,
          name: true,
          email: true,
          mustChangePassword: true,
          isActive: true,
          lastLoginAt: true,
        },
      },
      provisioningJobs: {
        orderBy: [{ createdAt: "desc" }],
        take: 10,
        select: {
          id: true,
          status: true,
          requestedByEmail: true,
          createdAt: true,
          startedAt: true,
          finishedAt: true,
          errorMessage: true,
          product: {
            select: {
              code: true,
              name: true,
            },
          },
          company: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
      restaurants: {
        orderBy: [{ createdAt: "asc" }],
        take: 1,
        select: {
          id: true,
          name: true,
          slug: true,
          whatsapp: true,
          adminEmail: true,
          adminUserName: true,
          adminPasswordTemporary: true,
          onboardingCompleted: true,
          address: true,
          city: true,
          state: true,
          logoUrl: true,
          bannerUrl: true,
          isOpen: true,
          deliveryActive: true,
          pickupActive: true,
          adminModuleEnabled: true,
          publicOrderingEnabled: true,
          digitalMenuEnabled: true,
          digitalMenuToken: true,
          _count: {
            select: {
              categories: true,
              products: true,
              orders: true,
              customers: true,
              offers: true,
              diningTables: true,
            },
          },
          orders: {
            orderBy: [{ createdAt: "desc" }],
            take: 6,
            select: {
              id: true,
              customerName: true,
              total: true,
              status: true,
              orderType: true,
              paymentStatus: true,
              createdAt: true,
              tableSessionId: true,
            },
          },
        },
      },
    },
  });

  if (!company) {
    return null;
  }

  const foodTenant = company.restaurants[0] ?? null;
  const contract = company.productAccesses[0] ?? null;
  const adminUser = company.platformUsers[0] ?? null;
  const digitalMenuUrl = buildDigitalMenuUrl(foodTenant?.digitalMenuToken);

  let restaurantCounts = {
    openTableSessions: 0,
    grossRevenue: null as Prisma.Decimal | null,
    paidRevenue: null as Prisma.Decimal | null,
    last30DaysOrders: 0,
  };

  if (foodTenant) {
    const [openTableSessions, revenueAggregate, paidAggregate, last30DaysOrders] = await Promise.all([
      prisma.tableSession.count({
        where: {
          restaurantId: foodTenant.id,
          status: "OPEN",
        },
      }),
      prisma.order.aggregate({
        where: {
          restaurantId: foodTenant.id,
          status: {
            not: "CANCELED",
          },
        },
        _sum: {
          total: true,
        },
      }),
      prisma.order.aggregate({
        where: {
          restaurantId: foodTenant.id,
          paymentStatus: "PAID",
        },
        _sum: {
          total: true,
        },
      }),
      prisma.order.count({
        where: {
          restaurantId: foodTenant.id,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    restaurantCounts = {
      openTableSessions,
      grossRevenue: revenueAggregate._sum.total ?? null,
      paidRevenue: paidAggregate._sum.total ?? null,
      last30DaysOrders,
    };
  }

  return {
    id: company.id,
    companyId: company.id,
    foodTenantId: foodTenant?.id ?? null,
    name: company.name,
    slug: company.slug,
    legalName: company.legalName,
    status: company.status,
    createdAt: company.createdAt,
    updatedAt: company.updatedAt,
    primaryContactName: company.primaryContactName,
    primaryContactEmail: company.primaryContactEmail,
    primaryContactPhone: company.primaryContactPhone,
    adminUser,
    contract: contract
      ? {
          status: toRestaurantContractStatus(contract.status),
          startsAt: contract.contractStartsAt,
          endsAt: contract.contractEndsAt,
          canceledAt: contract.status === "CANCELED" ? contract.contractEndsAt : null,
          monthlyPrice: contract.monthlyPrice,
          notes: contract.notes,
        }
      : null,
    featureAccess: {
      adminEnabled: foodTenant?.adminModuleEnabled ?? true,
      publicOrderingEnabled: foodTenant?.publicOrderingEnabled ?? true,
      digitalMenuEnabled: foodTenant?.digitalMenuEnabled ?? false,
    },
    links: {
      publicUrl: foodTenant ? buildPublicRestaurantUrl(foodTenant.slug) : null,
      adminUrl: foodTenant ? buildFoodAdminUrl(foodTenant.slug) : null,
      digitalMenuUrl,
      digitalMenuQrCodeUrl: buildQrCodeUrl(digitalMenuUrl),
    },
    restaurant: foodTenant
      ? {
          id: foodTenant.id,
          name: foodTenant.name,
          slug: foodTenant.slug,
          whatsapp: foodTenant.whatsapp,
          adminEmail: foodTenant.adminEmail,
          adminUserName: foodTenant.adminUserName,
          adminPasswordTemporary: foodTenant.adminPasswordTemporary,
          onboardingCompleted: foodTenant.onboardingCompleted,
          address: foodTenant.address,
          city: foodTenant.city,
          state: foodTenant.state,
          logoUrl: foodTenant.logoUrl,
          bannerUrl: foodTenant.bannerUrl,
          isOpen: foodTenant.isOpen,
          deliveryActive: foodTenant.deliveryActive,
          pickupActive: foodTenant.pickupActive,
          counts: {
            categories: foodTenant._count.categories,
            products: foodTenant._count.products,
            orders: foodTenant._count.orders,
            customers: foodTenant._count.customers,
            offers: foodTenant._count.offers,
            diningTables: foodTenant._count.diningTables,
            openTableSessions: restaurantCounts.openTableSessions,
          },
          totals: {
            grossRevenue: restaurantCounts.grossRevenue,
            paidRevenue: restaurantCounts.paidRevenue,
            last30DaysOrders: restaurantCounts.last30DaysOrders,
          },
          recentOrders: foodTenant.orders.map((order) => ({
            id: order.id,
            customerName: order.customerName,
            total: order.total,
            status: order.status,
            orderType: order.orderType,
            paymentStatus: order.paymentStatus,
            createdAt: order.createdAt,
            tableSessionId: order.tableSessionId,
          })),
        }
      : null,
    provisioningJobs: company.provisioningJobs.map((job) => ({
      id: job.id,
      companyId: job.company.id,
      companyName: job.company.name,
      companySlug: job.company.slug,
      productCode: job.product.code,
      productName: job.product.name,
      status: job.status,
      requestedByEmail: job.requestedByEmail,
      createdAt: job.createdAt,
      startedAt: job.startedAt,
      finishedAt: job.finishedAt,
      errorMessage: job.errorMessage,
    })),
  } satisfies ManagedCompanyDetail;
}

export async function listManagedCompanyOrders(companyId: string) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: {
      id: true,
      name: true,
      slug: true,
      restaurants: {
        orderBy: [{ createdAt: "asc" }],
        take: 1,
        select: {
          id: true,
          name: true,
          slug: true,
          orders: {
            orderBy: [{ createdAt: "desc" }],
            take: 120,
            select: {
              id: true,
              customerName: true,
              customerPhone: true,
              total: true,
              status: true,
              orderType: true,
              paymentMethod: true,
              paymentStatus: true,
              createdAt: true,
              notes: true,
              customerAddress: true,
              customerNeighborhood: true,
              tableSessionId: true,
              tableSession: {
                select: {
                  diningTable: {
                    select: {
                      label: true,
                    },
                  },
                },
              },
              items: {
                orderBy: [{ createdAt: "asc" }],
                select: {
                  id: true,
                  productName: true,
                  quantity: true,
                  totalPrice: true,
                  customizations: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!company) {
    return null;
  }

  const restaurant = company.restaurants[0] ?? null;

  return {
    companyId: company.id,
    companyName: company.name,
    companySlug: company.slug,
    restaurant: restaurant
      ? {
          id: restaurant.id,
          name: restaurant.name,
          slug: restaurant.slug,
        }
      : null,
    orders:
      restaurant?.orders.map((order) => ({
        id: order.id,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        total: order.total,
        status: order.status,
        orderType: order.orderType,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt,
        notes: order.notes,
        address: order.customerAddress,
        neighborhood: order.customerNeighborhood,
        tableSessionId: order.tableSessionId,
        tableLabel: order.tableSession?.diningTable.label ?? null,
        itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
        items: order.items.map((item) => ({
          id: item.id,
          productName: item.productName,
          quantity: item.quantity,
          totalPrice: item.totalPrice,
          customizations: item.customizations,
        })),
      })) ?? [],
  };
}

export async function createManagedCompany(input: {
  companyName: string;
  primaryContactPhone: string;
  adminName: string;
  email: string;
  temporaryPassword: string;
  contractStartsAt: string;
  contractEndsAt?: string;
  monthlyPrice?: string;
  notes?: string;
  status?: RestaurantContractStatus;
  productCode?: SaaSProductCode;
  adminEnabled?: boolean;
  publicOrderingEnabled?: boolean;
  digitalMenuEnabled?: boolean;
}) {
  const companyName = input.companyName.trim();
  const primaryContactPhone = input.primaryContactPhone.replace(/\D/g, "");
  const adminName = input.adminName.trim();
  const email = input.email.trim().toLowerCase();
  const temporaryPassword = input.temporaryPassword;
  const contractStartsAt = input.contractStartsAt.trim();
  const contractEndsAt = input.contractEndsAt?.trim() ?? "";
  const notes = input.notes?.trim() ?? "";
  const status = input.status ?? "ACTIVE";
  const productCode = input.productCode ?? "FOOD";
  const adminEnabled = input.adminEnabled ?? true;
  const publicOrderingEnabled = input.publicOrderingEnabled ?? true;
  const digitalMenuEnabled = input.digitalMenuEnabled ?? false;

  if (!companyName || !primaryContactPhone || !adminName || !email || !temporaryPassword) {
    throw new Error("Preencha os campos obrigatorios da empresa.");
  }

  const existingPlatformUser = await prisma.platformUser.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingPlatformUser) {
    throw new Error("Ja existe uma empresa provisionada com este email administrativo.");
  }

  const slug = await generateUniqueCompanySlug(companyName);
  const passwordHash = await hashPassword(temporaryPassword);

  const result = await prisma.$transaction(async (tx) => {
    const product = await ensureProduct(tx, productCode);
    const platformCompany = await tx.company.create({
      data: {
        name: companyName,
        slug,
        status: toCompanyStatus(status),
        primaryContactName: adminName,
        primaryContactEmail: email,
        primaryContactPhone: primaryContactPhone,
      },
      select: {
        id: true,
      },
    });

    const productAccess = await tx.companyProductAccess.create({
      data: {
        companyId: platformCompany.id,
        productId: product.id,
        status: toProductAccessStatus(status),
        contractStartsAt: contractStartsAt ? new Date(`${contractStartsAt}T12:00:00.000Z`) : new Date(),
        contractEndsAt: contractEndsAt ? new Date(`${contractEndsAt}T23:59:59.999Z`) : null,
        monthlyPrice:
          input.monthlyPrice && input.monthlyPrice.trim()
            ? new Prisma.Decimal(parseDecimalInput(input.monthlyPrice))
            : null,
        notes: notes || null,
      },
      select: {
        id: true,
      },
    });

    await tx.platformUser.create({
      data: {
        companyId: platformCompany.id,
        email,
        passwordHash,
        name: adminName,
        role: PlatformUserRole.COMPANY_ADMIN,
        mustChangePassword: true,
      },
    });

    return {
      companyId: platformCompany.id,
      productAccessId: productAccess.id,
      productCode,
      requestedByEmail: email,
    };
  });

  await runProvisioningJob({
    companyId: result.companyId,
    productCode: result.productCode,
    requestedByEmail: result.requestedByEmail,
    featureAccess: {
      adminEnabled,
      publicOrderingEnabled,
      digitalMenuEnabled,
    },
  });

  return result;
}

export async function updateManagedCompanyContract(input: {
  companyId: string;
  status: RestaurantContractStatus;
  endsAt?: string;
  monthlyPrice?: string;
  notes?: string;
  productCode?: SaaSProductCode;
  adminEnabled?: boolean;
  publicOrderingEnabled?: boolean;
  digitalMenuEnabled?: boolean;
}) {
  const endsAt = input.endsAt?.trim() ?? "";
  const monthlyPrice = input.monthlyPrice?.trim() ?? "";
  const notes = input.notes?.trim() ?? "";
  const productCode = input.productCode ?? "FOOD";
  const adminEnabled = input.adminEnabled ?? true;
  const publicOrderingEnabled = input.publicOrderingEnabled ?? true;
  const digitalMenuEnabled = input.digitalMenuEnabled ?? false;

  const company = await prisma.company.findUnique({
    where: { id: input.companyId },
    select: {
      id: true,
      platformUsers: {
        where: {
          role: PlatformUserRole.COMPANY_ADMIN,
        },
        orderBy: [{ createdAt: "asc" }],
        take: 1,
        select: {
          email: true,
        },
      },
      productAccesses: {
        where: {
          product: {
            code: productCode,
          },
        },
        select: {
          id: true,
          productId: true,
        },
        take: 1,
      },
      restaurants: {
        select: {
          id: true,
          digitalMenuToken: true,
        },
      },
    },
  });

  if (!company) {
    throw new Error("Empresa nao encontrada.");
  }

  const product = company.productAccesses[0];

  if (!product) {
    throw new Error(`Produto ${productCode} nao ativado para esta empresa.`);
  }

  const contractEndsAt = endsAt ? new Date(`${endsAt}T23:59:59.999Z`) : null;

  await prisma.$transaction(async (tx) => {
    await tx.company.update({
      where: { id: company.id },
      data: {
        status: toCompanyStatus(input.status),
      },
    });

    await tx.companyProductAccess.update({
      where: { id: product.id },
      data: {
        status: toProductAccessStatus(input.status),
        contractEndsAt,
        monthlyPrice: monthlyPrice ? new Prisma.Decimal(parseDecimalInput(monthlyPrice)) : null,
        notes: notes || null,
      },
    });

    const foodTenant = company.restaurants[0];

    if (productCode === "FOOD" && foodTenant) {
      await tx.restaurant.update({
        where: { id: foodTenant.id },
        data: {
          adminModuleEnabled: adminEnabled,
          publicOrderingEnabled,
          digitalMenuEnabled,
        },
      });

      await tx.restaurantContract.upsert({
        where: { restaurantId: foodTenant.id },
        update: {
          status: input.status,
          endsAt: contractEndsAt,
          canceledAt: input.status === "CANCELED" ? new Date() : null,
          monthlyPrice: monthlyPrice ? new Prisma.Decimal(parseDecimalInput(monthlyPrice)) : null,
          notes: notes || null,
        },
        create: {
          restaurantId: foodTenant.id,
          status: input.status,
          startsAt: new Date(),
          endsAt: contractEndsAt,
          canceledAt: input.status === "CANCELED" ? new Date() : null,
          monthlyPrice: monthlyPrice ? new Prisma.Decimal(parseDecimalInput(monthlyPrice)) : null,
          notes: notes || null,
        },
      });

      if (digitalMenuEnabled) {
        await ensureDefaultDiningTables(tx, foodTenant.id);
        await ensureRestaurantDigitalMenuToken(tx, foodTenant.id, foodTenant.digitalMenuToken);
      }
    }
  });

  const shouldSynchronizeFoodTenant =
    productCode === "FOOD" &&
    hasProvisioningUrl(productCode) &&
    (company.restaurants.length > 0 || input.status === "ACTIVE");

  if (shouldSynchronizeFoodTenant) {
    try {
      await runProvisioningJob({
        companyId: company.id,
        productCode,
        requestedByEmail: company.platformUsers[0]?.email ?? null,
        featureAccess: {
          adminEnabled,
          publicOrderingEnabled,
          digitalMenuEnabled,
        },
      });
    } catch (error) {
      throw new Error(
        `Contrato salvo, mas a sincronizacao do tenant FOOD falhou: ${
          error instanceof Error ? error.message : "erro desconhecido"
        }`,
      );
    }
  }
}

export async function reprocessManagedCompanyProvisioning(input: {
  companyId: string;
  productCode?: SaaSProductCode;
}) {
  const productCode = input.productCode ?? "FOOD";
  const company = await prisma.company.findUnique({
    where: { id: input.companyId },
    select: {
      id: true,
      platformUsers: {
        where: {
          role: PlatformUserRole.COMPANY_ADMIN,
        },
        orderBy: [{ createdAt: "asc" }],
        take: 1,
        select: {
          email: true,
        },
      },
      restaurants: {
        orderBy: [{ createdAt: "asc" }],
        take: 1,
        select: {
          adminModuleEnabled: true,
          publicOrderingEnabled: true,
          digitalMenuEnabled: true,
        },
      },
    },
  });

  if (!company) {
    throw new Error("Empresa nao encontrada.");
  }

  const foodTenant = company.restaurants[0] ?? null;

  return runProvisioningJob({
    companyId: company.id,
    productCode,
    requestedByEmail: company.platformUsers[0]?.email ?? null,
    featureAccess: {
      adminEnabled: foodTenant?.adminModuleEnabled ?? true,
      publicOrderingEnabled: foodTenant?.publicOrderingEnabled ?? true,
      digitalMenuEnabled: foodTenant?.digitalMenuEnabled ?? false,
    },
  });
}

export async function deleteManagedCompany(companyId: string) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: {
      id: true,
      restaurants: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!company) {
    throw new Error("Empresa nao encontrada.");
  }

  for (const restaurant of company.restaurants) {
    await prisma.orderItem.deleteMany({
      where: {
        order: {
          restaurantId: restaurant.id,
        },
      },
    });
    await prisma.order.deleteMany({ where: { restaurantId: restaurant.id } });
    await prisma.offer.deleteMany({ where: { restaurantId: restaurant.id } });
    await prisma.product.deleteMany({ where: { restaurantId: restaurant.id } });
    await prisma.category.deleteMany({ where: { restaurantId: restaurant.id } });
    await prisma.deliveryArea.deleteMany({ where: { restaurantId: restaurant.id } });
    await prisma.customer.deleteMany({ where: { restaurantId: restaurant.id } });
    await prisma.restaurantContract.deleteMany({ where: { restaurantId: restaurant.id } });
    await prisma.restaurant.delete({ where: { id: restaurant.id } });
  }

  await prisma.company.delete({
    where: {
      id: company.id,
    },
  });
}
