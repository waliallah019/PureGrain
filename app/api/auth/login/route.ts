import { NextResponse } from "next/server";
import {
  signSession,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/password";

// Password hashing (scrypt) needs the Node runtime.
export const runtime = "nodejs";

/**
 * Admin login. Verifies the submitted identifier + password against the
 * server-side admin credentials (ADMIN_LOGIN_USER / ADMIN_PASSWORD_HASH env
 * vars — note ADMIN_EMAIL is a separate, email-notifications var), then issues
 * an httpOnly, signed session cookie. Replaces the old client-side hardcoded
 * credential check in lib/auth.tsx.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = typeof body?.email === "string" ? body.email : "";
    const password = typeof body?.password === "string" ? body.password : "";

    const adminUser = process.env.ADMIN_LOGIN_USER;
    const adminHash = process.env.ADMIN_PASSWORD_HASH;
    if (!adminUser || !adminHash) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Admin login is not configured. Set ADMIN_LOGIN_USER and ADMIN_PASSWORD_HASH.",
        },
        { status: 500 }
      );
    }

    const emailOk =
      email.trim().toLowerCase() === adminUser.trim().toLowerCase();
    const passOk = password.length > 0 && (await verifyPassword(password, adminHash));
    if (!emailOk || !passOk) {
      return NextResponse.json(
        { success: false, message: "Invalid credentials" },
        { status: 401 }
      );
    }

    const token = await signSession({
      sub: adminUser,
      email: adminUser,
      role: "admin",
    });

    const res = NextResponse.json({
      success: true,
      user: { email: adminUser, role: "admin" },
    });
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
    return res;
  } catch {
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
