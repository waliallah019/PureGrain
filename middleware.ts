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
/**
 * Keeps the admin surface out of search results.
 *
 * `app/admin-ahmza/layout.tsx` is a client component and therefore cannot export
 * `metadata`, so an `X-Robots-Tag` response header is the way to noindex it. It
 * also covers the JSON API responses, which a `<meta>` tag never could.
 *
 * This replaces listing the admin paths in robots.txt. A public robots.txt that
 * names your admin URL advertises it to anyone who reads the file — that was
 * flagged as a critical security finding in the SEO audit.
 */
const NOINDEX_HEADER = "noindex, nofollow, noarchive"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const admin = await getAdminFromRequest(request)
  if (admin) {
    const response = NextResponse.next()
    response.headers.set("X-Robots-Tag", NOINDEX_HEADER)
    return response
  }

  if (pathname.startsWith("/api/admin")) {
    const unauthorized = NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    )
    unauthorized.headers.set("X-Robots-Tag", NOINDEX_HEADER)
    return unauthorized
  }

  // Admin page while logged out → send to login, remembering where they wanted.
  const url = request.nextUrl.clone()
  url.pathname = "/admin-login"
  url.searchParams.set("from", pathname)
  const redirect = NextResponse.redirect(url)
  redirect.headers.set("X-Robots-Tag", NOINDEX_HEADER)
  return redirect
}

export const config = {
  matcher: ["/admin-ahmza/:path*", "/api/admin/:path*"],
}
