"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react"
import { api } from "@/lib/api"

const MonthlyTrendChart = dynamic(() => import("@/components/MonthlyTrendChart"), {
  ssr: false,
  loading: () => (
    <div className="h-64 flex items-center justify-center text-zinc-600 text-sm">
      Loading chart...
    </div>
  ),
})

interface CategoryTotal { category: string; total: number }
interface MonthlyTrend { month: string; income: number; expense: number }
interface ActivityRecord {
  id: string; type: string; category: string; date: string; amount: number; description?: string
}
interface Summary {
  total_income: number
  total_expense: number
  net_balance: number
  category_incomes: CategoryTotal[]
  category_expenses: CategoryTotal[]
  monthly_trends: MonthlyTrend[]
  recent_activity: ActivityRecord[]
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string
  value: string
  icon: React.ElementType
  accent?: "positive" | "negative" | "neutral"
}) {
  const accentColor = accent === "positive"
    ? "text-emerald-400"
    : accent === "negative"
    ? "text-red-400"
    : "text-zinc-100"

  return (
    <div className="bg-[#111] border border-zinc-800 rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{label}</span>
        <div className="h-7 w-7 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center">
          <Icon className="h-3.5 w-3.5 text-zinc-500" />
        </div>
      </div>
      <div className={`text-2xl font-semibold tabular-nums ${accentColor}`}>{value}</div>
    </div>
  )
}

function CategoryList({ items, label }: { items: CategoryTotal[]; label: string }) {
  const max = Math.max(...items.map((i) => i.total), 1)
  return (
    <div>
      <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-3">{label}</p>
      <div className="space-y-2.5">
        {items.slice(0, 5).map((item) => (
          <div key={item.category}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-zinc-400">{item.category}</span>
              <span className="text-xs text-zinc-500 tabular-nums">
                ${item.total.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-zinc-600 rounded-full"
                style={{ width: `${(item.total / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-xs text-zinc-600">No data</p>
        )}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [data, setData] = useState<Summary | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api
      .get<Summary>("/api/dashboard/summary")
      .then(setData)
      .catch((e) => setError(e.message))
  }, [])

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <p className="text-sm font-medium text-red-400 mb-1">Failed to load dashboard</p>
          <p className="text-xs text-zinc-600">{error}</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-zinc-600 text-sm">Loading...</p>
      </div>
    )
  }

  const fmt = (n: number) =>
    "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <SummaryCard
          label="Total Income"
          value={fmt(data.total_income)}
          icon={TrendingUp}
          accent="positive"
        />
        <SummaryCard
          label="Total Expenses"
          value={fmt(data.total_expense)}
          icon={TrendingDown}
          accent="negative"
        />
        <SummaryCard
          label="Net Balance"
          value={fmt(data.net_balance)}
          icon={DollarSign}
          accent={data.net_balance >= 0 ? "positive" : "negative"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-[#111] border border-zinc-800 rounded-lg p-5">
          <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-5">
            Monthly Trend — Last 6 Months
          </h2>
          <div className="h-56">
            <MonthlyTrendChart data={data.monthly_trends} />
          </div>
        </div>

        <div className="bg-[#111] border border-zinc-800 rounded-lg p-5 flex flex-col gap-6">
          <CategoryList items={data.category_incomes} label="Income by Category" />
          <CategoryList items={data.category_expenses} label="Expense by Category" />
        </div>
      </div>

      <div className="bg-[#111] border border-zinc-800 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-800">
          <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Recent Activity</h2>
        </div>
        <div className="divide-y divide-zinc-800/60">
          {data.recent_activity.length > 0 ? (
            data.recent_activity.map((act) => (
              <div key={act.id} className="flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <div
                    className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                      act.type === "INCOME" ? "bg-emerald-500" : "bg-zinc-500"
                    }`}
                  />
                  <div>
                    <p className="text-sm font-medium text-zinc-300">{act.category}</p>
                    <p className="text-xs text-zinc-600 mt-0.5">{act.description || "—"}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`text-sm font-medium tabular-nums ${
                      act.type === "INCOME" ? "text-emerald-400" : "text-zinc-300"
                    }`}
                  >
                    {act.type === "INCOME" ? "+" : "−"}${act.amount.toFixed(2)}
                  </p>
                  <p className="text-xs text-zinc-600 mt-0.5">{act.date}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="px-5 py-8 text-center text-zinc-600 text-sm">No recent activity</div>
          )}
        </div>
      </div>
    </div>
  )
}
