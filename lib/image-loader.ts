/*
 * Custom next/image loader. Keeps Vercel's Image Optimization out of the
 * request path: the Hobby plan's monthly transformation quota ran out and
 * every uncached `/_next/image` request started returning
 * `402 OPTIMIZED_IMAGE_REQUEST_PAYMENT_REQUIRED`, which broke images in
 * production only (`next dev` optimizes locally and has no quota).
 *
 *   - Cloudinary sources get resized/transcoded by Cloudinary itself
 *     (`f_auto` → AVIF/WebP per browser, `q_auto`, `w_<width>`).
 *   - Local files under /public are served as-is from Vercel's static CDN,
 *     which has no transformation quota. The `w` param does nothing there; it
 *     only tells next/image that this loader honours the requested width.
 *   - Other absolute URLs are returned untouched.
 */
import { cloudinaryUrl } from "./cloudinary"

type LoaderArgs = { src: string; width: number; quality?: number }

export default function imageLoader({ src, width, quality }: LoaderArgs): string {
  const url = cloudinaryUrl(src, { width, quality })
  if (url !== src || /^https?:/.test(src)) return url
  return `${src}${src.includes("?") ? "&" : "?"}w=${width}`
}
