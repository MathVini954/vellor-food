import { Prisma, ProvisioningJobStatus, SaaSProductCode } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type ProvisioningResponsePayload = {
  tenantId: string;
  tenantSlug: string;
  adminUrl: string | null;
  publicUrl: string | null;
};

function getPlatformInternalSecret() {
  const secret = process.env.PLATFORM_INTERNAL_SECRET?.trim();

  if (!secret) {
    throw new Error("PLATFORM_INTERNAL_SECRET nao configurado no owner-console.");
  }

  return secret;
}

function getProvisioningUrl(productCode: SaaSProductCode) {
  const key =
    productCode === "FOOD"
      ? process.env.FOOD_PROVISIONING_URL?.trim()
      : process.env.BARBER_PROVISIONING_URL?.trim();

  if (!key) {
    throw new Error(`Provisionamento do produto ${productCode} nao configurado.`);
  }

  return key;
}

async function getProductByCode(productCode: SaaSProductCode) {
  const product = await prisma.saaSProduct.findUnique({
    where: { code: productCode },
    select: {
      id: true,
      code: true,
      name: true,
    },
  });

  if (!product) {
    throw new Error(`Produto ${productCode} nao encontrado na plataforma.`);
  }

  return product;
}

export async function runProvisioningJob(input: {
  companyId: string;
  productCode: SaaSProductCode;
  requestedByEmail?: string | null;
  featureAccess?: {
    adminEnabled: boolean;
    publicOrderingEnabled: boolean;
    digitalMenuEnabled: boolean;
  };
}) {
  const product = await getProductByCode(input.productCode);
  const requestPayload = {
    companyId: input.companyId,
    productCode: input.productCode,
    featureAccess: input.featureAccess ?? null,
  };

  const job = await prisma.provisioningJob.create({
    data: {
      companyId: input.companyId,
      productId: product.id,
      requestedByEmail: input.requestedByEmail ?? null,
      status: ProvisioningJobStatus.PENDING,
      requestPayload,
    },
    select: {
      id: true,
    },
  });

  try {
    await prisma.provisioningJob.update({
      where: { id: job.id },
      data: {
        status: ProvisioningJobStatus.PROCESSING,
        startedAt: new Date(),
      },
    });

    const response = await fetch(getProvisioningUrl(input.productCode), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-platform-internal-secret": getPlatformInternalSecret(),
      },
      body: JSON.stringify({
        jobId: job.id,
        companyId: input.companyId,
        productCode: input.productCode,
        featureAccess: input.featureAccess ?? null,
      }),
      cache: "no-store",
    });

    const payload = (await response.json().catch(() => ({}))) as
      | ProvisioningResponsePayload
      | { error?: string };

    if (!response.ok) {
      const errorMessage =
        "error" in payload ? payload.error : undefined;
      throw new Error(errorMessage || `Provisionamento ${input.productCode} falhou.`);
    }

    await prisma.provisioningJob.update({
      where: { id: job.id },
      data: {
        status: ProvisioningJobStatus.SUCCEEDED,
        responsePayload: payload as unknown as Prisma.JsonObject,
        finishedAt: new Date(),
      },
    });

    return payload as ProvisioningResponsePayload;
  } catch (error) {
    await prisma.provisioningJob.update({
      where: { id: job.id },
      data: {
        status: ProvisioningJobStatus.FAILED,
        errorMessage: error instanceof Error ? error.message : "Provisionamento falhou.",
        finishedAt: new Date(),
      },
    });

    throw error;
  }
}
