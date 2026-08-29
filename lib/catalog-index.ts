import { unstable_cache, revalidateTag } from "next/cache"
import connectDB from "@/lib/config/db"
import RawLeather from "@/lib/models/RawLeather"
import FinishedProduct from "@/lib/models/FinishedProduct"

/**
 * Names and ids for the two catalogue listings, for a server-rendered index.
 *
 * Both listing pages build their product grid from a client `useEffect` fetch,
 * so even after the SSR bail-out was fixed (see the note in
 * `app/catalog/raw-leather/page.tsx`) the server HTML still contained zero links
 * to any individual product. The 506 product pages were reachable only from the
 * sitemap — no crawl path, no internal link equity, and nothing for an AI
 * crawler to follow, since none of them execute JavaScript.
 *
 * This powers a plain, visible A–Z index beneath the interactive grid. It is
 * real navigation a person can use, not a hidden link farm: the same markup is
 * served to every client.
 *
 * Cached under its own tag so the listing pages do not run two collection scans
 * on every request — the routes are `force-dynamic`, so without this the query
 * would repeat per view.
 */

const TAG = "catalog-index"

export type CatalogIndexItem = { id: string; name: string }

/** Guards against a runaway page if the catalogue grows very large. */
const MAX_ITEMS = 600

/**
 * The two models are separate generic types, so a `RawLeather | FinishedProduct`
 * parameter produces a union of `.find` overloads that TypeScript cannot call.
 * Each caller runs its own identical query and hands the raw documents here to
 * be normalised, which keeps the shared logic without the union.
 */
function normalise(docs: unknown): CatalogIndexItem[] {
  return (docs as Array<{ _id: unknown; name?: string }>)
    .map((d) => ({ id: String(d._id), name: (d.name || "").trim() }))
    .filter((d) => d.id && d.name)
}

export function getRawLeatherIndex() {
  return unstable_cache(
    async (): Promise<CatalogIndexItem[]> => {
      await connectDB()
      return normalise(
        await RawLeather.find({}).select("_id name").sort({ name: 1 }).limit(MAX_ITEMS).lean()
      )
    },
    ["catalog-index", "raw-leather"],
    { revalidate: 3600, tags: [TAG] }
  )()
}

export function getFinishedProductIndex() {
  return unstable_cache(
    async (): Promise<CatalogIndexItem[]> => {
      await connectDB()
      return normalise(
        await FinishedProduct.find({})
          .select("_id name")
          .sort({ name: 1 })
          .limit(MAX_ITEMS)
          .lean()
      )
    },
    ["catalog-index", "finished-products"],
    { revalidate: 3600, tags: [TAG] }
  )()
}

/** Drops the cached index after a catalogue write. */
export function invalidateCatalogIndex(): void {
  try {
    revalidateTag(TAG)
  } catch (error) {
    // Cache housekeeping must never fail an otherwise successful write.
    console.error("catalog-index: revalidate failed", error)
  }
}
