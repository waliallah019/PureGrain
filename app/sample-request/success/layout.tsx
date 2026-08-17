import type { ReactNode } from "react"
import type { Metadata } from "next"
import { pageMetadata } from "@/lib/seo"

/* Post-submission confirmation — noindex. */
export const metadata: Metadata = pageMetadata({
  title: "Sample Request Received",
  description:
    "Your Pure Grain Exports sample request has been received.",
  path: "/sample-request/success",
  index: false,
})

export default function Layout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
