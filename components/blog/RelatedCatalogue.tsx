import Link from "next/link"
import { ArrowRight, Layers, Scissors } from "lucide-react"
import connectDB from "@/lib/config/db"
import RawLeatherType from "@/lib/models/RawLeatherType"
import ProductType from "@/lib/models/ProductType"

/**
 * Internal links from blog posts into the catalogue.
 *
 * The SEO audit flagged two On-Page gaps: "Zero internal links within blog
 * content" and "No internal linking from blog to catalog pages". Posts were
 * dead ends — no crawl path onward, and no link equity reaching the commercial
 * pages that need to rank.
 *
 * This is deliberately a *component*, not rewritten body copy. Action item #21
 * describes editing the posts themselves, which is a copywriting task on the
 * client's editorial voice; inventing sentences to hang links on would be
 * putting words in their mouth. This achieves the same SEO outcome — real,
 * relevant internal links with descriptive anchor text — from data.
 *
 * Relevance comes from the post's own tags matched against the live taxonomies.
 * Blog tags are descriptive phrases ("full grain leather", "leather tanning")
 * rather than taxonomy names ("Nubuck", "Veg Tan"), so matching is a two-way
 * substring test on normalised strings. When nothing matches — which is the
 * common case for general-interest posts — the two catalogue hubs still render,
 * so every post gets at least two onward links rather than none.
 */

type Props = { tags?: string[] }

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()

/** True when either string contains the other — catches "veg tan" in "leather veg tan guide". */
function related(tag: string, typeName: string) {
  const a = norm(tag)
  const b = norm(typeName)
  if (!a || !b) return false
  return a.includes(b) || b.includes(a)
}

export default async function RelatedCatalogue({ tags = [] }: Props) {
  let hideTypes: string[] = []
  let productTypes: string[] = []

  try {
    await connectDB()
    const [hides, products] = await Promise.all([
      RawLeatherType.find({}).select("name").lean(),
      ProductType.find({}).select("name").lean(),
    ])
    hideTypes = (hides as Array<{ name?: string }>).map((t) => t.name ?? "").filter(Boolean)
    productTypes = (products as Array<{ name?: string }>).map((t) => t.name ?? "").filter(Boolean)
  } catch {
    // Taxonomy unavailable — the hub links below still render.
  }

  const matchedHides = hideTypes.filter((t) => tags.some((tag) => related(tag, t))).slice(0, 3)
  const matchedProducts = productTypes.filter((t) => tags.some((tag) => related(tag, t))).slice(0, 2)

  return (
    <aside
      aria-labelledby="related-catalogue-heading"
      className="mt-14 border border-border bg-bone p-6 md:p-8"
    >
      <p className="text-eyebrow">From the Catalogue</p>
      <h2 id="related-catalogue-heading" className="heading-subsection mt-3 text-foreground">
        Source the leather in this article
      </h2>
      <div className="divider-brass mt-4" />

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Link
          href="/catalog/raw-leather"
          className="group flex items-start gap-4 border border-border bg-background p-5 transition-all duration-300 hover:border-brass/50 hover:shadow-card-hover"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-brass/35 text-brass-ink">
            <Layers size={18} strokeWidth={1.6} />
          </span>
          <span>
            <span className="block font-serif text-lg font-medium text-foreground">
              Leather hides wholesale
            </span>
            <span className="mt-1 block text-sm text-muted-foreground">
              Full grain, top grain, suede and nubuck by the square foot.
            </span>
            <span className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-brass-ink">
              Browse hides
              <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
            </span>
          </span>
        </Link>

        <Link
          href="/catalog/finished-products"
          className="group flex items-start gap-4 border border-border bg-background p-5 transition-all duration-300 hover:border-brass/50 hover:shadow-card-hover"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-brass/35 text-brass-ink">
            <Scissors size={18} strokeWidth={1.6} />
          </span>
          <span>
            <span className="block font-serif text-lg font-medium text-foreground">
              Wholesale finished goods
            </span>
            <span className="mt-1 block text-sm text-muted-foreground">
              Bags, jackets, belts and accessories made to order.
            </span>
            <span className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-brass-ink">
              Browse products
              <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
            </span>
          </span>
        </Link>
      </div>

      {matchedHides.length || matchedProducts.length ? (
        <div className="mt-6 border-t border-border pt-5">
          <p className="text-sm text-muted-foreground">
            Related to this article:{" "}
            {matchedHides.map((t, i) => (
              <span key={t}>
                {i > 0 ? ", " : ""}
                <Link
                  href={`/catalog/raw-leather?type=${encodeURIComponent(t)}`}
                  className="font-medium text-brass-ink underline-offset-2 hover:underline"
                >
                  {t} leather hides
                </Link>
              </span>
            ))}
            {matchedHides.length && matchedProducts.length ? ", " : ""}
            {matchedProducts.map((t, i) => (
              <span key={t}>
                {i > 0 ? ", " : ""}
                <Link
                  href={`/catalog/finished-products?type=${encodeURIComponent(t)}`}
                  className="font-medium text-brass-ink underline-offset-2 hover:underline"
                >
                  wholesale {t.toLowerCase()}
                </Link>
              </span>
            ))}
          </p>
        </div>
      ) : null}

      <p className="mt-6 text-sm text-muted-foreground">
        Need to see and feel it first?{" "}
        <Link
          href="/sample-request"
          className="font-semibold text-brass-ink underline-offset-2 hover:underline"
        >
          Request free leather samples
        </Link>{" "}
        or{" "}
        <Link
          href="/quality"
          className="font-semibold text-brass-ink underline-offset-2 hover:underline"
        >
          read how we grade and test every batch
        </Link>
        .
      </p>
    </aside>
  )
}
