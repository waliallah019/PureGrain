// lib/auth/password.ts
//
// Node-only password hashing using the built-in `crypto.scrypt` (no external
// bcrypt dependency). Import this ONLY from Node-runtime route handlers — it is
// not Edge-safe. Hash format: `scrypt:<saltHex>:<hashHex>` (colon-separated so
// the value is safe to store in .env without dotenv `$` variable expansion).

import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number
) => Promise<Buffer>;

const KEYLEN = 64;

/** Produce a `scrypt:salt:hash` string for a plaintext password. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scryptAsync(password, salt, KEYLEN);
  return `scrypt:${salt.toString("hex")}:${derived.toString("hex")}`;
}

/** Constant-time verify a plaintext password against a stored `scrypt:..` hash. */
export async function verifyPassword(
  password: string,
  stored: string
): Promise<boolean> {
  try {
    const [scheme, saltHex, hashHex] = stored.split(":");
    if (scheme !== "scrypt" || !saltHex || !hashHex) return false;
    const salt = Buffer.from(saltHex, "hex");
    const expected = Buffer.from(hashHex, "hex");
    const derived = await scryptAsync(password, salt, expected.length);
    return (
      expected.length === derived.length && timingSafeEqual(expected, derived)
    );
  } catch {
    return false;
  }
}
