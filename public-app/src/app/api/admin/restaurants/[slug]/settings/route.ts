import { requireAdminAccess } from "@/lib/admin-auth";
import { Prisma } from "@prisma/client";
import { adminJson, adminOptions } from "@/lib/admin-response";
import { assertInlineAdminImageWithinLimit } from "@/lib/admin-inline-image";
import { geocodeAddress } from "@/lib/geocoding";
import { prisma } from "@/lib/prisma";
import { parseCurrencyInput } from "@/services/admin/restaurant-admin";

export function OPTIONS(request: Request) {
  return adminOptions(request);
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await context.params;
    const auth = requireAdminAccess(request, { restaurantSlug: slug });

    if (!auth.ok) {
      return auth.response;
    }

    const body = await request.json();
    const settings = body.settings;

    if (!settings) {
      return adminJson(request, { error: "Dados de configuracao nao enviados." }, { status: 400 });
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!restaurant) {
      return adminJson(request, { error: "Restaurante nao encontrado." }, { status: 404 });
    }

    const restaurantAddress = String(settings.restaurant?.address ?? "").trim() || null;
    const restaurantCity = String(settings.restaurant?.city ?? "").trim() || null;
    const restaurantState = String(settings.restaurant?.state ?? "").trim().toUpperCase() || null;
    const bannerUrl = String(settings.appearance?.banner ?? "").trim();
    const geocodedRestaurant =
      restaurantAddress && restaurantCity && restaurantState
        ? await geocodeAddress([restaurantAddress, restaurantCity, restaurantState, "Brasil"])
        : null;

    assertInlineAdminImageWithinLimit(bannerUrl, "O banner");

    await prisma.$transaction(async (tx) => {
      await tx.restaurant.update({
        where: { id: restaurant.id },
        data: {
          name: String(settings.restaurant?.name ?? "").trim(),
          logoUrl: String(settings.restaurant?.logo ?? "").trim() || null,
          whatsapp: String(settings.restaurant?.whatsapp ?? "").trim(),
          address: restaurantAddress,
          city: restaurantCity,
          state: restaurantState,
          latitude:
            geocodedRestaurant != null ? new Prisma.Decimal(geocodedRestaurant.latitude) : null,
          longitude:
            geocodedRestaurant != null ? new Prisma.Decimal(geocodedRestaurant.longitude) : null,
          workingHours: String(settings.operation?.workingHours ?? "").trim() || null,
          minimumOrderValue: new Prisma.Decimal(
            parseCurrencyInput(String(settings.operation?.minimumOrder ?? "0")),
          ),
          deliveryFee: new Prisma.Decimal(
            parseCurrencyInput(String(settings.operation?.deliveryFee ?? "0")),
          ),
          freeDeliveryRadiusKm: new Prisma.Decimal(
            parseCurrencyInput(String(settings.operation?.freeDeliveryRadiusKm ?? "0")),
          ),
          deliveryActive: Boolean(settings.operation?.deliveryActive),
          pickupActive: Boolean(settings.operation?.pickupActive),
          acceptCash: Boolean(settings.payment?.cash),
          acceptPix: Boolean(settings.payment?.pix),
          acceptCardOnDelivery: Boolean(settings.payment?.cardOnDelivery),
          primaryColor: String(settings.appearance?.primaryColor ?? "").trim() || null,
          secondaryColor: String(settings.appearance?.secondaryColor ?? "").trim() || null,
          bannerUrl: bannerUrl || null,
          welcomeMessage: String(settings.appearance?.welcomeMessage ?? "").trim() || null,
        },
      });
    });

    return adminJson(request, { success: true });
  } catch (error) {
    return adminJson(request, 
      {
        error:
          error instanceof Error ? error.message : "Nao foi possivel salvar as configuracoes.",
      },
      { status: 500 },
    );
  }
}
