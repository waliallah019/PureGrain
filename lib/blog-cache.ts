import { unstable_cache, revalidateTag } from "next/cache"
import connectDB from "@/lib/config/db"
import blogService from "@/lib/services/blogService"

/**
 * Cached reads for the public blog surface.
 *
 * Both `/blogs` and `/blogs/[slug]` are `force-dynamic`, so before this every
 * page view ran a fresh MongoDB round trip — a listing render cost a
 * countDocuments plus a find, and an article render cost a findOne plus the
 * catalogue-stats query behind its price tokens. None of that content changes
 * between publishes.
 *
 * Reads are cached under the `blogs` tag and dropped the moment a post is
 * created, updated or deleted (see `invalidateBlogs`), so editors still see
 * their changes immediately.
 */

const TAG = "blogs"

/** Serialisable shape — `unstable_cache` stores JSON, not Mongoose documents. */
export type BlogListItem = {
  _id: string
  title: string
  slug: string
  excerpt: string
  coverImage?: string
  tags: string[]
  authorName: string
  readingTimeMinutes: number
  publishedAt?: string
  createdAt?: string
}

export type BlogListResult = { blogs: BlogListItem[]; total: number }

function toListItem(b: Record<string, any>): BlogListItem {
  return {
    _id: String(b._id),
    title: b.title,
    slug: b.slug,
    excerpt: b.excerpt,
    coverImage: b.coverImage || undefined,
    tags: Array.isArray(b.tags) ? b.tags : [],
    authorName: b.authorName,
    readingTimeMinutes: b.readingTimeMinutes ?? 1,
    // Dates must be strings: the cache serialises to JSON and a Date would
    // come back as a string anyway, so normalise it here rather than leaving
    // callers to deal with two possible types.
    publishedAt: b.publishedAt ? new Date(b.publishedAt).toISOString() : undefined,
    createdAt: b.createdAt ? new Date(b.createdAt).toISOString() : undefined,
  }
}

/**
 * One published page of the blog index.
 *
 * Keyed by page number so pagination does not share a cache entry — the key
 * array is part of `unstable_cache`'s identity, and the closure argument alone
 * would not distinguish page 1 from page 2.
 */
export function getPublishedBlogPage(page: number, limit: number) {
  return unstable_cache(
    async (): Promise<BlogListResult> => {
      await connectDB()
      const { blogs, total } = await blogService.getBlogs(
        { status: "published", includeDraft: false, summary: true },
        page,
        limit,
        "publishedAt",
        "desc"
      )
      return {
        blogs: (blogs as unknown as Array<Record<string, any>>).map(toListItem),
        total,
      }
    },
    ["blog-list", String(page), String(limit)],
    { revalidate: 3600, tags: [TAG] }
  )()
}

/** Every published post, for the agent Markdown index. */
export function getAllPublishedBlogs(limit = 100) {
  return unstable_cache(
    async (): Promise<BlogListItem[]> => {
      await connectDB()
      const { blogs } = await blogService.getBlogs(
        { status: "published", includeDraft: false, summary: true },
        1,
        limit,
        "publishedAt",
        "desc"
      )
      return (blogs as unknown as Array<Record<string, any>>).map(toListItem)
    },
    ["blog-list-all", String(limit)],
    { revalidate: 3600, tags: [TAG] }
  )()
}

/** A full published post, including article HTML, as plain serialisable data. */
export type BlogPost = {
  _id: string
  title: string
  slug: string
  excerpt: string
  content: string
  coverImage?: string
  tags: string[]
  authorName: string
  seoTitle?: string
  seoDescription?: string
  readingTimeMinutes: number
  publishedAt?: string
  createdAt?: string
  updatedAt?: string
}

/**
 * One published post by slug.
 *
 * The article route reads the same post twice per render — once in
 * `generateMetadata` and once in the page body. Caching here collapses that to
 * a single query, and to zero on a warm cache.
 */
export function getPublishedPostBySlug(slug: string) {
  return unstable_cache(
    async (): Promise<BlogPost | null> => {
      await connectDB()
      const post = (await blogService.getBlogBySlug(slug)) as unknown as
        | Record<string, any>
        | null
      if (!post) return null

      const raw = typeof post.toObject === "function" ? post.toObject() : post
      const iso = (v: unknown) => (v ? new Date(v as string).toISOString() : undefined)

      return {
        _id: String(raw._id),
        title: raw.title,
        slug: raw.slug,
        excerpt: raw.excerpt,
        content: raw.content,
        coverImage: raw.coverImage || undefined,
        tags: Array.isArray(raw.tags) ? raw.tags : [],
        authorName: raw.authorName,
        seoTitle: raw.seoTitle || undefined,
        seoDescription: raw.seoDescription || undefined,
        readingTimeMinutes: raw.readingTimeMinutes ?? 1,
        publishedAt: iso(raw.publishedAt),
        createdAt: iso(raw.createdAt),
        updatedAt: iso(raw.updatedAt),
      }
    },
    ["blog-post", slug],
    { revalidate: 3600, tags: [TAG] }
  )()
}

/**
 * Drops every cached blog read.
 *
 * Called from the blog mutation routes so a publish or edit is visible on the
 * next request rather than after the revalidate window.
 */
export function invalidateBlogs(): void {
  try {
    revalidateTag(TAG)
  } catch (error) {
    // Cache housekeeping must never fail an otherwise successful write.
    console.error("blog-cache: revalidate failed", error)
  }
}
