import type { ReactNode } from "react"
import type { Metadata } from "next"
import { pageMetadata } from "@/lib/seo"

/* Tokenised per-customer route — must never be indexed. */
export const metadata: Metadata = pageMetadata({
  title: "Payment Confirmation",
  description:
    "Confirm your Pure Grain Exports payment.",
  path: "/payment-confirmation",
  index: false,
})

export default function Layout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
