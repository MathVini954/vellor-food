import { requireAdminAccess } from "@/lib/admin-auth";
import { adminJson, adminOptions } from "@/lib/admin-response";
import { prisma } from "@/lib/prisma";
import { mapAdminOrderStatusToDb, mapDbOrderStatusToAdmin } from "@/services/admin/restaurant-admin";

export function OPTIONS(request: Request) {
  return adminOptions(request);
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ slug: string; orderId: string }> },
) {
  try {
    const { slug, orderId } = await context.params;
    const auth = requireAdminAccess(request, { restaurantSlug: slug });

    if (!auth.ok) {
      return auth.response;
    }

    const body = await request.json();
    const status = body.status ? String(body.status) : null;

    if (!status) {
      return adminJson(request, { error: "Informe o novo status do pedido." }, { status: 400 });
    }

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        restaurant: { slug },
      },
      select: {
        id: true,
      },
    });

    if (!order) {
      return adminJson(request, { error: "Pedido nao encontrado." }, { status: 404 });
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: mapAdminOrderStatusToDb(status as Parameters<typeof mapAdminOrderStatusToDb>[0]),
      },
      select: {
        id: true,
        status: true,
      },
    });

    return adminJson(request, {
      orderId: updated.id,
      status: mapDbOrderStatusToAdmin(updated.status),
    });
  } catch (error) {
    return adminJson(request, 
      { error: error instanceof Error ? error.message : "Nao foi possivel atualizar o pedido." },
      { status: 500 },
    );
  }
}
