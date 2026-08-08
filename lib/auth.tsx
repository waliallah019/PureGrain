"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface User {
  email: string
  role: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// How often to re-check the server session so a tab left open past the cookie's
// expiry reflects the logout without needing a manual reload.
const SESSION_CHECK_INTERVAL_MS = 5 * 60 * 1000

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Hydrate auth state from the httpOnly session cookie via the server. The
  // cookie itself is not readable by JS (httpOnly), so /api/auth/me is the
  // source of truth — there is no client-side credential check anymore.
  useEffect(() => {
    let cancelled = false

    const refresh = async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" })
        if (cancelled) return
        if (res.ok) {
          const data = await res.json()
          setUser(data?.authenticated ? data.user : null)
        } else {
          setUser(null)
        }
      } catch {
        if (!cancelled) setUser(null)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    refresh()
    const interval = setInterval(refresh, SESSION_CHECK_INTERVAL_MS)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) return false
      const data = await res.json()
      if (data?.success && data.user) {
        setUser(data.user)
        return true
      }
      return false
    } catch (error) {
      console.error("Login error:", error)
      return false
    }
  }

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } catch {
      /* clear local state regardless */
    }
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, login, logout, isLoading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
