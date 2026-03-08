-- CreateEnum
CREATE TYPE "public"."RestaurantContractStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'CANCELED');

-- CreateTable
CREATE TABLE "public"."RestaurantContract" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "status" "public"."RestaurantContractStatus" NOT NULL DEFAULT 'ACTIVE',
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "monthlyPrice" DECIMAL(10,2),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RestaurantContract_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RestaurantContract_restaurantId_key" ON "public"."RestaurantContract"("restaurantId");

-- CreateIndex
CREATE INDEX "RestaurantContract_status_endsAt_idx" ON "public"."RestaurantContract"("status", "endsAt");

-- AddForeignKey
ALTER TABLE "public"."RestaurantContract"
ADD CONSTRAINT "RestaurantContract_restaurantId_fkey"
FOREIGN KEY ("restaurantId") REFERENCES "public"."Restaurant"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

-- Backfill
INSERT INTO "public"."RestaurantContract" ("id", "restaurantId", "status", "startsAt", "createdAt", "updatedAt")
SELECT
    'contract_' || "id",
    "id",
    'ACTIVE'::"public"."RestaurantContractStatus",
    COALESCE("createdAt", CURRENT_TIMESTAMP),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "public"."Restaurant"
WHERE NOT EXISTS (
    SELECT 1
    FROM "public"."RestaurantContract" rc
    WHERE rc."restaurantId" = "Restaurant"."id"
);
