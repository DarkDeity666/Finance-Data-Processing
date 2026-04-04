"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { api } from "@/lib/api"

export interface User {
  id: string
  name: string
  email: string
  role: "ADMIN" | "ANALYST" | "VIEWER"
  status: "ACTIVE" | "INACTIVE"
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  token: string | null
  login: (token: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUser = async (t: string): Promise<User> => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${t}` },
    })
    if (!res.ok) throw new Error("Unauthorized")
    return res.json()
  }

  useEffect(() => {
    const stored = localStorage.getItem("token")
    if (!stored) {
      setLoading(false)
      return
    }
    setToken(stored)
    fetchUser(stored)
      .then((u) => setUser(u))
      .catch(() => {
        localStorage.removeItem("token")
        setToken(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const login = async (t: string) => {
    localStorage.setItem("token", t)
    setToken(t)
    const u = await fetchUser(t)
    setUser(u)
  }

  const logout = () => {
    localStorage.removeItem("token")
    setToken(null)
    setUser(null)
  }

  const refreshUser = async () => {
    const t = localStorage.getItem("token")
    if (!t) return
    const u = await fetchUser(t)
    setUser(u)
  }

  return (
    <AuthContext.Provider value={{ user, loading, token, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
