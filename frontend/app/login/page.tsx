"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { TrendingUp, Mail, Lock, Loader2 } from "lucide-react"
import { AuthProvider, useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"

function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const data = await api.login(email, password)
      await login(data.access_token)
      router.replace("/")
    } catch (err: any) {
      setError(err.message ?? "Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-[360px]">
        <div className="flex flex-col items-center mb-8">
          <div className="h-10 w-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-5">
            <TrendingUp className="h-5 w-5 text-zinc-300" />
          </div>
          <h1 className="text-lg font-semibold text-zinc-100">Sign in to FinancePro</h1>
          <p className="text-zinc-500 text-sm mt-1.5">Enter your credentials to continue</p>
        </div>

        <div className="bg-[#111] border border-zinc-800 rounded-lg p-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-3 py-2 rounded-md mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-500 focus:border-zinc-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 pointer-events-none" />
                <input
                  id="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-500 focus:border-zinc-500 transition-colors"
                />
              </div>
            </div>

            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="w-full mt-1 flex items-center justify-center gap-2 bg-zinc-100 hover:bg-white text-zinc-900 font-medium text-sm py-2 rounded-md transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
            </button>
          </form>
        </div>

        <div className="mt-5 px-1">
          <p className="text-xs text-zinc-600 mb-2 font-medium uppercase tracking-wide">Demo accounts</p>
          <div className="space-y-1.5">
            {[
              { email: "admin@example.com", role: "Admin" },
              { email: "analyst@example.com", role: "Analyst" },
              { email: "viewer@example.com", role: "Viewer" },
            ].map((a) => (
              <button
                key={a.email}
                type="button"
                onClick={() => {
                  setEmail(a.email)
                  setPassword("password123")
                }}
                className="w-full flex items-center justify-between px-3 py-2 bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800 rounded-md text-xs transition-colors group"
              >
                <span className="text-zinc-400 group-hover:text-zinc-300">{a.email}</span>
                <span className="text-zinc-600">{a.role}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <AuthProvider>
      <LoginForm />
    </AuthProvider>
  )
}
