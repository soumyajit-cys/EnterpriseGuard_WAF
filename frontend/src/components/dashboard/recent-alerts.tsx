"use client"

import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollText, ShieldAlert, AlertTriangle, Info, ChevronRight } from "lucide-react"
import { cn, timeAgo } from "@/lib/utils"
import { alertsService } from "@/services/alerts"

const severityConfig: Record<
  string,
  { icon: typeof ShieldAlert; color: string; bg: string }
> = {
  critical: { icon: ShieldAlert, color: "text-red-500", bg: "bg-red-500/10" },
  high: { icon: AlertTriangle, color: "text-orange-500", bg: "bg-orange-500/10" },
  medium: { icon: Info, color: "text-yellow-500", bg: "bg-yellow-500/10" },
  low: { icon: Info, color: "text-blue-500", bg: "bg-blue-500/10" },
}

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
            alerts.map((alert) => {
              const config =
                severityConfig[alert.severity] ?? severityConfig.medium
              const Icon = config.icon
              return (
                <div
                  key={alert.id}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-zinc-800/30 transition-colors"
                >
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                      config.bg
                    )}
                  >
                    <Icon className={cn("h-4 w-4", config.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-300 leading-relaxed line-clamp-2">
                      {alert.message}
                    </p>
                    <p className="text-xs text-zinc-600 mt-1">
                      {alert.created_at ? timeAgo(new Date(alert.created_at)) : ""}
                      {alert.ip_address ? ` · ${alert.ip_address}` : ""}
                    </p>
                  </div>
                  <Badge
                    variant={
                      alert.severity === "critical"
                        ? "danger"
                        : alert.severity === "high"
                        ? "warning"
                        : alert.severity === "medium"
                        ? "info"
                        : "outline"
                    }
                    className="shrink-0"
                  >
                    {alert.severity}
                  </Badge>
                </div>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}
