import type { MetadataRoute } from "next"
import connectDB from "@/lib/config/db"
import Blog from "@/lib/models/Blog"
import RawLeather from "@/lib/models/RawLeather"
import FinishedProduct from "@/lib/models/FinishedProduct"
import { SITE_URL } from "@/lib/seo"

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
 */

const now = new Date()

type Entry = MetadataRoute.Sitemap[number]

const STATIC_ROUTES: Array<{ path: string; priority: number; changeFrequency: Entry["changeFrequency"] }> = [
  { path: "", priority: 1.0, changeFrequency: "weekly" },
  { path: "/catalog", priority: 0.9, changeFrequency: "weekly" },
  { path: "/catalog/raw-leather", priority: 0.9, changeFrequency: "weekly" },
  { path: "/catalog/finished-products", priority: 0.9, changeFrequency: "weekly" },
  { path: "/about", priority: 0.8, changeFrequency: "monthly" },
  { path: "/quality", priority: 0.8, changeFrequency: "monthly" },
  { path: "/industries", priority: 0.8, changeFrequency: "monthly" },
  { path: "/custom-manufacturing", priority: 0.8, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.7, changeFrequency: "monthly" },
  { path: "/sample-request", priority: 0.7, changeFrequency: "monthly" },
  { path: "/quote-request", priority: 0.7, changeFrequency: "monthly" },
  { path: "/blogs", priority: 0.7, changeFrequency: "weekly" },
  { path: "/payments-and-trade-terms", priority: 0.4, changeFrequency: "yearly" },
  { path: "/return-policy", priority: 0.4, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
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
  const staticRoutes: MetadataRoute.Sitemap = STATIC_ROUTES.map(
    ({ path, priority, changeFrequency }) => ({
      url: `${SITE_URL}${path}`,
      lastModified: now,
      changeFrequency,
      priority,
    })
  )

  const connected = await safe("db connection", async () => {
    await connectDB()
    return true
  }, false)

  if (!connected) return staticRoutes

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
    lastModified: blog.updatedAt || blog.publishedAt || blog.createdAt || now,
    changeFrequency: "monthly",
    priority: 0.6,
  }))

  const hideRoutes: MetadataRoute.Sitemap = hides.map((item: any) => ({
    url: `${SITE_URL}/catalog/raw-leather/${item._id}`,
    lastModified: item.updatedAt || item.createdAt || now,
    changeFrequency: "weekly",
    priority: 0.8,
  }))

  const productRoutes: MetadataRoute.Sitemap = products.map((item: any) => ({
    url: `${SITE_URL}/catalog/finished-products/${item._id}`,
    lastModified: item.updatedAt || item.createdAt || now,
    changeFrequency: "weekly",
    priority: 0.8,
  }))

  return [...staticRoutes, ...blogRoutes, ...hideRoutes, ...productRoutes]
}
