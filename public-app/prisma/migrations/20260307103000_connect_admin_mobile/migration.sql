-- CreateEnum
CREATE TYPE "public"."OfferType" AS ENUM ('ALL_ITEMS', 'CATEGORY', 'DISH_OF_THE_DAY', 'SPECIFIC_PROMOTION');

-- AlterTable
ALTER TABLE "public"."Customer" ADD COLUMN     "isBlocked" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."Restaurant" ADD COLUMN     "acceptCardOnDelivery" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "acceptCash" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "acceptPix" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "adminEmail" TEXT,
ADD COLUMN     "adminPassword" TEXT,
ADD COLUMN     "adminUserName" TEXT,
ADD COLUMN     "bannerUrl" TEXT,
ADD COLUMN     "deliveryActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "pickupActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "pixKey" TEXT,
ADD COLUMN     "welcomeMessage" TEXT,
ADD COLUMN     "workingHours" TEXT;

-- CreateTable
CREATE TABLE "public"."Offer" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."OfferType" NOT NULL,
    "discountLabel" TEXT NOT NULL,
    "appliesTo" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Offer_restaurantId_isActive_idx" ON "public"."Offer"("restaurantId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Restaurant_adminEmail_key" ON "public"."Restaurant"("adminEmail");

-- AddForeignKey
ALTER TABLE "public"."Offer" ADD CONSTRAINT "Offer_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "public"."Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
