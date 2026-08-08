import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getAdminFromRequest } from "@/lib/auth/session"

/**
 * Real access control for the admin surface. Verifies the signed httpOnly
 * session cookie (HMAC, via Web Crypto — Edge-safe) and:
 *   - redirects unauthenticated visitors away from /admin-ahmza/** to the login
 *   - returns 401 JSON for unauthenticated calls to /api/admin/**
 * The admin login page (/admin-login) and /api/auth/* are intentionally NOT
 * matched so they stay reachable while logged out.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const admin = await getAdminFromRequest(request)
  if (admin) return NextResponse.next()

  if (pathname.startsWith("/api/admin")) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    )
  }

  // Admin page while logged out → send to login, remembering where they wanted.
  const url = request.nextUrl.clone()
  url.pathname = "/admin-login"
  url.searchParams.set("from", pathname)
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ["/admin-ahmza/:path*", "/api/admin/:path*"],
}
