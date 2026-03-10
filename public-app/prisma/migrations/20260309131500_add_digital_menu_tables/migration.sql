DO $$
BEGIN
  ALTER TYPE "OrderType" ADD VALUE 'DINE_IN';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "TableSessionStatus" AS ENUM ('OPEN', 'CLOSED', 'MERGED', 'CANCELED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Restaurant"
  ADD COLUMN IF NOT EXISTS "adminModuleEnabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "publicOrderingEnabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "digitalMenuEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "digitalMenuToken" TEXT;

CREATE TABLE IF NOT EXISTS "DiningTable" (
  "id" TEXT NOT NULL,
  "restaurantId" TEXT NOT NULL,
  "identifier" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "area" TEXT,
  "seats" INTEGER,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DiningTable_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "TableSession" (
  "id" TEXT NOT NULL,
  "restaurantId" TEXT NOT NULL,
  "diningTableId" TEXT NOT NULL,
  "status" "TableSessionStatus" NOT NULL DEFAULT 'OPEN',
  "notes" TEXT,
  "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "closedAt" TIMESTAMP(3),
  "mergedIntoSessionId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TableSession_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Order"
  ADD COLUMN IF NOT EXISTS "tableSessionId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Restaurant_digitalMenuToken_key" ON "Restaurant"("digitalMenuToken");
CREATE INDEX IF NOT EXISTS "DiningTable_restaurantId_sortOrder_idx" ON "DiningTable"("restaurantId", "sortOrder");
CREATE UNIQUE INDEX IF NOT EXISTS "DiningTable_restaurantId_identifier_key" ON "DiningTable"("restaurantId", "identifier");
CREATE INDEX IF NOT EXISTS "TableSession_restaurantId_status_openedAt_idx" ON "TableSession"("restaurantId", "status", "openedAt");
CREATE INDEX IF NOT EXISTS "TableSession_diningTableId_status_idx" ON "TableSession"("diningTableId", "status");
CREATE INDEX IF NOT EXISTS "Order_tableSessionId_idx" ON "Order"("tableSessionId");

DO $$
BEGIN
  ALTER TABLE "DiningTable"
    ADD CONSTRAINT "DiningTable_restaurantId_fkey"
    FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "TableSession"
    ADD CONSTRAINT "TableSession_restaurantId_fkey"
    FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "TableSession"
    ADD CONSTRAINT "TableSession_diningTableId_fkey"
    FOREIGN KEY ("diningTableId") REFERENCES "DiningTable"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "TableSession"
    ADD CONSTRAINT "TableSession_mergedIntoSessionId_fkey"
    FOREIGN KEY ("mergedIntoSessionId") REFERENCES "TableSession"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "Order"
    ADD CONSTRAINT "Order_tableSessionId_fkey"
    FOREIGN KEY ("tableSessionId") REFERENCES "TableSession"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
