import { TableSessionStatus } from "@prisma/client";
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

    const body = await request.json();
    const targetTableId = String(body.targetTableId ?? "").trim();

    if (!targetTableId) {
      return adminJson(request, { error: "Informe a mesa de destino." }, { status: 400 });
    }

    const sourceSession = await prisma.tableSession.findFirst({
      where: {
        id: sessionId,
        restaurant: {
          slug,
        },
      },
      select: {
        id: true,
        restaurantId: true,
        status: true,
      },
    });

    if (!sourceSession) {
      return adminJson(request, { error: "Comanda nao encontrada." }, { status: 404 });
    }

    if (sourceSession.status !== TableSessionStatus.OPEN) {
      return adminJson(
        request,
        { error: "Apenas comandas abertas podem ser transferidas." },
        { status: 400 },
      );
    }

    const targetTable = await prisma.diningTable.findFirst({
      where: {
        id: targetTableId,
        restaurantId: sourceSession.restaurantId,
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    if (!targetTable) {
      return adminJson(request, { error: "Mesa de destino nao encontrada." }, { status: 404 });
    }

    const occupiedTargetTable = await prisma.tableSession.findFirst({
      where: {
        restaurantId: sourceSession.restaurantId,
        diningTableId: targetTable.id,
        status: TableSessionStatus.OPEN,
        id: {
          not: sourceSession.id,
        },
      },
      select: {
        id: true,
      },
    });

    if (occupiedTargetTable) {
      return adminJson(
        request,
        { error: "A mesa de destino ja possui uma comanda aberta. Use mesclar." },
        { status: 400 },
      );
    }

    await prisma.tableSession.update({
      where: {
        id: sourceSession.id,
      },
      data: {
        diningTableId: targetTable.id,
      },
    });

    return adminJson(request, { sessionId: sourceSession.id, targetTableId: targetTable.id });
  } catch (error) {
    return adminJson(
      request,
      {
        error: error instanceof Error ? error.message : "Nao foi possivel transferir a mesa.",
      },
      { status: 500 },
    );
  }
}
