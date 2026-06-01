import { ReactNode } from "react"
import { AuthProvider } from "@/lib/auth"

export default function AdminLoginLayout({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}
