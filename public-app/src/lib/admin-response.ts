import { NextResponse } from "next/server";

function resolveAllowedOrigin(request?: Request | null) {
  const allowedOrigin = process.env.ADMIN_ALLOWED_ORIGIN?.trim();

  if (!allowedOrigin) {
    return null;
  }

  if (allowedOrigin === "*") {
    return request?.headers.get("origin")?.trim() || null;
  }

  return allowedOrigin;
}

function getCorsHeaders(request?: Request | null) {
  const resolvedOrigin = resolveAllowedOrigin(request);
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    Vary: "Origin",
  };

  if (!resolvedOrigin) {
    return headers;
  }

  return {
    ...headers,
    "Access-Control-Allow-Origin": resolvedOrigin,
    "Access-Control-Allow-Credentials": "true",
  };
}

export function adminJson(request: Request, payload: unknown, init?: ResponseInit): NextResponse;
export function adminJson(payload: unknown, init?: ResponseInit): NextResponse;
export function adminJson(
  requestOrPayload: Request | unknown,
  payloadOrInit?: unknown | ResponseInit,
  maybeInit?: ResponseInit,
) {
  const request = requestOrPayload instanceof Request ? requestOrPayload : null;
  const payload = request ? payloadOrInit : requestOrPayload;
  const init = (request ? maybeInit : payloadOrInit) as ResponseInit | undefined;

  return NextResponse.json(payload, {
    ...init,
    headers: {
      ...getCorsHeaders(request),
      ...(init?.headers ?? {}),
    },
  });
}

export function adminOptions(request?: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(request),
  });
}
