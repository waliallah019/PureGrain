import type { ReactNode } from "react"
import type { Metadata } from "next"
import { pageMetadata } from "@/lib/seo"

/*
 * `/catalog` renders as a client component, and a client component cannot export
 * `metadata` in the App Router — which is why this route previously inherited the
 * root layout's title and description (flagged as a duplicate-title issue in the
 * SEO audit). This passthrough layout supplies the metadata instead.
 */
export const metadata: Metadata = {
  ...pageMetadata({
  title: "Wholesale Leather Catalogue",
  description:
    "Browse the full Pure Grain Exports catalogue: full-grain and top-grain leather hides sold by the square foot, plus wholesale finished leather goods. Samples available.",
  path: "/catalog",
  keywords: [
    "leather catalogue",
    "wholesale leather catalog",
    "buy leather hides online",
  ],
}),
  /* pageMetadata sets a plain string title, which consumes the root layout's
     `title.template`. Re-declaring the template here means nested catalog routes
     (raw-leather, finished-products, product detail pages) keep the
     "… | Pure Grain Exports" suffix instead of rendering bare titles. */
  title: {
    default: "Wholesale Leather Catalogue",
    template: "%s | Pure Grain Exports",
  },
}

export default function Layout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
