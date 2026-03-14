import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const isStaticAdminAsset =
    pathname === "/admin/index.html" ||
    pathname.startsWith("/admin/assets/") ||
    pathname.startsWith("/admin/favicon") ||
    pathname.startsWith("/admin/.well-known/");

  if (isStaticAdminAsset) {
    return NextResponse.next();
  }

  const rewriteUrl = request.nextUrl.clone();
  rewriteUrl.pathname = "/admin/index.html";
  return NextResponse.rewrite(rewriteUrl);
}

export const config = {
  matcher: ["/admin/:path*"],
};
