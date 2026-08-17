import type { Metadata } from "next"

/**
 * Central SEO metadata helper.
 *
 * The August 2026 audit scored Technical SEO 38/100 and On-Page 32/100, with
 * "Contact and Catalog pages using homepage default title" as a critical issue.
 * The root cause was structural rather than editorial: those pages are
 * `"use client"` components, and a client component **cannot** export
 * `metadata` in the App Router — so they silently inherited the root layout's
 * title and description.
 *
 * The fix is a `layout.tsx` per client route segment that exports metadata built
 * through `pageMetadata()` below. Server pages call the same helper directly, so
 * every page emits a consistent canonical / Open Graph / Twitter set.
 */

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.puregrainexports.com"
).replace(/\/$/, "")

export const SITE_NAME = "Pure Grain Exports"

/** Default social share image. 1200x630 is the ratio both Facebook and X crop to. */
export const DEFAULT_OG_IMAGE = "/hero-leather-warm.jpg"

export const DEFAULT_DESCRIPTION =
  "B2B leather wholesale from Lahore, Pakistan. Full-grain hides and finished leather goods supplied to manufacturers in 40+ countries, with lab-tested quality and full export documentation."

type PageMetadataInput = {
  title: string
  description: string
  /** Route path beginning with "/", or "/" for the homepage. Drives the canonical. */
  path: string
  /** Absolute or root-relative image path. Falls back to the site default. */
  image?: string
  imageAlt?: string
  keywords?: string[]
  /** Set for blog posts so Open Graph emits article semantics. */
  type?: "website" | "article"
  publishedTime?: string
  modifiedTime?: string
  authors?: string[]
  /** Pass false for thin/utility routes that should stay out of the index. */
  index?: boolean
}

function absoluteUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`
}

/**
 * Builds a complete metadata object: canonical, hreflang, Open Graph and
 * Twitter card. `metadataBase` is set once on the root layout, so the relative
 * `canonical` here resolves to an absolute URL automatically.
 */
export function pageMetadata({
  title,
  description,
  path,
  image = DEFAULT_OG_IMAGE,
  imageAlt,
  keywords,
  type = "website",
  publishedTime,
  modifiedTime,
  authors,
  index = true,
}: PageMetadataInput): Metadata {
  const canonical = path === "/" ? "/" : path.replace(/\/$/, "")
  const ogImage = absoluteUrl(image)

  return {
    title,
    description,
    ...(keywords?.length ? { keywords } : {}),
    alternates: {
      canonical,
      // Single-language site today. `x-default` tells Google this URL serves
      // every locale, which is what the audit's "no hreflang for global
      // targeting" gap was asking for.
      languages: {
        en: canonical,
        "x-default": canonical,
      },
    },
    robots: index
      ? { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } }
      : { index: false, follow: true },
    openGraph: {
      type: type === "article" ? "article" : "website",
      siteName: SITE_NAME,
      locale: "en_US",
      url: absoluteUrl(canonical),
      title,
      description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: imageAlt ?? title }],
      ...(type === "article"
        ? {
            publishedTime,
            modifiedTime,
            authors,
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  }
}
