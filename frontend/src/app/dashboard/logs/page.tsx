"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Download } from "lucide-react"
import { logsService } from "@/services/logs"
import { formatDate,  from "@/lib/utils"
import type { RequestLog } from "@/types"

export default function LogsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [actionFilter, setActionFilter] = useState("")

  const { data, isLoading } = useQuery({
    queryKey: ["logs", page, search, actionFilter],
    queryFn: () => logsService.getAll({
      page,
      page_size: 20,
      search: search || undefined,
      action: actionFilter || undefined,
    }),
  })

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <PageHeader
        title="Request Logs"
        description="Detailed request history and analysis"
        actions={
          <Button variant="outline" onClick={() => logsService.exportLogs("csv").then(blob => {
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url; a.download = "logs.csv"; a.click()
          })}>
            <Download className="h-4 w-4 mr-2" /> Export
          </Button>
        }
      />

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Search IP, path, attack type..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-10"
          />
        </div>
        <select
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setPage(1) }}
          className="h-10 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 text-sm text-zinc-200"
        >
          <option value="">All Actions</option>
          <option value="ALLOW">Allowed</option>
          <option value="BLOCK">Blocked</option>
        </select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase">Time</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase">IP</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase">Method</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase">Path</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase">Action</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase">Score</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase">Attack</th>
                </tr>
              </thead>
              <tbody>
                {data?.items.map((log: RequestLog) => (
                  <tr key={log.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                    <td className="px-4 py-3 text-sm text-zinc-400">{formatDate(log.created_at)}</td>
                    <td className="px-4 py-3 text-sm font-mono text-zinc-300">{log.ip_address}</td>
                    <td className="px-4 py-3 text-sm text-zinc-400">{log.method || "-"}</td>
                    <td className="px-4 py-3 text-sm text-zinc-300 max-w-[300px] truncate">{log.path}</td>
                    <td className="px-4 py-3">
                      <Badge variant={log.action === "BLOCK" ? "danger" : "success"}>
                        {log.action}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {log.score != null && (
                        <span className={`font-mono ${
                          log.score >= 80 ? "text-red-400" :
                          log.score >= 50 ? "text-yellow-400" :
                          "text-green-400"
                        }`}>
                          {log.score}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-400">{log.attack_type || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!isLoading && data?.items.length === 0 && (
            <div className="text-center py-12 text-zinc-500">No logs found</div>
          )}
        </CardContent>
      </Card>

      {data && data.total_pages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-500">{data.total} logs</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= data.total_pages} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      )}
    </motion.div>
  )
}
