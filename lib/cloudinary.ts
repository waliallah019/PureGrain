/*
 * Cloudinary delivery URLs. Safe to import from client components and from the
 * next/image loader: it only builds public URLs, so it must never touch the API
 * key or secret. The authenticated SDK lives in lib/config/cloudinary.ts and is
 * server-only.
 */
import localAssets from "./cloudinary-local-assets.json" with { type: "json" }

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "da1coaysi"
const DELIVERY_ROOT = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload`
const CLOUDINARY_UPLOAD_URL = /^https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\//
const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:/i

/** Shown when a product has no image, or its image fails to load. */
export const IMAGE_FALLBACK = "/placeholder.svg"

/**
 * /public paths that have a Cloudinary copy, written by
 * scripts/uploadPublicImages.mjs. A path listed here moves to Cloudinary with no
 * call-site changes; one that is missing keeps being served from /public.
 */
const LOCAL_ASSETS: Record<string, string> = localAssets

export type CloudinaryOptions = {
  width?: number
  height?: number
  /** `limit` never upscales or crops, so it is safe for any aspect ratio. */
  crop?: "limit" | "fill" | "fit" | "pad"
  /** Only meaningful with a cropping mode such as `fill`. */
  gravity?: string
  quality?: number | "auto" | `auto:${string}`
  format?: string
  dpr?: number
}

function toCloudinarySource(src: string): string | null {
  const local = LOCAL_ASSETS[src.split("?")[0]]
  if (local) return `${DELIVERY_ROOT}/${local}`
  if (CLOUDINARY_UPLOAD_URL.test(src)) return src
  // Anything else without a scheme or leading slash is a bare public ID.
  if (src && !src.startsWith("/") && !HAS_SCHEME.test(src)) return `${DELIVERY_ROOT}/${src}`
  return null
}

function buildTransformation({
  width,
  height,
  crop = "limit",
  gravity,
  quality = "auto",
  format = "auto",
  dpr,
}: CloudinaryOptions): string {
  const parts = [`f_${format}`, `q_${quality}`]
  if (width || height) parts.push(`c_${crop}`)
  if (gravity) parts.push(`g_${gravity}`)
  if (width) parts.push(`w_${Math.round(width)}`)
  if (height) parts.push(`h_${Math.round(height)}`)
  if (dpr) parts.push(`dpr_${dpr}`)
  return parts.join(",")
}

/**
 * Adds a transformation to a Cloudinary URL or public ID. Sources Cloudinary
 * does not hold (/public files, blob: previews, third-party URLs) come back
 * unchanged, so this can wrap any image value.
 */
export function cloudinaryUrl(src: string, options: CloudinaryOptions = {}): string {
  const source = toCloudinarySource(src)
  if (!source) return src
  const uploadEnd = source.indexOf("/upload/") + "/upload/".length
  return `${source.slice(0, uploadEnd)}${buildTransformation(options)}/${source.slice(uploadEnd)}`
}

// Bounded by the column they render in; matches widths in next.config.mjs so
// articles reuse derivatives that already exist.
const ARTICLE_IMAGE_WIDTHS = [256, 384, 640, 828]
const ARTICLE_IMAGE_SIZES = "(min-width: 1024px) 416px, (min-width: 768px) 352px, 100vw"

/**
 * Article bodies are stored as HTML, so their <img> tags never reach next/image.
 * Gives Cloudinary images in that HTML the same responsive delivery.
 */
export function optimizeArticleImages(html: string): string {
  return html.replace(/<img\b[^>]*>/gi, (tag) => {
    const src = tag.match(/\ssrc="([^"]+)"/i)?.[1]
    if (!src || /\ssrcset=/i.test(tag) || cloudinaryUrl(src) === src) return tag

    const srcSet = ARTICLE_IMAGE_WIDTHS.map((w) => `${cloudinaryUrl(src, { width: w })} ${w}w`).join(", ")
    const fallback = cloudinaryUrl(src, { width: 828 })
    const lazy = /\sloading=/i.test(tag) ? "" : ' loading="lazy"'
    return tag.replace(
      /\ssrc="[^"]+"/i,
      () => ` src="${fallback}" srcset="${srcSet}" sizes="${ARTICLE_IMAGE_SIZES}"${lazy}`,
    )
  })
}
