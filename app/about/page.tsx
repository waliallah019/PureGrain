// app/about/page.tsx
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import AboutContent from "./AboutContent"

/*
 * This page used to read `app/about/policy-body.html` off disk with fs.readFileSync
 * and inject it via dangerouslySetInnerHTML, styled by the return-policy stylesheet
 * plus a local overrides.css. That meant the About page shared none of the site's
 * design system, and it pulled Cormorant Garamond, Jost AND Font Awesome from CDNs
 * in <head> — re-downloading the two brand faces that app/layout.tsx already
 * self-hosts via next/font.
 *
 * The content now lives in AboutContent.tsx as real components using the same
 * primitives as the landing page. policy-body.html / PolicyContent.tsx /
 * PageEffects.tsx / overrides.css are no longer referenced.
 */

export const metadata = {
  title: "About Us | Pure Grain Exports",
  description:
    "Pure Grain Exports is a Lahore-headquartered premium leather exporter, sourcing through Pakistan's Sialkot, Kasur and Karachi leather clusters and serving wholesale buyers across Europe, North America, Asia and the Middle East.",
  robots: "index, follow",
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <AboutContent />
      </main>
      <Footer />
    </div>
  )
}
