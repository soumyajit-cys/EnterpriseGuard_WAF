"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShieldOff } from "lucide-react"
import { cn } from "@/lib/utils"

const attackers = [
  { ip: "192.168.1.105", attacks: 1456, country: "RU", threat: "critical" },
  { ip: "10.0.0.45", attacks: 892, country: "CN", threat: "high" },
  { ip: "172.16.0.88", attacks: 654, country: "US", threat: "high" },
  { ip: "203.0.113.50", attacks: 432, country: "NG", threat: "medium" },
  { ip: "198.51.100.22", attacks: 321, country: "BR", threat: "medium" },
]

export function TopAttackers() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldOff className="h-5 w-5 text-red-400" />
          Top Attacker IPs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {attackers.map((attacker, i) => (
            <div
              key={attacker.ip}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800/30 transition-colors"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 text-xs font-bold text-zinc-400">
                #{i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-mono text-zinc-300">{attacker.ip}</p>
                  <span className="text-xs text-zinc-600">{attacker.country}</span>
                </div>
                <p className="text-xs text-zinc-600 mt-0.5">
                  {attacker.attacks.toLocaleString()} attacks
                </p>
              </div>
              <Badge
                variant={
                  attacker.threat === "critical"
                    ? "danger"
                    : attacker.threat === "high"
                    ? "warning"
                    : "info"
                }
              >
                {attacker.threat}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
