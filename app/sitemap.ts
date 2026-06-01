import type { MetadataRoute } from "next"
import connectDB from "@/lib/config/db"
import Blog from "@/lib/models/Blog"

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.puregrainexports.com").replace(/\/$/, "")

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const routes = [
    "",
    "/about",
    "/blogs",
    "/catalog",
    "/catalog/raw-leather",
    "/catalog/finished-products",
    "/contact",
    "/custom-manufacturing",
    "/industries",
    "/privacy",
    "/quality",
    "/quote-request",
    "/sample-request",
    "/terms",
  ]

  let blogRoutes: MetadataRoute.Sitemap = []

  try {
    await connectDB()
    const publishedBlogs = await Blog.find({ status: "published" })
      .select("slug updatedAt publishedAt createdAt")
      .lean()

    blogRoutes = publishedBlogs.map((blog) => ({
      url: `${siteUrl}/blogs/${blog.slug}`,
      lastModified: blog.updatedAt || blog.publishedAt || blog.createdAt || now,
      changeFrequency: "monthly",
      priority: 0.7,
    }))
  } catch {
    blogRoutes = []
  }

  const staticRoutes: MetadataRoute.Sitemap = routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: now,
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : route.startsWith("/catalog") ? 0.9 : 0.8,
  }))

  return [...staticRoutes, ...blogRoutes]
}
