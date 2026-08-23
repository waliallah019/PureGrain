import type { CatalogueStats, ProductTypeStat } from "@/lib/catalogue-stats"

/**
 * Catalogue tokens for blog content.
 *
 * Articles quote prices, MOQs and SKU counts. Hardcoding those into the stored
 * HTML would mean every price edit in the admin panel silently turns a
 * published article into a false claim. Instead article HTML carries tokens:
 *
 *     Wallets start at {{pg:price-from:Wallet}} per piece.
 *     {{pg:table-products:Wallet|Belt}}
 *
 * ...which are resolved against a live catalogue snapshot at render time. The
 * catalogue stays the single source of truth and the copy never goes stale.
 *
 * Tokens are plain text, so they survive editing in TinyMCE and can be typed
 * by hand into new posts.
 *
 * ── Supported tokens ──────────────────────────────────────────────────────
 *   {{pg:price-from:<Type>}}    lowest unit price          → "$12"
 *   {{pg:price-range:<Type>}}   price span                 → "$12–$13.50"
 *   {{pg:moq-from:<Type>}}      lowest MOQ                 → "5"
 *   {{pg:moq-range:<Type>}}     MOQ span                   → "5–50"
 *   {{pg:count:<Type>}}         live SKUs of that type     → "125"
 *   {{pg:phrase-price:<Type>}}  prose-safe price clause    → "from $12 per piece"
 *   {{pg:phrase-moq:<Type>}}    prose-safe MOQ clause      → "from 5 pieces"
 *   {{pg:total-products}}       all finished-goods SKUs    → "316"
 *   {{pg:total-product-types}}  distinct product lines     → "10"
 *   {{pg:total-hides}}          all hide SKUs              → "186"
 *   {{pg:total-hide-types}}     distinct hide finishes     → "9"
 *   {{pg:moq-lowest}}           lowest MOQ across lines    → "2"
 *   {{pg:list-hide-types}}      "Aniline, Embossed, …"
 *   {{pg:list-hide-animals}}    "cowhide, goat, buffalo, sheep"
 *   {{pg:table-products}}       full live pricing table
 *   {{pg:table-products:A|B}}   pricing table, listed types only
 *
 * `<Type>` is the `productType` value exactly as stored (e.g. "Duffle Bag").
 */

const TOKEN_RE = /\{\{pg:([a-z-]+)(?::([^}]*))?\}\}/gi

/** Shown when a token cannot be resolved — DB down, or type since removed. */
const DASH = "&mdash;"

/**
 * Values injected into HTML that is later passed to dangerouslySetInnerHTML.
 * Product type names are admin-authored, so escape rather than trust them.
 */
function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

/** "$12" for whole numbers, "$13.50" otherwise — no trailing ".00" noise. */
function money(amount: number, currency: string): string {
  if (!Number.isFinite(amount) || amount <= 0) return ""
  const symbol = currency === "USD" ? "$" : `${esc(currency)} `
  const body = Number.isInteger(amount) ? String(amount) : amount.toFixed(2)
  return `${symbol}${body}`
}

function range(low: string, high: string): string {
  if (!low) return ""
  if (!high || low === high) return low
  return `${low}&ndash;${high}`
}

function findType(stats: CatalogueStats, type: string): ProductTypeStat | undefined {
  const needle = type.trim().toLowerCase()
  if (!needle) return undefined
  return (
    stats.products.find((p) => p.type.toLowerCase() === needle) ||
    // Allow articles to reference the corrected spelling ("Motorcycle Jacket")
    // even though the stored value is misspelled.
    stats.products.find((p) => p.label.toLowerCase() === needle)
  )
}

/** Per-piece vs per-unit wording follows the catalogue's own priceUnit language. */
function unitWord(stat: ProductTypeStat): string {
  return stat.type === "Belt" ? "unit" : "piece"
}

function productTable(stats: CatalogueStats, filter: string): string {
  const wanted = filter
    .split("|")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)

  const rows = wanted.length
    ? stats.products.filter(
        (p) => wanted.includes(p.type.toLowerCase()) || wanted.includes(p.label.toLowerCase())
      )
    : stats.products

  if (!rows.length) return ""

  const body = rows
    .map((p) => {
      const price = range(money(p.priceMin, p.currency), money(p.priceMax, p.currency)) || DASH
      const moq = p.moqMin > 0 ? range(String(p.moqMin), String(p.moqMax)) : DASH
      return (
        `<tr>` +
        `<td><strong>${esc(p.label)}</strong></td>` +
        `<td class="pg-num">${price}</td>` +
        `<td class="pg-num">${moq}</td>` +
        `<td class="pg-num">${p.count}</td>` +
        `</tr>`
      )
    })
    .join("")

  const asOf = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })

  return (
    `<div class="pg-table-wrap"><table>` +
    `<thead><tr>` +
    `<th scope="col">Product line</th>` +
    `<th scope="col">Unit price</th>` +
    `<th scope="col">MOQ (pieces)</th>` +
    `<th scope="col">Live options</th>` +
    `</tr></thead>` +
    `<tbody>${body}</tbody>` +
    `</table></div>` +
    `<p class="pg-live-note">Read directly from the Pure Grain catalogue, ${esc(asOf)}. ` +
    `Prices are ex-works per piece before customisation, freight and duties; ` +
    `volume above the listed MOQ is quoted per order.</p>`
  )
}

function resolveToken(kind: string, arg: string, stats: CatalogueStats): string {
  const k = kind.toLowerCase()

  // ── Blocks ──────────────────────────────────────────────────────────────
  if (k === "table-products") return productTable(stats, arg)

  // ── Catalogue-wide scalars ──────────────────────────────────────────────
  switch (k) {
    case "total-products":
      return stats.productTotal > 0 ? String(stats.productTotal) : DASH
    case "total-product-types":
      return stats.products.length > 0 ? String(stats.products.length) : DASH
    case "total-hides":
      return stats.hides.total > 0 ? String(stats.hides.total) : DASH
    case "total-hide-types":
      return stats.hides.types.length > 0 ? String(stats.hides.types.length) : DASH
    case "moq-lowest":
      return stats.productMoqMin > 0 ? String(stats.productMoqMin) : DASH
    case "list-hide-types":
      return stats.hides.types.length ? esc(stats.hides.types.join(", ")) : DASH
    case "list-hide-animals": {
      const names = stats.hides.byAnimal.map((a) =>
        a.animal.toLowerCase() === "cow" ? "cowhide" : a.animal.toLowerCase()
      )
      if (!names.length) return DASH
      if (names.length === 1) return esc(names[0])
      return esc(`${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`)
    }
  }

  // ── Per-product-type scalars ────────────────────────────────────────────
  const stat = findType(stats, arg)

  if (!stat) {
    // Unresolvable: never leave raw braces in the page. Prose tokens degrade
    // to a clause that still reads as a sentence.
    if (k === "phrase-price") return "priced on specification"
    if (k === "phrase-moq") return "set per order"
    return DASH
  }

  switch (k) {
    case "price-from":
      return money(stat.priceMin, stat.currency) || DASH
    case "price-range":
      return (
        range(money(stat.priceMin, stat.currency), money(stat.priceMax, stat.currency)) || DASH
      )
    case "moq-from":
      return stat.moqMin > 0 ? String(stat.moqMin) : DASH
    case "moq-range":
      return stat.moqMin > 0 ? range(String(stat.moqMin), String(stat.moqMax)) : DASH
    case "count":
      return String(stat.count)
    case "phrase-price": {
      const from = money(stat.priceMin, stat.currency)
      return from ? `from ${from} per ${unitWord(stat)}` : "priced on specification"
    }
    case "phrase-moq":
      return stat.moqMin > 0 ? `from ${stat.moqMin} pieces` : "set per order"
    default:
      return DASH
  }
}

/**
 * Replaces every `{{pg:…}}` token in `html`. Unknown tokens resolve to an
 * em dash rather than being left in place, so a typo in an article can never
 * surface as literal braces on the public page.
 */
export function renderArticleTokens(html: string, stats: CatalogueStats): string {
  if (!html.includes("{{pg:")) return html

  return html.replace(TOKEN_RE, (_match, kind: string, arg?: string) =>
    resolveToken(kind, arg ?? "", stats)
  )
}

/** True when a post uses catalogue tokens — used to skip the stats query. */
export function usesCatalogueTokens(html: string): boolean {
  return html.includes("{{pg:")
}

/**
 * Pulls question/answer pairs out of a rendered `.pg-faq` block so the page can
 * emit FAQPage structured data without the answers being duplicated into the
 * database by hand. Answers are flattened to plain text — schema.org expects
 * text, and stray markup there is a common validation failure.
 *
 * Deliberately regex-based rather than DOM-parsed: this runs on every article
 * render, the markup shape is authored by us (see the FAQ block convention in
 * the seeded articles), and adding a parser dependency for it is not worth it.
 * Anything that does not match simply yields no FAQ schema.
 */
export function extractFaqs(html: string): Array<{ q: string; a: string }> {
  const block = html.match(/<div class="pg-faq">([\s\S]*?)<\/div>\s*(?=<h2|<div class="pg-cta"|$)/i)
  if (!block) return []

  const faqs: Array<{ q: string; a: string }> = []
  const itemRe = /<div>\s*<span class="pg-faq-q">([\s\S]*?)<\/span>([\s\S]*?)<\/div>/gi

  let m: RegExpExecArray | null
  while ((m = itemRe.exec(block[1])) !== null) {
    const q = stripTags(m[1])
    const a = stripTags(m[2])
    if (q && a) faqs.push({ q, a })
  }

  return faqs
}

function stripTags(value: string): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&ndash;/g, "–")
    .replace(/&mdash;/g, "—")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim()
}
