"use client"

import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ShieldOff, ChevronRight } from "lucide-react"
import { analyticsService } from "@/services/analytics"
import { severityBar, type SeverityLevel } from "@/lib/severity"

function threatLevel(count: number): SeverityLevel {
  if (count >= 20) return "critical"
  if (count >= 10) return "high"
  return "medium"
}

export function TopAttackers() {
  const { data, isLoading } = useQuery({
    queryKey: ["top-attackers"],
    queryFn: () => analyticsService.getTraffic("7d"),
    refetchInterval: 30000,
  })

  const attackers = (data?.top_ips ?? []) as Array<{ ip: string; count: number }>

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <ShieldOff className="h-5 w-5 text-red-400" />
            Top Attacker IPs
          </span>
          <Link
            href="/dashboard/blocked-ips"
            className="flex items-center gap-0.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Blocked IPs <ChevronRight className="h-3 w-3" />
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))
          ) : attackers.length === 0 ? (
            <div className="py-8 text-center text-sm text-zinc-500">
              No attackers detected — great job
            </div>
          ) : (
            attackers.slice(0, 5).map((attacker, i) => {
              const level = threatLevel(attacker.count)
              return (
                <div
                  key={attacker.ip}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800/30 transition-colors"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 text-xs font-bold text-zinc-400">
                    #{i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-mono text-zinc-300 truncate">
                        {attacker.ip}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="h-1 flex-1 rounded-full bg-zinc-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-red-500/70"
                          style={{
                            width: `${Math.min(
                              (attacker.count / (attackers[0]?.count || 1)) * 100,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                      <p className="text-xs text-zinc-600 w-20 text-right">
                        {attacker.count.toLocaleString()} attacks
                      </p>
                    </div>
                  </div>
                  <Badge variant={level.variant}>{level.label}</Badge>
                </div>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}
