"use client"

import { useState } from "react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const data = [
  { time: "00:00", requests: 1200, blocked: 45, allowed: 1155 },
  { time: "02:00", requests: 800, blocked: 32, allowed: 768 },
  { time: "04:00", requests: 600, blocked: 28, allowed: 572 },
  { time: "06:00", requests: 900, blocked: 41, allowed: 859 },
  { time: "08:00", requests: 2100, blocked: 89, allowed: 2011 },
  { time: "10:00", requests: 3500, blocked: 156, allowed: 3344 },
  { time: "12:00", requests: 4200, blocked: 201, allowed: 3999 },
  { time: "14:00", requests: 3800, blocked: 178, allowed: 3622 },
  { time: "16:00", requests: 2900, blocked: 134, allowed: 2766 },
  { time: "18:00", requests: 2400, blocked: 112, allowed: 2288 },
  { time: "20:00", requests: 1800, blocked: 78, allowed: 1722 },
  { time: "22:00", requests: 1400, blocked: 56, allowed: 1344 },
]

const periods = ["24h", "7d", "30d"] as const

export function TrafficChart() {
  const [period, setPeriod] = useState<"24h" | "7d" | "30d">("24h")

  return (
    <Card className="col-span-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Traffic Overview</CardTitle>
        <div className="flex items-center gap-1">
          {periods.map((p) => (
            <Button
              key={p}
              variant={period === p ? "default" : "ghost"}
              size="sm"
              onClick={() => setPeriod(p)}
              className="text-xs"
            >
              {p}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="requests" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="blocked" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#27272A"
                vertical={false}
              />
              <XAxis
                dataKey="time"
                stroke="#71717A"
                tick={{ fill: "#71717A", fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#71717A"
                tick={{ fill: "#71717A", fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "#18181B",
                  border: "1px solid #27272A",
                  borderRadius: "8px",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
                }}
                labelStyle={{ color: "#E4E4E7" }}
              />
              <Legend
                wrapperStyle={{ paddingTop: "12px" }}
                formatter={(value) => (
                  <span style={{ color: "#A1A1AA", fontSize: "12px" }}>{value}</span>
                )}
              />
              <Area
                type="monotone"
                dataKey="requests"
                stroke="#2563EB"
                strokeWidth={2}
                fill="url(#requests)"
                name="Total Requests"
              />
              <Area
                type="monotone"
                dataKey="blocked"
                stroke="#EF4444"
                strokeWidth={2}
                fill="url(#blocked)"
                name="Blocked"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
