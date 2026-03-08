import { requireAdminAccess } from "@/lib/admin-auth";
import { adminJson, adminOptions } from "@/lib/admin-response";
import { getAdminBootstrap } from "@/services/admin/restaurant-admin";

export function OPTIONS() {
  return adminOptions();
}

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await context.params;
    const auth = requireAdminAccess(request, { restaurantSlug: slug });

    if (!auth.ok) {
      return auth.response;
    }

    const payload = await getAdminBootstrap(slug, request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "");

    if (!payload) {
      return adminJson({ error: "Restaurante nao encontrado." }, { status: 404 });
    }

    return adminJson(payload);
  } catch (error) {
    return adminJson(
      { error: error instanceof Error ? error.message : "Nao foi possivel carregar o painel." },
      { status: 500 },
    );
  }
}
