import type { ReactNode } from "react"
import type { Metadata } from "next"
import { pageMetadata } from "@/lib/seo"

/* Mid-funnel step — noindex. */
export const metadata: Metadata = pageMetadata({
  title: "Review Sample Request",
  description:
    "Review your selected leather hides before submitting your sample request.",
  path: "/sample-request/review",
  index: false,
})

export default function Layout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
