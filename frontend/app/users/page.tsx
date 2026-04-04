"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { UserPlus, Loader2, Pencil, Trash2 } from "lucide-react"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { Badge } from "@/components/ui/badge"
import { Dialog } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"

interface User {
  id: string
  name: string
  email: string
  role: "ADMIN" | "ANALYST" | "VIEWER"
  status: "ACTIVE" | "INACTIVE"
  created_at: string
}

const createSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["ADMIN", "ANALYST", "VIEWER"]),
  status: z.enum(["ACTIVE", "INACTIVE"]),
})

const editSchema = z.object({
  name: z.string().min(2).optional(),
  role: z.enum(["ADMIN", "ANALYST", "VIEWER"]).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
})

type CreateData = z.infer<typeof createSchema>
type EditData = z.infer<typeof editSchema>

function roleBadgeVariant(role: string) {
  if (role === "ADMIN") return "purple"
  if (role === "ANALYST") return "info"
  return "default"
}

function CreateUserDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated: () => void
}) {
  const [serverError, setServerError] = useState("")
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateData>({
    resolver: zodResolver(createSchema),
    defaultValues: { role: "VIEWER", status: "ACTIVE" },
  })

  const onSubmit = async (data: CreateData) => {
    setServerError("")
    try {
      await api.post("/api/users", data)
      reset()
      onCreated()
      onClose()
    } catch (err: any) {
      setServerError(err.message ?? "Failed to create user")
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Create User">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {serverError && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-3 py-2 rounded-md">
            {serverError}
          </div>
        )}
        <div>
          <Label htmlFor="create-name">Full Name</Label>
          <Input id="create-name" placeholder="Jane Smith" {...register("name")} />
          {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <Label htmlFor="create-email">Email</Label>
          <Input id="create-email" type="email" placeholder="jane@example.com" {...register("email")} />
          {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <Label htmlFor="create-password">Password</Label>
          <Input id="create-password" type="password" placeholder="Min. 6 characters" {...register("password")} />
          {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="create-role">Role</Label>
            <Select id="create-role" {...register("role")}>
              <option value="VIEWER">Viewer</option>
              <option value="ANALYST">Analyst</option>
              <option value="ADMIN">Admin</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="create-status">Status</Label>
            <Select id="create-status" {...register("status")}>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </Select>
          </div>
        </div>
        <div className="flex gap-3 pt-1">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create User"}
          </Button>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Dialog>
  )
}

function EditUserDialog({
  user,
  open,
  onClose,
  onUpdated,
}: {
  user: User
  open: boolean
  onClose: () => void
  onUpdated: () => void
}) {
  const [serverError, setServerError] = useState("")
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EditData>({
    resolver: zodResolver(editSchema),
    defaultValues: { name: user.name, role: user.role, status: user.status },
  })

  const onSubmit = async (data: EditData) => {
    setServerError("")
    try {
      await api.put(`/api/users/${user.id}`, data)
      onUpdated()
      onClose()
    } catch (err: any) {
      setServerError(err.message ?? "Failed to update user")
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title={`Edit — ${user.name}`}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {serverError && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-3 py-2 rounded-md">
            {serverError}
          </div>
        )}
        <div>
          <Label htmlFor="edit-name">Full Name</Label>
          <Input id="edit-name" {...register("name")} />
          {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="edit-role">Role</Label>
            <Select id="edit-role" {...register("role")}>
              <option value="VIEWER">Viewer</option>
              <option value="ANALYST">Analyst</option>
              <option value="ADMIN">Admin</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="edit-status">Status</Label>
            <Select id="edit-status" {...register("status")}>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </Select>
          </div>
        </div>
        <div className="flex gap-3 pt-1">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
          </Button>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Dialog>
  )
}

export default function UsersPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editTarget, setEditTarget] = useState<User | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchUsers = () => {
    api
      .get<User[]>("/api/users")
      .then(setUsers)
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleDelete = async (u: User) => {
    if (!confirm(`Delete user "${u.name}"? This cannot be undone.`)) return
    setDeleting(u.id)
    try {
      await api.delete(`/api/users/${u.id}`)
      fetchUsers()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setDeleting(null)
    }
  }

  if (currentUser?.role !== "ADMIN") {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-zinc-500 text-sm">Admin access required.</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">User Management</h2>
          {!loading && (
            <p className="text-xs text-zinc-500 mt-0.5">{users.length} users</p>
          )}
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <UserPlus className="h-3.5 w-3.5" />
          Create User
        </Button>
      </div>

      <div className="bg-[#111] border border-zinc-800 rounded-lg overflow-hidden">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-zinc-800 text-xs text-zinc-500 font-medium uppercase tracking-wide">
              <th className="px-5 py-3 text-left">Name</th>
              <th className="px-5 py-3 text-left">Email</th>
              <th className="px-5 py-3 text-left">Role</th>
              <th className="px-5 py-3 text-left">Status</th>
              <th className="px-5 py-3 text-left">Joined</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-zinc-800/20 transition-colors group">
                <td className="px-5 py-3.5 font-medium text-zinc-200">{u.name}</td>
                <td className="px-5 py-3.5 text-zinc-400">{u.email}</td>
                <td className="px-5 py-3.5">
                  <Badge variant={roleBadgeVariant(u.role)}>{u.role}</Badge>
                </td>
                <td className="px-5 py-3.5">
                  <Badge variant={u.status === "ACTIVE" ? "success" : "default"}>
                    {u.status}
                  </Badge>
                </td>
                <td className="px-5 py-3.5 text-zinc-500 text-xs tabular-nums">
                  {new Date(u.created_at).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                <td className="px-5 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setEditTarget(u)}
                      className="p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    {currentUser.id !== u.id && (
                      <button
                        onClick={() => handleDelete(u)}
                        disabled={deleting === u.id}
                        className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!loading && users.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-zinc-600 text-sm">
                  No users found.
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-zinc-600 text-sm">
                  Loading...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <CreateUserDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={fetchUsers}
      />

      {editTarget && (
        <EditUserDialog
          user={editTarget}
          open={true}
          onClose={() => setEditTarget(null)}
          onUpdated={fetchUsers}
        />
      )}
    </div>
  )
}
