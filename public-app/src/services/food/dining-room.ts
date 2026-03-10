import { randomUUID } from "node:crypto";
import { TableSessionStatus, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type PrismaLike = Prisma.TransactionClient | typeof prisma;

const DEFAULT_DINING_TABLES = Array.from({ length: 12 }, (_, index) => {
  const tableNumber = index + 1;

  return {
    identifier: String(tableNumber),
    label: `Mesa ${tableNumber}`,
    area: "Salao principal",
    seats: 4,
    sortOrder: index + 1,
    isActive: true,
  };
});

export function buildDefaultDiningTables() {
  return DEFAULT_DINING_TABLES.map((table) => ({ ...table }));
}

export async function ensureRestaurantDigitalMenuToken(
  client: PrismaLike,
  restaurantId: string,
  currentToken: string | null | undefined,
) {
  if (currentToken) {
    return currentToken;
  }

  const nextToken = randomUUID();
  const updated = await client.restaurant.update({
    where: { id: restaurantId },
    data: {
      digitalMenuToken: nextToken,
    },
    select: {
      digitalMenuToken: true,
    },
  });

  return updated.digitalMenuToken ?? nextToken;
}

export async function ensureDefaultDiningTables(
  client: PrismaLike,
  restaurantId: string,
) {
  const existingCount = await client.diningTable.count({
    where: {
      restaurantId,
    },
  });

  if (existingCount > 0) {
    return;
  }

  await client.diningTable.createMany({
    data: buildDefaultDiningTables().map((table) => ({
      restaurantId,
      ...table,
    })),
  });
}

export async function findOrCreateOpenTableSession(
  client: PrismaLike,
  input: {
    restaurantId: string;
    tableId: string;
    requestedSessionId?: string | null;
    notes?: string | null;
  },
) {
  if (input.requestedSessionId) {
    const existingRequestedSession = await client.tableSession.findFirst({
      where: {
        id: input.requestedSessionId,
        restaurantId: input.restaurantId,
        status: TableSessionStatus.OPEN,
      },
      select: {
        id: true,
      },
    });

    if (existingRequestedSession) {
      return existingRequestedSession;
    }
  }

  const existingOpenSession = await client.tableSession.findFirst({
    where: {
      restaurantId: input.restaurantId,
      diningTableId: input.tableId,
      status: TableSessionStatus.OPEN,
    },
    orderBy: {
      openedAt: "desc",
    },
    select: {
      id: true,
    },
  });

  if (existingOpenSession) {
    return existingOpenSession;
  }

  return client.tableSession.create({
    data: {
      restaurantId: input.restaurantId,
      diningTableId: input.tableId,
      status: TableSessionStatus.OPEN,
      notes: input.notes ?? null,
    },
    select: {
      id: true,
    },
  });
}
