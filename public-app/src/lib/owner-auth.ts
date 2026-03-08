import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { assertDevOwnerToken } from "@/lib/dev-owner";
import { verifyPassword } from "@/lib/password";

const OWNER_SESSION_COOKIE = "owner_console_session";
const OWNER_TOKEN_VERSION = 1;
const OWNER_TOKEN_TTL_SECONDS = 60 * 60 * 12;

type OwnerSessionPayload = {
  ver: number;
  kind: "owner-session";
  email: string;
  exp: number;
};

function getOwnerConsoleSecret() {
  const secret =
    process.env.OWNER_CONSOLE_SECRET?.trim() || process.env.ADMIN_AUTH_SECRET?.trim() || "";

  if (!secret) {
    throw new Error("OWNER_CONSOLE_SECRET ou ADMIN_AUTH_SECRET nao configurado.");
  }

  return secret;
}

function getOwnerConsoleEmail() {
  return process.env.OWNER_CONSOLE_EMAIL?.trim().toLowerCase() ?? "";
}

function getOwnerConsolePasswordHash() {
  return process.env.OWNER_CONSOLE_PASSWORD_HASH?.trim() ?? "";
}

function getOwnerConsolePassword() {
  return process.env.OWNER_CONSOLE_PASSWORD ?? "";
}

export function hasOwnerConsoleCredentialsConfigured() {
  return Boolean(
    getOwnerConsoleEmail() && (getOwnerConsolePasswordHash() || getOwnerConsolePassword()),
  );
}

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signPayload(encodedPayload: string) {
  return createHmac("sha256", getOwnerConsoleSecret()).update(encodedPayload).digest("base64url");
}

function createOwnerSessionToken(email: string) {
  const payload: OwnerSessionPayload = {
    ver: OWNER_TOKEN_VERSION,
    kind: "owner-session",
    email: email.toLowerCase().trim(),
    exp: Date.now() + OWNER_TOKEN_TTL_SECONDS * 1000,
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = signPayload(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

function parseOwnerSessionToken(token: string) {
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
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as OwnerSessionPayload;

    if (
      payload.ver !== OWNER_TOKEN_VERSION ||
      payload.kind !== "owner-session" ||
      !payload.email ||
      !payload.exp
    ) {
      return null;
    }

    if (payload.exp <= Date.now()) {
      return null;
    }

    if (payload.email !== getOwnerConsoleEmail()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

async function readOwnerSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(OWNER_SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  return parseOwnerSessionToken(token);
}

async function verifyPlainOwnerPassword(password: string) {
  const configuredPassword = getOwnerConsolePassword();
  const providedPasswordBuffer = Buffer.from(password);
  const configuredPasswordBuffer = Buffer.from(configuredPassword);

  if (
    !configuredPassword ||
    providedPasswordBuffer.length !== configuredPasswordBuffer.length
  ) {
    return false;
  }

  return timingSafeEqual(providedPasswordBuffer, configuredPasswordBuffer);
}

export async function authenticateOwnerConsole(input: {
  email: string;
  password: string;
}) {
  if (!hasOwnerConsoleCredentialsConfigured()) {
    return false;
  }

  const normalizedEmail = input.email.trim().toLowerCase();

  if (normalizedEmail !== getOwnerConsoleEmail()) {
    return false;
  }

  const configuredPasswordHash = getOwnerConsolePasswordHash();

  if (configuredPasswordHash) {
    return verifyPassword(input.password, configuredPasswordHash);
  }

  return verifyPlainOwnerPassword(input.password);
}

export async function isOwnerConsoleAuthenticated() {
  return Boolean(await readOwnerSession());
}

export async function createOwnerConsoleSession(email: string) {
  const cookieStore = await cookies();

  cookieStore.set(OWNER_SESSION_COOKIE, createOwnerSessionToken(email), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/dev/owner",
    maxAge: OWNER_TOKEN_TTL_SECONDS,
  });
}

export async function clearOwnerConsoleSession() {
  const cookieStore = await cookies();
  cookieStore.delete(OWNER_SESSION_COOKIE);
}

export async function assertOwnerConsoleMutationAccess(legacyToken?: string | null) {
  if (hasOwnerConsoleCredentialsConfigured()) {
    const session = await readOwnerSession();

    if (!session) {
      throw new Error("Autenticacao do owner obrigatoria.");
    }

    return session;
  }

  assertDevOwnerToken(legacyToken);
  return null;
}
