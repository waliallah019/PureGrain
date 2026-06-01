"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AuthProvider, useAuth } from "@/lib/auth"
import { AdminHeader } from "@/components/admin/header"
import { Toaster } from 'react-hot-toast';
import { AdminSidebar } from "@/components/admin/sidebar"

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace("/admin-login") // redirect silently
      } else {
        setChecked(true) // allow render
      }
    }
  }, [user, isLoading, router])

  // Block rendering until we know if user is valid
  if (!checked) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-700 dark:text-gray-200 text-sm">Checking authentication...</p>
      </div>
    )
  }

  return <>{children}</>
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <AuthProvider>
      <AdminGuard>
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
          <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <div className="flex flex-1 flex-col lg:pl-64">
            <AdminHeader onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
            <main className="flex-1">
              {children}
              <Toaster />
            </main>
          </div>
        </div>
      </AdminGuard>
    </AuthProvider>
  )
}
