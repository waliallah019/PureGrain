import Link from "next/link"
import type { Metadata } from "next"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { pageMetadata } from "@/lib/seo"
import { JsonLd, jsonLdGraph, breadcrumbSchema, faqPageSchema } from "@/lib/schema"
import { FOOTWEAR_FAQS } from "@/lib/content/industry-faqs"
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

const PAGE = INDUSTRY_PAGES.footwear

export const metadata: Metadata = pageMetadata({
  title: PAGE.seoTitle,
  description: PAGE.seoDescription,
  path: PAGE.path,
  keywords: PAGE.keywords,
  image: PAGE.image,
  imageAlt: PAGE.imageAlt,
})

/** Substance figures come from the live catalogue; regenerate hourly. */
export const revalidate = 3600

export default async function FootwearLeatherPage() {
  let stats = EMPTY_CATALOGUE_STATS
  try {
    stats = await getCatalogueStats()
  } catch {
    // Spec table falls back to a "contact us" note rather than failing the page.
  }

  return (
    <div className="min-h-screen bg-background">
      <JsonLd
        data={jsonLdGraph(
          faqPageSchema(FOOTWEAR_FAQS),
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

          {/* --- What footwear buyers are actually specifying ---------------- */}
          <IndustrySection
            heading="What footwear manufacturers specify"
            eyebrow="Buyer requirements"
          >
            <p className="text-body max-w-3xl">
              Footwear is a component business, not a single-material one. A shoe
              factory rarely wants &ldquo;leather&rdquo; &mdash; it wants an upper
              at one substance, a lining at another, and consistency across a run
              measured in thousands of pairs. The specification that matters:
            </p>
            <dl className="mt-6 grid gap-px border border-border bg-border sm:grid-cols-2">
              {[
                {
                  t: "Substance, per component",
                  d: "Uppers typically 1.4–1.8mm; linings 0.8–1.2mm. Quoted as a range, because leather is split to a tolerance rather than a single figure.",
                },
                {
                  t: "Temper",
                  d: "Firm enough to hold a lasted shape without cracking at the vamp. Too soft and the upper collapses; too firm and it will not last cleanly.",
                },
                {
                  t: "Grain consistency",
                  d: "Volume lines need a uniform surface across every pair. Corrected and embossed grains exist precisely for this.",
                },
                {
                  t: "Yield per hide",
                  d: "Shoe patterns nest awkwardly. Grade drives usable panel area, which is what you are really paying for — not the per-square-foot rate.",
                },
              ].map((item) => (
                <div key={item.t} className="bg-background p-6">
                  <dt className="font-serif text-lg font-medium text-foreground">{item.t}</dt>
                  <dd className="mt-2 text-sm text-muted-foreground">{item.d}</dd>
                </div>
              ))}
            </dl>
          </IndustrySection>

          {/* --- Live spec table -------------------------------------------- */}
          <IndustrySection heading="What we actually stock" eyebrow="Verified availability">
            <p className="text-body mb-6 max-w-3xl">
              Read from our live catalogue rather than a brochure figure, so the
              substances below are what is genuinely available today.
            </p>
            <HideSpecTable
              animals={stats.hides.animals}
              only={PAGE.animals}
              emptyNote="Live availability is temporarily unavailable — contact us for current substances and grades."
            />
            <p className="mt-4 text-sm text-muted-foreground">
              Tannage is chrome as standard; vegetable-tanned cowhide is stocked at
              1.2&ndash;2.2mm and suits uppers and linings rather than bottoming.
            </p>
          </IndustrySection>

          {/* --- Component matrix: the genuinely footwear-specific part ------ */}
          <IndustrySection heading="Matching leather to the component" eyebrow="Applications">
            <div className="overflow-x-auto border border-border">
              <table className="w-full border-collapse text-left text-[0.9375rem]">
                <thead className="bg-bone dark:bg-muted/30">
                  <tr>
                    {["Component", "Suggested leather", "Why"].map((h) => (
                      <th
                        key={h}
                        scope="col"
                        className="border-b border-border px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em]"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Dress shoe upper", "Smooth full-grain cowhide, 1.4–1.6mm", "Takes a high polish and holds a lasted shape"],
                    ["Casual / sneaker upper", "Pebble or embossed cowhide, 1.2–1.6mm", "Textured grain disguises scuffing in wear"],
                    ["Boot upper", "Pull-up or waxed cowhide, 1.6–2.0mm", "Heavier substance, and the finish ages rather than looking worn"],
                    ["Nubuck / suede upper", "Nubuck or suede, 1.2–1.6mm", "Napped surface; needs better raw material as there is no pigment layer"],
                    ["Lining", "Goat, 0.8–1.2mm", "Light, breathable and strong for its weight against the foot"],
                    ["Quarter lining / collar", "Goat or light cowhide", "Abrasion resistance where the heel moves"],
                  ].map(([c, l, w]) => (
                    <tr key={c}>
                      <td className="border-b border-border px-4 py-3 font-medium text-foreground">{c}</td>
                      <td className="border-b border-border px-4 py-3 text-muted-foreground">{l}</td>
                      <td className="border-b border-border px-4 py-3 text-muted-foreground">{w}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 border-l-2 border-warning bg-warning/5 p-5 md:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-warning">
                What we do not supply
              </p>
              <p className="mt-2 text-muted-foreground">
                Sole, insole and welt leather. Bottoming stock is heavy
                vegetable-tanned leather at 3mm and above; every vegetable-tanned
                hide we carry is cowhide at 1.2&ndash;2.2mm. We would rather point
                you elsewhere for bottoming than take the order and substitute.
              </p>
            </div>
          </IndustrySection>

          {/* --- QC ---------------------------------------------------------- */}
          <IndustrySection heading="Grading and quality control" eyebrow="How we control it">
            <p className="text-body max-w-3xl">
              Every batch passes six-stage inspection with in-house lab testing of
              thickness, tensile strength, colour fastness and chemical compliance.
              For footwear specifically, the two failure modes that matter are
              substance drift between bundles and colour variation between dye
              lots &mdash; both are documented per batch, and we hold a retained
              swatch against your approved sample.
            </p>
            <p className="text-body mt-4 max-w-3xl">
              We are certified to ISO 9001 and ISO 14001, tan through LWG-certified
              partners, and our chemistry is REACH compliant. Full detail on the{" "}
              <Link href="/quality" className="font-medium text-brass-ink underline underline-offset-2">
                quality and process page
              </Link>
              .
            </p>
          </IndustrySection>

          {/* --- Ordering ---------------------------------------------------- */}
          <IndustrySection heading="Sampling and ordering" eyebrow="How to buy">
            <ol className="space-y-4">
              {[
                ["Send the component and substance", "Tell us what you are making — upper, lining, quarter — and the substance range. If you are unsure, describe the shoe and we will recommend."],
                ["Approve physical swatches", "Complimentary for verified trade buyers; you pay shipping only. Never approve footwear leather from a photograph — temper is invisible on a screen."],
                ["Confirm grade and volume", "We quote per square foot against your specification, and confirm grade and square footage per bundle."],
                ["Production and export", "Graded and documented per batch, then shipped FOB Karachi as standard with full export paperwork."],
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
              <Link
                href={PAGE.catalogueHref}
                className="font-medium text-brass-ink underline underline-offset-2"
              >
                Browse cowhide in the leather hides catalogue
              </Link>
            </p>
          </IndustrySection>

          <IndustrySection heading="Footwear leather sourcing questions" eyebrow="FAQ">
            <IndustryFaqList faqs={FOOTWEAR_FAQS} />
          </IndustrySection>

          <IndustrySection heading="Related sourcing guides" eyebrow="Read next">
            <RelatedGuides guides={PAGE.relatedGuides} />
          </IndustrySection>

          <IndustryCta
            title="Start with the leather, not the paperwork"
            body="Tell us the component and substance you need. We will send swatches from live stock and quote per square foot against your volume."
            sampleLabel="Request footwear swatches"
          />
        </div>
      </main>

      <Footer />
    </div>
  )
}
