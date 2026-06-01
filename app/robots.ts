import type { MetadataRoute } from "next"

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.puregrainexports.com").replace(/\/$/, "")

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin-ahmza", "/admin-ahmza/*", "/admin-login", "/api", "/api/*"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
