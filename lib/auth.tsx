"use client"

import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from "react"

interface User {
  email: string
  role: string
}

interface StoredSession extends User {
  expiresAt: number
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const STORAGE_KEY = "admin-user"
// Admin sessions expire 24h after login rather than persisting in
// localStorage indefinitely. Re-checked periodically so a tab left open
// past expiry is logged out without needing a reload.
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000
const SESSION_CHECK_INTERVAL_MS = 60 * 1000

function readStoredSession(): User | null {
  let raw: string | null
  try {
    raw = localStorage.getItem(STORAGE_KEY)
  } catch {
    // localStorage unavailable (privacy mode, etc.) — treat as logged out.
    return null
  }
  if (!raw) return null

  let parsed: StoredSession
  try {
    parsed = JSON.parse(raw)
  } catch {
    // Corrupted entry — clear it so we don't keep re-parsing garbage forever.
    localStorage.removeItem(STORAGE_KEY)
    return null
  }

  if (!parsed?.expiresAt || Date.now() > parsed.expiresAt) {
    localStorage.removeItem(STORAGE_KEY)
    return null
  }

  return { email: parsed.email, role: parsed.role }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const userRef = useRef<User | null>(null)
  userRef.current = user

  useEffect(() => {
    setUser(readStoredSession())
    setIsLoading(false)

    // Periodically re-validate so an expired session in an already-open tab
    // gets cleared instead of lingering until the next reload/navigation.
    const interval = setInterval(() => {
      if (userRef.current && !readStoredSession()) {
        setUser(null)
      }
    }, SESSION_CHECK_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // For demo purposes, hardcode the credentials
      if (email === "ahamz48" && password === "JaguarX8") {
        const user = { email, role: "admin" }
        setUser(user)
        const session: StoredSession = { ...user, expiresAt: Date.now() + SESSION_DURATION_MS }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
        return true
      }
      return false
    } catch (error) {
      console.error("Login error:", error)
      return false
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
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
