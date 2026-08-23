import type { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/seo"

/**
 * robots.txt is public. The previous version listed `/admin-ahmza` and
 * `/admin-ahmza/*` by name, which told anyone who fetched the file exactly where
 * the admin surface lives — flagged as a critical security finding in the SEO
 * audit, and a standard reconnaissance step.
 *
 * Disallow was never the right control for this anyway:
 *   - `Disallow` only asks well-behaved crawlers not to CRAWL a URL. It does not
 *     prevent indexing, and it does not stop anyone reading the file.
 *   - A page blocked by robots.txt can still be indexed from external links, and
 *     because Google cannot fetch it, it cannot see a `noindex` on it either.
 *
 * Admin routes are instead kept out of the index by an `X-Robots-Tag:
 * noindex, nofollow` response header set in `middleware.ts`, plus `noindex`
 * metadata on `/admin-login`. That works whether or not the path is guessed, and
 * the middleware already returns 401/redirect for unauthenticated requests.
 *
 * `/api` stays listed: those endpoints are not secret, they are simply worthless
 * to crawl, and keeping them out saves crawl budget.
 *
 * No `host:` directive is emitted. It was only ever understood by Yandex, which
 * deprecated it in 2018 in favour of a plain 301; Google has never supported it
 * and treats the line as an unknown directive. The canonical host is already
 * stated by the apex -> www redirect and by the canonical tag on every page.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          // Transactional / per-customer routes. Also noindex'd at the page
          // level; listed here to keep them out of the crawl entirely.
          "/sample-request/review",
          "/sample-request/success",
          "/request-sample/pay",
          "/payment-confirmation/",
          // Filtered catalogue permutations. The canonical on each filtered view
          // already points at the parent, this just avoids spending crawl budget
          // rediscovering them.
          "/*?type=",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
