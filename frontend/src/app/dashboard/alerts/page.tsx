"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { Bell, CheckCircle, Trash2 } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { alertsService } from "@/services/alerts"
import { timeAgo } from "@/lib/utils"
import type { Alert } from "@/types"

export default function AlertsPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [severityFilter, setSeverityFilter] = useState<string>("")
  const [resolvedFilter, setResolvedFilter] = useState<string>("")

  const { data, isLoading } = useQuery({
    queryKey: ["alerts", page, severityFilter, resolvedFilter],
    queryFn: () => alertsService.getAll({
      page,
      page_size: 20,
      severity: severityFilter || undefined,
      resolved: resolvedFilter === "resolved" ? true : resolvedFilter === "unresolved" ? false : undefined,
    }),
  })

  const resolveMutation = useMutation({
    mutationFn: (id: number) => alertsService.resolve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] })
      toast.success("Alert resolved")
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => alertsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] })
      toast.success("Alert deleted")
    },
  })

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <PageHeader title="Alerts" description="Security alerts and notifications" />

      <div className="flex items-center gap-3">
        <select
          value={severityFilter}
          onChange={(e) => { setSeverityFilter(e.target.value); setPage(1) }}
          className="h-10 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 text-sm text-zinc-200"
        >
          <option value="">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select
          value={resolvedFilter}
          onChange={(e) => { setResolvedFilter(e.target.value); setPage(1) }}
          className="h-10 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 text-sm text-zinc-200"
        >
          <option value="">All Status</option>
          <option value="unresolved">Unresolved</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      <Card>
        <CardContent className="p-0">
          {data?.items.map((alert: Alert) => (
            <div key={alert.id} className="flex items-start gap-4 p-4 border-b border-zinc-800 last:border-0 hover:bg-zinc-800/30 transition-colors">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                alert.severity === "critical" ? "bg-red-500/10" :
                alert.severity === "high" ? "bg-orange-500/10" :
                "bg-yellow-500/10"
              }`}>
                <Bell className={`h-5 w-5 ${
                  alert.severity === "critical" ? "text-red-400" :
                  alert.severity === "high" ? "text-orange-400" :
                  "text-yellow-400"
                }`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={
                    alert.severity === "critical" ? "danger" :
                    alert.severity === "high" ? "warning" :
                    "info"
                  }>{alert.severity}</Badge>
                  {alert.resolved && <Badge variant="success">Resolved</Badge>}
                </div>
                <p className="text-sm text-zinc-300">{alert.message}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-zinc-600">
                  {alert.ip_address && <span>IP: {alert.ip_address}</span>}
                  {alert.source && <span>Source: {alert.source}</span>}
                  {alert.created_at && <span>{timeAgo(alert.created_at)}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!alert.resolved && (
                  <Button variant="ghost" size="sm" onClick={() => resolveMutation.mutate(alert.id)}>
                    <CheckCircle className="h-4 w-4 text-green-400" />
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(alert.id)}>
                  <Trash2 className="h-4 w-4 text-red-400" />
                </Button>
              </div>
            </div>
          ))}
          {!isLoading && data?.items.length === 0 && (
            <div className="text-center py-12 text-zinc-500">No alerts found</div>
          )}
        </CardContent>
      </Card>

      {data && data.total_pages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-500">{data.total} alerts</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= data.total_pages} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      )}
    </motion.div>
  )
}
