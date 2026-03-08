DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        WHERE t.typname = 'SaaSProductCode' AND e.enumlabel = 'BARBER'
    ) THEN
        ALTER TYPE "SaaSProductCode" ADD VALUE 'BARBER';
    END IF;
END $$;

CREATE TYPE "ProvisioningJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELED');

CREATE TABLE "ProvisioningJob" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "requestedByEmail" TEXT,
    "status" "ProvisioningJobStatus" NOT NULL DEFAULT 'PENDING',
    "requestPayload" JSONB,
    "responsePayload" JSONB,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProvisioningJob_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProvisioningJob_companyId_status_idx" ON "ProvisioningJob"("companyId", "status");
CREATE INDEX "ProvisioningJob_productId_status_idx" ON "ProvisioningJob"("productId", "status");

ALTER TABLE "ProvisioningJob"
ADD CONSTRAINT "ProvisioningJob_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProvisioningJob"
ADD CONSTRAINT "ProvisioningJob_productId_fkey" FOREIGN KEY ("productId") REFERENCES "SaaSProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
