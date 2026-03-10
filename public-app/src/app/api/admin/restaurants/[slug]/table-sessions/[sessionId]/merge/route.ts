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
    const targetSessionId = String(body.targetSessionId ?? "").trim();

    if (!targetSessionId) {
      return adminJson(request, { error: "Informe a comanda de destino." }, { status: 400 });
    }

    if (targetSessionId === sessionId) {
      return adminJson(
        request,
        { error: "Selecione outra comanda para mesclar." },
        { status: 400 },
      );
    }

    const sessions = await prisma.tableSession.findMany({
      where: {
        id: {
          in: [sessionId, targetSessionId],
        },
        restaurant: {
          slug,
        },
      },
      select: {
        id: true,
        status: true,
      },
    });

    const sourceSession = sessions.find((session) => session.id === sessionId) ?? null;
    const targetSession = sessions.find((session) => session.id === targetSessionId) ?? null;

    if (!sourceSession || !targetSession) {
      return adminJson(request, { error: "Comanda nao encontrada." }, { status: 404 });
    }

    if (
      sourceSession.status !== TableSessionStatus.OPEN ||
      targetSession.status !== TableSessionStatus.OPEN
    ) {
      return adminJson(
        request,
        { error: "Apenas comandas abertas podem ser mescladas." },
        { status: 400 },
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.updateMany({
        where: {
          tableSessionId: sourceSession.id,
        },
        data: {
          tableSessionId: targetSession.id,
        },
      });

      await tx.tableSession.update({
        where: {
          id: sourceSession.id,
        },
        data: {
          status: TableSessionStatus.MERGED,
          closedAt: new Date(),
          mergedIntoSessionId: targetSession.id,
        },
      });
    });

    return adminJson(request, { sessionId: sourceSession.id, mergedIntoSessionId: targetSession.id });
  } catch (error) {
    return adminJson(
      request,
      {
        error: error instanceof Error ? error.message : "Nao foi possivel mesclar as mesas.",
      },
      { status: 500 },
    );
  }
}
