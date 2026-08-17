import type { ReactNode } from "react"
import type { Metadata } from "next"
import { pageMetadata } from "@/lib/seo"

/*
 * `/privacy` renders as a client component, and a client component cannot export
 * `metadata` in the App Router — which is why this route previously inherited the
 * root layout's title and description (flagged as a duplicate-title issue in the
 * SEO audit). This passthrough layout supplies the metadata instead.
 */
export const metadata: Metadata = pageMetadata({
  title: "Privacy Policy",
  description:
    "How Pure Grain Exports collects, uses and protects the information you share when you enquire, request samples or place a wholesale order.",
  path: "/privacy",
})

export default function Layout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
