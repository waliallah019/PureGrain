import type { ReactNode } from "react"
import type { Metadata } from "next"
import { pageMetadata } from "@/lib/seo"

/*
 * `/industries` renders as a client component, and a client component cannot export
 * `metadata` in the App Router — which is why this route previously inherited the
 * root layout's title and description (flagged as a duplicate-title issue in the
 * SEO audit). This passthrough layout supplies the metadata instead.
 */
export const metadata: Metadata = pageMetadata({
  title: "Industries We Supply",
  description:
    "Pure Grain Exports supplies leather to footwear, furniture, automotive, fashion and accessories manufacturers worldwide, matched to each sector's performance requirements.",
  path: "/industries",
  keywords: [
    "leather for footwear manufacturers",
    "upholstery leather supplier",
    "automotive leather supplier",
  ],
})

export default function Layout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
