"use client"

import { useAuth } from "@/lib/auth-context"
import { Badge } from "@/components/ui/badge"
import { User, Mail, Shield, Calendar, Activity } from "lucide-react"

function roleBadgeVariant(role: string) {
  if (role === "ADMIN") return "purple" as const
  if (role === "ANALYST") return "info" as const
  return "default" as const
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-4 py-4 border-b border-zinc-800 last:border-0">
      <div className="h-8 w-8 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="h-3.5 w-3.5 text-zinc-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide mb-0.5">{label}</p>
        <div className="text-sm text-zinc-200">{value}</div>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const { user } = useAuth()

  if (!user) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-zinc-600 text-sm">Loading...</p>
      </div>
    )
  }

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const roleDescriptions: Record<string, string> = {
    ADMIN: "Full access — can manage users and all financial records",
    ANALYST: "Can view and filter financial records and dashboard insights",
    VIEWER: "Read-only access to dashboard summary",
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="bg-[#111] border border-zinc-800 rounded-lg p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-14 w-14 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-lg font-semibold text-zinc-200">
            {initials}
          </div>
          <div>
            <h2 className="text-base font-semibold text-zinc-100">{user.name}</h2>
            <p className="text-sm text-zinc-500 mt-0.5">{user.email}</p>
          </div>
        </div>

        <div>
          <InfoRow icon={User} label="Full Name" value={user.name} />
          <InfoRow icon={Mail} label="Email Address" value={user.email} />
          <InfoRow
            icon={Shield}
            label="Role"
            value={
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={roleBadgeVariant(user.role)}>{user.role}</Badge>
                <span className="text-xs text-zinc-500">{roleDescriptions[user.role]}</span>
              </div>
            }
          />
          <InfoRow
            icon={Activity}
            label="Account Status"
            value={
              <Badge variant={user.status === "ACTIVE" ? "success" : "default"}>
                {user.status}
              </Badge>
            }
          />
          <InfoRow
            icon={Calendar}
            label="Member Since"
            value={new Date(user.created_at).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          />
        </div>
      </div>

      <div className="bg-[#111] border border-zinc-800 rounded-lg p-5">
        <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
          Access Permissions
        </h3>
        <div className="space-y-2">
          {[
            { label: "View dashboard summary", allowed: true },
            { label: "View financial records", allowed: user.role !== "VIEWER" },
            { label: "Filter and search records", allowed: user.role !== "VIEWER" },
            { label: "Create financial records", allowed: user.role === "ADMIN" },
            { label: "Edit financial records", allowed: user.role === "ADMIN" },
            { label: "Delete financial records", allowed: user.role === "ADMIN" },
            { label: "Manage users", allowed: user.role === "ADMIN" },
          ].map((perm) => (
            <div key={perm.label} className="flex items-center gap-3">
              <div
                className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                  perm.allowed ? "bg-emerald-500" : "bg-zinc-700"
                }`}
              />
              <span
                className={`text-sm ${perm.allowed ? "text-zinc-300" : "text-zinc-600"}`}
              >
                {perm.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
