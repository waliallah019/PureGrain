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
 * Homepage FAQ — 10 buyer-intent questions.
 *
 * These come directly from the Aug 2026 SEO/AEO strategy (Part 3) and are the
 * "People Also Ask" style questions Google and generative-AI engines are
 * demonstrably rewarding for wholesale-leather sourcing intent. Every answer is
 * verifiable, uses concrete numbers where they exist, and stays inside what the
 * business can defend under buyer scrutiny.
 *
 * IMPORTANT: This array is the single source of truth for both the visible FAQ
 * accordion on the homepage and the FAQPage JSON-LD emitted in <head>. Editing
 * the visible copy also updates the schema — that guarantee is what keeps the
 * FAQPage markup valid under Google's "content must match" rule.
 */
export const HOME_FAQS: readonly Faq[] = [
  {
    q: "What does Pure Grain Exports supply?",
    a: "Two categories. First, wholesale leather hides — cowhide, buffalo, and goat — sourced from tanneries in Kasur, Sialkot, and Lahore. Sold per square foot in your specified thickness, finish, and color. Second, OEM private-label leather goods — wallets, belts, bags, jackets, backpacks — manufactured under your brand and shipped with your labeling.",
  },
  {
    q: "What is the minimum order quantity for wholesale leather hides?",
    a: "Our starting MOQ for wholesale hides is typically 100 sq ft per specification. This allows small brands and pilot production runs while ensuring the batch is large enough to maintain grain and color consistency. Higher volume orders (500+ sq ft) receive tiered pricing.",
  },
  {
    q: "How do I get leather hide samples before ordering?",
    a: "Request samples through our sample request page. For verified trade buyers, the leather itself is free — you pay only international shipping (typically $80-$120 to USA/UK/UAE via DHL Express). Samples ship within 3-5 business days of order confirmation.",
  },
  {
    q: "Do you ship leather hides to the USA?",
    a: "Yes. We offer both FOB Karachi (you handle US customs) and DDP delivery to your US address (we handle freight, US customs clearance, duties, and final delivery). DDP quotations are itemized so you see every cost component before committing.",
  },
  {
    q: "What payment terms do you offer for wholesale leather orders?",
    a: "For wholesale orders, we accept Irrevocable Letter of Credit (LC) — bank-guaranteed protection for both parties, standard for first-time international B2B leather trade. For established buyers, TT (Telegraphic Transfer) with agreed deposit terms. PayPal is accepted for sample orders only.",
  },
  {
    q: "What leather grades and finishes do you supply?",
    a: "Full-grain cowhide (our standard for premium goods), top-grain, and vegetable-tanned options depending on end use. Finishes include aniline, semi-aniline, pigmented, pull-up, crazy horse, waxed, nappa, and embossed. Thicknesses from 0.6mm (goat nappa for wallets) to 4.0mm (buffalo hide for heritage belts).",
  },
  {
    q: "Where is Pure Grain Exports located and where do you ship from?",
    a: "Pure Grain Exports (SMC-Private) Limited is based in Lahore, Punjab, Pakistan. Leather hides and finished goods ship from Karachi seaport (FOB) or door-to-door via DHL/FedEx Express (DDP).",
  },
  {
    q: "Can Pure Grain Exports produce leather goods under my own brand?",
    a: "Yes. Our OEM/private-label service produces wallets, belts, bags, jackets, backpacks, and other leather goods to your designs and specifications, with your branding embossed or debossed, in your custom packaging. Full private-label from material selection through to retail-ready shipment.",
  },
  {
    q: "Can you handle custom finish and thickness requirements for leather hides?",
    a: "Yes. This is standard for our wholesale orders. You specify thickness (in mm), finish type, color, and any special treatment. We source to your specification and ship physical swatches for your approval before beginning bulk production.",
  },
  {
    q: "What documentation do you provide with leather hide shipments?",
    a: "Every shipment includes: commercial invoice, packing list, certificate of origin, and HTS classification appropriate for your destination country (typically HS Code 4104 for tanned hides, 4106 for split hides, 4107 for finished leather).",
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
