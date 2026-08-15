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
import { Switch } from "@/components/ui/switch"
import { Trash2, Ban } from "lucide-react"
import { blocklistService } from "@/services/blocklist"
import { getErrorMessage } from "@/services/api"
import { formatDate } from "@/lib/utils"
import type { BlockedIP } from "@/types"

export default function BlockedIPsPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [isOpen, setIsOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ["blocked-ips", page],
    queryFn: () => blocklistService.getAll({ page, page_size: 20 }),
  })

  const unblockMutation = useMutation({
    mutationFn: (id: number) => blocklistService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blocked-ips"] })
      toast.success("IP unblocked")
    },
  })

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <PageHeader
        title="Blocked IPs"
        description="Manage blocked IP addresses"
        actions={
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button><Ban className="h-4 w-4 mr-2" />Block IP</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Block IP Address</DialogTitle></DialogHeader>
              <BlockIPForm onSuccess={() => { setIsOpen(false); queryClient.invalidateQueries({ queryKey: ["blocked-ips"] }) }} />
            </DialogContent>
          </Dialog>
        }
      />

      <Card>
        <CardContent className="p-0">
          {data?.items.map((ip: BlockedIP) => (
            <div key={ip.id} className="flex items-center gap-4 p-4 border-b border-zinc-800 last:border-0 hover:bg-zinc-800/30">
              <Ban className="h-5 w-5 text-red-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-medium text-zinc-200">{ip.ip_address}</span>
                  {ip.permanent && <Badge variant="danger">Permanent</Badge>}
                  {!ip.permanent && ip.expires_at && (
                    <Badge variant="outline">Expires {formatDate(ip.expires_at)}</Badge>
                  )}
                </div>
                {ip.reason && <p className="text-sm text-zinc-500 mt-1">{ip.reason}</p>}
                <p className="text-xs text-zinc-600 mt-1">Blocked {formatDate(ip.created_at)}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => unblockMutation.mutate(ip.id)}>
                <Trash2 className="h-4 w-4 text-red-400" />
              </Button>
            </div>
          ))}
          {!isLoading && data?.items.length === 0 && (
            <div className="text-center py-12 text-zinc-500">No blocked IPs</div>
          )}
        </CardContent>
      </Card>

      {data && data.total_pages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-500">{data.total} blocked IPs</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= data.total_pages} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      )}
    </motion.div>
  )
}

function BlockIPForm({ onSuccess }: { onSuccess: () => void }) {
  const [ip_address, setIpAddress] = useState("")
  const [reason, setReason] = useState("")
  const [permanent, setPermanent] = useState(true)
  const [expires_in, setExpiresIn] = useState("24")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await blocklistService.create({
        ip_address,
        reason,
        permanent,
        expires_in: permanent ? undefined : `${expires_in}h`,
      })
      toast.success("IP blocked")
      onSuccess()
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to block IP"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm text-zinc-400">IP Address</label>
        <Input value={ip_address} onChange={(e) => setIpAddress(e.target.value)} placeholder="e.g., 192.168.1.100" required />
      </div>
      <div>
        <label className="text-sm text-zinc-400">Reason</label>
        <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why is this IP blocked?" />
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={permanent} onCheckedChange={setPermanent} />
        <span className="text-sm text-zinc-400">Permanent block</span>
      </div>
      {!permanent && (
        <div>
          <label className="text-sm text-zinc-400">Expires In (hours)</label>
          <Input type="number" value={expires_in} onChange={(e) => setExpiresIn(e.target.value)} />
        </div>
      )}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Blocking..." : "Block IP"}
      </Button>
    </form>
  )
}
