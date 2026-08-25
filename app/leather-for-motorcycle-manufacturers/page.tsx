import Link from "next/link"
import type { Metadata } from "next"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { pageMetadata } from "@/lib/seo"
import { JsonLd, jsonLdGraph, breadcrumbSchema, faqPageSchema } from "@/lib/schema"
import { MOTORCYCLE_FAQS } from "@/lib/content/industry-faqs"
import { INDUSTRY_PAGES } from "@/lib/industries"
import { getCatalogueStats, EMPTY_CATALOGUE_STATS } from "@/lib/catalogue-stats"
import {
  HideSpecTable,
  IndustryBreadcrumb,
  IndustryCta,
  IndustryFaqList,
  IndustryHero,
  IndustryInlineCta,
  IndustrySection,
  RelatedGuides,
} from "@/components/industry/primitives"

const PAGE = INDUSTRY_PAGES.motorcycle

export const metadata: Metadata = pageMetadata({
  title: PAGE.seoTitle,
  description: PAGE.seoDescription,
  path: PAGE.path,
  keywords: PAGE.keywords,
  image: PAGE.image,
  imageAlt: PAGE.imageAlt,
})

export const revalidate = 3600

export default async function MotorcycleLeatherPage() {
  let stats = EMPTY_CATALOGUE_STATS
  try {
    stats = await getCatalogueStats()
  } catch {
    /* spec table degrades to a contact note */
  }

  const lines = stats.products.filter((p) => PAGE.oemProductTypes.includes(p.type))
  const money = (n: number) => (Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`)

  return (
    <div className="min-h-screen bg-background">
      <JsonLd
        data={jsonLdGraph(
          faqPageSchema(MOTORCYCLE_FAQS),
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

          {/* --- This is PPE, and that governs everything ------------------- */}
          <IndustrySection heading="This is protective equipment, not outerwear" eyebrow="Read this first">
            <p className="text-body max-w-3xl">
              Motorcycle clothing sold as protective in the EU and UK is{" "}
              <strong className="text-foreground">Personal Protective Equipment</strong>.
              It must be tested to <strong className="text-foreground">EN 17092</strong>,
              carry CE or UKCA marking, and ship with a declaration of conformity
              and user information. That single fact governs the material, the
              construction and the paperwork.
            </p>
            <div className="mt-6 border-l-2 border-warning bg-warning/5 p-5 md:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-warning">
                What certification actually means here
              </p>
              <p className="mt-2 text-muted-foreground">
                CE marking under EN 17092 is issued against a{" "}
                <strong className="text-foreground">specific garment construction</strong>{" "}
                by a notified body, in your name. It is not a certificate a
                factory holds and applies to everything it makes. We build to the
                standard and coordinate the testing; any supplier describing
                itself as &ldquo;CE certified&rdquo; has misunderstood the
                regulation, and that is worth knowing before you rely on them.
              </p>
            </div>
          </IndustrySection>

          <IndustrySection heading="Shell leather for protective garments" eyebrow="Verified availability">
            <p className="text-body mb-6 max-w-3xl">
              Cowhide at <strong className="text-foreground">1.2mm or heavier</strong> is
              the baseline for abrasion resistance. Light skins drape better and
              have no place in a garment sold as protective &mdash; if a supplier
              offers you 0.8mm lambskin for motorcycle use, that tells you
              something about their understanding of the category.
            </p>
            <HideSpecTable
              animals={stats.hides.animals}
              only={PAGE.animals}
              emptyNote="Live availability is temporarily unavailable — contact us for current substances and grades."
            />
          </IndustrySection>

          {/* --- Construction detail that is genuinely motorcycle-specific --- */}
          <IndustrySection heading="What the construction has to do" eyebrow="Engineering">
            <p className="text-body max-w-3xl">
              A motorcycle garment is cut for a rider on a bike, not a person
              standing up. Sleeves are longer, the back hem drops, and the whole
              block leans forward. Get that wrong and the jacket rides up and
              pulls at the cuffs the moment someone reaches for the bars.
            </p>
            <div className="mt-6 grid gap-px border border-border bg-border sm:grid-cols-2">
              {[
                ["Armour pockets", "Positioned so the insert sits over the joint in the riding position, not the standing one. Shoulder, elbow, back, and hip and knee on pants."],
                ["Seam construction", "Load-bearing seams need to hold under abrasion, which means seam type and thread specification are part of the safety case, not a finishing detail."],
                ["Stretch panels", "Accordion inserts at the elbow, shoulder and lower back so the garment moves without gaping at the closure."],
                ["Ventilation", "Zipped intake and exhaust that does not compromise the abrasion panels — the usual tension in touring gear design."],
              ].map(([t, d]) => (
                <div key={t} className="bg-background p-6">
                  <h3 className="font-serif text-lg font-medium text-foreground">{t}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{d}</p>
                </div>
              ))}
            </div>
          </IndustrySection>

          {/* --- OEM is the primary commercial route for this industry ------- */}
          <IndustrySection heading="Finished gear under your label" eyebrow="Manufacturing">
            <p className="text-body max-w-3xl">
              Unlike our material-supply industries, most motorcycle buyers want
              the finished garment. This is our deepest line, and Sialkot has been
              building it for European brands for decades &mdash; the armour-pocket
              construction and pattern engineering sit in the same cluster as the
              leather.
            </p>

            {lines.length > 0 ? (
              <div className="mt-6 overflow-x-auto border border-border">
                <table className="w-full border-collapse text-left text-[0.9375rem]">
                  <thead className="bg-bone dark:bg-muted/30">
                    <tr>
                      {["Line", "Unit price", "MOQ", "Options"].map((h) => (
                        <th key={h} scope="col" className="border-b border-border px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em]">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((p) => (
                      <tr key={p.type}>
                        <td className="border-b border-border px-4 py-3 font-medium text-foreground">{p.label}</td>
                        <td className="whitespace-nowrap border-b border-border px-4 py-3 text-muted-foreground tabular-nums">
                          {p.priceMin > 0
                            ? p.priceMin === p.priceMax
                              ? money(p.priceMin)
                              : `${money(p.priceMin)}–${money(p.priceMax)}`
                            : "On request"}
                        </td>
                        <td className="whitespace-nowrap border-b border-border px-4 py-3 text-muted-foreground tabular-nums">
                          {p.moqMin > 0 ? (p.moqMin === p.moqMax ? p.moqMin : `${p.moqMin}–${p.moqMax}`) : "—"}
                        </td>
                        <td className="border-b border-border px-4 py-3 text-right text-foreground tabular-nums">{p.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}

            <p className="mt-4 text-sm text-muted-foreground">
              Ex-works per piece before armour, certification testing, freight and
              duties, read live from the catalogue. Armour is supplied by us or
              built to accept inserts you nominate &mdash; many brands prefer to
              specify their own supplier, which we accommodate.
            </p>

            <IndustryInlineCta
              heading="Bringing a protective range to market?"
              body="Send your tech pack or a reference garment and the markets you sell into. We come back with a price at your quantity, the certification route for EN 17092, and a fit sample before anything is graded."
              primary={{ href: "/quote-request", label: "Quote my motorcycle range" }}
              secondary={{ href: "/custom-manufacturing", label: "How custom production works" }}
            />
          </IndustrySection>

          <IndustrySection heading="Sizing for riders" eyebrow="Fit">
            <p className="text-body max-w-3xl">
              Approve a base-size fit sample before the range is graded, then a
              second graded size to verify your grade rules. Tell us the market at
              enquiry stage: US sizing runs fuller through chest and waist than EU
              at the same nominal size, and grading to the wrong market drives
              return rates on a garment people cannot easily try on first.
            </p>
            <p className="mt-6">
              <Link href={PAGE.catalogueHref} className="font-medium text-brass-ink underline underline-offset-2">
                Browse the finished goods catalogue
              </Link>
            </p>
          </IndustrySection>

          <IndustrySection heading="Motorcycle apparel questions" eyebrow="FAQ">
            <IndustryFaqList faqs={MOTORCYCLE_FAQS} />
          </IndustrySection>

          <IndustrySection heading="Related sourcing guides" eyebrow="Read next">
            <RelatedGuides guides={PAGE.relatedGuides} />
          </IndustrySection>

          <IndustryCta
            title="Start with a fit sample, not a purchase order"
            body="Send your tech pack or a reference garment and your size range. We will quote at your quantity and produce a fit sample before anything is graded or certified."
            sampleLabel="Request a sample"
          />
        </div>
      </main>

      <Footer />
    </div>
  )
}
