import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;
const HASH_PREFIX = "scrypt";

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;

  return `${HASH_PREFIX}:${salt}:${derivedKey.toString("hex")}`;
}

export async function verifyPassword(password: string, storedPassword: string | null) {
  if (!storedPassword) {
    return false;
  }

  if (!storedPassword.startsWith(`${HASH_PREFIX}:`)) {
    return storedPassword === password;
  }

  const [, salt, hash] = storedPassword.split(":");

  if (!salt || !hash) {
    return false;
  }

  const storedHashBuffer = Buffer.from(hash, "hex");
  const derivedKey = (await scrypt(password, salt, storedHashBuffer.length)) as Buffer;

  if (storedHashBuffer.length !== derivedKey.length) {
    return false;
  }

  return timingSafeEqual(storedHashBuffer, derivedKey);
}

