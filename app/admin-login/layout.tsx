import { ReactNode } from "react"
import { AuthProvider } from "@/lib/auth"

import type { Metadata } from "next"

/*
 * Admin surfaces are noindex. This is the correct control for keeping them out
 * of search results — app/robots.ts deliberately no longer lists these paths,
 * because a public robots.txt that names your admin URL simply advertises it
 * (flagged as a critical security finding in the SEO audit).
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
}


export default function AdminLoginLayout({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}
