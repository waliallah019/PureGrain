import type { ReactNode } from "react"
import type { Metadata } from "next"
import { pageMetadata } from "@/lib/seo"

/*
 * `/catalog/finished-products` renders as a client component, and a client component cannot export
 * `metadata` in the App Router — which is why this route previously inherited the
 * root layout's title and description (flagged as a duplicate-title issue in the
 * SEO audit). This passthrough layout supplies the metadata instead.
 */
export const metadata: Metadata = pageMetadata({
  title: "Wholesale Finished Leather Goods",
  description:
    "Ready-made leather goods produced to wholesale order — bags, jackets, belts and accessories. White-label ready, made to your specification with export documentation.",
  path: "/catalog/finished-products",
  keywords: [
    "wholesale leather goods",
    "finished leather products supplier",
    "private label leather manufacturer",
  ],
})

export default function Layout({ children }: { children: ReactNode }) {
  /*
   * No BreadcrumbList here: this layout also wraps the product detail route,
   * which emits its own deeper trail. Two BreadcrumbLists on one URL is a
   * conflicting signal, so the listing page emits its own instead.
   */
  return <>{children}</>
}
