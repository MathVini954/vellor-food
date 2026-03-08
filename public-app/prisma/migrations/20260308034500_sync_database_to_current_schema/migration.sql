-- AlterTable
ALTER TABLE "public"."Offer"
ADD COLUMN "categoryIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "productIds" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "public"."OrderItem"
ADD COLUMN "customizations" TEXT;

-- AlterTable
ALTER TABLE "public"."Product"
ADD COLUMN "customizationOptions" JSONB;

-- AlterTable
ALTER TABLE "public"."Restaurant"
ADD COLUMN "city" TEXT,
ADD COLUMN "freeDeliveryRadiusKm" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN "latitude" DECIMAL(10,7),
ADD COLUMN "longitude" DECIMAL(10,7),
ADD COLUMN "state" TEXT;

-- CreateTable
CREATE TABLE "public"."DeliveryArea" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "isFree" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryArea_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DeliveryArea_restaurantId_sortOrder_idx" ON "public"."DeliveryArea"("restaurantId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryArea_restaurantId_name_key" ON "public"."DeliveryArea"("restaurantId", "name");

-- AddForeignKey
ALTER TABLE "public"."DeliveryArea"
ADD CONSTRAINT "DeliveryArea_restaurantId_fkey"
FOREIGN KEY ("restaurantId") REFERENCES "public"."Restaurant"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
