import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminFromRequest } from "@/lib/auth/session";

/** Returns the current admin session (from the httpOnly cookie) or 401. */
export async function GET(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({
    authenticated: true,
    user: { email: admin.email, role: admin.role },
  });
}
