import type { ReactNode } from "react"
import type { Metadata } from "next"
import { pageMetadata } from "@/lib/seo"

/* This route had no metadata of its own and inherited the root layout's. */
export const metadata: Metadata = pageMetadata({
  title: "Request a Wholesale Leather Quote",
  description:
    "Send your leather specification, volume and destination market for a quoted price. Transparent pricing based on grade, quantity and logistics.",
  path: "/quote-request",
  index: true,
})

export default function Layout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
