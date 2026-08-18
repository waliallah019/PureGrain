// app/quality/page.tsx
import type { Metadata } from "next"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { pageMetadata } from "@/lib/seo"
import { JsonLd, jsonLdGraph, breadcrumbSchema, faqPageSchema } from "@/lib/schema"
import { QUALITY_FAQS } from "@/lib/content/faqs"
import QualityContent from "./QualityContent"

/*
 * This page used to read `app/quality/policy-body.html` (480 lines) off disk and
 * inject it via dangerouslySetInnerHTML, styled by the return-policy stylesheet
 * plus 895 lines of local overrides.css. It also pulled Cormorant Garamond, Jost
 * and Font Awesome from CDNs in <head> — re-downloading the two brand faces that
 * app/layout.tsx already self-hosts via next/font, and loading an entire icon
 * font for a handful of decorative glyphs.
 *
 * That stack is why the page drifted: its own colour variables never mapped to
 * the theme tokens, so section grounds, card surfaces and dark mode all diverged
 * from the rest of the site.
 *
 * Content now lives in QualityContent.tsx on the shared design system.
 * policy-body.html / PolicyContent.tsx / PageEffects.tsx / overrides.css are no
 * longer referenced.
 */

export const metadata: Metadata = pageMetadata({
  title: "Leather Quality Standards & QC Process",
  description:
    "ISO 9001, ISO 14001, LWG and REACH certified. Six-stage quality control with in-house lab testing of every batch — thickness, tensile strength, colour fastness and chemical compliance.",
  path: "/quality",
  image: "/local/hide-inspection.jpg",
  imageAlt: "Tannery interior with processing drums and hides in production",
  keywords: [
    "leather quality control",
    "LWG certified leather supplier",
    "REACH compliant leather",
    "ISO 9001 leather manufacturer",
  ],
})

export default function QualityPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* FAQPage is built from the SAME array the accordion renders
          (lib/content/faqs.ts). Google requires marked-up Q&A to match the
          visible page; sharing the source makes drift impossible. */}
      <JsonLd
        data={jsonLdGraph(
          faqPageSchema(QUALITY_FAQS),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Quality & Process", path: "/quality" },
          ])
        )}
      />
      <Header />
      <main>
        <QualityContent />
      </main>
      <Footer />
    </div>
  )
}
