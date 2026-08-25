import Link from "next/link"
import type { Metadata } from "next"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { pageMetadata } from "@/lib/seo"
import { JsonLd, jsonLdGraph, breadcrumbSchema, faqPageSchema } from "@/lib/schema"
import { AUTOMOTIVE_FAQS } from "@/lib/content/industry-faqs"
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

const PAGE = INDUSTRY_PAGES.automotive

export const metadata: Metadata = pageMetadata({
  title: PAGE.seoTitle,
  description: PAGE.seoDescription,
  path: PAGE.path,
  keywords: PAGE.keywords,
  image: PAGE.image,
  imageAlt: PAGE.imageAlt,
})

export const revalidate = 3600

export default async function AutomotiveLeatherPage() {
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
          faqPageSchema(AUTOMOTIVE_FAQS),
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

          {/* --- Scope, stated first because it is the honest thing to do ---- */}
          <IndustrySection heading="Where our capability starts and stops" eyebrow="Read this first">
            <p className="text-body max-w-3xl">
              Automotive leather splits into two very different businesses, and
              most suppliers blur them. We would rather be useful than
              impressive, so here is the boundary in plain terms.
            </p>

            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              <div className="border border-border bg-card p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brass-ink">
                  We supply
                </p>
                <h3 className="mt-2 font-serif text-xl font-medium text-foreground">
                  Trim, retrim, restoration and aftermarket
                </h3>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  {[
                    "Seat facings and bolsters for retrim and restoration work",
                    "Door cards, dash and console panels",
                    "Steering wheel and gear-lever covers",
                    "Marine trim: helm seating, cockpit cushions, interior panels",
                    "Low-volume specialist and custom-build programmes",
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
                  We do not currently supply
                </p>
                <h3 className="mt-2 font-serif text-xl font-medium text-foreground">
                  Tier-one OEM seat programmes
                </h3>
                <p className="mt-4 text-sm text-muted-foreground">
                  Supplying a vehicle manufacturer directly means holding
                  OEM-specific material approvals, IMDS material declarations, and
                  test data for fogging, UV and heat ageing, abrasion and
                  flammability against that manufacturer&apos;s own standard. We do
                  not hold those approvals today.
                </p>
                <p className="mt-3 text-sm text-muted-foreground">
                  If you need a tier-one qualified hide, say so at enquiry stage.
                  We will tell you plainly rather than quote and disappoint you at
                  the audit.
                </p>
              </div>
            </div>
          </IndustrySection>

          <IndustrySection heading="Hides we stock for trim work" eyebrow="Verified availability">
            <HideSpecTable
              animals={stats.hides.animals}
              only={PAGE.animals}
              emptyNote="Live availability is temporarily unavailable — contact us for current substances and grades."
            />
            <p className="mt-4 text-sm text-muted-foreground">
              Trim leather is usually taken at 1.1&ndash;1.4mm so it pulls cleanly
              over foam without bulking at the seams. Pebble and embossed grains
              dominate our cowhide stock and are the conventional choice for
              seating, because a uniform grain hides the wear that a plain aniline
              surface would show.
            </p>
          </IndustrySection>

          {/* --- Genuinely automotive-specific engineering content ----------- */}
          <IndustrySection heading="What trim leather has to survive" eyebrow="Performance">
            <p className="text-body max-w-3xl">
              A car interior is a harsher environment than furniture. Cabin
              temperatures swing far wider, UV exposure through glass is
              relentless, and a seat facing is abraded every time someone gets in.
              The properties that matter:
            </p>
            <div className="mt-6 overflow-x-auto border border-border">
              <table className="w-full border-collapse text-left text-[0.9375rem]">
                <thead className="bg-bone dark:bg-muted/30">
                  <tr>
                    {["Property", "Why it matters in a vehicle", "How we handle it"].map((h) => (
                      <th key={h} scope="col" className="border-b border-border px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Colour fastness to light", "UV through glass fades an untreated dye within a season", "Tested to ISO standards per batch; report issued on request"],
                    ["Rub / crock fastness", "Seat facings abrade at the bolster every entry and exit", "Colour fastness to rubbing is part of our standard batch testing"],
                    ["Substance consistency", "Uneven substance shows as ripples when pulled over foam", "Split to a stated range and documented per bundle"],
                    ["Chemical compliance", "Prolonged enclosed contact; EU market requires REACH", "REACH-compliant chemistry including chromium VI limits"],
                    ["Fogging / heat ageing", "Volatiles condensing on glass — an OEM test we do not run in-house", "Arranged through a third-party lab per order, at cost"],
                  ].map(([a, b, c]) => (
                    <tr key={a}>
                      <td className="border-b border-border px-4 py-3 font-medium text-foreground">{a}</td>
                      <td className="border-b border-border px-4 py-3 text-muted-foreground">{b}</td>
                      <td className="border-b border-border px-4 py-3 text-muted-foreground">{c}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Note the last row. Fogging and heat-ageing data can be produced for
              you through an accredited lab; we do not claim it as a standing
              certification, because it is generated per batch against the
              standard you nominate.
            </p>
          </IndustrySection>

          <IndustrySection heading="Planning a retrim order" eyebrow="How to buy">
            <p className="text-body max-w-3xl">
              Retrim work is yield-sensitive in a way flat goods are not: seat
              panels are large, symmetrical and must be cut from matching areas of
              the hide, so usable area per hide matters more than the
              per-square-foot rate.
            </p>
            <ol className="mt-6 space-y-4">
              {[
                ["Send the vehicle or panel set", "Tell us what is being trimmed and how many sets. A full interior and a pair of seat facings are very different material calculations."],
                ["Agree colour against a physical reference", "Send the trim piece you are matching to. Screen colour is unreliable, and interior colour matching is unforgiving."],
                ["Order the whole job in one dye lot", "Leather dye lots vary slightly. A door card from a second lot next to a seat from the first is visible in daylight."],
                ["Confirm grade and yield", "We quote per square foot against grade, and confirm square footage per hide so you can plan your cutting."],
              ].map(([t, d], i) => (
                <li key={t} className="flex gap-5 border-b border-border pb-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-brass/40 text-sm font-semibold text-brass-ink tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>
                    <span className="block font-medium text-foreground">{t}</span>
                    <span className="mt-1 block text-muted-foreground">{d}</span>
                  </span>
                </li>
              ))}
            </ol>
            <p className="mt-6">
              <Link href={PAGE.catalogueHref} className="font-medium text-brass-ink underline underline-offset-2">
                Browse cowhide in the leather hides catalogue
              </Link>
            </p>
          </IndustrySection>

          <IndustrySection heading="Automotive leather questions" eyebrow="FAQ">
            <IndustryFaqList faqs={AUTOMOTIVE_FAQS} />
          </IndustrySection>

          <IndustrySection heading="Related sourcing guides" eyebrow="Read next">
            <RelatedGuides guides={PAGE.relatedGuides} />
          </IndustrySection>

          <IndustryCta
            title="Match the colour before you cut"
            body="Send the trim piece you are matching to and the panel set you need to cover. We will send swatches from live stock and quote per square foot against grade and yield."
            sampleLabel="Request trim swatches"
          />
        </div>
      </main>

      <Footer />
    </div>
  )
}
