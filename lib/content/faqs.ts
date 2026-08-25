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
