"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollText, ShieldAlert, AlertTriangle, Info } from "lucide-react"
import { cn, timeAgo } from "@/lib/utils"

const alerts = [
  {
    id: 1,
    severity: "critical",
    message: "SQL Injection attempt detected from 192.168.1.105",
    time: new Date(Date.now() - 1000 * 60 * 2),
  },
  {
    id: 2,
    severity: "high",
    message: "XSS payload detected in /search endpoint",
    time: new Date(Date.now() - 1000 * 60 * 5),
  },
  {
    id: 3,
    severity: "medium",
    message: "Rate limit exceeded for 10.0.0.45",
    time: new Date(Date.now() - 1000 * 60 * 12),
  },
  {
    id: 4,
    severity: "high",
    message: "Command injection attempt blocked on /api/exec",
    time: new Date(Date.now() - 1000 * 60 * 18),
  },
  {
    id: 5,
    severity: "low",
    message: "Suspicious user-agent detected",
    time: new Date(Date.now() - 1000 * 60 * 25),
  },
]

const severityConfig = {
  critical: { icon: ShieldAlert, color: "text-red-500", bg: "bg-red-500/10" },
  high: { icon: AlertTriangle, color: "text-orange-500", bg: "bg-orange-500/10" },
  medium: { icon: Info, color: "text-yellow-500", bg: "bg-yellow-500/10" },
  low: { icon: Info, color: "text-blue-500", bg: "bg-blue-500/10" },
}

export function RecentAlerts() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ScrollText className="h-5 w-5 text-blue-400" />
          Recent Alerts
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.map((alert) => {
            const config = severityConfig[alert.severity as keyof typeof severityConfig]
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
                  <p className="text-sm text-zinc-300 leading-relaxed">
                    {alert.message}
                  </p>
                  <p className="text-xs text-zinc-600 mt-1">
                    {timeAgo(alert.time)}
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
          })}
        </div>
      </CardContent>
    </Card>
  )
}
