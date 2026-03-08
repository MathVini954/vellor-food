import { requireAdminAccess } from "@/lib/admin-auth";
import { Prisma } from "@prisma/client";
import { adminJson, adminOptions } from "@/lib/admin-response";
import { prisma } from "@/lib/prisma";
import { parseCustomizationConfig } from "@/services/admin/product-customization";
import { ensureCategoryForRestaurant, parseCurrencyInput } from "@/services/admin/restaurant-admin";

export function OPTIONS(request: Request) {
  return adminOptions(request);
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
    const description = String(body.description ?? "").trim();
    const price = String(body.price ?? "").trim();
    const category = String(body.category ?? "").trim();
    const imageUrl = String(body.imageUrl ?? "").trim();
    const status = String(body.status ?? "Ativo");
    const customizationConfig = parseCustomizationConfig(body.customizationConfig, body.customizationOptions);

    if (!name || !description || !price || !category || !imageUrl) {
      return adminJson(request, { error: "Preencha os campos obrigatorios do produto." }, { status: 400 });
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!restaurant) {
      return adminJson(request, { error: "Restaurante nao encontrado." }, { status: 404 });
    }

    const categoryId = await ensureCategoryForRestaurant(restaurant.id, category);

    const product = await prisma.product.create({
      data: {
        restaurantId: restaurant.id,
        categoryId,
        name,
        description,
        price: new Prisma.Decimal(parseCurrencyInput(price)),
        imageUrl,
        isActive: status === "Ativo",
        customizationOptions: customizationConfig,
      },
      select: {
        id: true,
      },
    });

    return adminJson(request, { productId: product.id });
  } catch (error) {
    return adminJson(request, 
      { error: error instanceof Error ? error.message : "Nao foi possivel criar o produto." },
      { status: 500 },
    );
  }
}
