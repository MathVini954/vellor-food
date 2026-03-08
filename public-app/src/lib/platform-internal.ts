import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

function getPlatformInternalSecret() {
  const secret = process.env.PLATFORM_INTERNAL_SECRET?.trim();

  if (!secret) {
    throw new Error("PLATFORM_INTERNAL_SECRET nao configurado.");
  }

  return secret;
}

function hasValidInternalSecret(request: Request) {
  const providedSecret = request.headers.get("x-platform-internal-secret")?.trim();

  if (!providedSecret) {
    return false;
  }

  const expectedBuffer = Buffer.from(getPlatformInternalSecret(), "utf8");
  const providedBuffer = Buffer.from(providedSecret, "utf8");

  return (
    expectedBuffer.length === providedBuffer.length &&
    timingSafeEqual(expectedBuffer, providedBuffer)
  );
}

export function requirePlatformInternalAccess(request: Request) {
  try {
    if (hasValidInternalSecret(request)) {
      return { ok: true as const };
    }

    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "Acesso interno da plataforma nao autorizado." },
        { status: 401 },
      ),
    };
  } catch (error) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: error instanceof Error ? error.message : "Falha ao validar acesso interno." },
        { status: 500 },
      ),
    };
  }
}
