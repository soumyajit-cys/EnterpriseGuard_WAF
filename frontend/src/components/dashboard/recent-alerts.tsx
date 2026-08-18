"use client"

import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollText, ChevronRight } from "lucide-react"
import { cn, timeAgo } from "@/lib/utils"
import { alertsService } from "@/services/alerts"
import { SeverityChip } from "@/components/ui/severity-chip"
import { severityRail, severityOf } from "@/lib/severity"

export function RecentAlerts() {
  const { data, isLoading } = useQuery({
    queryKey: ["recent-alerts"],
    queryFn: () => alertsService.getAll({ page: 1, page_size: 5 }),
    refetchInterval: 30000,
  })

  const alerts = data?.items ?? []

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <ScrollText className="h-5 w-5 text-blue-400" />
            Recent Alerts
          </span>
          <Link
            href="/dashboard/alerts"
            className="flex items-center gap-0.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            View all <ChevronRight className="h-3 w-3" />
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))
          ) : alerts.length === 0 ? (
            <div className="py-8 text-center text-sm text-zinc-500">
              No alerts yet — all quiet
            </div>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className="relative flex items-start gap-3 overflow-hidden rounded-lg p-3 pl-4 hover:bg-zinc-800/30 transition-colors"
              >
                <span
                  className={cn(
                    "absolute left-0 top-0 h-full w-1 rounded-r-full",
                    severityRail[severityOf(alert.severity)]
                  )}
                  aria-hidden
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-300 leading-relaxed line-clamp-2">
                    {alert.message}
                  </p>
                  <p className="font-mono text-xs text-zinc-600 mt-1">
                    {alert.created_at ? timeAgo(new Date(alert.created_at)) : ""}
                    {alert.ip_address ? ` · ${alert.ip_address}` : ""}
                  </p>
                </div>
                <SeverityChip value={alert.severity} className="shrink-0" />
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}