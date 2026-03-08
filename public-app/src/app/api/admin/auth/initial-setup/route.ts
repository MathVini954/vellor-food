import { createAdminAccessToken, verifyAdminSetupToken } from "@/lib/admin-auth";
import { adminJson, adminOptions } from "@/lib/admin-response";
import { consumeRateLimit, getRequestClientKey } from "@/lib/rate-limit";
import {
  completeRestaurantInitialSetup,
  mapRestaurantSession,
} from "@/services/admin/restaurant-admin";

export function OPTIONS() {
  return adminOptions();
}

export async function POST(request: Request) {
  try {
    const clientKey = getRequestClientKey(request);
    const allowed = consumeRateLimit({
      key: `admin-initial-setup:${clientKey}`,
      limit: 10,
      windowMs: 10 * 60 * 1000,
    });

    if (!allowed) {
      return adminJson(
        { error: "Muitas tentativas de setup inicial. Tente novamente em alguns minutos." },
        { status: 429 },
      );
    }

    const body = await request.json();
    const setupToken = String(body.setupToken ?? "").trim();
    const companyName = String(body.companyName ?? "").trim();
    const adminName = String(body.adminName ?? "").trim();
    const whatsapp = String(body.whatsapp ?? "").trim();
    const address = String(body.address ?? "").trim();
    const city = String(body.city ?? "").trim();
    const state = String(body.state ?? "").trim().toUpperCase();
    const password = String(body.password ?? "");

    if (!setupToken) {
      return adminJson({ error: "Token de setup nao informado." }, { status: 401 });
    }

    const tokenPayload = verifyAdminSetupToken(setupToken);

    if (!tokenPayload) {
      return adminJson({ error: "Token de setup invalido ou expirado." }, { status: 401 });
    }

    const restaurant = await completeRestaurantInitialSetup({
      slug: tokenPayload.slug,
      email: tokenPayload.email,
      companyName,
      adminName,
      whatsapp,
      address,
      city,
      state,
      password,
    });

    const accessToken = createAdminAccessToken({
      restaurantSlug: restaurant.slug,
      userEmail: restaurant.adminEmail ?? tokenPayload.email,
    });

    return adminJson({
      kind: "session",
      session: mapRestaurantSession({
        ...restaurant,
        accessToken,
      }),
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Acesso da empresa indisponivel. Verifique o status do contrato."
    ) {
      return adminJson({ error: error.message }, { status: 403 });
    }

    return adminJson(
      { error: error instanceof Error ? error.message : "Nao foi possivel concluir o setup inicial." },
      { status: 500 },
    );
  }
}
