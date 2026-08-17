import type { ReactNode } from "react"
import type { Metadata } from "next"
import { pageMetadata } from "@/lib/seo"

/*
 * `/contact` renders as a client component, and a client component cannot export
 * `metadata` in the App Router — which is why this route previously inherited the
 * root layout's title and description (flagged as a duplicate-title issue in the
 * SEO audit). This passthrough layout supplies the metadata instead.
 */
export const metadata: Metadata = pageMetadata({
  title: "Contact Our Leather Export Team",
  description:
    "Speak to Pure Grain Exports in Lahore about leather hides, finished goods, samples and wholesale pricing. Enquiries answered within one business day (PKT, UTC+5).",
  path: "/contact",
  keywords: [
    "contact leather supplier",
    "leather exporter Pakistan contact",
    "wholesale leather enquiry",
  ],
})

export default function Layout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
