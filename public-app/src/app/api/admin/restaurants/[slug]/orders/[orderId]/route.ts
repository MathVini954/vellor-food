import { requireAdminAccess } from "@/lib/admin-auth";
import { adminJson, adminOptions } from "@/lib/admin-response";
import { prisma } from "@/lib/prisma";

export function OPTIONS(request: Request) {
  return adminOptions(request);
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ slug: string; orderId: string }> },
) {
  try {
    const { slug, orderId } = await context.params;
    const auth = requireAdminAccess(request, { restaurantSlug: slug });

    if (!auth.ok) {
      return auth.response;
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

    await prisma.order.delete({
      where: { id: order.id },
    });

    return adminJson(request, { orderId: order.id });
  } catch (error) {
    return adminJson(request, 
      { error: error instanceof Error ? error.message : "Nao foi possivel excluir o pedido." },
      { status: 500 },
    );
  }
}
