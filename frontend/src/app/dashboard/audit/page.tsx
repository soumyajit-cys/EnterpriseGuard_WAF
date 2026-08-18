"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { wafService } from "@/services/waf"
import { History, ShieldCheck } from "lucide-react"
import type { PaginatedAuditLogs } from "@/types"

export default function AuditLogPage() {
  const [page, setPage] = useState(1)
  const [action, setAction] = useState<string>("")
  const pageSize = 20

  const { data, isLoading } = useQuery<PaginatedAuditLogs>({
    queryKey: ["audit-logs", page, action],
    queryFn: () => wafService.getAuditLogs(page, pageSize, action || undefined),
  })

  const actionBadge: Record<string, "default" | "success" | "danger" | "warning"> = {
    LOGIN: "success",
    LOGIN_BLOCKED: "danger",
    LOGIN_2FA_STEP: "warning",
    IP_BLOCKED: "danger",
    IP_UNBLOCKED: "warning",
    IP_ALLOWED: "success",
    MODE_CHANGED: "warning",
    SETTINGS_UPDATED: "warning",
    WEBHOOK_TESTED: "warning",
    "2FA_SETUP": "warning",
    "2FA_ENABLED": "success",
    "2FA_DISABLED": "warning",
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <PageHeader
        title="Audit Log"
        description="Every administrative action across the platform"
        actions={
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/[0.06] px-3 py-1.5 text-xs font-medium text-blue-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            Immutable trail
          </span>
        }
      />

      <Card>
        <CardContent className="p-5">
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <button
              onClick={() => setAction("")}
              className={`rounded-full border px-3 py-1 text-xs transition-all ${
                !action
                  ? "border-blue-500/40 bg-blue-500/10 text-blue-300"
                  : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700"
              }`}
            >
              All actions
            </button>
            {Object.keys(actionBadge).map((a) => (
              <button
                key={a}
                onClick={() => setAction(action === a ? "" : a)}
                className={`rounded-full border px-3 py-1 text-xs font-mono transition-all ${
                  action === a
                    ? "border-blue-500/40 bg-blue-500/10 text-blue-300"
                    : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700"
                }`}
              >
                {a}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-lg" />
              ))}
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {(data?.items ?? []).length === 0 ? (
                  <EmptyState
                    icon={History}
                    title="No audit entries yet"
                    description="Admin actions like IP blocks and settings changes appear here."
                  />
                ) : (
                  data?.items.map((log) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-wrap items-center gap-3 rounded-lg bg-zinc-900/50 border border-zinc-800 px-4 py-3"
                    >
                      <Badge variant={actionBadge[log.action] ?? "default"} className="font-mono">
                        {log.action}
                      </Badge>
                      <span className="text-sm text-zinc-300">{log.username ?? "system"}</span>
                      {log.resource && (
                        <span className="text-xs text-zinc-600 font-mono">{log.resource}</span>
                      )}
                      {log.details && (
                        <span className="text-xs text-zinc-500 truncate max-w-xs">
                          {log.details}
                        </span>
                      )}
                      <span className="ml-auto text-xs text-zinc-600">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                      {log.ip_address && (
                        <span className="text-xs text-zinc-600 font-mono">
                          {log.ip_address}
                        </span>
                      )}
                    </motion.div>
                  ))
                )}
              </div>

              {data && data.total_pages > 1 && (
                <div className="mt-5 flex items-center justify-between">
                  <p className="text-xs text-zinc-600">
                    Page {data.page} of {data.total_pages} · {data.total} entries
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-1.5 text-xs text-zinc-400 hover:border-zinc-600 disabled:opacity-40"
                    >
                      Prev
                    </button>
                    <button
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page >= (data?.total_pages ?? 1)}
                      className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-1.5 text-xs text-zinc-400 hover:border-zinc-600 disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
