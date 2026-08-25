/**
 * Accept-header content negotiation, per RFC 9110 §12.5.1 and the
 * acceptmarkdown.com readiness checks:
 *
 *   1. serve Markdown when the client asks for `text/markdown`
 *   2. set `Vary: Accept` on every negotiable response
 *   3. answer 406 when the client accepts nothing we can produce
 *   4. honour q-values when ranking the client's preferences
 *
 * Kept dependency-free and Edge-safe so `middleware.ts` can use it.
 */

export const MARKDOWN_CONTENT_TYPE = "text/markdown; charset=utf-8"
export const HTML_CONTENT_TYPE = "text/html; charset=utf-8"

/** What the client would rather have, once q-values are taken into account. */
export type NegotiatedType = "markdown" | "html" | "unacceptable"

type MediaRange = {
  type: string
  subtype: string
  q: number
  /** Index in the original header, used to break q ties in declaration order. */
  order: number
}

/**
 * Parses an Accept header into media ranges with quality values.
 *
 * A missing or malformed q defaults to 1, and q values outside 0–1 are clamped,
 * both per RFC 9110 §12.4.2. Parameters other than q (`;level=1`) are ignored —
 * they do not affect which representation we can produce.
 */
function parseAccept(header: string): MediaRange[] {
  const ranges: MediaRange[] = []

  header.split(",").forEach((part, order) => {
    const segments = part.trim().split(";")
    const media = segments.shift()?.trim().toLowerCase()
    if (!media) return

    const slash = media.indexOf("/")
    if (slash === -1) return

    const type = media.slice(0, slash).trim()
    const subtype = media.slice(slash + 1).trim()
    if (!type || !subtype) return

    let q = 1
    for (const segment of segments) {
      const [rawKey, rawValue] = segment.split("=")
      if (rawKey?.trim().toLowerCase() !== "q") continue
      const parsed = Number.parseFloat(rawValue ?? "")
      if (Number.isFinite(parsed)) q = Math.min(1, Math.max(0, parsed))
    }

    ranges.push({ type, subtype, q, order })
  })

  return ranges
}

/** Best q-value the header assigns to a concrete media type, or 0 if excluded. */
function qualityFor(ranges: MediaRange[], type: string, subtype: string): number {
  let best = 0
  let bestSpecificity = -1

  for (const range of ranges) {
    // Specificity ranking so `text/markdown;q=0` beats a broad `*/*;q=1`,
    // which is how a client opts out of one format while accepting others.
    let specificity: number
    if (range.type === type && range.subtype === subtype) specificity = 3
    else if (range.type === type && range.subtype === "*") specificity = 2
    else if (range.type === "*" && range.subtype === "*") specificity = 1
    else continue

    if (specificity > bestSpecificity) {
      bestSpecificity = specificity
      best = range.q
    }
  }

  return best
}

/**
 * Decides which representation to return for an Accept header.
 *
 * No header at all means "anything" (RFC 9110 §12.5.1), which for a website
 * means HTML — this is what plain browsers and most crawlers send, so the
 * default path must never change behaviour for them.
 */
export function negotiate(acceptHeader: string | null | undefined): NegotiatedType {
  const header = (acceptHeader ?? "").trim()
  if (!header) return "html"

  const ranges = parseAccept(header)
  if (ranges.length === 0) return "html"

  const markdown = Math.max(
    qualityFor(ranges, "text", "markdown"),
    // `text/x-markdown` is the pre-RFC-7763 spelling and still in the wild.
    qualityFor(ranges, "text", "x-markdown")
  )
  const html = qualityFor(ranges, "text", "html")

  if (markdown === 0 && html === 0) return "unacceptable"

  // Ties go to HTML so that a browser sending `*/*` (which scores both equally)
  // keeps getting the rendered page.
  return markdown > html ? "markdown" : "html"
}
