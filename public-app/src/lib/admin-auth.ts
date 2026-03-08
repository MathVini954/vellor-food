import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { adminJson } from "@/lib/admin-response";

const TOKEN_VERSION = 1;
const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const SETUP_TOKEN_TTL_MS = 2 * 60 * 60 * 1000;
const ADMIN_SESSION_COOKIE = "vellor_admin_session";

function getAdminCookieSameSite(): "lax" | "none" {
  return process.env.NODE_ENV === "production" ? "none" : "lax";
}

type SignedTokenPayloadBase = {
  ver: number;
  kind: "access" | "setup";
  slug: string;
  email: string;
  exp: number;
};

type AdminTokenPayload = SignedTokenPayloadBase & {
  kind: "access";
};

type AdminSetupTokenPayload = SignedTokenPayloadBase & {
  kind: "setup";
};

type AdminAuthResult =
  | { ok: true; token: AdminTokenPayload }
  | { ok: false; response: Response };

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function getAdminAuthSecret() {
  const secret = process.env.ADMIN_AUTH_SECRET;

  if (!secret) {
    throw new Error("ADMIN_AUTH_SECRET nao configurado.");
  }

  return secret;
}

function signPayload(encodedPayload: string) {
  return createHmac("sha256", getAdminAuthSecret()).update(encodedPayload).digest("base64url");
}

export function createAdminAccessToken(input: { restaurantSlug: string; userEmail: string }) {
  const payload: AdminTokenPayload = {
    ver: TOKEN_VERSION,
    kind: "access",
    slug: input.restaurantSlug,
    email: input.userEmail.toLowerCase().trim(),
    exp: Date.now() + TOKEN_TTL_MS,
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = signPayload(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export function createAdminSetupToken(input: { restaurantSlug: string; userEmail: string }) {
  const payload: AdminSetupTokenPayload = {
    ver: TOKEN_VERSION,
    kind: "setup",
    slug: input.restaurantSlug,
    email: input.userEmail.toLowerCase().trim(),
    exp: Date.now() + SETUP_TOKEN_TTL_MS,
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = signPayload(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

function parseSignedAdminToken(token: string): SignedTokenPayloadBase | null {
  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = signPayload(encodedPayload);
  const providedSignature = Buffer.from(signature, "base64url");
  const expectedSignatureBuffer = Buffer.from(expectedSignature, "base64url");

  if (
    providedSignature.length !== expectedSignatureBuffer.length ||
    !timingSafeEqual(providedSignature, expectedSignatureBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as SignedTokenPayloadBase;

    if (
      payload.ver !== TOKEN_VERSION ||
      (payload.kind !== "access" && payload.kind !== "setup") ||
      !payload.slug ||
      !payload.email ||
      !payload.exp
    ) {
      return null;
    }

    if (payload.exp <= Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

function parseAdminAccessToken(token: string): AdminTokenPayload | null {
  const payload = parseSignedAdminToken(token);

  if (!payload || payload.kind !== "access") {
    return null;
  }

  return {
    ...payload,
    kind: "access",
  };
}

export function verifyAdminSetupToken(token: string): AdminSetupTokenPayload | null {
  const payload = parseSignedAdminToken(token);

  if (!payload || payload.kind !== "setup") {
    return null;
  }

  return {
    ...payload,
    kind: "setup",
  };
}

export function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";

  if (!authorization.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length).trim();
}

function getCookieValue(request: Request, cookieName: string) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookies = cookieHeader.split(";");

  for (const cookie of cookies) {
    const [rawName, ...rawValueParts] = cookie.trim().split("=");
    if (rawName === cookieName) {
      return decodeURIComponent(rawValueParts.join("="));
    }
  }

  return null;
}

export function getAdminSessionToken(request: Request) {
  return getBearerToken(request) ?? getCookieValue(request, ADMIN_SESSION_COOKIE);
}

export function attachAdminSessionCookie(response: NextResponse, token: string) {
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: getAdminCookieSameSite(),
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TOKEN_TTL_MS / 1000,
  });

  return response;
}

export function clearAdminSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: getAdminCookieSameSite(),
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return response;
}

export function requireAdminAccess(
  request: Request,
  context: { restaurantSlug: string },
): AdminAuthResult {
  const bearerToken = getAdminSessionToken(request);

  if (!bearerToken) {
    return {
      ok: false,
      response: adminJson({ error: "Autenticacao obrigatoria." }, { status: 401 }),
    };
  }

  const payload = parseAdminAccessToken(bearerToken);

  if (!payload) {
    return {
      ok: false,
      response: adminJson({ error: "Sessao invalida ou expirada." }, { status: 401 }),
    };
  }

  if (payload.slug !== context.restaurantSlug) {
    return {
      ok: false,
      response: adminJson({ error: "Acesso negado para este restaurante." }, { status: 403 }),
    };
  }

  return {
    ok: true,
    token: payload,
  };
}
