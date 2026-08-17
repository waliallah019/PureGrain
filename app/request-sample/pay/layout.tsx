import type { ReactNode } from "react"
import type { Metadata } from "next"
import { pageMetadata } from "@/lib/seo"

/* Transactional checkout step — noindex. Utility pages like this dilute
   crawl budget and can surface in SERPs ahead of the pages that should rank. */
export const metadata: Metadata = pageMetadata({
  title: "Sample Request Checkout",
  description:
    "Complete your Pure Grain Exports leather sample request.",
  path: "/request-sample/pay",
  index: false,
})

export default function Layout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
