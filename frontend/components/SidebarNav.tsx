"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { FileText, LayoutDashboard, Users } from "lucide-react"

export function SidebarNav() {
  const pathname = usePathname()

  const tabs = [
    {
      name: "Dashboard",
      href: "/",
      icon: LayoutDashboard
    },
    {
      name: "Records",
      href: "/records",
      icon: FileText
    },
    {
      name: "Users",
      href: "/users",
      icon: Users
    }
  ]

  return (
    <nav className="mt-4 px-3 space-y-1 flex-1">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href || (tab.href !== "/" && pathname.startsWith(tab.href))
        const Icon = tab.icon

        return (
          <Link
            key={tab.name}
            href={tab.href}
            className={`flex items-center gap-3 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              isActive
                ? "bg-zinc-800 text-zinc-100 border border-zinc-700/50"
                : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100 border border-transparent"
            }`}
          >
            <Icon className="h-4 w-4" />
            <span>{tab.name}</span>
          </Link>
        )
      })}
    </nav>
  )
}
