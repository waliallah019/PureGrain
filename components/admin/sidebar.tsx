"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth"
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Blocks,
  Bell,
  BarChart,
  FileText,
  Newspaper,
  Box,
  MessageSquare,
  Settings,
  LogOut,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { useRouter } from "next/navigation"

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function AdminSidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push("/admin-login")
  }

  const links = [
    { name: "Dashboard", href: "/admin-ahmza", icon: LayoutDashboard },
    { name: "Products", href: "/admin-ahmza/products", icon: Package },
    { name: "Raw-Leather", href: "/admin-ahmza/raw-leather", icon: Blocks },
    { name: "Custom Requests", href: "/admin-ahmza/custom-manufacturing", icon: Users },
    { name: "Reports", href: "/admin-ahmza/reports", icon: BarChart },
    { name: "Quotes", href: "/admin-ahmza/quotes", icon: FileText },
    { name: "Blogs", href: "/admin-ahmza/blogs", icon: Newspaper },
    { name: "Sample Requests", href: "/admin-ahmza/samples", icon: Box },
    { name: "Messages", href: "/admin-ahmza/messages", icon: MessageSquare },
    { name: "Settings", href: "/admin-ahmza/settings", icon: Settings },
  ]

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} />}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform border-r bg-white transition-transform duration-200 ease-in-out dark:bg-gray-950 dark:border-gray-800",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
    <div className="h-16 flex items-center justify-center border-b dark:border-gray-800 px-4">

  <Link
    href="/admin-ahmza"
    className="flex items-center justify-center w-full"
  >
    <Image
      src="/logo.png"
      alt="Pure Grain"
      width={40}
      height={40}
      className="dark:hidden object-contain"
    />
    <Image
      src="/logo-dark.png"
      alt="Pure Grain Dark"
      width={40}
      height={40}
      className="hidden dark:block object-contain"
    />
  </Link>
</div>

        <div className="flex flex-col gap-1 p-4">
          {links.map((link) => {
            const Icon = link.icon
            const isActive = pathname === link.href

            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => {
                  if (window.innerWidth < 1024) {
                    onClose()
                  }
                }}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-brown-50 text-brown-900 dark:bg-brown-900/20 dark:text-brown-50"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800",
                )}
              >
                <Icon className="h-4 w-4" />
                {link.name}
              </Link>
            )
          })}
        </div>

        <div className="mt-auto p-4 border-t dark:border-gray-800">
       <Button
  variant="outline"
  className="w-full justify-start gap-3 hover:bg-red-600 hover:text-white dark:hover:bg-red-600 dark:hover:text-white transition-colors"
  onClick={handleLogout}
>

  <LogOut className="h-4 w-4" />
  Logout
</Button>


        </div>
      </aside>
    </>
  )
}
