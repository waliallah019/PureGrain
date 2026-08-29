import Link from "next/link"
import type { CatalogIndexItem } from "@/lib/catalog-index"

/**
 * Server-rendered A–Z index of every item in a catalogue listing.
 *
 * The interactive grid above it is paginated twelve at a time and built from a
 * client fetch, so nothing it shows reaches the server HTML. This does two jobs
 * that grid cannot:
 *
 *   - gives every product page an internal link, so crawlers have a path to it
 *     that is not the sitemap, and link equity actually flows down to it;
 *   - gives a returning buyer who knows the product name a way to jump straight
 *     to it without paging through filters.
 *
 * Rendered as an ordinary visible list. It is not hidden, collapsed or
 * off-screen — the point is that a person and a crawler get the same page.
 */
export function CatalogIndex({
  items,
  heading,
  intro,
  basePath,
}: {
  items: CatalogIndexItem[]
  heading: string
  intro: string
  basePath: string
}) {
  if (!items.length) return null

  return (
    <section className="border-t border-border bg-bone/40 py-14 dark:bg-muted/10 md:py-16">
      <div className="container-wide">
        <h2 className="heading-subsection text-foreground">{heading}</h2>
        <div className="divider-brass mt-4" />
        <p className="mt-5 max-w-3xl text-muted-foreground">{intro}</p>

        <ul className="mt-8 grid gap-x-8 gap-y-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <li key={item.id} className="min-w-0">
              <Link
                href={`${basePath}/${item.id}`}
                className="block truncate py-1 text-sm text-muted-foreground underline-offset-2 transition-colors hover:text-brass-ink hover:underline"
                title={item.name}
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>

        <p className="mt-8 text-sm text-muted-foreground">
          {items.length.toLocaleString()} items listed. Prices are quoted per
          order against your specification &mdash;{" "}
          <Link
            href="/quote-request"
            className="font-medium text-brass-ink underline underline-offset-2"
          >
            request a quote
          </Link>{" "}
          or{" "}
          <Link
            href="/sample-request"
            className="font-medium text-brass-ink underline underline-offset-2"
          >
            order a sample
          </Link>
          .
        </p>
      </div>
    </section>
  )
}
