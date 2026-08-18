import type { ReactNode } from "react"
import type { Metadata } from "next"
import { pageMetadata } from "@/lib/seo"
import { JsonLd, jsonLdGraph, breadcrumbSchema } from "@/lib/schema"

/*
 * `/sample-request` renders as a client component, and a client component cannot export
 * `metadata` in the App Router — which is why this route previously inherited the
 * root layout's title and description (flagged as a duplicate-title issue in the
 * SEO audit). This passthrough layout supplies the metadata instead.
 */
export const metadata: Metadata = pageMetadata({
  title: "Request Free Leather Samples",
  description:
    "Request physical leather samples from Pure Grain Exports. Samples are complimentary for verified trade buyers — you pay international shipping only.",
  path: "/sample-request",
  keywords: [
    "free leather samples",
    "leather swatch request",
    "leather sample supplier",
  ],
})

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      {/* Emitted here rather than in page.tsx because the page is a client
          component. BreadcrumbList gives Google the site hierarchy and drives
          the breadcrumb trail shown in place of the raw URL in results. */}
      <JsonLd data={jsonLdGraph(breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Request Samples", path: "/sample-request" }]))} />
      {children}
    </>
  )
}
