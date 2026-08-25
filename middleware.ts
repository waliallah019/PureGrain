import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getAdminFromRequest } from "@/lib/auth/session"
import { negotiate } from "@/lib/agent/content-negotiation"

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

function isAdminPath(pathname: string): boolean {
  return pathname.startsWith("/admin-ahmza") || pathname.startsWith("/api/admin")
}

/**
 * The admin gate, unchanged. Extracted from the top level so that widening the
 * matcher for content negotiation does not run a Web Crypto session verify on
 * every public page view.
 */
async function adminGate(request: NextRequest) {
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

/**
 * Accept-header content negotiation for public pages (acceptmarkdown.com).
 *
 *   - `Accept: text/markdown` rewrites to the Markdown renderer, so the same
 *     canonical URL serves both representations.
 *   - Everything else falls through to the normal HTML render, with
 *     `Vary: Accept` added so a CDN keys the two variants separately. Without
 *     that header a shared cache can hand an agent the HTML it cached for a
 *     browser — the specific failure the audit flagged.
 *   - A client that accepts neither HTML nor Markdown gets 406, per RFC 9110.
 */
function negotiateMarkdown(request: NextRequest) {
  const accept = request.headers.get("accept")
  const decision = negotiate(accept)

  if (decision === "markdown") {
    const url = request.nextUrl.clone()
    url.pathname = "/api/agent/markdown"
    url.search = ""
    url.searchParams.set("path", request.nextUrl.pathname)

    /*
     * The requested path is passed as a request HEADER as well as a query
     * param. After a rewrite, a route handler's `nextUrl` still reflects the
     * URL the client asked for — not the rewrite target — so the query string
     * added here is not visible to the handler. The header is the documented
     * middleware-to-handler channel and is what the handler reads first; the
     * query param is kept so the endpoint can still be called directly.
     */
    const headers = new Headers(request.headers)
    headers.set("x-agent-md-path", request.nextUrl.pathname)

    return NextResponse.rewrite(url, { request: { headers } })
  }

  if (decision === "unacceptable") {
    return new NextResponse(
      `# 406 — Not Acceptable\n\nThis URL can be served as \`text/html\` or \`text/markdown\`.\nRe-request with \`Accept: text/markdown\` or \`Accept: text/html\`.\n`,
      {
        status: 406,
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          Vary: "Accept, Accept-Encoding",
        },
      }
    )
  }

  const response = NextResponse.next()
  // `append`, not `set`: Next adds its own RSC-related Vary values downstream
  // and clobbering them would break client-side navigation caching.
  response.headers.append("Vary", "Accept")
  return response
}

export async function middleware(request: NextRequest) {
  if (isAdminPath(request.nextUrl.pathname)) {
    return adminGate(request)
  }
  return negotiateMarkdown(request)
}

export const config = {
  matcher: [
    "/admin-ahmza/:path*",
    "/api/admin/:path*",
    /*
     * Public pages, for Accept negotiation.
     *
     * Excluded: Next's build assets, the image optimiser, every other /api
     * route (they speak JSON and negotiating them would be wrong), and any
     * path containing a dot — which covers sitemap.xml, robots.txt, llms.txt
     * and every static file, all of which already declare their own type.
     */
    "/((?!_next/static|_next/image|api/|.*\\.).*)",
  ],
}
