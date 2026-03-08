import {
  CompanyStatus,
  Prisma,
  ProductAccessStatus,
  RestaurantContractStatus,
  SaaSProductCode,
} from "@prisma/client";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

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

  while (await prisma.restaurant.findUnique({ where: { slug: candidate }, select: { id: true } })) {
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

export type ManagedCompanyRecord = {
  id: string;
  companyId: string | null;
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
};

function toCompanyStatus(status: RestaurantContractStatus): CompanyStatus {
  return status as unknown as CompanyStatus;
}

function toProductAccessStatus(status: RestaurantContractStatus): ProductAccessStatus {
  return status as unknown as ProductAccessStatus;
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

export async function listManagedCompanies() {
  return prisma.restaurant.findMany({
    orderBy: [{ createdAt: "desc" }],
    select: {
      id: true,
      companyId: true,
      name: true,
      slug: true,
      whatsapp: true,
      adminEmail: true,
      adminUserName: true,
      adminPasswordTemporary: true,
      onboardingCompleted: true,
      city: true,
      state: true,
      createdAt: true,
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
      _count: {
        select: {
          products: true,
          orders: true,
          customers: true,
        },
      },
    },
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

  if (!companyName || !primaryContactPhone || !adminName || !email || !temporaryPassword) {
    throw new Error("Preencha os campos obrigatorios da empresa.");
  }

  const existingEmail = await prisma.restaurant.findFirst({
    where: { adminEmail: email },
    select: { id: true },
  });

  const existingPlatformUser = await prisma.platformUser.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingEmail || existingPlatformUser) {
    throw new Error("Ja existe uma empresa provisionada com este email administrativo.");
  }

  const slug = await generateUniqueCompanySlug(companyName);
  const passwordHash = await hashPassword(temporaryPassword);

  return prisma.$transaction(async (tx) => {
    const foodProduct = await ensureFoodProduct(tx);
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

    await tx.companyProductAccess.create({
      data: {
        companyId: platformCompany.id,
        productId: foodProduct.id,
        status: toProductAccessStatus(status),
        contractStartsAt: contractStartsAt ? new Date(`${contractStartsAt}T12:00:00.000Z`) : new Date(),
        contractEndsAt: contractEndsAt ? new Date(`${contractEndsAt}T23:59:59.999Z`) : null,
        monthlyPrice:
          input.monthlyPrice && input.monthlyPrice.trim()
            ? new Prisma.Decimal(parseDecimalInput(input.monthlyPrice))
            : null,
        notes: notes || null,
      },
    });

    await tx.platformUser.create({
      data: {
        companyId: platformCompany.id,
        email,
        passwordHash,
        name: adminName,
        role: "COMPANY_ADMIN",
        mustChangePassword: true,
      },
    });

    const restaurant = await tx.restaurant.create({
      data: {
        companyId: platformCompany.id,
        name: companyName,
        slug,
        whatsapp: primaryContactPhone,
        adminEmail: email,
        adminPassword: passwordHash,
        adminPasswordTemporary: true,
        adminUserName: adminName,
        onboardingCompleted: false,
        primaryColor: "#050505",
        secondaryColor: "#8b8b8b",
        welcomeMessage: "Setup inicial pendente. Aguardando onboarding da operacao.",
        deliveryFee: new Prisma.Decimal(0),
        freeDeliveryRadiusKm: new Prisma.Decimal(0),
        minimumOrderValue: new Prisma.Decimal(0),
        isOpen: false,
        deliveryActive: false,
        pickupActive: false,
        acceptCash: true,
        acceptPix: true,
        acceptCardOnDelivery: true,
      },
      select: {
        id: true,
        slug: true,
      },
    });

    await tx.restaurantContract.create({
      data: {
        restaurantId: restaurant.id,
        status,
        startsAt: contractStartsAt ? new Date(`${contractStartsAt}T12:00:00.000Z`) : new Date(),
        endsAt: contractEndsAt ? new Date(`${contractEndsAt}T23:59:59.999Z`) : null,
        monthlyPrice:
          input.monthlyPrice && input.monthlyPrice.trim()
            ? new Prisma.Decimal(parseDecimalInput(input.monthlyPrice))
            : null,
        notes: notes || null,
      },
    });

    return restaurant;
  });
}

export async function updateManagedCompanyContract(input: {
  restaurantId: string;
  status: RestaurantContractStatus;
  endsAt?: string;
  notes?: string;
}) {
  const endsAt = input.endsAt?.trim() ?? "";
  const notes = input.notes?.trim() ?? "";

  const company = await prisma.restaurant.findUnique({
    where: { id: input.restaurantId },
    select: { id: true, companyId: true },
  });

  if (!company) {
    throw new Error("Empresa nao encontrada.");
  }

  const data: Prisma.RestaurantContractUpdateInput = {
    status: input.status,
    notes: notes || null,
    canceledAt: input.status === "CANCELED" ? new Date() : null,
    endsAt: endsAt ? new Date(`${endsAt}T23:59:59.999Z`) : null,
  };

  return prisma.$transaction(async (tx) => {
    const contract = await tx.restaurantContract.upsert({
      where: { restaurantId: company.id },
      update: data,
      create: {
        restaurantId: company.id,
        status: input.status,
        startsAt: new Date(),
        endsAt: endsAt ? new Date(`${endsAt}T23:59:59.999Z`) : null,
        canceledAt: input.status === "CANCELED" ? new Date() : null,
        notes: notes || null,
      },
    });

    if (company.companyId) {
      await tx.company.update({
        where: { id: company.companyId },
        data: {
          status: toCompanyStatus(input.status),
        },
      });

      const foodProduct = await ensureFoodProduct(tx);
      await tx.companyProductAccess.upsert({
        where: {
          companyId_productId: {
            companyId: company.companyId,
            productId: foodProduct.id,
          },
        },
        update: {
          status: toProductAccessStatus(input.status),
          contractEndsAt: endsAt ? new Date(`${endsAt}T23:59:59.999Z`) : null,
          notes: notes || null,
        },
        create: {
          companyId: company.companyId,
          productId: foodProduct.id,
          status: toProductAccessStatus(input.status),
          contractStartsAt: new Date(),
          contractEndsAt: endsAt ? new Date(`${endsAt}T23:59:59.999Z`) : null,
          notes: notes || null,
        },
      });
    }

    return contract;
  });
}

export async function deleteManagedCompany(restaurantId: string) {
  const company = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { id: true, companyId: true },
  });

  if (!company) {
    throw new Error("Empresa nao encontrada.");
  }

  await prisma.orderItem.deleteMany({
    where: {
      order: {
        restaurantId,
      },
    },
  });
  await prisma.order.deleteMany({ where: { restaurantId } });
  await prisma.offer.deleteMany({ where: { restaurantId } });
  await prisma.product.deleteMany({ where: { restaurantId } });
  await prisma.category.deleteMany({ where: { restaurantId } });
  await prisma.deliveryArea.deleteMany({ where: { restaurantId } });
  await prisma.customer.deleteMany({ where: { restaurantId } });
  await prisma.restaurantContract.deleteMany({ where: { restaurantId } });
  await prisma.restaurant.delete({ where: { id: restaurantId } });

  if (company.companyId) {
    await prisma.company.delete({ where: { id: company.companyId } });
  }
}
