"use client"

/**
 * Shared client-side cache for the two taxonomy endpoints.
 *
 * The SEO audit flagged "12 API calls on homepage, 6 duplicates". Measured on
 * the current build it was 11 calls with `raw-leather-types` fetched **four
 * times** and `product-types` **twice** — the Header, the Catalog mega-menu, the
 * Footer and the page body each fetched independently, because they are
 * unrelated components that happen to need the same list.
 *
 * These lists change when an admin edits the taxonomy, i.e. almost never, and
 * every consumer wants the identical payload. So rather than add SWR or React
 * Query (a dependency, plus a provider to wire through the tree) this is a
 * module-level promise cache:
 *
 *   - The first caller starts the fetch and stores the *promise*.
 *   - Concurrent callers await that same in-flight promise — this is what
 *     collapses the duplicates, since all four mount in the same tick.
 *   - Later callers get the resolved value until the TTL expires.
 *
 * A failed request is not cached, so a transient error does not poison the
 * value for the rest of the session.
 */

export type TaxonomyItem = { _id?: string; name?: string }

type Entry = { promise: Promise<TaxonomyItem[]>; at: number }

/** Taxonomies are admin-edited and rarely change; 5 minutes is generous. */
const TTL_MS = 5 * 60 * 1000

const cache = new Map<string, Entry>()

async function request(url: string): Promise<TaxonomyItem[]> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${url} responded ${res.status}`)
  const json = await res.json()
  return Array.isArray(json?.data) ? (json.data as TaxonomyItem[]) : []
}

function get(url: string): Promise<TaxonomyItem[]> {
  const hit = cache.get(url)
  if (hit && Date.now() - hit.at < TTL_MS) return hit.promise

  const promise = request(url).catch((error) => {
    // Drop the failed entry so the next caller retries rather than inheriting
    // a rejected promise for the whole TTL window.
    cache.delete(url)
    throw error
  })

  cache.set(url, { promise, at: Date.now() })
  return promise
}

/** Raw leather types (Aniline, Nubuck, Veg Tan, …). */
export function getRawLeatherTypes(): Promise<TaxonomyItem[]> {
  return get("/api/raw-leather-types")
}

/** Finished product types (Backpack, Belt, Wallet, …). */
export function getProductTypes(): Promise<TaxonomyItem[]> {
  return get("/api/product-types")
}

/** Sorted, de-duplicated, non-empty names — what the menus and footer render. */
export function toNames(items: TaxonomyItem[]): string[] {
  return Array.from(
    new Set(
      items
        .map((i) => i?.name)
        .filter((n): n is string => typeof n === "string" && n.length > 0)
    )
  ).sort((a, b) => a.localeCompare(b))
}
