import { createHmac, timingSafeEqual } from "node:crypto";
import { adminJson } from "@/lib/admin-response";

const TOKEN_VERSION = 1;
const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const SETUP_TOKEN_TTL_MS = 2 * 60 * 60 * 1000;

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

export function requireAdminAccess(
  request: Request,
  context: { restaurantSlug: string },
): AdminAuthResult {
  const bearerToken = getBearerToken(request);

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
