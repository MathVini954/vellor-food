import { requireAdminAccess } from "@/lib/admin-auth";
import { Prisma } from "@prisma/client";
import { adminJson, adminOptions } from "@/lib/admin-response";
import { assertInlineAdminImageWithinLimit } from "@/lib/admin-inline-image";
import { prisma } from "@/lib/prisma";
import { parseCustomizationConfig } from "@/services/admin/product-customization";
import { ensureCategoryForRestaurant, parseCurrencyInput } from "@/services/admin/restaurant-admin";

export function OPTIONS(request: Request) {
  return adminOptions(request);
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ slug: string; productId: string }> },
) {
  try {
    const { slug, productId } = await context.params;
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

    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        restaurantId: restaurant.id,
      },
      select: {
        id: true,
      },
    });

    if (!product) {
      return adminJson(request, { error: "Produto nao encontrado." }, { status: 404 });
    }

    const data = {};

    if (body.name !== undefined) {
      Object.assign(data, { name: String(body.name).trim() });
    }
    if (body.description !== undefined) {
      Object.assign(data, { description: String(body.description).trim() });
    }
    if (body.price !== undefined) {
      Object.assign(data, { price: new Prisma.Decimal(parseCurrencyInput(String(body.price))) });
    }
    if (body.imageUrl !== undefined) {
      const imageUrl = String(body.imageUrl).trim();
      assertInlineAdminImageWithinLimit(imageUrl, "A imagem do prato");
      Object.assign(data, { imageUrl });
    }
    if (body.customizationOptions !== undefined || body.customizationConfig !== undefined) {
      Object.assign(data, {
        customizationOptions: parseCustomizationConfig(body.customizationConfig, body.customizationOptions),
      });
    }
    if (body.status !== undefined) {
      Object.assign(data, { isActive: String(body.status) === "Ativo" });
    }
    if (body.category !== undefined) {
      const categoryId = await ensureCategoryForRestaurant(restaurant.id, String(body.category));
      Object.assign(data, { categoryId });
    }

    await prisma.product.update({
      where: { id: product.id },
      data,
    });

    return adminJson(request, { productId: product.id });
  } catch (error) {
    return adminJson(
      request,
      { error: error instanceof Error ? error.message : "Nao foi possivel atualizar o produto." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ slug: string; productId: string }> },
) {
  try {
    const { slug, productId } = await context.params;
    const auth = requireAdminAccess(request, { restaurantSlug: slug });

    if (!auth.ok) {
      return auth.response;
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!restaurant) {
      return adminJson(request, { error: "Restaurante nao encontrado." }, { status: 404 });
    }

    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        restaurantId: restaurant.id,
      },
      select: { id: true },
    });

    if (!product) {
      return adminJson(request, { error: "Produto nao encontrado." }, { status: 404 });
    }

    await prisma.product.delete({
      where: { id: product.id },
    });

    return adminJson(request, { productId: product.id });
  } catch (error) {
    return adminJson(
      request,
      { error: error instanceof Error ? error.message : "Nao foi possivel excluir o produto." },
      { status: 500 },
    );
  }
}
