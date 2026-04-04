"use client"

import { useEffect, ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import {
  LayoutDashboard,
  FileText,
  Users,
  User,
  TrendingUp,
  LogOut,
  Loader2,
} from "lucide-react"
import { AuthProvider, useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"

function NavLink({
  href,
  icon: Icon,
  label,
  exact = false,
}: {
  href: string
  icon: React.ElementType
  label: string
  exact?: boolean
}) {
  const pathname = usePathname()
  const isActive = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors border",
        isActive
          ? "bg-zinc-800 text-zinc-100 border-zinc-700/50"
          : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 border-transparent"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{label}</span>
    </Link>
  )
}

function RoleBadgeInline({ role }: { role: string }) {
  const colorMap: Record<string, string> = {
    ADMIN: "text-violet-400",
    ANALYST: "text-blue-400",
    VIEWER: "text-zinc-400",
  }
  return <span className={cn("text-xs", colorMap[role] ?? "text-zinc-500")}>{role}</span>
}

function DashboardShell({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="fixed inset-0 bg-zinc-950 flex items-center justify-center">
        <Loader2 className="h-5 w-5 text-zinc-500 animate-spin" />
      </div>
    )
  }

  if (!user) return null

  const handleLogout = () => {
    logout()
    router.replace("/login")
  }

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const pageTitles: Record<string, string> = {
    "/": "Dashboard",
    "/records": "Financial Records",
    "/users": "User Management",
    "/profile": "Profile",
  }
  const matchedTitle =
    Object.entries(pageTitles)
      .sort((a, b) => b[0].length - a[0].length)
      .find(([p]) => pathname === p || pathname.startsWith(`${p}/`))?.[1] ?? "Dashboard"

  return (
    <div className="flex min-h-screen">
      <aside className="w-60 bg-[#111111] border-r border-zinc-800 flex-shrink-0 flex flex-col fixed top-0 left-0 h-full z-20">
        <div className="h-14 flex items-center gap-2.5 px-5 border-b border-zinc-800">
          <div className="h-6 w-6 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center">
            <TrendingUp className="h-3.5 w-3.5 text-zinc-300" />
          </div>
          <span className="text-sm font-semibold text-zinc-100 tracking-tight">FinancePro</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          <NavLink href="/" icon={LayoutDashboard} label="Dashboard" exact />
          <NavLink href="/records" icon={FileText} label="Records" />
          {user.role === "ADMIN" && <NavLink href="/users" icon={Users} label="Users" />}
          <NavLink href="/profile" icon={User} label="Profile" />
        </nav>

        <div className="p-3 border-t border-zinc-800">
          <div className="flex items-center gap-3 px-2 py-2 rounded-md">
            <div className="h-7 w-7 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-semibold text-zinc-300 shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-zinc-200 truncate">{user.name}</p>
              <RoleBadgeInline role={user.role} />
            </div>
            <button
              onClick={handleLogout}
              className="text-zinc-500 hover:text-zinc-300 transition-colors p-1"
              title="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 ml-60">
        <header className="h-14 bg-zinc-950 border-b border-zinc-800 flex items-center px-8 sticky top-0 z-10">
          <span className="text-sm font-medium text-zinc-400">{matchedTitle}</span>
        </header>
        <main className="flex-1 p-8 bg-zinc-950 overflow-auto">
          <div className="max-w-6xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  if (pathname === "/login") {
    return <>{children}</>
  }

  return (
    <AuthProvider>
      <DashboardShell>{children}</DashboardShell>
    </AuthProvider>
  )
}
