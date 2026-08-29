import { Suspense } from "react"
import RawLeatherCatalog from "./RawLeatherCatalog"
import { CatalogIndex } from "@/components/catalog/catalog-index"
import { getRawLeatherIndex, type CatalogIndexItem } from "@/lib/catalog-index"
import { JsonLd, jsonLdGraph, breadcrumbSchema, collectionListSchema } from "@/lib/schema"

/**
 * Server wrapper for the leather-hides listing.
 *
 * The listing itself is a client component that calls `useSearchParams()` (it
 * reads `?q=` and `?type=` to seed its filters). On a statically rendered route
 * that call makes Next bail out of server rendering for **everything up to the
 * nearest Suspense boundary** — and there was no boundary, so the bail-out took
 * the whole route with it. The page shipped a 25KB shell whose entire body text
 * was "Chat with us on WhatsApp": no <main>, no <h1>, not one heading, and not
 * one link to any of the 187 hide pages beneath it. All the copy the component
 * renders — the "Leather Hides Wholesale" H1, the type strip, the sourcing
 * section — existed only after JavaScript ran, which meant it did not exist at
 * all for the AI crawlers, and Google had to spend a render pass to see any of
 * it.
 *
 * Two changes fix that, and both are needed:
 *
 *   1. `dynamic = "force-dynamic"` — with the route rendered per request the
 *      search params are known on the server, so `useSearchParams()` resolves
 *      there and the tree renders to HTML instead of bailing out. This config
 *      cannot live in the listing file itself, because route segment config is
 *      not allowed in a `"use client"` module; that is why the client code moved
 *      to `RawLeatherCatalog.tsx` and this server file took its place.
 *   2. The Suspense boundary — it scopes any remaining client-only rendering to
 *      this subtree rather than to the whole document.
 *
 * The listing component itself is untouched, so the interactive behaviour
 * (filters, search, sort, pagination) is exactly what it was.
 *
 * Deliberately NOT put on the shared `layout.tsx`: that layout also wraps
 * `/catalog/raw-leather/[rawLeatherId]`, and forcing 187 product detail pages
 * to render per request to fix the listing would trade one problem for a worse
 * one. Route config belongs to the segment that needs it.
 */
export const dynamic = "force-dynamic"

export default async function RawLeatherPage() {
  // A listing that cannot reach the database is still a useful page — the grid
  // fetches independently on the client — so a failure here drops the index
  // rather than the route.
  let items: CatalogIndexItem[] = []
  try {
    items = await getRawLeatherIndex()
  } catch (error) {
    console.error("catalog: raw leather index unavailable", error)
  }

  return (
    <>
      {/*
        The listing's own breadcrumb trail. The shared layout deliberately emits
        none, because it also wraps the detail route, which publishes a deeper
        trail of its own — two BreadcrumbLists on one URL is a conflicting
        signal.
      */}
      <JsonLd
        data={jsonLdGraph(
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Catalog", path: "/catalog" },
            { name: "Leather Hides", path: "/catalog/raw-leather" },
          ]),
          collectionListSchema({
            name: "Leather Hides — Bulk Wholesale",
            description:
              "Full-grain, top-grain, suede and nubuck leather hides supplied in bulk by the square foot.",
            path: "/catalog/raw-leather",
            items: items.map((i) => ({
              name: i.name,
              path: `/catalog/raw-leather/${i.id}`,
            })),
          })
        )}
      />
      <Suspense fallback={null}>
        <RawLeatherCatalog
          indexSlot={
            <CatalogIndex
              items={items}
              basePath="/catalog/raw-leather"
              heading="All leather hides"
              intro="Every hide currently in the catalogue, listed alphabetically. Each entry carries its own substance, finish and grading detail."
            />
          }
        />
      </Suspense>
    </>
  )
}
