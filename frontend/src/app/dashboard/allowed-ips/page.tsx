"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {  from "lucide-react"
import { allowlistService } from "@/services/allowlist"
import { getErrorMessage } from "@/services/api"
import { formatDate } from "@/lib/utils"
import type { AllowedIP } from "@/types"

export default function AllowedIPsPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [isOpen, setIsOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ["allowed-ips", page],
    queryFn: () => allowlistService.getAll({ page, page_size: 20 }),
  })

  const removeMutation = useMutation({
    mutationFn: (id: number) => allowlistService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allowed-ips"] })
      toast.success("IP removed from allowlist")
    },
  })

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <PageHeader
        title="Allowed IPs"
        description="Manage IP allowlist"
        actions={
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button><ShieldCheck className="h-4 w-4 mr-2" />Add IP</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Allow IP Address</DialogTitle></DialogHeader>
              <AllowIPForm onSuccess={() => { setIsOpen(false); queryClient.invalidateQueries({ queryKey: ["allowed-ips"] }) }} />
            </DialogContent>
          </Dialog>
        }
      />

      <Card>
        <CardContent className="p-0">
          {data?.items.map((ip: AllowedIP) => (
            <div key={ip.id} className="flex items-center gap-4 p-4 border-b border-zinc-800 last:border-0 hover:bg-zinc-800/30">
              <ShieldCheck className="h-5 w-5 text-green-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="font-mono font-medium text-zinc-200">{ip.ip_address}</span>
                {ip.description && <p className="text-sm text-zinc-500 mt-1">{ip.description}</p>}
                <p className="text-xs text-zinc-600 mt-1">Added {formatDate(ip.created_at)}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => removeMutation.mutate(ip.id)}>
                <Trash2 className="h-4 w-4 text-red-400" />
              </Button>
            </div>
          ))}
          {!isLoading && data?.items.length === 0 && (
            <div className="text-center py-12 text-zinc-500">No allowed IPs</div>
          )}
        </CardContent>
      </Card>

      {data && data.total_pages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-500">{data.total} allowed IPs</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= data.total_pages} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      )}
    </motion.div>
  )
}

function AllowIPForm({ onSuccess }: { onSuccess: () => void }) {
  const [ip_address, setIpAddress] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await allowlistService.create({ ip_address, description })
      toast.success("IP allowed")
      onSuccess()
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to add IP"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm text-zinc-400">IP Address</label>
        <Input value={ip_address} onChange={(e) => setIpAddress(e.target.value)} placeholder="e.g., 10.0.0.0/8" required />
      </div>
      <div>
        <label className="text-sm text-zinc-400">Description</label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Why is this IP allowed?" />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Adding..." : "Add to Allowlist"}
      </Button>
    </form>
  )
}
