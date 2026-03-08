import { requireAdminAccess } from "@/lib/admin-auth";
import { adminJson, adminOptions } from "@/lib/admin-response";
import { prisma } from "@/lib/prisma";

export function OPTIONS() {
  return adminOptions();
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ slug: string; customerId: string }> },
) {
  try {
    const { slug, customerId } = await context.params;
    const auth = requireAdminAccess(request, { restaurantSlug: slug });

    if (!auth.ok) {
      return auth.response;
    }

    const body = await request.json();
    const blocked = Boolean(body.blocked);

    const restaurant = await prisma.restaurant.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!restaurant) {
      return adminJson({ error: "Restaurante nao encontrado." }, { status: 404 });
    }

    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        restaurantId: restaurant.id,
      },
      select: { id: true },
    });

    if (!customer) {
      return adminJson({ error: "Cliente nao encontrado." }, { status: 404 });
    }

    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        isBlocked: blocked,
      },
    });

    return adminJson({ customerId: customer.id, blocked });
  } catch (error) {
    return adminJson(
      { error: error instanceof Error ? error.message : "Nao foi possivel atualizar o cliente." },
      { status: 500 },
    );
  }
}
