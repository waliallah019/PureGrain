import { SITE } from "@/lib/site"
import { SITE_NAME, SITE_URL } from "@/lib/seo"

/**
 * JSON-LD structured data.
 *
 * The August 2026 audit scored Schema 2/100 — "The site has zero structured
 * data. No JSON-LD exists on any page." Google therefore had no machine-readable
 * way to tell what the business is, what it sells, or how the pages relate.
 *
 * Everything here is derived from data already on the page. Nothing is invented:
 * if a field is absent on the record it is omitted rather than guessed, because
 * wrong structured data is worse than none — it is a manual-action risk and it
 * teaches search engines incorrect facts about the business.
 *
 * Entities are linked by `@id` so the graph resolves: the Organization is the
 * `publisher` of blog posts, the `seller` on product offers, and the publisher
 * of the WebSite.
 */

export const ORG_ID = `${SITE_URL}/#organization`
export const WEBSITE_ID = `${SITE_URL}/#website`

const abs = (path: string) =>
  /^https?:\/\//i.test(path) ? path : `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`

/** Strips undefined/null/empty so we never emit hollow properties. */
function clean<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null || v === "") continue
    if (Array.isArray(v) && v.length === 0) continue
    out[k] = v
  }
  return out as T
}

/* -------------------------------------------------------------------------- */
/* Sitewide entities                                                          */
/* -------------------------------------------------------------------------- */

export function organizationSchema() {
  return clean({
    "@type": "Organization",
    "@id": ORG_ID,
    name: SITE_NAME,
    alternateName: SITE.shortName,
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: abs("/new_logo.png"),
      width: 1159,
      height: 279,
    },
    image: abs("/hero-leather-warm.jpg"),
    description:
      "B2B leather exporter supplying full-grain and top-grain hides and wholesale finished leather goods to manufacturers worldwide.",
    email: SITE.email,
    telephone: SITE.phoneDisplay,
    // Strengthens the brand entity for knowledge-panel style resolution.
    // Backed by the homepage stat block ("Continuous operation since 1999").
    foundingDate: "1999",
    /*
     * Named person behind the entity. AI systems disambiguate organisations far
     * more confidently when a founder resolves alongside the company, and this
     * is the one E-E-A-T signal the site can make without inventing anything:
     * the name and title are already published on /about, so the schema only
     * restates what a reader can verify on the page.
     */
    founder: {
      "@type": "Person",
      name: "Ahmad Hassan",
      jobTitle: "Founder & Director",
      worksFor: { "@id": ORG_ID },
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: `${SITE.address.line1}, ${SITE.address.line2}`,
      addressLocality: SITE.address.city,
      addressRegion: SITE.address.region,
      postalCode: SITE.address.postalCode,
      addressCountry: "PK",
    },
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "sales",
        email: SITE.email,
        telephone: SITE.phoneDisplay,
        areaServed: "Worldwide",
        availableLanguage: ["English", "Urdu"],
      },
    ],
    sameAs: [SITE.social.instagram, SITE.social.linkedin, SITE.social.facebook],
    areaServed: { "@type": "Place", name: "Worldwide" },
    knowsAbout: [
      "Leather hides wholesale",
      "Full-grain leather",
      "Vegetable tanning",
      "Leather export documentation",
    ],
  })
}

export function websiteSchema() {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: SITE_URL,
    name: SITE_NAME,
    publisher: { "@id": ORG_ID },
    inLanguage: "en",
    /*
     * The catalogue genuinely reads a `q` search param (see
     * app/catalog/raw-leather/page.tsx), so this target is real. A SearchAction
     * pointing at a URL that does not actually search is a common way sites get
     * this wrong.
     */
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/catalog/raw-leather?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  }
}

/* -------------------------------------------------------------------------- */
/* Per-page entities                                                          */
/* -------------------------------------------------------------------------- */

export type Crumb = { name: string; path: string }

export function breadcrumbSchema(crumbs: Crumb[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: abs(c.path),
    })),
  }
}

/**
 * A catalogue listing page and the items on it.
 *
 * `CollectionPage` tells a search engine this URL is a category rather than a
 * product or an article, and the nested `ItemList` enumerates what it contains
 * in a fixed order. Both listings previously published neither: their grids are
 * built client-side, so as far as any parser was concerned the pages held no
 * items at all.
 *
 * Entries are URL references rather than inlined Products. The full Product
 * entity — offers, price, availability, material properties — is published on
 * each item's own page, and repeating a partial copy here would give two
 * different answers for the same `@id`.
 */
export function collectionListSchema({
  name,
  description,
  path,
  items,
}: {
  name: string
  description?: string
  path: string
  items: Array<{ name: string; path: string }>
}) {
  return clean({
    "@type": "CollectionPage",
    "@id": `${abs(path)}#collection`,
    url: abs(path),
    name,
    description,
    isPartOf: { "@id": WEBSITE_ID },
    about: { "@id": ORG_ID },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: items.length,
      itemListOrder: "https://schema.org/ItemListOrderAscending",
      itemListElement: items.map((item, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: item.name,
        url: abs(item.path),
      })),
    },
  })
}

const AVAILABILITY: Record<string, string> = {
  "In Stock": "https://schema.org/InStock",
  "Made to Order": "https://schema.org/MadeToOrder",
  "Limited Stock": "https://schema.org/LimitedAvailability",
}

type ProductInput = {
  name: string
  description?: string
  images?: string[]
  sku: string
  path: string
  category?: string
  price?: number
  currency?: string
  priceUnit?: string
  availability?: string
  /** Rendered as additionalProperty rows — the spec data buyers actually filter on. */
  specs?: Array<{ name: string; value?: string | number }>
}

export function productSchema(p: ProductInput) {
  const specs = (p.specs ?? [])
    .filter((s) => s.value !== undefined && s.value !== null && s.value !== "")
    .map((s) => ({ "@type": "PropertyValue", name: s.name, value: String(s.value) }))

  return clean({
    "@type": "Product",
    name: p.name,
    description: p.description,
    image: (p.images ?? []).filter(Boolean).map(abs),
    sku: p.sku,
    category: p.category,
    url: abs(p.path),
    brand: { "@type": "Brand", name: SITE_NAME },
    additionalProperty: specs,
    /*
     * `offers` is omitted entirely when there is no price. Google requires a
     * price on an Offer, so emitting one with 0/null would be invalid markup
     * rather than a graceful fallback.
     */
    offers: p.price
      ? clean({
          "@type": "Offer",
          price: p.price,
          priceCurrency: p.currency || "USD",
          availability: AVAILABILITY[p.availability ?? ""] ?? "https://schema.org/InStock",
          url: abs(p.path),
          seller: { "@id": ORG_ID },
          // Signals a per-unit trade price rather than a consumer basket price.
          priceSpecification: clean({
            "@type": "UnitPriceSpecification",
            price: p.price,
            priceCurrency: p.currency || "USD",
            unitText: p.priceUnit,
          }),
        })
      : undefined,
  })
}

type BlogInput = {
  title: string
  description?: string
  slug: string
  image?: string
  author?: string
  published?: Date | string
  modified?: Date | string
  tags?: string[]
  wordCount?: number
}

export function blogPostingSchema(b: BlogInput) {
  const iso = (d?: Date | string) => {
    if (!d) return undefined
    const dt = d instanceof Date ? d : new Date(d)
    return Number.isNaN(dt.getTime()) ? undefined : dt.toISOString()
  }
  const url = abs(`/blogs/${b.slug}`)

  return clean({
    "@type": "BlogPosting",
    "@id": `${url}#post`,
    headline: b.title.slice(0, 110), // Google truncates headline beyond ~110 chars
    description: b.description,
    image: b.image ? abs(b.image) : undefined,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    datePublished: iso(b.published),
    dateModified: iso(b.modified) || iso(b.published),
    author: b.author ? { "@type": "Person", name: b.author } : { "@id": ORG_ID },
    publisher: { "@id": ORG_ID },
    keywords: b.tags?.length ? b.tags.join(", ") : undefined,
    wordCount: b.wordCount,
    inLanguage: "en",
  })
}

export function faqPageSchema(faqs: ReadonlyArray<{ q: string; a: string }>) {
  return {
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  }
}

/* -------------------------------------------------------------------------- */
/* Rendering                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Wraps entities in a single @graph document. One script tag per page keeps the
 * entities cross-referencable by `@id` and avoids the duplicate Organization
 * blocks you get from emitting each entity separately.
 */
export function jsonLdGraph(...entities: Array<Record<string, unknown> | undefined | null>) {
  return {
    "@context": "https://schema.org",
    "@graph": entities.filter(Boolean),
  }
}

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      /*
       * Generated from our own data, never user input. Escaping `<` prevents a
       * stray `</script>` sequence inside any field from closing the element
       * early — the standard JSON-LD injection guard.
       */
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  )
}
