import type { ReactNode } from "react"
import type { Metadata } from "next"
import { pageMetadata } from "@/lib/seo"

/*
 * `/custom-manufacturing` renders as a client component, and a client component cannot export
 * `metadata` in the App Router — which is why this route previously inherited the
 * root layout's title and description (flagged as a duplicate-title issue in the
 * SEO audit). This passthrough layout supplies the metadata instead.
 */
export const metadata: Metadata = pageMetadata({
  title: "Custom Leather Manufacturing",
  description:
    "Custom leather manufacturing to your specification — bespoke finishes, colour matching, thickness and private-label production, with samples before you commit to volume.",
  path: "/custom-manufacturing",
  keywords: [
    "custom leather manufacturing",
    "private label leather production",
    "bespoke leather finishes",
  ],
})

export default function Layout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
