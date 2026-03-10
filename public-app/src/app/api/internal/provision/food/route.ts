import { NextResponse } from "next/server";
import { requirePlatformInternalAccess } from "@/lib/platform-internal";
import { provisionFoodCompany } from "@/services/platform/food-provisioning";

export async function POST(request: Request) {
  const internalAccess = requirePlatformInternalAccess(request);

  if (!internalAccess.ok) {
    return internalAccess.response;
  }

  try {
    const body = await request.json();
    const companyId = String(body.companyId ?? "").trim();
    const productCode = String(body.productCode ?? "").trim().toUpperCase();
    const featureAccess =
      body.featureAccess && typeof body.featureAccess === "object"
        ? {
            adminEnabled: body.featureAccess.adminEnabled !== false,
            publicOrderingEnabled: body.featureAccess.publicOrderingEnabled !== false,
            digitalMenuEnabled: Boolean(body.featureAccess.digitalMenuEnabled),
          }
        : undefined;

    if (!companyId) {
      return NextResponse.json({ error: "companyId nao informado." }, { status: 400 });
    }

    if (productCode && productCode !== "FOOD") {
      return NextResponse.json(
        { error: "Este endpoint provisiona apenas o produto FOOD." },
        { status: 400 },
      );
    }

    const response = await provisionFoodCompany({
      companyId,
      requestOrigin: new URL(request.url).origin,
      featureAccess,
    });

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Nao foi possivel provisionar o FOOD." },
      { status: 500 },
    );
  }
}
