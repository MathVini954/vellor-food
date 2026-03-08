import { Prisma, SaaSProductCode } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type FoodProvisioningOutput = {
  tenantId: string;
  tenantSlug: string;
  adminUrl: string | null;
  publicUrl: string | null;
};

function buildPublicUrl(slug: string, requestOrigin: string) {
  const baseUrl = process.env.PUBLIC_APP_BASE_URL?.trim() || requestOrigin;
  return `${baseUrl.replace(/\/$/, "")}/r/${slug}`;
}

function buildAdminUrl(slug: string) {
  const baseUrl = process.env.FOOD_ADMIN_APP_URL?.trim();

  if (!baseUrl) {
    return null;
  }

  return `${baseUrl.replace(/\/$/, "")}/admin/${slug}/dashboard`;
}

export async function provisionFoodCompany(input: {
  companyId: string;
  requestOrigin: string;
}): Promise<FoodProvisioningOutput> {
  const company = await prisma.company.findUnique({
    where: { id: input.companyId },
    select: {
      id: true,
      name: true,
      slug: true,
      primaryContactPhone: true,
      productAccesses: {
        where: {
          product: {
            code: SaaSProductCode.FOOD,
          },
        },
        take: 1,
        select: {
          id: true,
          status: true,
          contractStartsAt: true,
          contractEndsAt: true,
          monthlyPrice: true,
          notes: true,
        },
      },
      platformUsers: {
        where: {
          role: "COMPANY_ADMIN",
        },
        orderBy: [{ createdAt: "asc" }],
        take: 1,
        select: {
          email: true,
          name: true,
          passwordHash: true,
          mustChangePassword: true,
        },
      },
      restaurants: {
        orderBy: [{ createdAt: "asc" }],
        take: 1,
        select: {
          id: true,
          slug: true,
          onboardingCompleted: true,
          address: true,
          city: true,
          state: true,
          latitude: true,
          longitude: true,
          logoUrl: true,
          bannerUrl: true,
          primaryColor: true,
          secondaryColor: true,
          welcomeMessage: true,
          isOpen: true,
          deliveryActive: true,
          pickupActive: true,
        },
      },
    },
  });

  if (!company) {
    throw new Error("Empresa nao encontrada para provisionamento FOOD.");
  }

  const productAccess = company.productAccesses[0];

  if (!productAccess) {
    throw new Error("Acesso ao produto FOOD nao encontrado para esta empresa.");
  }

  const adminUser = company.platformUsers[0];

  if (!adminUser?.email || !adminUser.passwordHash) {
    throw new Error("Usuario administrativo da empresa nao encontrado para o FOOD.");
  }

  const currentRestaurant = company.restaurants[0] ?? null;
  const baseRestaurantData = {
    companyId: company.id,
    name: company.name,
    slug: company.slug,
    whatsapp: company.primaryContactPhone ?? "",
    adminEmail: adminUser.email,
    adminPassword: adminUser.passwordHash,
    adminPasswordTemporary: adminUser.mustChangePassword,
    adminUserName: adminUser.name,
    onboardingCompleted: currentRestaurant?.onboardingCompleted ?? false,
    address: currentRestaurant?.address ?? null,
    city: currentRestaurant?.city ?? null,
    state: currentRestaurant?.state ?? null,
    latitude: currentRestaurant?.latitude ?? null,
    longitude: currentRestaurant?.longitude ?? null,
    logoUrl: currentRestaurant?.logoUrl ?? null,
    bannerUrl: currentRestaurant?.bannerUrl ?? null,
    primaryColor: currentRestaurant?.primaryColor ?? "#050505",
    secondaryColor: currentRestaurant?.secondaryColor ?? "#8b8b8b",
    welcomeMessage:
      currentRestaurant?.welcomeMessage ??
      "Setup inicial pendente. Aguardando onboarding da operacao.",
    isOpen: currentRestaurant?.isOpen ?? false,
    deliveryActive: currentRestaurant?.deliveryActive ?? false,
    pickupActive: currentRestaurant?.pickupActive ?? false,
    acceptCash: true,
    acceptPix: true,
    acceptCardOnDelivery: true,
    deliveryFee: new Prisma.Decimal(0),
    freeDeliveryRadiusKm: new Prisma.Decimal(0),
    minimumOrderValue: new Prisma.Decimal(0),
  };

  const restaurant = currentRestaurant
    ? await prisma.restaurant.update({
        where: { id: currentRestaurant.id },
        data: baseRestaurantData,
        select: {
          id: true,
          slug: true,
        },
      })
    : await prisma.restaurant.create({
        data: baseRestaurantData,
        select: {
          id: true,
          slug: true,
        },
      });

  await prisma.restaurantContract.upsert({
    where: { restaurantId: restaurant.id },
    update: {
      status: productAccess.status as never,
      startsAt: productAccess.contractStartsAt,
      endsAt: productAccess.contractEndsAt,
      canceledAt: productAccess.status === "CANCELED" ? new Date() : null,
      monthlyPrice: productAccess.monthlyPrice,
      notes: productAccess.notes,
    },
    create: {
      restaurantId: restaurant.id,
      status: productAccess.status as never,
      startsAt: productAccess.contractStartsAt,
      endsAt: productAccess.contractEndsAt,
      canceledAt: productAccess.status === "CANCELED" ? new Date() : null,
      monthlyPrice: productAccess.monthlyPrice,
      notes: productAccess.notes,
    },
  });

  return {
    tenantId: restaurant.id,
    tenantSlug: restaurant.slug,
    adminUrl: buildAdminUrl(restaurant.slug),
    publicUrl: buildPublicUrl(restaurant.slug, input.requestOrigin),
  };
}
