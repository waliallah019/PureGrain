import type { ReactNode } from "react"
import type { Metadata } from "next"
import { pageMetadata } from "@/lib/seo"

/*
 * `/catalog/raw-leather` renders as a client component, and a client component cannot export
 * `metadata` in the App Router — which is why this route previously inherited the
 * root layout's title and description (flagged as a duplicate-title issue in the
 * SEO audit). This passthrough layout supplies the metadata instead.
 */
export const metadata: Metadata = pageMetadata({
  title: "Leather Hides — Bulk Wholesale",
  description:
    "Full-grain, top-grain, suede and nubuck leather hides supplied in bulk by the square foot. Cow, buffalo and goat, custom thickness and finish, graded and lab-tested.",
  path: "/catalog/raw-leather",
  keywords: [
    "leather hides wholesale",
    "bulk leather hides",
    "full grain leather supplier",
    "buy leather hides",
  ],
})

export default function Layout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
