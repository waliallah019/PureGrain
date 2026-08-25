import Link from "next/link"
import type { Metadata } from "next"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { pageMetadata } from "@/lib/seo"
import { JsonLd, jsonLdGraph, breadcrumbSchema, faqPageSchema } from "@/lib/schema"
import { UPHOLSTERY_FAQS } from "@/lib/content/industry-faqs"
import { INDUSTRY_PAGES } from "@/lib/industries"
import { getCatalogueStats, EMPTY_CATALOGUE_STATS } from "@/lib/catalogue-stats"
import {
  HideSpecTable,
  IndustryBreadcrumb,
  IndustryCta,
  IndustryFaqList,
  IndustryHero,
  IndustrySection,
  RelatedGuides,
} from "@/components/industry/primitives"

const PAGE = INDUSTRY_PAGES.upholstery

export const metadata: Metadata = pageMetadata({
  title: PAGE.seoTitle,
  description: PAGE.seoDescription,
  path: PAGE.path,
  keywords: PAGE.keywords,
  image: PAGE.image,
  imageAlt: PAGE.imageAlt,
})

export const revalidate = 3600

export default async function FurnitureLeatherPage() {
  let stats = EMPTY_CATALOGUE_STATS
  try {
    stats = await getCatalogueStats()
  } catch {
    /* spec table degrades to a contact note */
  }

  return (
    <div className="min-h-screen bg-background">
      <JsonLd
        data={jsonLdGraph(
          faqPageSchema(UPHOLSTERY_FAQS),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Industries", path: "/industries" },
            { name: PAGE.shortLabel, path: PAGE.path },
          ])
        )}
      />
      <Header />

      <main className="pt-32 pb-20">
        <div className="container-wide">
          <IndustryBreadcrumb label={PAGE.shortLabel} />
          <IndustryHero
            h1={PAGE.h1}
            positioning={PAGE.positioning}
            image={PAGE.image}
            imageAlt={PAGE.imageAlt}
          />

          {/* --- Yield is the commercial fact of upholstery ------------------ */}
          <IndustrySection heading="Upholstery is bought on yield" eyebrow="The commercial reality">
            <p className="text-body max-w-3xl">
              Furniture is the one leather application where the per-square-foot
              rate is close to meaningless on its own. Seat and back panels are
              large and rectangular; a hide is neither. What you actually pay for
              is <strong className="text-foreground">usable area per hide</strong>{" "}
              after you cut around the neck, belly, legs and any natural markings.
            </p>
            <div className="mt-6 border-l-2 border-brass bg-bone/50 p-6 dark:bg-muted/20">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brass-ink">
                The comparison that matters
              </p>
              <p className="mt-2 text-muted-foreground">
                A lower grade at a lower rate frequently costs{" "}
                <em>more</em> per finished panel, because you cut around more
                defects and discard more material. Before comparing two quotes,
                work out how many panels of your largest pattern piece you get
                from one hide at each grade. That number is the price.
              </p>
            </div>
            <p className="text-body mt-6 max-w-3xl">
              Typical usable yield runs about 65&ndash;80% depending on panel size
              and grade &mdash; large single panels waste considerably more than
              small ones. Order material against that, not against the sum of your
              pattern areas, or you will come up short.
            </p>
          </IndustrySection>

          <IndustrySection heading="Hides we stock for upholstery" eyebrow="Verified availability">
            <HideSpecTable
              animals={stats.hides.animals}
              only={PAGE.animals}
              emptyNote="Live availability is temporarily unavailable — contact us for current substances and grades."
            />
            <p className="mt-4 text-sm text-muted-foreground">
              Upholstery is normally taken at 1.1&ndash;1.4mm: heavy enough to
              wear well and tailor cleanly over foam, light enough to pull round a
              corner without bulking. Heavier substances are better suited to
              structural work than seating.
            </p>
          </IndustrySection>

          {/* --- Finish selection, furniture-specific ------------------------ */}
          <IndustrySection heading="Choosing a finish for seating" eyebrow="Materials">
            <p className="text-body max-w-3xl">
              The finish decides how the piece looks on day one and how it looks in
              year five. For furniture the trade-off is always the same: natural
              depth versus resistance to real household use.
            </p>
            <div className="mt-6 overflow-x-auto border border-border">
              <table className="w-full border-collapse text-left text-[0.9375rem]">
                <thead className="bg-bone dark:bg-muted/30">
                  <tr>
                    {["Finish", "Character", "Best suited to"].map((h) => (
                      <th key={h} scope="col" className="border-b border-border px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Aniline", "Dyed through, no pigment topcoat. Deepest colour, natural markings visible, develops patina.", "Premium seating, low-traffic pieces, heritage positioning"],
                    ["Semi-aniline", "Light pigment coat over aniline dye. More uniform and more stain resistant.", "The usual compromise for family seating"],
                    ["Pebble", "Textured grain, natural or embossed. Disguises wear better than any flat finish.", "High-traffic seating, contract and hospitality work"],
                    ["Pull-up", "Oil and wax rich; lightens where stretched over an arm or edge.", "Characterful pieces where wear is intended to show"],
                    ["Smooth", "Even, flat grain with a clean finish.", "Formal and contemporary pieces"],
                  ].map(([a, b, c]) => (
                    <tr key={a}>
                      <td className="whitespace-nowrap border-b border-border px-4 py-3 font-medium text-foreground">{a}</td>
                      <td className="border-b border-border px-4 py-3 text-muted-foreground">{b}</td>
                      <td className="border-b border-border px-4 py-3 text-muted-foreground">{c}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-6">
              <Link href={PAGE.catalogueHref} className="font-medium text-brass-ink underline underline-offset-2">
                Browse cowhide by finish in the leather hides catalogue
              </Link>
            </p>
          </IndustrySection>

          {/* --- Testing: honest about what is held vs arranged --------------- */}
          <IndustrySection heading="Performance testing, stated precisely" eyebrow="Compliance">
            <p className="text-body max-w-3xl">
              Contract and hospitality buyers qualify upholstery on test data, and
              this is where suppliers are often vague. Ours, split into what we run
              as standard and what we arrange for you:
            </p>
            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              <div className="border border-border bg-card p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brass-ink">
                  Run in-house, every batch
                </p>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  {[
                    "Substance consistency across the hide",
                    "Tensile strength (ISO 3376) and tear load (ISO 3377)",
                    "Colour fastness to rubbing and to light",
                    "Chemical compliance including chromium VI",
                  ].map((t) => (
                    <li key={t} className="relative pl-6">
                      <span aria-hidden className="absolute left-0 top-[0.45em] h-1.5 w-1.5 bg-brass" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="border-l-2 border-warning bg-warning/5 p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-warning">
                  Arranged per order, not held as a standing certificate
                </p>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  {[
                    "Abrasion cycles (Martindale / Wyzenbeek) to your nominated threshold",
                    "Flammability to BS 5852 or California TB 117-2013",
                    "Any contract-specific standard your client requires",
                  ].map((t) => (
                    <li key={t} className="relative pl-6">
                      <span aria-hidden className="absolute left-0 top-[0.45em] h-1.5 w-1.5 bg-warning" />
                      {t}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-sm text-muted-foreground">
                  These are produced through an accredited third-party lab against
                  the batch you are buying, and the report is issued in your name.
                  We do not advertise them as certifications we hold, because they
                  are properties of a batch and a construction rather than of a
                  factory.
                </p>
              </div>
            </div>
          </IndustrySection>

          <IndustrySection heading="Ordering for a furniture programme" eyebrow="How to buy">
            <ul className="space-y-3">
              {[
                "Send your largest pattern piece dimensions — that single figure drives yield, and therefore price, more than anything else.",
                "Order colour-critical quantities in one dye lot. A second lot on the matching armchair is visible in daylight.",
                "Agree acceptable natural marking in writing before production. This is the most common source of upholstery disputes and it is entirely preventable.",
                "Specify a substance range, not a single figure — leather is split to a tolerance, and demanding an exact number raises cost without improving anything.",
              ].map((t) => (
                <li key={t} className="relative pl-8 text-muted-foreground">
                  <span aria-hidden className="absolute left-0 top-[0.4em] h-3 w-2 rotate-45 border-b-2 border-r-2 border-brass" />
                  {t}
                </li>
              ))}
            </ul>
          </IndustrySection>

          <IndustrySection heading="Upholstery leather questions" eyebrow="FAQ">
            <IndustryFaqList faqs={UPHOLSTERY_FAQS} />
          </IndustrySection>

          <IndustrySection heading="Related sourcing guides" eyebrow="Read next">
            <RelatedGuides guides={PAGE.relatedGuides} />
          </IndustrySection>

          <IndustryCta
            title="Send your largest panel dimensions"
            body="Yield decides the real cost of upholstery leather. Tell us your biggest pattern piece and the finish you want, and we will quote against grade, yield and volume."
            sampleLabel="Request upholstery swatches"
          />
        </div>
      </main>

      <Footer />
    </div>
  )
}
