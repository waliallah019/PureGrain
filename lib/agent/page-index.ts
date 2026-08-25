import { SITE_URL } from "@/lib/seo"
import { INDUSTRY_PAGE_LIST } from "@/lib/industries"

/**
 * Markdown representations of the non-article routes.
 *
 * Blog posts are converted from their stored HTML at request time. Everything
 * else on the site is a React page — there is no source document to convert —
 * so each route gets a short, hand-maintained Markdown summary here.
 *
 * `title` and `description` mirror the `pageMetadata()` call on the
 * corresponding page. `scripts/../agent-readiness.test.mjs` asserts that this
 * index covers every public route in the sitemap, so a new page cannot ship
 * without an agent-readable representation.
 */

export type AgentPage = {
  path: string
  title: string
  description: string
  /** What an agent can actually accomplish at this URL. */
  actions?: string[]
  /** Related routes worth following. */
  seeAlso?: string[]
}

export const AGENT_PAGES: AgentPage[] = [
  {
    path: "/",
    title: "Pure Grain Exports — B2B Leather Wholesale",
    description:
      "B2B leather exporter in Lahore, Pakistan. Full-grain and top-grain hides sold by the square foot, plus wholesale finished leather goods, supplied to manufacturers and brands in 40+ countries since 1999.",
    actions: [
      "Identify whether you need bulk hides (sold per square foot) or finished goods (sold per piece)",
      "Follow through to the catalogue, sample request or quote request",
    ],
    seeAlso: ["/catalog/raw-leather", "/catalog/finished-products", "/sample-request"],
  },
  {
    path: "/catalog",
    title: "Wholesale Leather Catalogue",
    description:
      "The full catalogue: full-grain and top-grain leather hides sold by the square foot, plus wholesale finished leather goods.",
    seeAlso: ["/catalog/raw-leather", "/catalog/finished-products"],
  },
  {
    path: "/catalog/raw-leather",
    title: "Leather Hides — Bulk Wholesale",
    description:
      "Full-grain, top-grain, suede and nubuck leather hides supplied in bulk by the square foot. Cow, buffalo, goat and sheep, custom thickness and finish, graded per batch.",
    actions: [
      "Browse hides by leather type, animal, finish and thickness",
      "Each hide detail page carries Product structured data with its own specification",
    ],
    seeAlso: ["/sample-request", "/quality"],
  },
  {
    path: "/catalog/finished-products",
    title: "Wholesale Finished Leather Goods",
    description:
      "Ready-made leather goods produced to wholesale order — wallets, belts, bags, jackets and motorcycle apparel. White-label ready, made to specification with export documentation.",
    actions: [
      "Browse by product type; each listing carries its own unit price and minimum order quantity",
    ],
    seeAlso: ["/custom-manufacturing", "/quote-request"],
  },
  {
    path: "/about",
    title: "About Us — Leather Exporter in Lahore",
    description:
      "Lahore-headquartered leather exporter sourcing through Pakistan's Sialkot, Kasur and Karachi clusters. Vetted partner tanneries, documented grading, and wholesale supply to 40+ countries.",
    seeAlso: ["/quality", "/contact"],
  },
  {
    path: "/quality",
    title: "Leather Quality Standards & QC Process",
    description:
      "ISO 9001, ISO 14001, LWG and REACH certified. Six-stage quality control with in-house lab testing of every batch — thickness, tensile strength, colour fastness and chemical compliance.",
    actions: ["Verify certifications and testing scope before qualifying us as a supplier"],
    seeAlso: ["/blogs/how-to-verify-leather-supplier", "/about"],
  },
  {
    path: "/industries",
    title: "Industries We Supply",
    description:
      "Leather supplied to footwear, furniture, automotive, fashion and accessories manufacturers worldwide, matched to each sector's performance requirements.",
    seeAlso: ["/catalog/raw-leather"],
  },
  {
    path: "/custom-manufacturing",
    title: "Custom Leather Manufacturing",
    description:
      "Custom leather manufacturing to specification — bespoke finishes, colour matching, thickness and private-label production, with samples before you commit.",
    actions: ["Submit a tech pack or reference product for a bespoke production quote"],
    seeAlso: ["/quote-request", "/blogs/private-label-leather-goods-manufacturer-pakistan"],
  },
  {
    path: "/sample-request",
    title: "Request Free Leather Samples",
    description:
      "Request physical leather samples. Samples are complimentary for verified trade buyers — you pay international shipping only.",
    actions: [
      "Primary conversion route for evaluating material before ordering",
      "Form fields: company, contact, destination country, hides of interest",
    ],
    seeAlso: ["/catalog/raw-leather"],
  },
  {
    path: "/quote-request",
    title: "Request a Wholesale Leather Quote",
    description:
      "Send your leather specification, volume and destination market for a quoted price. Pricing is based on grade, quantity and logistics.",
    actions: ["Primary conversion route for pricing a specific order"],
    seeAlso: ["/payments-and-trade-terms"],
  },
  {
    path: "/contact",
    title: "Contact Our Leather Export Team",
    description:
      "Speak to Pure Grain Exports in Lahore about leather hides, finished goods, samples and wholesale pricing. Enquiries answered within one business day.",
    seeAlso: ["/sample-request", "/quote-request"],
  },
  {
    path: "/blogs",
    title: "Leather Sourcing Guides & Insights",
    description:
      "Sourcing guidance, grading explainers and leather industry analysis written for manufacturers and wholesale buyers.",
    actions: ["Index of long-form guides; each article is available as Markdown"],
  },
  {
    path: "/payments-and-trade-terms",
    title: "Payments & Trade Terms",
    description:
      "Payment methods, deposit and balance structure, incoterms and currency for wholesale leather orders.",
  },
  {
    path: "/return-policy",
    title: "Return & Dispute Policy",
    description:
      "How quality claims, refunds and resolutions work for sample hides and wholesale leather orders — including what counts as a natural leather characteristic rather than a defect.",
  },
  {
    path: "/terms",
    title: "Terms & Conditions",
    description:
      "The contractual framework governing Pure Grain Exports' B2B leather hide supply, custom finishing and private-label manufacturing — payment, grading and liability.",
  },
  {
    path: "/privacy",
    title: "Privacy Policy",
    description:
      "How Pure Grain Exports collects, uses and protects the information you share when you enquire, request samples or place a wholesale order.",
  },
]

/**
 * Industry landing pages are generated from the same registry that drives the
 * hub links, the sitemap and the page routes — so an agent-readable entry
 * cannot go missing when a new industry page ships.
 */
const INDUSTRY_AGENT_PAGES: AgentPage[] = INDUSTRY_PAGE_LIST.map((i) => ({
  path: i.path,
  title: i.h1,
  description: i.seoDescription,
  actions: [
    `Specification detail for ${i.shortLabel.toLowerCase()} buyers: substances, leather types and grading`,
    i.oemProductTypes.length
      ? "Also covers private-label manufacturing of the finished product"
      : "Material supply only — we do not manufacture the finished product for this industry",
  ],
  seeAlso: ["/industries", i.catalogueHref.split("?")[0], "/sample-request", "/quote-request"],
}))

const BY_PATH = new Map(
  [...AGENT_PAGES, ...INDUSTRY_AGENT_PAGES].map((p) => [p.path, p])
)

export function findAgentPage(pathname: string): AgentPage | undefined {
  // Trailing slashes are equivalent for lookup; "/" is the one real exception.
  const normalised = pathname !== "/" ? pathname.replace(/\/+$/, "") : "/"
  return BY_PATH.get(normalised)
}

/** Renders one indexed route as a standalone Markdown document. */
export function renderAgentPageMarkdown(page: AgentPage): string {
  const lines: string[] = [`# ${page.title}`, "", page.description]

  if (page.actions?.length) {
    lines.push("", "## What you can do here", "")
    lines.push(...page.actions.map((a) => `- ${a}`))
  }

  if (page.seeAlso?.length) {
    lines.push("", "## See also", "")
    lines.push(
      ...page.seeAlso.map((p) => {
        const target = findAgentPage(p)
        const label = target ? target.title : p
        return `- [${label}](${SITE_URL}${p})`
      })
    )
  }

  lines.push(
    "",
    "---",
    "",
    `Canonical URL: ${SITE_URL}${page.path === "/" ? "/" : page.path}`,
    `Site index: ${SITE_URL}/llms.txt · Full URL list: ${SITE_URL}/sitemap.xml`
  )

  return lines.join("\n")
}
