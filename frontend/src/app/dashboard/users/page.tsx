"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Trash2, ShieldCheck } from "lucide-react"
import { usersService } from "@/services/users"
import { formatDate } from "@/lib/utils"
import type { User } from "@/types"

export default function UsersPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [isOpen, setIsOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ["users", page, search],
    queryFn: () => usersService.getAll({ page, page_size: 20, search }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => usersService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
      toast.success("User deleted")
    },
  })

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <PageHeader
        title="Users"
        description="Manage system users and roles"
        actions={
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Add User</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create User</DialogTitle></DialogHeader>
              <UserForm onSuccess={() => { setIsOpen(false); queryClient.invalidateQueries({ queryKey: ["users"] }) }} />
            </DialogContent>
          </Dialog>
        }
      />

      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b border-zinc-800">
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="max-w-sm"
            />
          </div>
          {data?.items.map((user: User) => (
            <div key={user.id} className="flex items-center gap-4 p-4 border-b border-zinc-800 last:border-0 hover:bg-zinc-800/30">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600/20 text-blue-400 text-sm font-bold">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-zinc-200">{user.username}</span>
                  <Badge variant={
                    user.role === "admin" ? "default" :
                    user.role === "analyst" ? "info" :
                    "outline"
                  }>{user.role}</Badge>
                  {!user.is_active && <Badge variant="danger">Inactive</Badge>}
                </div>
                <p className="text-sm text-zinc-500">{user.email}</p>
              </div>
              <div className="text-right text-xs text-zinc-600">
                <p>Created: {formatDate(user.created_at)}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(user.id)}>
                <Trash2 className="h-4 w-4 text-red-400" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {data && data.total_pages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-500">{data.total} users</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= data.total_pages} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      )}
    </motion.div>
  )
}

function UserForm({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("analyst")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await usersService.create({ username, email, password, role })
      toast.success("User created")
      onSuccess()
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to create user"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm text-zinc-400">Username</label>
        <Input value={username} onChange={(e) => setUsername(e.target.value)} required />
      </div>
      <div>
        <label className="text-sm text-zinc-400">Email</label>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div>
        <label className="text-sm text-zinc-400">Password</label>
        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>
      <div>
        <label className="text-sm text-zinc-400">Role</label>
        <select value={role} onChange={(e) => setRole(e.target.value)} className="flex h-10 w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 text-sm text-zinc-200">
          <option value="admin">Admin</option>
          <option value="analyst">Analyst</option>
          <option value="operator">Operator</option>
          <option value="viewer">Viewer</option>
        </select>
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Creating..." : "Create User"}
      </Button>
    </form>
  )
}
