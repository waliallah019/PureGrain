import Link from "next/link"
import type { Metadata } from "next"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { pageMetadata } from "@/lib/seo"
import { JsonLd, jsonLdGraph, breadcrumbSchema, faqPageSchema } from "@/lib/schema"
import { GLOVE_FAQS } from "@/lib/content/industry-faqs"
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

const PAGE = INDUSTRY_PAGES.gloves

export const metadata: Metadata = pageMetadata({
  title: PAGE.seoTitle,
  description: PAGE.seoDescription,
  path: PAGE.path,
  keywords: PAGE.keywords,
  image: PAGE.image,
  imageAlt: PAGE.imageAlt,
})

export const revalidate = 3600

export default async function GloveLeatherPage() {
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
          faqPageSchema(GLOVE_FAQS),
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

          {/* --- Stretch direction: the defining glove constraint ------------ */}
          <IndustrySection heading="Why glove leather is cut differently" eyebrow="The core constraint">
            <p className="text-body max-w-3xl">
              Glove cutting is the most direction-sensitive work in leather. A skin
              stretches more across the backbone than along it, and a glove has to
              stretch <em>around</em> the hand while staying stable{" "}
              <em>along</em> the finger. Every panel is therefore cut to a specific
              orientation, and a cutter who ignores that produces gloves that bag
              at the knuckle and split at the fourchette.
            </p>
            <p className="text-body mt-4 max-w-3xl">
              Two consequences for anyone buying glove leather:
            </p>
            <ul className="mt-5 space-y-3">
              {[
                "Yield is lower than any other leather product, because panels cannot simply be nested for maximum area — they must respect direction first.",
                "Substance consistency across the whole skin matters more than the headline figure. A skin that runs 0.8mm at the butt and 1.1mm at the belly will produce gloves that do not match.",
                "Tensile strength for the weight is the property to ask about, not thickness alone. This is why goat outperforms most skins at the same substance.",
              ].map((t) => (
                <li key={t} className="relative pl-8 text-muted-foreground">
                  <span
                    aria-hidden
                    className="absolute left-0 top-[0.4em] h-3 w-2 rotate-45 border-b-2 border-r-2 border-brass"
                  />
                  {t}
                </li>
              ))}
            </ul>
          </IndustrySection>

          <IndustrySection heading="Skins we stock for gloves" eyebrow="Verified availability">
            <HideSpecTable
              animals={stats.hides.animals}
              only={PAGE.animals}
              emptyNote="Live availability is temporarily unavailable — contact us for current substances and grades."
            />
            <div className="mt-6 border-l-2 border-warning bg-warning/5 p-5 md:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-warning">
                Read this before specifying
              </p>
              <p className="mt-2 text-muted-foreground">
                Our stocked skins start at 0.8mm. Fine dress-glove leather at
                0.5&ndash;0.7mm is <strong className="text-foreground">not</strong>{" "}
                held in stock and would be sourced to order through the Sialkot
                cluster, adding lead time. If your pattern depends on that
                substance, say so in your first message rather than after a sample
                round.
              </p>
            </div>
          </IndustrySection>

          <IndustrySection heading="Goat or sheep?" eyebrow="Choosing the skin">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="border border-border bg-card p-6">
                <h3 className="font-serif text-xl font-medium text-foreground">Goat</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  The workhorse of glove leather. Unusually strong for its weight,
                  fine natural grain, holds a seam under load. The default for
                  driving gloves, work gloves and anything that has to survive
                  repeated flexing.
                </p>
              </div>
              <div className="border border-border bg-card p-6">
                <h3 className="font-serif text-xl font-medium text-foreground">Sheep</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Softer, more stretch, better next to the skin — and correspondingly
                  lower tensile strength. Right for dress and fashion gloves, wrong
                  for anything taking mechanical load.
                </p>
              </div>
            </div>
            <p className="mt-6">
              <Link href={PAGE.catalogueHref} className="font-medium text-brass-ink underline underline-offset-2">
                Browse goat skins in the leather hides catalogue
              </Link>
            </p>
          </IndustrySection>

          {/* --- Compliance matters more here: prolonged skin contact -------- */}
          <IndustrySection heading="Chemical compliance for skin contact" eyebrow="Regulatory">
            <p className="text-body max-w-3xl">
              Gloves sit against skin for hours, which makes chemical compliance a
              sharper issue than in most leather categories. Our chemistry is REACH
              compliant &mdash; including chromium VI, azo dyes and formaldehyde
              limits &mdash; and batch test reports are issued in your name on
              request.
            </p>
            <p className="text-body mt-4 max-w-3xl">
              The distinction worth knowing: chromium III is the tanning agent and
              is not restricted; chromium VI is a restricted substance that forms
              when chrome leather is badly processed or stored. Any supplier who
              cannot tell you the difference is telling you something. Our testing
              scope is set out on the{" "}
              <Link href="/quality" className="font-medium text-brass-ink underline underline-offset-2">
                quality and process page
              </Link>
              .
            </p>
          </IndustrySection>

          {/* --- Honest scope limit ------------------------------------------ */}
          <IndustrySection heading="What we do and do not do here" eyebrow="Scope">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="border border-border bg-card p-6">
                <h3 className="font-serif text-lg font-medium text-foreground">We supply</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Goat and sheep glove leather by the square foot, graded and
                  documented per batch, with export documentation and REACH
                  declarations.
                </p>
              </div>
              <div className="border border-border bg-card p-6">
                <h3 className="font-serif text-lg font-medium text-foreground">We do not</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Manufacture finished gloves. If you need finished glove
                  production we would rather say so plainly than take the order and
                  subcontract it without telling you.
                </p>
              </div>
            </div>
          </IndustrySection>

          <IndustrySection heading="Glove leather sourcing questions" eyebrow="FAQ">
            <IndustryFaqList faqs={GLOVE_FAQS} />
          </IndustrySection>

          <IndustrySection heading="Related sourcing guides" eyebrow="Read next">
            <RelatedGuides guides={PAGE.relatedGuides} />
          </IndustrySection>

          <IndustryCta
            title="Send us your pattern and size run"
            body="Glove yield depends entirely on pattern and direction, so we would rather work the requirement with you than quote a generic figure. Swatches are complimentary for verified trade buyers."
            sampleLabel="Request glove leather swatches"
          />
        </div>
      </main>

      <Footer />
    </div>
  )
}
