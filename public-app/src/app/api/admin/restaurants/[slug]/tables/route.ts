import { requireAdminAccess } from "@/lib/admin-auth";
import { adminJson, adminOptions } from "@/lib/admin-response";
import { prisma } from "@/lib/prisma";

export function OPTIONS(request: Request) {
  return adminOptions(request);
}

export async function PUT(
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
    const rawTables: unknown[] | null = Array.isArray(body.tables) ? body.tables : null;

    if (!rawTables) {
      return adminJson(request, { error: "Informe a configuracao de mesas." }, { status: 400 });
    }

    const normalizedTables = rawTables.map((table: unknown, index) => {
      const tableRecord = table && typeof table === "object" ? (table as Record<string, unknown>) : {};

      return {
        id: typeof tableRecord.id === "string" ? tableRecord.id : "",
        identifier: String(tableRecord.identifier ?? "").trim(),
        label: String(tableRecord.label ?? "").trim(),
        area: String(tableRecord.area ?? "").trim(),
        seats:
          tableRecord.seats === null || tableRecord.seats === undefined || tableRecord.seats === ""
          ? null
          : Number(tableRecord.seats),
        isActive: tableRecord.isActive !== false,
        sortOrder: index + 1,
      };
    });

    for (const table of normalizedTables) {
      if (!table.identifier || !table.label) {
        return adminJson(
          request,
          { error: "Cada mesa precisa de identificador e nome de exibicao." },
          { status: 400 },
        );
      }

      if (table.seats != null && (!Number.isFinite(table.seats) || table.seats <= 0)) {
        return adminJson(
          request,
          { error: "A quantidade de lugares deve ser maior que zero." },
          { status: 400 },
        );
      }
    }

    const duplicateIdentifier = normalizedTables.find(
      (table, index) =>
        normalizedTables.findIndex(
          (candidate) =>
            candidate.identifier.toLowerCase() === table.identifier.toLowerCase(),
        ) !== index,
    );

    if (duplicateIdentifier) {
      return adminJson(
        request,
        { error: `O identificador ${duplicateIdentifier.identifier} esta duplicado.` },
        { status: 400 },
      );
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { slug },
      select: {
        id: true,
      },
    });

    if (!restaurant) {
      return adminJson(request, { error: "Restaurante nao encontrado." }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      const existingTables = await tx.diningTable.findMany({
        where: {
          restaurantId: restaurant.id,
        },
        select: {
          id: true,
        },
      });

      const existingIds = new Set(existingTables.map((table) => table.id));
      const incomingExistingIds = new Set(
        normalizedTables.map((table) => table.id).filter((id) => existingIds.has(id)),
      );

      for (const table of normalizedTables) {
        const payload = {
          identifier: table.identifier,
          label: table.label,
          area: table.area || null,
          seats: table.seats,
          isActive: table.isActive,
          sortOrder: table.sortOrder,
        };

        if (table.id && existingIds.has(table.id)) {
          await tx.diningTable.update({
            where: {
              id: table.id,
            },
            data: payload,
          });
          continue;
        }

        await tx.diningTable.create({
          data: {
            restaurantId: restaurant.id,
            ...payload,
          },
        });
      }

      const missingIds = existingTables
        .map((table) => table.id)
        .filter((id) => !incomingExistingIds.has(id));

      if (missingIds.length) {
        await tx.diningTable.updateMany({
          where: {
            restaurantId: restaurant.id,
            id: {
              in: missingIds,
            },
          },
          data: {
            isActive: false,
          },
        });
      }
    });

    const tables = await prisma.diningTable.findMany({
      where: {
        restaurantId: restaurant.id,
      },
      orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
      select: {
        id: true,
        identifier: true,
        label: true,
        area: true,
        seats: true,
        sortOrder: true,
        isActive: true,
      },
    });

    return adminJson(request, { tables });
  } catch (error) {
    return adminJson(
      request,
      {
        error: error instanceof Error ? error.message : "Nao foi possivel salvar as mesas.",
      },
      { status: 500 },
    );
  }
}
