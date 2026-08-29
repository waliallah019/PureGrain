import type { ReactNode } from "react"
import type { Metadata } from "next"
import { pageMetadata } from "@/lib/seo"
import { JsonLd, jsonLdGraph, breadcrumbSchema } from "@/lib/schema"

/*
 * `/custom-manufacturing` renders as a client component, and a client component cannot export
 * `metadata` in the App Router — which is why this route previously inherited the
 * root layout's title and description (flagged as a duplicate-title issue in the
 * SEO audit). This passthrough layout supplies the metadata instead.
 */
export const metadata: Metadata = pageMetadata({
  /*
   * Titled for the cluster it actually competes in. "Custom Leather
   * Manufacturing" carried neither of the two head terms buyers search — the
   * SXO analysis grouped "private label leather goods manufacturer" and
   * "leather OEM manufacturer" as the site's largest keyword gap, and this is
   * the page that serves them. Kept short deliberately: the root layout appends
   * " | Pure Grain Exports" (21 characters) to every title.
   */
  title: "Private Label & OEM Leather Manufacturer",
  description:
    "Private-label and OEM leather goods manufacturing from Pakistan. Per-line minimums, OEM and ODM routes, samples before bulk, and your brand on every piece.",
  path: "/custom-manufacturing",
  keywords: [
    "private label leather goods manufacturer",
    "leather OEM manufacturer",
    "custom leather manufacturing",
    "private label leather production",
  ],
})

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      {/* Emitted here rather than in page.tsx because the page is a client
          component. BreadcrumbList gives Google the site hierarchy and drives
          the breadcrumb trail shown in place of the raw URL in results. */}
      <JsonLd data={jsonLdGraph(breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Custom Manufacturing", path: "/custom-manufacturing" }]))} />
      {children}
    </>
  )
}
