"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useAuthStore } from "@/store/auth-store"
import { Plus, Trash2, Save, User } from "lucide-react"

export default function ProfilePage() {
  const { user } = useAuthStore()
  const [username, setUsername] = useState(user?.username || "")
  const [email, setEmail] = useState(user?.email || "")

  const handleUpdate = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("access_token")}` },
        body: JSON.stringify({ username, email }),
      })
      if (!res.ok) throw new Error("Failed to update")
      toast.success("Profile updated")
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto space-y-6">
      <PageHeader title="Profile" description="Manage your account" />

      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600/20 text-blue-400 text-2xl font-bold">
              {user?.username?.charAt(0).toUpperCase() || "U"}
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-100">{user?.username}</h2>
              <p className="text-sm text-zinc-500">{user?.email}</p>
              {user?.role && <Badge className="mt-1">{user.role}</Badge>}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-zinc-400">Username</label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-zinc-400">Email</label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <Button onClick={handleUpdate} className="w-full">
              <Save className="h-4 w-4 mr-2" /> Update Profile
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
