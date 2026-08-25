import Link from "next/link"
import type { Metadata } from "next"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { pageMetadata } from "@/lib/seo"
import { JsonLd, jsonLdGraph, breadcrumbSchema, faqPageSchema } from "@/lib/schema"
import { GIFTING_FAQS } from "@/lib/content/industry-faqs"
import { INDUSTRY_PAGES } from "@/lib/industries"
import { getCatalogueStats, EMPTY_CATALOGUE_STATS } from "@/lib/catalogue-stats"
import {
  IndustryBreadcrumb,
  IndustryCta,
  IndustryFaqList,
  IndustryHero,
  IndustryInlineCta,
  IndustrySection,
  RelatedGuides,
} from "@/components/industry/primitives"

const PAGE = INDUSTRY_PAGES.gifting

export const metadata: Metadata = pageMetadata({
  title: PAGE.seoTitle,
  description: PAGE.seoDescription,
  path: PAGE.path,
  keywords: PAGE.keywords,
  image: PAGE.image,
  imageAlt: PAGE.imageAlt,
})

export const revalidate = 3600

export default async function CorporateGiftingPage() {
  let stats = EMPTY_CATALOGUE_STATS
  try {
    stats = await getCatalogueStats()
  } catch {
    /* tables degrade to a contact note */
  }

  const lines = stats.products.filter((p) => PAGE.oemProductTypes.includes(p.type))
  const money = (n: number) => (Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`)
  const lowestMoq = stats.productMoqMin

  return (
    <div className="min-h-screen bg-background">
      <JsonLd
        data={jsonLdGraph(
          faqPageSchema(GIFTING_FAQS),
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

          {/* --- Gifting has a different shape to normal wholesale ---------- */}
          <IndustrySection heading="Why gifting is a different order shape" eyebrow="The constraint">
            <p className="text-body max-w-3xl">
              A gifting programme is the opposite of a retail range. You need a
              few hundred units, not a few thousand; you need them branded, not
              blank; and you need them by a date that was set by a conference or
              a financial year, not by a production calendar. Most factories are
              built for the other shape.
            </p>
            <div className="mt-6 grid gap-5 sm:grid-cols-3">
              {[
                ["Short runs", `Our small leather goods carry the lowest minimums in the catalogue${lowestMoq > 0 ? ` — from ${lowestMoq} pieces` : ""}, against the 300–500 unit floors typical of large factories.`],
                ["Branding in house", "Embossing, debossing, custom edge paint, woven labels and boxing all happen with us, so a programme is branded end to end without a separate finisher."],
                ["Fixed dates", "Gifting deadlines do not move. Tell us the date first and we will tell you honestly whether it is achievable before you commit."],
              ].map(([t, d]) => (
                <div key={t} className="border border-border bg-card p-6">
                  <h3 className="font-serif text-lg font-medium text-foreground">{t}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{d}</p>
                </div>
              ))}
            </div>
          </IndustrySection>

          {/* --- Branding methods: the actual decision for this buyer -------- */}
          <IndustrySection heading="How your mark goes on" eyebrow="Branding">
            <div className="overflow-x-auto border border-border">
              <table className="w-full border-collapse text-left text-[0.9375rem]">
                <thead className="bg-bone dark:bg-muted/30">
                  <tr>
                    {["Method", "Looks like", "Tooling", "Best for"].map((h) => (
                      <th key={h} scope="col" className="border-b border-border px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Blind deboss", "Mark pressed in, no colour. Understated.", "One-off die", "Premium, restrained brands"],
                    ["Foil deboss", "Gold, silver or coloured foil in the impression.", "One-off die", "High contrast on dark leather"],
                    ["Pigment fill", "Coloured ink in the impression, matched to brand.", "One-off die", "Brand-colour accuracy"],
                    ["Embossed keeper / patch", "Raised mark on a loop or applied patch.", "One-off die", "Belts and bags"],
                    ["Custom edge paint", "Brand colour on every cut edge.", "None", "Recognisable without a logo"],
                    ["Woven label", "Stitched inside the piece.", "Label setup", "Interior branding"],
                  ].map(([a, b, c, d]) => (
                    <tr key={a}>
                      <td className="border-b border-border px-4 py-3 font-medium text-foreground">{a}</td>
                      <td className="border-b border-border px-4 py-3 text-muted-foreground">{b}</td>
                      <td className="whitespace-nowrap border-b border-border px-4 py-3 text-muted-foreground">{c}</td>
                      <td className="border-b border-border px-4 py-3 text-muted-foreground">{d}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-6 border-l-2 border-brass bg-bone/50 p-5 md:p-6 dark:bg-muted/20">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brass-ink">
                On tooling cost
              </p>
              <p className="mt-2 text-muted-foreground">
                A die is a <strong className="text-foreground">one-off cost on the
                first order</strong>, then stored and reused free on every repeat.
                That makes it disproportionately expensive on a single small run
                and negligible on an annual programme &mdash; worth knowing if you
                are comparing a one-off event against a recurring gift.
              </p>
            </div>
          </IndustrySection>

          <IndustrySection heading="What we produce for gifting" eyebrow="Product lines">
            {lines.length > 0 ? (
              <div className="overflow-x-auto border border-border">
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
            ) : (
              <p className="text-body">
                Live pricing is temporarily unavailable &mdash; contact us for
                current lines and minimums.
              </p>
            )}
            <p className="mt-4 text-sm text-muted-foreground">
              Ex-works per piece before branding, packaging, freight and duties.
              Folios, card holders and keyrings are produced to order rather than
              held as catalogue lines &mdash; send the spec and we will quote.
            </p>
            <IndustryInlineCta
              heading="Working to an event date?"
              body="Tell us the date and the headcount. We will tell you what is achievable before you commit — including whether a custom die still fits the timeline — and quote per unit with branding and boxing included."
              primary={{ href: "/quote-request", label: "Price a gifting programme" }}
              secondary={{ href: "/catalog/finished-products", label: "Browse current lines" }}
            />
          </IndustrySection>

          <IndustrySection heading="Presentation and packaging" eyebrow="The unboxing">
            <p className="text-body max-w-3xl">
              For a gift, the packaging is not protection &mdash; it is most of the
              perceived value, because the recipient sees it before the product.
              Options run from a kraft sleeve through rigid two-piece gift boxes
              to full retail cartons with barcodes, plus care cards and
              individually addressed inserts where a programme needs them.
            </p>
            <p className="text-body mt-4 max-w-3xl">
              Decide packaging before production: it changes unit cost, carton
              dimensions and therefore freight, and it is the most common source
              of avoidable delay on a date-driven programme.
            </p>
          </IndustrySection>

          <IndustrySection heading="Corporate gifting questions" eyebrow="FAQ">
            <IndustryFaqList faqs={GIFTING_FAQS} />
          </IndustrySection>

          <IndustrySection heading="Related sourcing guides" eyebrow="Read next">
            <RelatedGuides guides={PAGE.relatedGuides} />
          </IndustrySection>

          <IndustryCta
            title="Tell us the date and the headcount"
            body="Those two numbers decide everything else. We will come back with what is achievable, a per-unit price including branding, and a sample before you commit."
            sampleLabel="Request a sample"
          />
        </div>
      </main>

      <Footer />
    </div>
  )
}
