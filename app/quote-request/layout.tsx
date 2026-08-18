import type { ReactNode } from "react"
import type { Metadata } from "next"
import { pageMetadata } from "@/lib/seo"
import { JsonLd, jsonLdGraph, breadcrumbSchema } from "@/lib/schema"

/* This route had no metadata of its own and inherited the root layout's. */
export const metadata: Metadata = pageMetadata({
  title: "Request a Wholesale Leather Quote",
  description:
    "Send your leather specification, volume and destination market for a quoted price. Transparent pricing based on grade, quantity and logistics.",
  path: "/quote-request",
  index: true,
})

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      {/* Emitted here rather than in page.tsx because the page is a client
          component. BreadcrumbList gives Google the site hierarchy and drives
          the breadcrumb trail shown in place of the raw URL in results. */}
      <JsonLd data={jsonLdGraph(breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Request a Quote", path: "/quote-request" }]))} />
      {children}
    </>
  )
}
