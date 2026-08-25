import Link from "next/link"
import type { Metadata } from "next"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { pageMetadata } from "@/lib/seo"
import { JsonLd, jsonLdGraph, breadcrumbSchema, faqPageSchema } from "@/lib/schema"
import { GARMENT_FAQS } from "@/lib/content/industry-faqs"
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

const PAGE = INDUSTRY_PAGES.garment

export const metadata: Metadata = pageMetadata({
  title: PAGE.seoTitle,
  description: PAGE.seoDescription,
  path: PAGE.path,
  keywords: PAGE.keywords,
  image: PAGE.image,
  imageAlt: PAGE.imageAlt,
})

export const revalidate = 3600

export default async function GarmentLeatherPage() {
  let stats = EMPTY_CATALOGUE_STATS
  try {
    stats = await getCatalogueStats()
  } catch {
    /* spec table degrades to a contact note */
  }

  const outerwear = stats.products.filter((p) => PAGE.oemProductTypes.includes(p.type))

  return (
    <div className="min-h-screen bg-background">
      <JsonLd
        data={jsonLdGraph(
          faqPageSchema(GARMENT_FAQS),
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

          {/* --- Garment leather is a different product ---------------------- */}
          <IndustrySection heading="Why garment leather is its own product" eyebrow="Buyer requirements">
            <p className="text-body max-w-3xl">
              Garment leather is not thin upholstery. It is selected and tanned for
              <strong className="text-foreground"> drape</strong> &mdash; how it
              falls, folds and moves on a body &mdash; and for consistency across a
              size run, where a sleeve panel and a body panel cut from different
              skins must hang identically. Three properties decide it:
            </p>
            <div className="mt-6 grid gap-px border border-border bg-border sm:grid-cols-3">
              {[
                ["Substance", "0.8–1.0mm for fashion outerwear. Every 0.1mm is visible in how a garment hangs."],
                ["Stretch direction", "Skins stretch more across the backbone than along it. Panels must be cut with that in mind or a jacket distorts in wear."],
                ["Hand and temper", "Soft enough to drape, strong enough to hold a seam under load at the shoulder and elbow."],
              ].map(([t, d]) => (
                <div key={t} className="bg-background p-6">
                  <h3 className="font-serif text-lg font-medium text-foreground">{t}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{d}</p>
                </div>
              ))}
            </div>
          </IndustrySection>

          <IndustrySection heading="Skins we stock for garments" eyebrow="Verified availability">
            <HideSpecTable
              animals={stats.hides.animals}
              only={PAGE.animals}
              emptyNote="Live availability is temporarily unavailable — contact us for current substances and grades."
            />
            <div className="mt-6 border-l-2 border-warning bg-warning/5 p-5 md:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-warning">
                An honest note on very light skins
              </p>
              <p className="mt-2 text-muted-foreground">
                Our lightest stocked skins start at 0.8mm. If your specification
                calls for 0.5&ndash;0.7mm dress-weight leather, that is sourced to
                order rather than shipped from stock, and it adds lead time. Worth
                raising at enquiry stage rather than after sampling.
              </p>
            </div>
          </IndustrySection>

          {/* --- The safety distinction — genuinely garment-specific --------- */}
          <IndustrySection heading="Fashion outerwear vs protective apparel" eyebrow="Critical distinction">
            <p className="text-body max-w-3xl">
              These are different products with different materials, and confusing
              them is the most consequential mistake in this category.
            </p>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div className="border border-border bg-card p-6">
                <h3 className="font-serif text-xl font-medium text-foreground">Fashion outerwear</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Judged on look, fit, lining and hardware. Goat at 0.8&ndash;1.0mm
                  or sheep for maximum softness. No protective standard applies.
                </p>
              </div>
              <div className="border border-border bg-card p-6">
                <h3 className="font-serif text-xl font-medium text-foreground">Motorcycle apparel</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Personal protective equipment in the EU and UK, regulated under
                  EN 17092. Cowhide at 1.2mm or heavier is the baseline for
                  abrasion resistance, with CE-rated armour at shoulder, elbow and
                  back.
                </p>
              </div>
            </div>
            <p className="mt-6 text-body max-w-3xl">
              If a supplier offers you a 0.8mm lambskin &ldquo;biker jacket&rdquo;
              for motorcycle use, that tells you something important about their
              understanding of the category. Light skins drape beautifully and have
              no place in a garment sold as protective.
            </p>
          </IndustrySection>

          {/* --- Secondary: OEM ------------------------------------------------ */}
          <IndustrySection heading="Finished garment manufacturing" eyebrow="Also available">
            <p className="text-body max-w-3xl">
              This page is about sourcing garment leather. Separately, finished
              outerwear is our deepest manufacturing line: Sialkot has supplied
              European motorcycle brands for decades, so the pattern engineering,
              armour-pocket construction and stretch-panel work sit in the same
              cluster as the leather.
            </p>

            {outerwear.length > 0 ? (
              <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {outerwear.map((p) => (
                  <li key={p.type} className="border border-border bg-card p-5">
                    <span className="block font-serif text-lg font-medium text-foreground">{p.label}</span>
                    <span className="mt-1 block text-sm text-muted-foreground tabular-nums">
                      {p.count} options · MOQ from {p.moqMin > 0 ? p.moqMin : "—"}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}

            <IndustryInlineCta
              heading="Have a jacket you want built?"
              body="Send a tech pack or a reference garment with your size range and target market. We come back with a price at your quantity, a realistic lead time, and a fit sample before anything is graded."
              primary={{ href: "/quote-request", label: "Get a production quote" }}
              secondary={{ href: "/custom-manufacturing", label: "How custom production works" }}
            />
          </IndustrySection>

          <IndustrySection heading="Sampling and ordering" eyebrow="How to buy">
            <p className="text-body max-w-3xl">
              Garment leather must be judged for drape as well as colour, which a
              swatch shows and a photograph cannot. Swatches are complimentary for
              verified trade buyers &mdash; you pay shipping only.
            </p>
            <p className="mt-4">
              <Link href={PAGE.catalogueHref} className="font-medium text-brass-ink underline underline-offset-2">
                Browse goat skins in the leather hides catalogue
              </Link>
            </p>
          </IndustrySection>

          <IndustrySection heading="Garment leather sourcing questions" eyebrow="FAQ">
            <IndustryFaqList faqs={GARMENT_FAQS} />
          </IndustrySection>

          <IndustrySection heading="Related sourcing guides" eyebrow="Read next">
            <RelatedGuides guides={PAGE.relatedGuides} />
          </IndustrySection>

          <IndustryCta
            title="Feel the drape before you commit"
            body="Tell us the garment and the market. We will send skins from live stock so you can judge hand and drape, and quote per square foot against your volume."
            sampleLabel="Request garment leather swatches"
          />
        </div>
      </main>

      <Footer />
    </div>
  )
}
