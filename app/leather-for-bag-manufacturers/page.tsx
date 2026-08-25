import Link from "next/link"
import type { Metadata } from "next"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { pageMetadata } from "@/lib/seo"
import { JsonLd, jsonLdGraph, breadcrumbSchema, faqPageSchema } from "@/lib/schema"
import { BAG_FAQS } from "@/lib/content/industry-faqs"
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

const PAGE = INDUSTRY_PAGES.bags

export const metadata: Metadata = pageMetadata({
  title: PAGE.seoTitle,
  description: PAGE.seoDescription,
  path: PAGE.path,
  keywords: PAGE.keywords,
  image: PAGE.image,
  imageAlt: PAGE.imageAlt,
})

export const revalidate = 3600

export default async function BagLeatherPage() {
  let stats = EMPTY_CATALOGUE_STATS
  try {
    stats = await getCatalogueStats()
  } catch {
    /* spec table degrades to a contact note */
  }

  const bagLines = stats.products.filter((p) => PAGE.oemProductTypes.includes(p.type))
  const money = (n: number) => (Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`)

  return (
    <div className="min-h-screen bg-background">
      <JsonLd
        data={jsonLdGraph(
          faqPageSchema(BAG_FAQS),
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

          {/* --- Substance is the whole decision ---------------------------- */}
          <IndustrySection heading="Substance drives the whole design" eyebrow="Specification">
            <p className="text-body max-w-3xl">
              More bag programmes fail on substance than on finish. A structured
              bag drawn in 1.2mm leather collapses; a soft tote cut from 2.0mm
              will not drape. Choose the substance from the construction, then
              pick the finish.
            </p>
            <div className="mt-6 overflow-x-auto border border-border">
              <table className="w-full border-collapse text-left text-[0.9375rem]">
                <thead className="bg-bone dark:bg-muted/30">
                  <tr>
                    {["Substance", "Behaviour", "Suits"].map((h) => (
                      <th key={h} scope="col" className="border-b border-border px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["1.2–1.6mm", "Soft, slouches, drapes", "Totes, soft backpacks, unstructured bags"],
                    ["1.6–2.0mm", "Semi-structured, holds shape loaded", "Messengers, briefcases, most backpacks"],
                    ["1.8–2.2mm", "Firm, holds shape empty", "Structured bags, base and stress panels"],
                  ].map(([a, b, c]) => (
                    <tr key={a}>
                      <td className="whitespace-nowrap border-b border-border px-4 py-3 font-medium text-foreground tabular-nums">{a}</td>
                      <td className="border-b border-border px-4 py-3 text-muted-foreground">{b}</td>
                      <td className="border-b border-border px-4 py-3 text-muted-foreground">{c}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Many good bags use two substances: a heavier leather for base, straps
              and stress panels, lighter for the body. It costs nesting yield and
              produces a bag that behaves properly.
            </p>
          </IndustrySection>

          <IndustrySection heading="Hides we stock for bags" eyebrow="Verified availability">
            <HideSpecTable
              animals={stats.hides.animals}
              only={PAGE.animals}
              emptyNote="Live availability is temporarily unavailable — contact us for current substances and grades."
            />
            <p className="mt-4 text-sm text-muted-foreground">
              Vegetable-tanned cowhide is stocked at 1.2&ndash;2.2mm across a wide
              colour range &mdash; it tools, burnishes and darkens with use, which
              is why heritage bag brands specify it.
            </p>
          </IndustrySection>

          {/* --- Finish selection, bag-specific ----------------------------- */}
          <IndustrySection heading="Choosing a finish for a bag" eyebrow="Materials">
            <div className="grid gap-5 sm:grid-cols-2">
              {[
                ["Pebble", "Textured grain disguises scuffs better than any other finish. The pragmatic choice for a bag that will be used hard."],
                ["Pull-up", "Lightens at flex points and corners. Reads rugged and lived-in; wear becomes character rather than damage."],
                ["Veg tan", "Tools and burnishes, darkens with use. Right for heritage positioning, wrong for a bag sold on staying pristine."],
                ["Smooth / embossed", "Even and predictable across panels. The safe choice when a customer expects uniformity."],
              ].map(([t, d]) => (
                <div key={t} className="border border-border bg-card p-6">
                  <h3 className="font-serif text-lg font-medium text-foreground">{t}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{d}</p>
                </div>
              ))}
            </div>
            <p className="mt-6">
              <Link href={PAGE.catalogueHref} className="font-medium text-brass-ink underline underline-offset-2">
                Browse cowhide by finish in the leather hides catalogue
              </Link>
            </p>
          </IndustrySection>

          {/* --- Where cheap bags fail -------------------------------------- */}
          <IndustrySection heading="Where bags actually fail" eyebrow="Construction">
            <p className="text-body max-w-3xl">
              Rarely the leather. Almost always the hardware and how it is anchored:
              a strap tearing out of an unreinforced panel, a zip separating, plating
              worn through in six months. If you are specifying a bag, specify these
              too.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Strap and handle anchors: reinforcement patch, rivets, bar tacks — ideally all three.",
                "Base construction: the base carries the load every time the bag is set down, and abrades first.",
                "Zips by brand and gauge, not just length. Generic zips are the most common false economy in bag manufacturing.",
                "Load-bearing fittings in solid brass or stainless rather than plated zinc alloy — identical on day one, not in a year.",
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

          {/* --- Secondary: OEM. Explicitly framed as the secondary intent. -- */}
          <IndustrySection heading="Need finished bags rather than leather?" eyebrow="Also available">
            <p className="text-body max-w-3xl">
              This page is about buying bag leather. If you would rather buy the
              finished article, we also manufacture bags to order under your own
              label &mdash; your leather, lining, hardware and internal layout,
              your branding and packaging.
            </p>

            {bagLines.length > 0 ? (
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
                    {bagLines.map((p) => (
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
              heading="Want the bag made, not the leather?"
              body="Send a tech pack or the bag you want to work from. We pattern from either, quote at your quantity, and produce a sample you can load and carry before you commit to a run."
              primary={{ href: "/quote-request", label: "Quote my bag programme" }}
              secondary={{ href: "/catalog/finished-products", label: "See current bag lines" }}
            />
          </IndustrySection>

          <IndustrySection heading="Bag leather sourcing questions" eyebrow="FAQ">
            <IndustryFaqList faqs={BAG_FAQS} />
          </IndustrySection>

          <IndustrySection heading="Related sourcing guides" eyebrow="Read next">
            <RelatedGuides guides={PAGE.relatedGuides} />
          </IndustrySection>

          <IndustryCta
            title="Judge the leather before you cut a pattern"
            body="Send the construction and substance you have in mind. We will send swatches from live stock, and quote per square foot — or per finished piece if you would rather we built it."
            sampleLabel="Request bag leather swatches"
          />
        </div>
      </main>

      <Footer />
    </div>
  )
}
