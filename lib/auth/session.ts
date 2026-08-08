// lib/auth/session.ts
//
// Admin session utilities built on Web Crypto only, so this module is safe to
// import from BOTH the Edge middleware and Node route handlers. Password
// hashing (which needs Node's `crypto.scrypt`) lives separately in
// `lib/auth/password.ts` and must only be imported from Node runtime routes.
//
// A session is a compact HMAC-SHA256 signed token: `<b64url(payload)>.<b64url(sig)>`.
// The cookie holding it is httpOnly + secure + sameSite=lax, so it is never
// readable by client JS (unlike the old localStorage approach).

import { NextResponse } from "next/server";

export const SESSION_COOKIE = "pg_admin_session";
export const SESSION_MAX_AGE_SECONDS = 12 * 60 * 60; // 12h

export interface AdminSession {
  sub: string;
  email: string;
  role: string;
  exp: number; // unix seconds
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function getSecret(): string {
  const s = process.env.SESSION_SECRET || process.env.ADMIN_JWT_SECRET;
  if (!s || s.length < 16) {
    throw new Error(
      "SESSION_SECRET is not set (min 16 chars). Configure it in your environment before using admin auth."
    );
  }
  return s;
}

function bytesToB64url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlToBytes(s: string): Uint8Array {
  let t = s.replace(/-/g, "+").replace(/_/g, "/");
  while (t.length % 4) t += "=";
  const bin = atob(t);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function strToB64url(s: string): string {
  return bytesToB64url(encoder.encode(s));
}
function b64urlToStr(s: string): string {
  return decoder.decode(b64urlToBytes(s));
}

async function importKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

/** Sign a session payload into a token string. */
export async function signSession(
  payload: Omit<AdminSession, "exp"> & { exp?: number }
): Promise<string> {
  const exp =
    payload.exp ?? Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS;
  const body: AdminSession = {
    sub: payload.sub,
    email: payload.email,
    role: payload.role,
    exp,
  };
  const data = strToB64url(JSON.stringify(body));
  const key = await importKey(getSecret());
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return `${data}.${bytesToB64url(new Uint8Array(sig))}`;
}

/** Verify a token and return the payload, or null if invalid/expired. */
export async function verifySession(
  token: string | undefined | null
): Promise<AdminSession | null> {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [data, sigStr] = parts;

  let secret: string;
  try {
    secret = getSecret();
  } catch {
    return null;
  }

  try {
    const key = await importKey(secret);
    const ok = await crypto.subtle.verify(
      "HMAC",
      key,
      b64urlToBytes(sigStr),
      encoder.encode(data)
    );
    if (!ok) return null;

    const payload = JSON.parse(b64urlToStr(data)) as AdminSession;
    if (
      !payload ||
      typeof payload.exp !== "number" ||
      payload.exp < Math.floor(Date.now() / 1000)
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

/**
 * Read a cookie value from the raw `Cookie` header. Works for both plain
 * `Request` (route handlers) and `NextRequest` (middleware), so the guard is
 * usable regardless of a handler's parameter type.
 */
export function getSessionTokenFromRequest(req: Request): string | undefined {
  const header = req.headers.get("cookie");
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    if (key === SESSION_COOKIE) {
      return decodeURIComponent(part.slice(idx + 1).trim());
    }
  }
  return undefined;
}

/** Resolve the admin session from a request's cookie, or null. */
export async function getAdminFromRequest(
  req: Request
): Promise<AdminSession | null> {
  return verifySession(getSessionTokenFromRequest(req));
}

/**
 * Guard helper for route handlers. Returns `{ ok: true, admin }` when a valid
 * admin session is present, otherwise `{ ok: false, response }` carrying a 401
 * to return directly from the handler.
 */
export async function requireAdmin(
  req: Request
): Promise<
  | { ok: true; admin: AdminSession }
  | { ok: false; response: NextResponse }
> {
  const admin = await getAdminFromRequest(req);
  if (!admin) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      ),
    };
  }
  return { ok: true, admin };
}
