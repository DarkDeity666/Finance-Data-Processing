"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { ArrowLeft, Loader2 } from "lucide-react"
import { api } from "@/lib/api"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

const schema = z.object({
  amount: z.coerce
    .number({ invalid_type_error: "Amount is required" })
    .positive("Amount must be greater than 0"),
  type: z.enum(["INCOME", "EXPENSE"], { required_error: "Type is required" }),
  category: z.string().min(2, "Category must be at least 2 characters"),
  date: z.string().min(1, "Date is required"),
  description: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Record {
  id: string
  amount: number
  type: "INCOME" | "EXPENSE"
  category: string
  date: string
  description?: string
}

export default function EditRecord() {
  const router = useRouter()
  const params = useParams()
  const recordId = params.id as string
  const [serverError, setServerError] = useState("")
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    api
      .get<Record>(`/api/records/${recordId}`)
      .then((rec) => {
        reset({
          amount: rec.amount,
          type: rec.type,
          category: rec.category,
          date: rec.date,
          description: rec.description ?? "",
        })
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [recordId, reset])

  const onSubmit = async (data: FormData) => {
    setServerError("")
    try {
      await api.put(`/api/records/${recordId}`, data)
      router.push("/records")
    } catch (err: any) {
      setServerError(err.message ?? "Failed to update record")
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-5 w-5 text-zinc-500 animate-spin" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <p className="text-sm font-medium text-zinc-400">Record not found</p>
          <button
            onClick={() => router.push("/records")}
            className="mt-3 text-xs text-zinc-600 hover:text-zinc-400 underline"
          >
            Back to records
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">Edit Record</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Update this financial record</p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-[#111] border border-zinc-800 rounded-lg p-6 space-y-5"
      >
        {serverError && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-3 py-2 rounded-md">
            {serverError}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="amount">Amount ($)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              {...register("amount")}
            />
            {errors.amount && (
              <p className="text-xs text-red-400 mt-1">{errors.amount.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="type">Type</Label>
            <Select id="type" {...register("type")}>
              <option value="EXPENSE">Expense</option>
              <option value="INCOME">Income</option>
            </Select>
            {errors.type && (
              <p className="text-xs text-red-400 mt-1">{errors.type.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              type="text"
              placeholder="e.g. Server Costs"
              {...register("category")}
            />
            {errors.category && (
              <p className="text-xs text-red-400 mt-1">{errors.category.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="date">Date</Label>
            <Input id="date" type="date" {...register("date")} />
            {errors.date && (
              <p className="text-xs text-red-400 mt-1">{errors.date.message}</p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="description">Description (optional)</Label>
          <Textarea
            id="description"
            rows={3}
            placeholder="Brief description of this transaction"
            {...register("description")}
          />
        </div>

        <div className="flex items-center gap-3 pt-1">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
