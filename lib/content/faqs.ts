/**
 * FAQ copy shared between the rendered accordions and the FAQPage JSON-LD.
 *
 * These arrays previously lived inside the two `"use client"` page components.
 * A server component cannot import from a client module's internals to build
 * structured data, and duplicating the copy would guarantee the visible answers
 * and the marked-up answers drift apart — which Google treats as a violation
 * (FAQPage content must match what the user actually sees).
 *
 * Single source of truth: both the accordion and the schema read from here.
 */

export type Faq = { q: string; a: string }

export const ABOUT_FAQS: readonly Faq[] = [
  {
    q: "What is your minimum order quantity (MOQ)?",
    a: "Minimums are set per catalogue line and shown on each listing rather than as one site-wide figure. Finished-goods minimums start at a few pieces on entry lines such as belts and wallets and rise for bags and outerwear; hides are quoted per square foot against your specification. Sample orders have no minimum.",
  },
  {
    q: "How do I request a sample?",
    a: "Use the sample request page. We charge only for international shipping — the leather sample itself is complimentary for verified trade buyers.",
  },
  {
    q: "What leather types do you supply?",
    a: "We supply full-grain, top-grain, and suede finishes across cow, buffalo, and goat hides. Custom thickness, tanning method, and finish specifications are available for wholesale orders.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept bank transfer (SWIFT/TT) and irrevocable Letter of Credit (LC) for large wholesale purchases. Sample payments can be settled separately.",
  },
  {
    q: "What is your typical lead time?",
    a: "Sample dispatch is within 3–5 business days. Wholesale orders typically require 3–6 weeks from order confirmation depending on quantity, grade, and current production schedule.",
  },
  {
    q: "Do you provide export documentation?",
    a: "Yes. We provide a full export documentation package including commercial invoice, packing list, certificate of origin, and any certificates required by your country's import regulations.",
  },
] as const

export const QUALITY_FAQS: readonly Faq[] = [
  {
    q: "How do I know the bulk shipment will match the sample I approved?",
    a: "Every bulk batch is colour-matched and hand-feel-matched against your retained master swatch before it is released. Lab data and photographs are kept on file per batch and provided with the shipment documentation.",
  },
  {
    q: "Is your leather REACH compliant for the European market?",
    a: "Yes. All chemistry used in our partner tanneries is REACH-compliant, with documented restrictions on AZO dyes, chromium VI, and other regulated substances. Lab certificates are available per batch on request.",
  },
  {
    q: "What grading system do you use, and is it conservative?",
    a: "We use a documented A / B / C grading system based on grain quality, scar density, and usable area. We grade conservatively — the leather you receive is at or above the grade declared on your documentation.",
  },
  {
    q: "What happens if a batch fails your internal QC?",
    a: "The batch does not advance. It is either reworked at the tannery, regraded into a lower category, or rejected entirely. We never substitute leather without your written approval.",
  },
  {
    q: "Can I commission a third-party inspection (SGS / Bureau Veritas) before shipment?",
    a: "Absolutely. We welcome third-party pre-shipment inspections at your cost and will coordinate access, sampling, and documentation directly with the inspection agency.",
  },
  {
    q: "What does “full-grain” and “top-grain” really mean in your terminology?",
    a: "Full-grain leather retains the entire natural grain surface — nothing sanded away. Top-grain has had a very fine top layer corrected for uniformity but the grain pattern itself is preserved. We never market split, bonded, or heavily corrected leather as either.",
  },
] as const

/**
 * Homepage FAQ.
 *
 * The homepage is the entity anchor for the whole site — it is the URL an AI
 * system resolves "Pure Grain Exports" to — yet it carried no question-based
 * heading, no self-contained definition of the company, and no FAQPage schema,
 * while /about and /quality had all three. These questions are deliberately the
 * entity-resolution ones ("who is this", "what do they sell", "where are they",
 * "how do I start") rather than a second copy of the About page's operational
 * detail, which stays where it is.
 *
 * Every figure here is stated elsewhere on the site. Country count is
 * deliberately omitted: the homepage trust strip says 40+ while the catalogue
 * and industries pages say 30+, and repeating either would harden a
 * contradiction rather than resolve it.
 */
export const HOME_FAQS: readonly Faq[] = [
  {
    q: "What is Pure Grain Exports?",
    a: "Pure Grain Exports is a B2B leather supplier and exporter based in Lahore, Pakistan, operating continuously since 1999. We sell to manufacturers, brands and distributors — not to consumers. The business has two halves: bulk leather hides sold by the square foot to factories running their own production, and finished leather goods produced under a client's own label.",
  },
  {
    q: "What does Pure Grain Exports supply?",
    a: "Two things. First, raw and finished leather hides — cow, buffalo, goat and sheep — in full-grain, top-grain, suede, nubuck, pebble and vegetable-tanned finishes, quoted per square foot against your thickness, temper and colour specification. Second, finished leather goods manufactured to your design: jackets, motorcycle apparel, bags, backpacks, wallets, belts and small leather goods, with in-house embossing, custom edge paint and retail-ready packaging.",
  },
  {
    q: "Does Pure Grain Exports sell to the public?",
    a: "No. This is a wholesale export business and every order is a trade order. Hides are quoted per square foot and finished goods carry per-line minimums, so the smallest realistic order is still a business purchase rather than a single item. Sample orders are the exception and are open to any verified trade buyer.",
  },
  {
    q: "Which industries does Pure Grain Exports supply?",
    a: "Footwear, gloves, motorcycle and powersports apparel, furniture and upholstery, automotive and marine trim, bags and luggage, belts and small leather goods, garments and apparel, and corporate gifting. Each of those has its own page setting out the substances, grades and minimums that apply to it, because a glove maker and a furniture maker need materially different leather.",
  },
  {
    q: "How do I get a sample before ordering?",
    a: "Request one through the sample request page. The leather sample itself is free for verified trade buyers — you pay only international shipping — and samples carry no minimum. Sample dispatch is typically within 3 to 5 business days.",
  },
  {
    q: "Where is Pure Grain Exports based, and do you handle export paperwork?",
    a: "We are based in Lahore, Punjab, Pakistan, and ship worldwide. Every shipment includes a full export documentation package: commercial invoice, packing list, certificate of origin, and any certificates your country's import regulations require. Quality management is ISO 9001 certified and tannery chemistry is REACH-compliant, with lab certificates available per batch on request.",
  },
] as const

/**
 * Private-label / OEM FAQ for /custom-manufacturing.
 *
 * The SXO analysis found this cluster ("private label leather goods
 * manufacturer", "leather OEM manufacturer") to be the site's weakest keyword
 * fit, and the persona scoring put the private-label founder lowest of five at
 * 45/100 — chiefly because MOQ, the OEM/ODM distinction and the sample process
 * were nowhere on the page. These answer exactly those objections.
 */
export const PRIVATE_LABEL_FAQS: readonly Faq[] = [
  {
    q: "What is the difference between OEM and ODM here?",
    a: "OEM means you bring the design — a tech pack, patterns, or a physical sample — and we build precisely to it. ODM means you start from one of our existing products and we adapt it for you: your leather, your hardware, your branding, your changes to the block. OEM gives you a product nobody else has and takes about three to four weeks to first sample. ODM reaches a sample in ten to fourteen days because the pattern already exists.",
  },
  {
    q: "What is your minimum order quantity for private-label production?",
    a: "It is set per product line, not as one figure for the business, and every line's current minimum is listed in the table above straight from our catalogue. Small leather goods such as wallets and belts carry the lowest minimums we offer; bags and outerwear are higher because the cutting and assembly are longer. Below-minimum trial orders are sometimes possible at a higher unit price — ask rather than assume.",
  },
  {
    q: "Do I need a full tech pack to get started?",
    a: "No. A tech pack makes quoting faster and more accurate, but it is not a prerequisite. Annotated photographs, a sketch with dimensions, or a physical sample we can take apart are all workable starting points. If you have none of those, describe the product and the price point and we will propose a specification for you to react to.",
  },
  {
    q: "How long does the whole process take, from enquiry to delivered goods?",
    a: "Typically eight to fourteen weeks. Quoting takes two to five business days on a complete brief. First sample is ten to fourteen days for ODM and three to four weeks for OEM. Allow a round of revisions on the sample. Bulk production then runs three to six weeks depending on quantity and how many styles and colours are in the order, before shipping time.",
  },
  {
    q: "Do you produce samples before I commit to a bulk order?",
    a: "Always, and we would not accept a bulk order without one. You approve a physical pre-production sample before anything is cut in volume. Sample charges are quoted per product and are commonly credited against the first bulk order — confirm this in writing at quote stage, since it depends on the tooling involved.",
  },
  {
    q: "Whose brand appears on the product and the packaging?",
    a: "Yours, throughout. Embossing and debossing, foil and pigment fill, custom edge paint, woven and printed labels, hangtags, care cards, polybags and retail-ready boxing are all done in house. Nothing carries our name unless you ask for it. Dies are a one-off cost on the first order and are then stored and reused free on repeats.",
  },
  {
    q: "Can you match a product I am currently buying from another supplier?",
    a: "Usually yes. Send the physical product rather than photographs — we can measure the panels, identify the leather substance and finish, and match the hardware. We will tell you honestly where we can match it, where we would deviate, and where we think the original specification could be improved for the same money.",
  },
] as const
