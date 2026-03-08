import { NextResponse } from "next/server";

function getCorsHeaders() {
  const allowedOrigin = process.env.ADMIN_ALLOWED_ORIGIN?.trim() || "*";

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    Vary: allowedOrigin === "*" ? "Origin" : "Origin",
  };
}

export function adminJson(payload: unknown, init?: ResponseInit) {
  return NextResponse.json(payload, {
    ...init,
    headers: {
      ...getCorsHeaders(),
      ...(init?.headers ?? {}),
    },
  });
}

export function adminOptions() {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(),
  });
}
