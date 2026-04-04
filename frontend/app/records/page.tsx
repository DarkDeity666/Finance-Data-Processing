"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { Plus, ChevronLeft, ChevronRight, Search, X, Pencil, Trash2 } from "lucide-react"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { Badge } from "@/components/ui/badge"

interface Record {
  id: string
  amount: number
  type: "INCOME" | "EXPENSE"
  category: string
  date: string
  description?: string
  created_by: string
  is_deleted: boolean
}

interface PaginatedRecords {
  items: Record[]
  total: number
  page: number
  size: number
  pages: number
}

const EMPTY_FILTERS = {
  type: "",
  category: "",
  start_date: "",
  end_date: "",
  search: "",
}

export default function Records() {
  const { user } = useAuth()
  const [data, setData] = useState<PaginatedRecords | null>(null)
  const [page, setPage] = useState(1)
  const [draft, setDraft] = useState({ ...EMPTY_FILTERS })
  const [applied, setApplied] = useState({ ...EMPTY_FILTERS })
  const [deleting, setDeleting] = useState<string | null>(null)

  const buildUrl = useCallback(
    (p: number, f: typeof EMPTY_FILTERS) => {
      const params = new URLSearchParams({ page: String(p), size: "20" })
      if (f.type) params.set("type", f.type)
      if (f.category) params.set("category", f.category)
      if (f.start_date) params.set("start_date", f.start_date)
      if (f.end_date) params.set("end_date", f.end_date)
      if (f.search) params.set("search", f.search)
      return `/api/records?${params.toString()}`
    },
    []
  )

  const fetchRecords = useCallback(
    (p: number, f: typeof EMPTY_FILTERS) => {
      api
        .get<PaginatedRecords>(buildUrl(p, f))
        .then(setData)
        .catch(() => {})
    },
    [buildUrl]
  )

  useEffect(() => {
    fetchRecords(page, applied)
  }, [page, applied, fetchRecords])

  const applyFilters = () => {
    setPage(1)
    setApplied({ ...draft })
  }

  const resetFilters = () => {
    setDraft({ ...EMPTY_FILTERS })
    setApplied({ ...EMPTY_FILTERS })
    setPage(1)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this record?")) return
    setDeleting(id)
    try {
      await api.delete(`/api/records/${id}`)
      fetchRecords(page, applied)
    } catch {
    } finally {
      setDeleting(null)
    }
  }

  const hasFilters = Object.values(applied).some(Boolean)
  const isAdmin = user?.role === "ADMIN"
  const canViewRecords = user?.role === "ADMIN" || user?.role === "ANALYST"

  if (!canViewRecords) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-zinc-500 text-sm">You do not have access to this page.</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">Financial Records</h2>
          {data && (
            <p className="text-xs text-zinc-500 mt-0.5">{data.total} records total</p>
          )}
        </div>
        {isAdmin && (
          <Link
            href="/records/new"
            className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 hover:bg-white text-zinc-900 text-sm font-medium rounded-md transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Record
          </Link>
        )}
      </div>

      <div className="bg-[#111] border border-zinc-800 rounded-lg p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-600 pointer-events-none" />
            <input
              type="text"
              placeholder="Search..."
              value={draft.search}
              onChange={(e) => setDraft((d) => ({ ...d, search: e.target.value }))}
              className="w-full pl-8 pr-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-md text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600 transition-colors"
            />
          </div>
          <select
            value={draft.type}
            onChange={(e) => setDraft((d) => ({ ...d, type: e.target.value }))}
            className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-md text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-600 transition-colors"
          >
            <option value="">All Types</option>
            <option value="INCOME">Income</option>
            <option value="EXPENSE">Expense</option>
          </select>
          <input
            type="text"
            placeholder="Category"
            value={draft.category}
            onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
            className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-md text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600 transition-colors"
          />
          <input
            type="date"
            value={draft.start_date}
            onChange={(e) => setDraft((d) => ({ ...d, start_date: e.target.value }))}
            className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-md text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-600 transition-colors"
          />
          <input
            type="date"
            value={draft.end_date}
            onChange={(e) => setDraft((d) => ({ ...d, end_date: e.target.value }))}
            className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-md text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-600 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={applyFilters}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-md border border-zinc-700 transition-colors"
          >
            Apply
          </button>
          {hasFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1.5 px-3 py-1.5 text-zinc-500 hover:text-zinc-300 text-xs transition-colors"
            >
              <X className="h-3 w-3" />
              Clear filters
            </button>
          )}
        </div>
      </div>

      <div className="bg-[#111] border border-zinc-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 text-xs text-zinc-500 font-medium uppercase tracking-wide">
                <th className="px-5 py-3 text-left">Date</th>
                <th className="px-5 py-3 text-left">Type</th>
                <th className="px-5 py-3 text-left">Category</th>
                <th className="px-5 py-3 text-left">Description</th>
                <th className="px-5 py-3 text-right">Amount</th>
                {isAdmin && <th className="px-5 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {data?.items.map((rec) => (
                <tr key={rec.id} className="hover:bg-zinc-800/20 transition-colors group">
                  <td className="px-5 py-3.5 text-zinc-400 whitespace-nowrap tabular-nums text-xs">
                    {rec.date}
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge variant={rec.type === "INCOME" ? "success" : "danger"}>
                      {rec.type}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5 text-zinc-300 font-medium">{rec.category}</td>
                  <td className="px-5 py-3.5 text-zinc-500 truncate max-w-xs text-xs">
                    {rec.description || "—"}
                  </td>
                  <td className="px-5 py-3.5 text-right tabular-nums font-medium">
                    <span className={rec.type === "INCOME" ? "text-emerald-400" : "text-zinc-300"}>
                      {rec.type === "INCOME" ? "+" : "−"}${rec.amount.toFixed(2)}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link
                          href={`/records/${rec.id}/edit`}
                          className="p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Link>
                        <button
                          onClick={() => handleDelete(rec.id)}
                          disabled={deleting === rec.id}
                          className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {data?.items.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="px-5 py-10 text-center text-zinc-600 text-sm">
                    {hasFilters ? "No records match your filters." : "No records found."}
                  </td>
                </tr>
              )}
              {!data && (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="px-5 py-10 text-center text-zinc-600 text-sm">
                    Loading...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {data && data.pages > 1 && (
          <div className="px-5 py-3 border-t border-zinc-800 flex items-center justify-between">
            <span className="text-xs text-zinc-500">
              Page <span className="text-zinc-300">{data.page}</span> of{" "}
              <span className="text-zinc-300">{data.pages}</span>
            </span>
            <div className="flex gap-1">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="p-1.5 border border-zinc-700 rounded hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-zinc-400"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                disabled={page === data.pages}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 border border-zinc-700 rounded hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-zinc-400"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
