import { requireAdminAccess } from "@/lib/admin-auth";
import { adminJson, adminOptions } from "@/lib/admin-response";
import { prisma } from "@/lib/prisma";
import { mapAdminOfferTypeToDb } from "@/services/admin/restaurant-admin";

export function OPTIONS(request: Request) {
  return adminOptions(request);
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ slug: string; offerId: string }> },
) {
  try {
    const { slug, offerId } = await context.params;
    const auth = requireAdminAccess(request, { restaurantSlug: slug });

    if (!auth.ok) {
      return auth.response;
    }

    const body = await request.json();
    const restaurant = await prisma.restaurant.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!restaurant) {
      return adminJson(request, { error: "Restaurante nao encontrado." }, { status: 404 });
    }

    const offer = await prisma.offer.findFirst({
      where: {
        id: offerId,
        restaurantId: restaurant.id,
      },
      select: {
        id: true,
        productIds: true,
        categoryIds: true,
      },
    });

    if (!offer) {
      return adminJson(request, { error: "Oferta nao encontrada." }, { status: 404 });
    }

    const data = {};
    const productIds = Array.isArray(body.productIds)
      ? body.productIds
          .map((id: unknown) => String(id ?? "").trim())
          .filter((id: string) => id.length > 0)
      : null;
    const categoryIds = Array.isArray(body.categoryIds)
      ? body.categoryIds
          .map((id: unknown) => String(id ?? "").trim())
          .filter((id: string) => id.length > 0)
      : null;

    const nextProductIds = productIds ?? offer.productIds;
    const nextCategoryIds = categoryIds ?? offer.categoryIds;

    if ((productIds !== null || categoryIds !== null) && !nextProductIds.length && !nextCategoryIds.length) {
      return adminJson(request, 
        { error: "Selecione ao menos um prato ou categoria para esta oferta." },
        { status: 400 },
      );
    }

    if (body.name !== undefined) {
      Object.assign(data, { name: String(body.name).trim() });
    }
    if (body.type !== undefined) {
      Object.assign(data, {
        type: mapAdminOfferTypeToDb(body.type as Parameters<typeof mapAdminOfferTypeToDb>[0]),
      });
    }
    if (body.discount !== undefined) {
      Object.assign(data, { discountLabel: String(body.discount).trim() });
    }
    if (body.appliesTo !== undefined) {
      Object.assign(data, { appliesTo: String(body.appliesTo).trim() });
    }
    if (productIds !== null) {
      Object.assign(data, { productIds });
    }
    if (categoryIds !== null) {
      Object.assign(data, { categoryIds });
    }
    if (body.startDate !== undefined) {
      Object.assign(data, { startDate: new Date(`${String(body.startDate)}T12:00:00.000Z`) });
    }
    if (body.endDate !== undefined) {
      Object.assign(data, { endDate: new Date(`${String(body.endDate)}T23:59:59.999Z`) });
    }
    if (body.status !== undefined) {
      Object.assign(data, { isActive: String(body.status) === "Ativa" });
    }

    await prisma.offer.update({
      where: { id: offer.id },
      data,
    });

    return adminJson(request, { offerId: offer.id });
  } catch (error) {
    return adminJson(request, 
      { error: error instanceof Error ? error.message : "Nao foi possivel atualizar a oferta." },
      { status: 500 },
    );
  }
}
