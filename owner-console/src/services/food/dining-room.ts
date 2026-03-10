import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";
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

export async function ensureDefaultDiningTables(client: PrismaLike, restaurantId: string) {
  const existingCount = await client.diningTable.count({
    where: {
      restaurantId,
    },
  });

  if (existingCount > 0) {
    return;
  }

  await client.diningTable.createMany({
    data: DEFAULT_DINING_TABLES.map((table) => ({
      restaurantId,
      ...table,
    })),
  });
}
