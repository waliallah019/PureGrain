import { unstable_cache, revalidateTag } from "next/cache"
import connectDB from "@/lib/config/db"
import FinishedProduct from "@/lib/models/FinishedProduct"
import RawLeather from "@/lib/models/RawLeather"

/**
 * Live catalogue figures for editorial content.
 *
 * Blog articles quote prices, MOQs and product counts. Those must never be
 * typed into the article HTML: the moment a price changes in the admin panel,
 * every hardcoded figure becomes a false public claim. Instead articles carry
 * tokens (see `lib/article-tokens.ts`) that are resolved against this snapshot
 * at render time, so the catalogue stays the single source of truth.
 *
 * Archived rows are excluded — they are no longer sellable, and letting one
 * drag a "from" price down would misquote the business.
 */

export type ProductTypeStat = {
  /** The `productType` value exactly as stored, used for token lookups. */
  type: string
  /** Corrected/presentable name for display. See DISPLAY_NAMES. */
  label: string
  count: number
  priceMin: number
  priceMax: number
  moqMin: number
  moqMax: number
  currency: string
}

/** Per-animal detail, used by the industry landing pages to state real specs. */
export type HideAnimalStat = {
  animal: string
  count: number
  /** Substance range in mm across that animal's stock, 0 when unknown. */
  thicknessMin: number
  thicknessMax: number
  /** Distinct leather types stocked in that animal, title-cased. */
  types: string[]
}

export type HideStats = {
  total: number
  byAnimal: Array<{ animal: string; count: number }>
  /** Distinct finish/type names, e.g. "Aniline", "Veg Tan". */
  types: string[]
  moqMin: number
  /** Richer per-animal breakdown; `byAnimal` is kept for existing callers. */
  animals: HideAnimalStat[]
}

export type CatalogueStats = {
  products: ProductTypeStat[]
  productTotal: number
  /** Lowest MOQ across every finished-goods line. */
  productMoqMin: number
  hides: HideStats
}

/**
 * Presentation names for `productType` values.
 *
 * "Motorcyle Jacket" is misspelled in the database on 51 live rows. Renaming
 * the data would touch the catalogue, the filters and every existing product
 * URL, so the typo is corrected at the presentation layer only — an article
 * should not publish a spelling mistake, and the stored value keeps working as
 * the lookup key.
 */
const DISPLAY_NAMES: Record<string, string> = {
  "Motorcyle Jacket": "Motorcycle Jacket",
}

/** Product types that are effectively the same shelf, ordered for tables. */
const TYPE_ORDER = [
  "Wallet",
  "Purse",
  "Belt",
  "Backpack",
  "Duffle Bag",
  "Leather Jackets",
  "Biker Jackets",
  "Motorcyle Jacket",
  "Motorcycle Pants",
  "Motorcycle Suit",
]

function displayName(type: string): string {
  return DISPLAY_NAMES[type] ?? type
}

function orderIndex(type: string): number {
  const i = TYPE_ORDER.indexOf(type)
  return i === -1 ? TYPE_ORDER.length : i
}

async function loadCatalogueStats(): Promise<CatalogueStats> {
  await connectDB()

  const [products, hides] = await Promise.all([
    FinishedProduct.find({ isArchived: { $ne: true } })
      .select("productType pricePerUnit moq currency")
      .lean(),
    RawLeather.find({ isArchived: { $ne: true } })
      .select("animal leatherType minOrderQuantity thickness")
      .lean(),
  ])

  const grouped = new Map<string, ProductTypeStat>()

  for (const p of products as Array<Record<string, any>>) {
    const type = String(p.productType || "").trim()
    if (!type) continue

    const price = Number(p.pricePerUnit)
    const moq = Number(p.moq)

    let stat = grouped.get(type)
    if (!stat) {
      stat = {
        type,
        label: displayName(type),
        count: 0,
        priceMin: Number.POSITIVE_INFINITY,
        priceMax: 0,
        moqMin: Number.POSITIVE_INFINITY,
        moqMax: 0,
        currency: String(p.currency || "USD"),
      }
      grouped.set(type, stat)
    }

    stat.count += 1
    if (Number.isFinite(price) && price > 0) {
      stat.priceMin = Math.min(stat.priceMin, price)
      stat.priceMax = Math.max(stat.priceMax, price)
    }
    if (Number.isFinite(moq) && moq > 0) {
      stat.moqMin = Math.min(stat.moqMin, moq)
      stat.moqMax = Math.max(stat.moqMax, moq)
    }
  }

  // A type where every row lacked a usable price/MOQ keeps Infinity; normalise
  // to 0 so downstream formatting can treat it as "no figure available"
  // instead of printing "Infinity".
  const productStats = [...grouped.values()]
    .map((s) => ({
      ...s,
      priceMin: Number.isFinite(s.priceMin) ? s.priceMin : 0,
      moqMin: Number.isFinite(s.moqMin) ? s.moqMin : 0,
    }))
    .sort((a, b) => orderIndex(a.type) - orderIndex(b.type) || a.label.localeCompare(b.label))

  const animalCounts = new Map<string, number>()
  const hideTypes = new Set<string>()
  const animalDetail = new Map<
    string,
    { count: number; thickness: number[]; types: Set<string> }
  >()
  let hideMoqMin = Number.POSITIVE_INFINITY

  for (const h of hides as Array<Record<string, any>>) {
    const animal = String(h.animal || "").trim()
    if (animal) animalCounts.set(animal, (animalCounts.get(animal) ?? 0) + 1)

    const t = String(h.leatherType || "").trim()
    // "suede" and "Suede" both occur; title-case so they collapse to one entry.
    const titled = t ? t.charAt(0).toUpperCase() + t.slice(1) : ""
    if (titled) hideTypes.add(titled)

    if (animal) {
      let detail = animalDetail.get(animal)
      if (!detail) {
        detail = { count: 0, thickness: [], types: new Set<string>() }
        animalDetail.set(animal, detail)
      }
      detail.count += 1
      if (titled) detail.types.add(titled)
      // `thickness` is free text ("1.2-1.4mm", "3", "Not specified"); pull every
      // number out and discard implausible values rather than trusting the field.
      for (const raw of String(h.thickness || "").match(/\d+(?:\.\d+)?/g) ?? []) {
        const mm = Number(raw)
        if (Number.isFinite(mm) && mm > 0 && mm < 20) detail.thickness.push(mm)
      }
    }

    const moq = Number(h.minOrderQuantity)
    if (Number.isFinite(moq) && moq > 0) hideMoqMin = Math.min(hideMoqMin, moq)
  }

  const animals: HideAnimalStat[] = [...animalDetail.entries()]
    .map(([animal, d]) => ({
      animal,
      count: d.count,
      thicknessMin: d.thickness.length ? Math.min(...d.thickness) : 0,
      thicknessMax: d.thickness.length ? Math.max(...d.thickness) : 0,
      types: [...d.types].sort(),
    }))
    .sort((a, b) => b.count - a.count)

  const productMoqs = productStats.map((s) => s.moqMin).filter((n) => n > 0)

  return {
    products: productStats,
    productTotal: (products as unknown[]).length,
    productMoqMin: productMoqs.length ? Math.min(...productMoqs) : 0,
    hides: {
      total: (hides as unknown[]).length,
      byAnimal: [...animalCounts.entries()]
        .map(([animal, count]) => ({ animal, count }))
        .sort((a, b) => b.count - a.count),
      types: [...hideTypes].sort(),
      moqMin: Number.isFinite(hideMoqMin) ? hideMoqMin : 0,
      animals,
    },
  }
}

/**
 * Cached for an hour. Blog detail pages are `force-dynamic`, so without this
 * every article view would run two full collection scans; an hour is well
 * inside the window a price edit needs to go live in, and the cache can be
 * dropped early with `revalidateTag("catalogue-stats")`.
 */
export const getCatalogueStats = unstable_cache(loadCatalogueStats, ["catalogue-stats"], {
  revalidate: 3600,
  tags: ["catalogue-stats"],
})

/** Empty snapshot used when the database is unreachable. */
export const EMPTY_CATALOGUE_STATS: CatalogueStats = {
  products: [],
  productTotal: 0,
  productMoqMin: 0,
  hides: { total: 0, byAnimal: [], types: [], moqMin: 0, animals: [] },
}

/**
 * Drops the cached snapshot so the next article render reads fresh figures.
 *
 * Called from the product mutation routes. Without it, a price or MOQ edited in
 * the admin panel would keep showing the old value in published articles for up
 * to an hour — which defeats the point of driving article copy from the
 * catalogue in the first place.
 */
export function invalidateCatalogueStats(): void {
  try {
    revalidateTag("catalogue-stats")
  } catch (error) {
    // Never let cache housekeeping fail an otherwise successful write.
    console.error("catalogue-stats: revalidate failed", error)
  }
}
