import type { MetadataRoute } from "next"
import connectDB from "@/lib/config/db"
import Blog from "@/lib/models/Blog"
import RawLeather from "@/lib/models/RawLeather"
import FinishedProduct from "@/lib/models/FinishedProduct"
import { SITE_URL } from "@/lib/seo"
import { INDUSTRY_PAGE_LIST } from "@/lib/industries"

/**
 * The SEO audit's third critical finding: "The sitemap lists 20 static pages.
 * Hundreds of individual product pages are completely absent. Google cannot
 * efficiently discover these pages."
 *
 * Product URLs are now pulled from the database alongside the blog posts.
 *
 * Deliberately excluded:
 *   - Filtered catalogue views (`?type=...`) — these are canonicalised to the
 *     parent catalogue page, so listing them would contradict the canonical.
 *   - Transactional routes (sample review/success, checkout, payment
 *     confirmation) — noindex'd; a sitemap entry for a noindex URL is a
 *     conflicting signal.
 *   - `/privacy-policy` — the orphaned duplicate of `/privacy`, canonicalised
 *     to it.
 *   - Conversion/utility routes (`/contact`, `/sample-request`,
 *     `/quote-request`). These are indexable and reachable from the header and
 *     footer on every page, so Google finds them regardless. A sitemap is a
 *     statement about which URLs deserve crawl attention, and form pages with
 *     no standalone search value only dilute that signal.
 *
 * `changefreq` and `priority` are intentionally absent. Google has confirmed it
 * ignores both, and Bing treats `priority` as spam signal noise. Only `loc` and
 * an accurate `lastmod` carry weight.
 */

/**
 * Regenerate hourly rather than freezing at build time.
 *
 * Without this the route is fully prerendered (`○ /sitemap.xml` in the build
 * output), which means the URL list is a snapshot of whatever was in MongoDB
 * when the last deploy ran. Blogs and products published through the admin
 * panel afterwards stayed out of the sitemap indefinitely — until someone
 * happened to redeploy. An hour is well inside the window Google re-fetches a
 * sitemap in, and costs at most 24 queries a day.
 */
export const revalidate = 3600

/**
 * `lastmod` for hand-written pages.
 *
 * This used to be a module-level `new Date()`, which stamped every static route
 * with "whenever this module was evaluated" — i.e. build time, and after the
 * change above, the top of every hour. A `lastmod` that always says "just now"
 * is exactly the pattern Google calls unreliable and then ignores site-wide,
 * taking the genuinely accurate per-product dates below down with it.
 *
 * Bump this by hand when you edit the copy on one of the STATIC_ROUTES pages.
 */
const STATIC_CONTENT_REVISED = new Date("2026-08-18T00:00:00.000Z")

const STATIC_ROUTES = [
  "",
  "/catalog",
  "/catalog/raw-leather",
  "/catalog/finished-products",
  "/about",
  "/quality",
  "/industries",
  // Industry landing pages. Sourced from the same registry the hub links
  // from, so a new page cannot be added without entering the sitemap.
  ...INDUSTRY_PAGE_LIST.map((i) => i.path),
  "/custom-manufacturing",
  "/blogs",
  "/payments-and-trade-terms",
  "/return-policy",
  "/privacy",
  "/terms",
]

/** Each collection is fetched independently so one failure cannot empty the map. */
async function safe<T>(label: string, fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    console.error(`sitemap: failed to load ${label}`, error)
    return fallback
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: STATIC_CONTENT_REVISED,
  }))

  /**
   * Deliberately NOT swallowed. If Mongo is unreachable we must not publish a
   * 13-URL sitemap in place of a 526-URL one — dropping every product and post
   * at once is a far worse signal than a stale sitemap.
   *
   * Because the route is ISR (see `revalidate`), throwing here does not surface
   * a 500 to Googlebot: the regeneration fails in the background and the last
   * good copy keeps being served until the next attempt succeeds. At build time
   * it fails the deploy loudly, which is the correct outcome — better a blocked
   * deploy than one that silently de-lists 97% of the site.
   */
  await connectDB()

  const [blogs, hides, products] = await Promise.all([
    safe(
      "blogs",
      async () =>
        Blog.find({ status: "published" })
          .select("slug updatedAt publishedAt createdAt")
          .lean(),
      [] as any[]
    ),
    safe(
      "raw leather",
      async () => RawLeather.find({}).select("_id updatedAt createdAt").lean(),
      [] as any[]
    ),
    safe(
      "finished products",
      async () => FinishedProduct.find({}).select("_id updatedAt createdAt").lean(),
      [] as any[]
    ),
  ])

  const blogRoutes: MetadataRoute.Sitemap = blogs.map((blog: any) => ({
    url: `${SITE_URL}/blogs/${blog.slug}`,
    lastModified:
      blog.updatedAt || blog.publishedAt || blog.createdAt || STATIC_CONTENT_REVISED,
  }))

  const hideRoutes: MetadataRoute.Sitemap = hides.map((item: any) => ({
    url: `${SITE_URL}/catalog/raw-leather/${item._id}`,
    lastModified: item.updatedAt || item.createdAt || STATIC_CONTENT_REVISED,
  }))

  const productRoutes: MetadataRoute.Sitemap = products.map((item: any) => ({
    url: `${SITE_URL}/catalog/finished-products/${item._id}`,
    lastModified: item.updatedAt || item.createdAt || STATIC_CONTENT_REVISED,
  }))

  return [...staticRoutes, ...blogRoutes, ...hideRoutes, ...productRoutes]
}
