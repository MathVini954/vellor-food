ALTER TABLE "Restaurant"
ADD COLUMN "adminPasswordTemporary" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "onboardingCompleted" BOOLEAN NOT NULL DEFAULT true;
