import Link from "next/link"
import type { Metadata } from "next"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { pageMetadata } from "@/lib/seo"
import { JsonLd, jsonLdGraph, breadcrumbSchema, faqPageSchema } from "@/lib/schema"
import { ACCESSORY_FAQS } from "@/lib/content/industry-faqs"
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

const PAGE = INDUSTRY_PAGES.accessories

export const metadata: Metadata = pageMetadata({
  title: PAGE.seoTitle,
  description: PAGE.seoDescription,
  path: PAGE.path,
  keywords: PAGE.keywords,
  image: PAGE.image,
  imageAlt: PAGE.imageAlt,
})

export const revalidate = 3600

export default async function AccessoryLeatherPage() {
  let stats = EMPTY_CATALOGUE_STATS
  try {
    stats = await getCatalogueStats()
  } catch {
    /* spec table degrades to a contact note */
  }

  const lines = stats.products.filter((p) => PAGE.oemProductTypes.includes(p.type))
  const money = (n: number) => (Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`)
  const lowestMoq = stats.productMoqMin

  return (
    <div className="min-h-screen bg-background">
      <JsonLd
        data={jsonLdGraph(
          faqPageSchema(ACCESSORY_FAQS),
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

          {/* --- The four details that separate good from cheap --------------- */}
          <IndustrySection heading="Four details that decide quality" eyebrow="Construction">
            <p className="text-body max-w-3xl">
              A wallet is a simple object, which means there is nowhere for poor
              work to hide. When you evaluate a sample &mdash; ours or anyone
              else&apos;s &mdash; check these before anything else. They predict
              long-term customer satisfaction better than the leather grade does.
            </p>
            <ol className="mt-6 space-y-4">
              {[
                ["Skiving", "Leather thinned at fold lines and seams so the folded piece stays slim. An unskived wallet is visibly bulky and will not close flat — the clearest single indicator of whether a factory knows what it is doing."],
                ["Edge treatment", "Painted edges in multiple thin coats sanded between them, or burnished edges on veg tan. Cheap goods get one thick coat that chips within months."],
                ["Stitch density and backstitching", "Seven to nine stitches per inch reads as considered. Backstitching at pocket mouths — the highest-stress points — prevents the unravelling that ends a wallet's life."],
                ["Card pocket tension", "Slots must hold a card securely when new and still accept one after a year of stretching. This comes from pattern tolerances, not material."],
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
          </IndustrySection>

          <IndustrySection heading="Hides we stock for small leather goods" eyebrow="Verified availability">
            <HideSpecTable
              animals={stats.hides.animals}
              only={PAGE.animals}
              emptyNote="Live availability is temporarily unavailable — contact us for current substances and grades."
            />
            <div className="mt-6 border-l-2 border-warning bg-warning/5 p-5 md:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-warning">
                Belt strap leather, stated plainly
              </p>
              <p className="mt-2 text-muted-foreground">
                A quality belt wants 3.0&ndash;4.0mm so it does not stretch under
                tension or crack at the holes. Our stocked cowhide tops out around
                2.2mm. We therefore produce belts as{" "}
                <strong className="text-foreground">finished goods</strong> using
                heavier stock sourced for the build &mdash; we do not sell
                belt-weight strap leather by the square foot. Wallet and strap
                components at 1.1&ndash;2.2mm ship from stock as normal.
              </p>
            </div>
          </IndustrySection>

          <IndustrySection heading="Matching leather to the piece" eyebrow="Materials">
            <div className="overflow-x-auto border border-border">
              <table className="w-full border-collapse text-left text-[0.9375rem]">
                <thead className="bg-bone dark:bg-muted/30">
                  <tr>
                    {["Piece", "Leather", "Substance"].map((h) => (
                      <th key={h} scope="col" className="border-b border-border px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Bifold / trifold wallet", "Full-grain cowhide, smooth or pebble", "1.1–1.4mm"],
                    ["Cardholder", "Full-grain or veg tan", "1.1–1.4mm"],
                    ["Watch strap", "Veg tan or embossed cowhide", "1.6–2.2mm"],
                    ["Interior lining", "Goat, 0.8–1.2mm", "0.8–1.2mm"],
                    ["Keyring / small pouch", "Veg tan offcut-friendly stock", "1.2–2.0mm"],
                  ].map(([a, b, c]) => (
                    <tr key={a}>
                      <td className="border-b border-border px-4 py-3 font-medium text-foreground">{a}</td>
                      <td className="border-b border-border px-4 py-3 text-muted-foreground">{b}</td>
                      <td className="whitespace-nowrap border-b border-border px-4 py-3 text-muted-foreground tabular-nums">{c}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-6">
              <Link href={PAGE.catalogueHref} className="font-medium text-brass-ink underline underline-offset-2">
                Browse cowhide in the leather hides catalogue
              </Link>
            </p>
          </IndustrySection>

          {/* --- OEM is unusually prominent here because it genuinely is the
                  deepest line for this segment — but the page still leads with
                  material sourcing. ------------------------------------------ */}
          <IndustrySection heading="Or buy the finished piece" eyebrow="Also available">
            <p className="text-body max-w-3xl">
              Small leather goods are our deepest finished line, and they carry the
              lowest minimums we offer
              {lowestMoq > 0 ? ` — from ${lowestMoq} pieces` : ""} &mdash; low
              enough to validate a design before committing capital, and well below
              the 300&ndash;500 unit floors typical of large factories.
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
              Ex-works per piece before customisation, freight and duties, read live
              from the catalogue.
            </p>

            <IndustryInlineCta
              heading="Test a design before you commit to a range"
              body="Wallets and belts carry the lowest minimums we offer, so a first order costs very little to be wrong about. Send your design or pick a line and we will quote it branded, boxed and ready to sell."
              primary={{ href: "/quote-request", label: "Price a branded first order" }}
              secondary={{ href: "/custom-manufacturing", label: "Branding & finishing options" }}
            />
          </IndustrySection>

          <IndustrySection heading="Small leather goods sourcing questions" eyebrow="FAQ">
            <IndustryFaqList faqs={ACCESSORY_FAQS} />
          </IndustrySection>

          <IndustrySection heading="Related sourcing guides" eyebrow="Read next">
            <RelatedGuides guides={PAGE.relatedGuides} />
          </IndustrySection>

          <IndustryCta
            title="The cheapest way to test our work"
            body="A small first order in wallets or belts shows you our leather, edge finishing and branding in a finished piece before you commit to a larger programme."
            sampleLabel="Request samples"
          />
        </div>
      </main>

      <Footer />
    </div>
  )
}
