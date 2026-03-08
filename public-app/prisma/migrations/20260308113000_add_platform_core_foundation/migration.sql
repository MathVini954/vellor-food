CREATE TYPE "CompanyStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'CANCELED');
CREATE TYPE "ProductAccessStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'CANCELED');
CREATE TYPE "PlatformUserRole" AS ENUM ('OWNER', 'COMPANY_ADMIN', 'STAFF');
CREATE TYPE "SaaSProductCode" AS ENUM ('FOOD');

CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "legalName" TEXT,
    "status" "CompanyStatus" NOT NULL DEFAULT 'ACTIVE',
    "primaryContactName" TEXT,
    "primaryContactEmail" TEXT,
    "primaryContactPhone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SaaSProduct" (
    "id" TEXT NOT NULL,
    "code" "SaaSProductCode" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SaaSProduct_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CompanyProductAccess" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "status" "ProductAccessStatus" NOT NULL DEFAULT 'ACTIVE',
    "contractStartsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contractEndsAt" TIMESTAMP(3),
    "monthlyPrice" DECIMAL(10,2),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyProductAccess_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PlatformUser" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "name" TEXT NOT NULL,
    "role" "PlatformUserRole" NOT NULL DEFAULT 'COMPANY_ADMIN',
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformUser_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Restaurant"
ADD COLUMN     "companyId" TEXT;

CREATE UNIQUE INDEX "Company_slug_key" ON "Company"("slug");
CREATE INDEX "Company_status_idx" ON "Company"("status");
CREATE UNIQUE INDEX "SaaSProduct_code_key" ON "SaaSProduct"("code");
CREATE UNIQUE INDEX "CompanyProductAccess_companyId_productId_key" ON "CompanyProductAccess"("companyId", "productId");
CREATE INDEX "CompanyProductAccess_status_contractEndsAt_idx" ON "CompanyProductAccess"("status", "contractEndsAt");
CREATE UNIQUE INDEX "PlatformUser_email_key" ON "PlatformUser"("email");
CREATE INDEX "PlatformUser_companyId_role_idx" ON "PlatformUser"("companyId", "role");
CREATE INDEX "Restaurant_companyId_idx" ON "Restaurant"("companyId");

ALTER TABLE "CompanyProductAccess"
ADD CONSTRAINT "CompanyProductAccess_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CompanyProductAccess"
ADD CONSTRAINT "CompanyProductAccess_productId_fkey" FOREIGN KEY ("productId") REFERENCES "SaaSProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PlatformUser"
ADD CONSTRAINT "PlatformUser_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Restaurant"
ADD CONSTRAINT "Restaurant_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "SaaSProduct" ("id", "code", "name", "description", "createdAt", "updatedAt")
VALUES (gen_random_uuid()::text, 'FOOD', 'Food', 'Operacao completa para cardapio, pedidos e delivery.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "Company" (
    "id",
    "name",
    "slug",
    "status",
    "primaryContactName",
    "primaryContactEmail",
    "primaryContactPhone",
    "createdAt",
    "updatedAt"
)
SELECT
    gen_random_uuid()::text,
    r."name",
    r."slug",
    COALESCE(rc."status"::text, 'ACTIVE')::"CompanyStatus",
    r."adminUserName",
    r."adminEmail",
    r."whatsapp",
    r."createdAt",
    r."updatedAt"
FROM "Restaurant" r
LEFT JOIN "RestaurantContract" rc ON rc."restaurantId" = r."id"
WHERE r."companyId" IS NULL
ON CONFLICT ("slug") DO NOTHING;

UPDATE "Restaurant" r
SET "companyId" = c."id"
FROM "Company" c
WHERE r."slug" = c."slug"
  AND r."companyId" IS NULL;

INSERT INTO "CompanyProductAccess" (
    "id",
    "companyId",
    "productId",
    "status",
    "contractStartsAt",
    "contractEndsAt",
    "monthlyPrice",
    "notes",
    "createdAt",
    "updatedAt"
)
SELECT
    gen_random_uuid()::text,
    c."id",
    p."id",
    COALESCE(rc."status"::text, 'ACTIVE')::"ProductAccessStatus",
    COALESCE(rc."startsAt", c."createdAt"),
    rc."endsAt",
    rc."monthlyPrice",
    rc."notes",
    c."createdAt",
    c."updatedAt"
FROM "Company" c
JOIN "Restaurant" r ON r."companyId" = c."id"
JOIN "SaaSProduct" p ON p."code" = 'FOOD'
LEFT JOIN "RestaurantContract" rc ON rc."restaurantId" = r."id"
ON CONFLICT ("companyId", "productId") DO NOTHING;

INSERT INTO "PlatformUser" (
    "id",
    "companyId",
    "email",
    "passwordHash",
    "name",
    "role",
    "mustChangePassword",
    "isActive",
    "createdAt",
    "updatedAt"
)
SELECT
    gen_random_uuid()::text,
    r."companyId",
    r."adminEmail",
    r."adminPassword",
    COALESCE(r."adminUserName", r."name"),
    'COMPANY_ADMIN',
    r."adminPasswordTemporary",
    CASE
        WHEN c."status" = 'CANCELED' THEN false
        ELSE true
    END,
    r."createdAt",
    r."updatedAt"
FROM "Restaurant" r
JOIN "Company" c ON c."id" = r."companyId"
WHERE r."adminEmail" IS NOT NULL
ON CONFLICT ("email") DO NOTHING;
