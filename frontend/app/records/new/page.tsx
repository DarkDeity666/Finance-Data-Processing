"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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

export default function NewRecord() {
  const router = useRouter()
  const [serverError, setServerError] = useState("")

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: "EXPENSE",
      date: new Date().toISOString().split("T")[0],
    },
  })

  const onSubmit = async (data: FormData) => {
    setServerError("")
    try {
      await api.post("/api/records", data)
      router.push("/records")
    } catch (err: any) {
      setServerError(err.message ?? "Failed to create record")
    }
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
          <h2 className="text-lg font-semibold text-zinc-100">New Financial Record</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Add an income or expense entry</p>
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
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Record"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
