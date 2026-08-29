import { Suspense } from "react"
import FinishedProductsCatalog from "./FinishedProductsCatalog"
import { CatalogIndex } from "@/components/catalog/catalog-index"
import { getFinishedProductIndex, type CatalogIndexItem } from "@/lib/catalog-index"
import { JsonLd, jsonLdGraph, breadcrumbSchema, collectionListSchema } from "@/lib/schema"

/**
 * Server wrapper for the finished-goods listing.
 *
 * Same defect and same fix as `/catalog/raw-leather` — see the long note in
 * that file. In short: the listing is a client component calling
 * `useSearchParams()`, which on a statically rendered route bails server
 * rendering out to the nearest Suspense boundary, and there was none. This page
 * was shipping an empty shell with no heading and no links to any of its 319
 * product pages.
 */
export const dynamic = "force-dynamic"

export default async function FinishedProductsPage() {
  let items: CatalogIndexItem[] = []
  try {
    items = await getFinishedProductIndex()
  } catch (error) {
    console.error("catalog: finished product index unavailable", error)
  }

  return (
    <>
      <JsonLd
        data={jsonLdGraph(
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Catalog", path: "/catalog" },
            { name: "Finished Products", path: "/catalog/finished-products" },
          ]),
          collectionListSchema({
            name: "Wholesale Finished Leather Goods",
            description:
              "Finished leather goods produced under your own label — jackets, bags, wallets, belts and motorcycle apparel.",
            path: "/catalog/finished-products",
            items: items.map((i) => ({
              name: i.name,
              path: `/catalog/finished-products/${i.id}`,
            })),
          })
        )}
      />
      <Suspense fallback={null}>
        <FinishedProductsCatalog
          indexSlot={
            <CatalogIndex
              items={items}
              basePath="/catalog/finished-products"
              heading="All finished products"
              intro="Every finished line currently in the catalogue, listed alphabetically. Each entry carries its own materials, options and minimum order quantity."
            />
          }
        />
      </Suspense>
    </>
  )
}
