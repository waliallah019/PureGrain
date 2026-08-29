import Link from "next/link"
import type { CatalogueStats } from "@/lib/catalogue-stats"
import type { Faq } from "@/lib/content/faqs"

/**
 * The three things a private-label buyer looks for before they enquire, and
 * which the page did not answer: whether we do OEM or ODM, what the minimum
 * order actually is, and what they need to send us to get a quote.
 *
 * Minimums are read from the live catalogue rather than written into the copy,
 * so this cannot drift out of date the way a hardcoded "from 100 units" would
 * the first time a line's MOQ changes in the admin panel.
 *
 * `!mt-14` on the sub-headings is deliberate: this section renders inside
 * `.cmPage`, whose stylesheet sets `.cmPage h1, h2, h3, h4 { margin: 0 0 .6em }`.
 * That selector scores higher than a plain `.mt-14` utility, so without the
 * important modifier the top margin is dropped and the headings collide with
 * the table above them.
 *
 * Styled with the site's Tailwind design tokens rather than the page's own
 * `cm-*` stylesheet: this section is new, so it has no legacy styling to match,
 * and the tokens keep it consistent in both themes without adding to custom.css.
 */
export function OemDetail({
  stats,
  faqs,
}: {
  stats: CatalogueStats
  faqs: readonly Faq[]
}) {
  const money = (n: number) => (Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`)

  // Cheapest-first: a founder scanning this is looking for the entry point.
  const lines = [...stats.products]
    .filter((p) => p.moqMin > 0)
    .sort((a, b) => a.moqMin - b.moqMin || a.label.localeCompare(b.label))

  return (
    <section
      className="border-y border-border bg-background py-16 md:py-20"
      aria-labelledby="cmOemTitle"
    >
      <div className="container-wide">
        <p className="text-eyebrow">Private Label &amp; OEM</p>
        <h2
          id="cmOemTitle"
          className="heading-section mt-3 text-foreground"
        >
          OEM, ODM and what it takes to start
        </h2>
        <div className="divider-brass mt-4" />

        {/* --- OEM vs ODM: the first question every private-label buyer asks --- */}
        <p className="mt-8 max-w-3xl text-muted-foreground">
          Both routes end with your brand on the product. They differ in who owns
          the design, and that decides your tooling cost, your lead time and how
          much of the work sits with your team.
        </p>

        <div className="mt-8 overflow-x-auto border border-border">
          <table className="w-full border-collapse text-left text-[0.9375rem]">
            <caption className="sr-only">
              OEM compared with ODM for private-label leather production
            </caption>
            <thead className="bg-bone dark:bg-muted/30">
              <tr>
                {["", "OEM — you bring the design", "ODM — we adapt ours"].map((h) => (
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
                [
                  "You supply",
                  "Tech pack, patterns or a physical reference sample",
                  "A reference from our existing lines plus your changes",
                ],
                [
                  "Design ownership",
                  "Yours — we build only to your specification",
                  "Ours, modified for you and produced under your label",
                ],
                [
                  "Typical first sample",
                  "3–4 weeks — patterns are cut and graded from scratch",
                  "10–14 days — an existing block is adapted",
                ],
                [
                  "Tooling",
                  "New dies, patterns and embossing plates as required",
                  "Usually only a branding die",
                ],
                [
                  "Best when",
                  "You have a defined product and want it built exactly",
                  "You want to launch quickly and refine from a proven base",
                ],
              ].map(([label, oem, odm]) => (
                <tr key={label}>
                  <th
                    scope="row"
                    className="whitespace-nowrap border-b border-border bg-bone/40 px-4 py-3 text-left font-medium text-foreground dark:bg-muted/20"
                  >
                    {label}
                  </th>
                  <td className="border-b border-border px-4 py-3 text-muted-foreground">{oem}</td>
                  <td className="border-b border-border px-4 py-3 text-muted-foreground">{odm}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* --- Minimums, read from the catalogue --------------------------- */}
        <h3 className="heading-subsection !mt-14 text-foreground">
          Minimum order quantity by product line
        </h3>
        <p className="mt-3 max-w-3xl text-muted-foreground">
          Minimums are per line rather than one figure for the whole business,
          because a wallet and a motorcycle suit are not the same production
          problem. These are read live from the catalogue.
        </p>

        {lines.length > 0 ? (
          <div className="mt-6 overflow-x-auto border border-border">
            <table className="w-full border-collapse text-left text-[0.9375rem]">
              <caption className="sr-only">
                Minimum order quantity and indicative unit price by product line
              </caption>
              <thead className="bg-bone dark:bg-muted/30">
                <tr>
                  {["Product line", "MOQ (units)", "Indicative unit price", "Options in catalogue"].map((h) => (
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
                {lines.map((p) => (
                  <tr key={p.type}>
                    <td className="border-b border-border px-4 py-3 font-medium text-foreground">
                      {p.label}
                    </td>
                    <td className="whitespace-nowrap border-b border-border px-4 py-3 text-muted-foreground tabular-nums">
                      {p.moqMin === p.moqMax ? p.moqMin : `${p.moqMin}–${p.moqMax}`}
                    </td>
                    <td className="whitespace-nowrap border-b border-border px-4 py-3 text-muted-foreground tabular-nums">
                      {p.priceMin > 0
                        ? p.priceMin === p.priceMax
                          ? money(p.priceMin)
                          : `${money(p.priceMin)}–${money(p.priceMax)}`
                        : "On request"}
                    </td>
                    <td className="border-b border-border px-4 py-3 text-right text-foreground tabular-nums">
                      {p.count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-6 text-muted-foreground">
            Live minimums are temporarily unavailable &mdash; send us your product
            and quantity and we will confirm by return.
          </p>
        )}

        <p className="mt-4 text-sm text-muted-foreground">
          Ex-works per piece before branding, packaging, freight and duties.
          Below-minimum first orders are sometimes possible on a trial basis at a
          higher unit price &mdash; ask rather than assume.
        </p>

        {/* --- What we need from you -------------------------------------- */}
        <h3 className="heading-subsection !mt-14 text-foreground">
          What to send us for a quote
        </h3>
        <p className="mt-3 max-w-3xl text-muted-foreground">
          A complete brief is quoted in days; an incomplete one turns into a
          fortnight of questions. Nothing here needs to be a formal document
          &mdash; annotated photographs and a sample garment work perfectly well.
        </p>
        <div className="mt-6 grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Product and quantity", "What it is, and how many per style and colour on the first order."],
            ["Reference or tech pack", "Drawings, patterns, a competitor product, or a sample we can take apart."],
            ["Materials", "Leather type, substance and colour — or ask us to propose one against a use case."],
            ["Hardware and trims", "Zips, buckles, thread and lining, with brands if you have a standard."],
            ["Branding", "Logo artwork as vector, plus where it goes and how: deboss, foil, patch or woven label."],
            ["Dates and market", "Your in-store date and the market you sell into, since sizing and certification follow from it."],
          ].map(([t, d]) => (
            <div key={t} className="bg-background p-6">
              <h4 className="font-serif text-lg font-medium text-foreground">{t}</h4>
              <p className="mt-2 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>

        {/* --- FAQ, shared with the FAQPage schema on this route ---------- */}
        <h3 className="heading-subsection !mt-14 text-foreground">
          Private-label questions
        </h3>
        <div className="mt-6 border-t border-border">
          {faqs.map((faq) => (
            <details key={faq.q} className="group border-b border-border py-4">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4 font-serif text-lg font-medium text-foreground md:text-xl">
                {faq.q}
                <span
                  aria-hidden="true"
                  className="mt-1.5 h-2.5 w-2.5 shrink-0 rotate-45 border-b-2 border-r-2 border-brass transition-transform duration-300 group-open:rotate-[225deg]"
                />
              </summary>
              <p className="mt-3 leading-relaxed text-muted-foreground">{faq.a}</p>
            </details>
          ))}
        </div>

        <p className="mt-8 text-muted-foreground">
          Producing under your own label in a specific category?{" "}
          <Link
            href="/industries"
            className="font-medium text-brass-ink underline underline-offset-2"
          >
            Each industry we supply
          </Link>{" "}
          has its own page covering the substances, construction and
          certification that apply to it.
        </p>
      </div>
    </section>
  )
}
