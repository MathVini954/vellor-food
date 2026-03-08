import { createAdminAccessToken, createAdminSetupToken } from "@/lib/admin-auth";
import { adminJson, adminOptions } from "@/lib/admin-response";
import { consumeRateLimit, getRequestClientKey } from "@/lib/rate-limit";
import {
  findRestaurantForAdminLogin,
  mapRestaurantInitialSetup,
  mapRestaurantSession,
} from "@/services/admin/restaurant-admin";

export function OPTIONS() {
  return adminOptions();
}

export async function POST(request: Request) {
  try {
    const clientKey = getRequestClientKey(request);
    const allowed = consumeRateLimit({
      key: `admin-login:${clientKey}`,
      limit: 10,
      windowMs: 10 * 60 * 1000,
    });

    if (!allowed) {
      return adminJson({ error: "Muitas tentativas de login. Tente novamente em alguns minutos." }, { status: 429 });
    }

    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!email || !password) {
      return adminJson({ error: "Informe email e senha." }, { status: 400 });
    }

    const restaurant = await findRestaurantForAdminLogin(email, password);

    if (!restaurant) {
      return adminJson({ error: "Email ou senha invalidos." }, { status: 401 });
    }

    if (restaurant.adminPasswordTemporary || !restaurant.onboardingCompleted) {
      const setupToken = createAdminSetupToken({
        restaurantSlug: restaurant.slug,
        userEmail: restaurant.adminEmail ?? email,
      });

      return adminJson({
        kind: "initial-setup",
        setup: mapRestaurantInitialSetup({
          ...restaurant,
          setupToken,
        }),
      });
    }

    const accessToken = createAdminAccessToken({
      restaurantSlug: restaurant.slug,
      userEmail: restaurant.adminEmail ?? email,
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
      { error: error instanceof Error ? error.message : "Nao foi possivel autenticar." },
      { status: 500 },
    );
  }
}
