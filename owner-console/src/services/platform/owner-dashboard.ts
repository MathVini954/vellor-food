import {
  CompanyStatus,
  PlatformUserRole,
  Prisma,
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
};

export async function listManagedCompanies() {
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
          adminPasswordTemporary: true,
          onboardingCompleted: true,
          adminModuleEnabled: true,
          publicOrderingEnabled: true,
          digitalMenuEnabled: true,
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

  return companies.map((company) => {
    const productAccess = company.productAccesses[0] ?? null;
    const companyAdmin = company.platformUsers[0] ?? null;
    const foodTenant = company.restaurants[0] ?? null;

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
    } satisfies ManagedCompanyRecord;
  });
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
  notes?: string;
  productCode?: SaaSProductCode;
  adminEnabled?: boolean;
  publicOrderingEnabled?: boolean;
  digitalMenuEnabled?: boolean;
}) {
  const endsAt = input.endsAt?.trim() ?? "";
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
          notes: notes || null,
        },
        create: {
          restaurantId: foodTenant.id,
          status: input.status,
          startsAt: new Date(),
          endsAt: contractEndsAt,
          canceledAt: input.status === "CANCELED" ? new Date() : null,
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
