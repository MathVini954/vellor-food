import { PaymentStatus, TableSessionStatus } from "@prisma/client";
import { requireAdminAccess } from "@/lib/admin-auth";
import { adminJson, adminOptions } from "@/lib/admin-response";
import { prisma } from "@/lib/prisma";

export function OPTIONS(request: Request) {
  return adminOptions(request);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string; sessionId: string }> },
) {
  try {
    const { slug, sessionId } = await context.params;
    const auth = requireAdminAccess(request, { restaurantSlug: slug });

    if (!auth.ok) {
      return auth.response;
    }

    const tableSession = await prisma.tableSession.findFirst({
      where: {
        id: sessionId,
        restaurant: {
          slug,
        },
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!tableSession) {
      return adminJson(request, { error: "Comanda nao encontrada." }, { status: 404 });
    }

    if (tableSession.status !== TableSessionStatus.OPEN) {
      return adminJson(
        request,
        { error: "Apenas comandas abertas podem ser encerradas." },
        { status: 400 },
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.updateMany({
        where: {
          tableSessionId: tableSession.id,
          orderType: "DINE_IN",
          status: {
            not: "CANCELED",
          },
        },
        data: {
          paymentStatus: PaymentStatus.PAID,
          status: "DELIVERED",
        },
      });

      await tx.tableSession.update({
        where: {
          id: tableSession.id,
        },
        data: {
          status: TableSessionStatus.CLOSED,
          closedAt: new Date(),
        },
      });
    });

    return adminJson(request, { sessionId: tableSession.id, status: "CLOSED" });
  } catch (error) {
    return adminJson(
      request,
      {
        error: error instanceof Error ? error.message : "Nao foi possivel encerrar a mesa.",
      },
      { status: 500 },
    );
  }
}
