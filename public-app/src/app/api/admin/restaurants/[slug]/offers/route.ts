import { requireAdminAccess } from "@/lib/admin-auth";
import { adminJson, adminOptions } from "@/lib/admin-response";
import { prisma } from "@/lib/prisma";
import { mapAdminOfferTypeToDb } from "@/services/admin/restaurant-admin";

export function OPTIONS() {
  return adminOptions();
}

export async function POST(
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
    const name = String(body.name ?? "").trim();
    const type = String(body.type ?? "").trim();
    const discount = String(body.discount ?? "").trim();
    const appliesTo = String(body.appliesTo ?? "").trim();
    const startDate = String(body.startDate ?? "").trim();
    const endDate = String(body.endDate ?? "").trim();
    const status = String(body.status ?? "Ativa").trim();
    const productIds = Array.isArray(body.productIds)
      ? body.productIds
          .map((id: unknown) => String(id ?? "").trim())
          .filter((id: string) => id.length > 0)
      : [];
    const categoryIds = Array.isArray(body.categoryIds)
      ? body.categoryIds
          .map((id: unknown) => String(id ?? "").trim())
          .filter((id: string) => id.length > 0)
      : [];

    if (!name || !type || !discount || !appliesTo || !startDate || !endDate) {
      return adminJson({ error: "Preencha os campos obrigatorios da oferta." }, { status: 400 });
    }

    if (!productIds.length && !categoryIds.length) {
      return adminJson(
        { error: "Selecione ao menos um prato ou categoria para esta oferta." },
        { status: 400 },
      );
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!restaurant) {
      return adminJson({ error: "Restaurante nao encontrado." }, { status: 404 });
    }

    const offer = await prisma.offer.create({
      data: {
        restaurantId: restaurant.id,
        name,
        type: mapAdminOfferTypeToDb(type as Parameters<typeof mapAdminOfferTypeToDb>[0]),
        discountLabel: discount,
        appliesTo,
        productIds,
        categoryIds,
        startDate: new Date(`${startDate}T12:00:00.000Z`),
        endDate: new Date(`${endDate}T23:59:59.999Z`),
        isActive: status === "Ativa",
      },
      select: {
        id: true,
      },
    });

    return adminJson({ offerId: offer.id });
  } catch (error) {
    return adminJson(
      { error: error instanceof Error ? error.message : "Nao foi possivel criar a oferta." },
      { status: 500 },
    );
  }
}
