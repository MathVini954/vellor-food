import { clearAdminSessionCookie } from "@/lib/admin-auth";
import { adminJson, adminOptions } from "@/lib/admin-response";

export function OPTIONS(request: Request) {
  return adminOptions(request);
}

export async function POST(request: Request) {
  return clearAdminSessionCookie(
    adminJson(request, {
      success: true,
    }),
  );
}
