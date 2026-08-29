import CustomManufacturingContent from "./CustomManufacturingContent"
import { OemDetail } from "@/components/custom-manufacturing/oem-detail"
import { PRIVATE_LABEL_FAQS } from "@/lib/content/faqs"
import { getCatalogueStats, EMPTY_CATALOGUE_STATS } from "@/lib/catalogue-stats"
import { JsonLd, faqPageSchema } from "@/lib/schema"

/**
 * Server wrapper for /custom-manufacturing.
 *
 * The page itself is a long-standing client component and is untouched. This
 * wrapper adds the three things the SXO analysis found missing against the
 * private-label SERP, where every top-ranking page carries them:
 *
 *   - an OEM vs ODM comparison, which is the first thing this buyer needs to
 *     resolve and which decides their tooling cost and lead time;
 *   - minimum order quantity per line, stated on the page rather than left to
 *     an enquiry — competitors put "from 20 pcs" in the first screen, and MOQ
 *     appeared nowhere on this site outside llms.txt;
 *   - what to send in order to be quoted.
 *
 * The minimums come from `getCatalogueStats()` rather than the copy, so they
 * follow the catalogue instead of going stale — the same rule the blog article
 * price tokens follow.
 */
export const revalidate = 3600

export default async function CustomManufacturingPage() {
  let stats = EMPTY_CATALOGUE_STATS
  try {
    stats = await getCatalogueStats()
  } catch (error) {
    // The MOQ table degrades to a contact note; the rest of the page is static.
    console.error("custom-manufacturing: catalogue stats unavailable", error)
  }

  return (
    <>
      {/* BreadcrumbList is emitted by layout.tsx; this adds the FAQ entity,
          built from the same array the section renders so the two cannot drift. */}
      <JsonLd data={faqPageSchema(PRIVATE_LABEL_FAQS)} />
      <CustomManufacturingContent
        oemSlot={<OemDetail stats={stats} faqs={PRIVATE_LABEL_FAQS} />}
      />
    </>
  )
}
