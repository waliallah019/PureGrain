import type { ReactNode } from "react"
import type { Metadata } from "next"
import { pageMetadata } from "@/lib/seo"

/*
 * `/products` renders as a client component, and a client component cannot export
 * `metadata` in the App Router — which is why this route previously inherited the
 * root layout's title and description (flagged as a duplicate-title issue in the
 * SEO audit). This passthrough layout supplies the metadata instead.
 */
export const metadata: Metadata = pageMetadata({
  title: "Products",
  description:
    "Browse leather products supplied by Pure Grain Exports for international wholesale buyers.",
  path: "/products",
})

export default function Layout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
