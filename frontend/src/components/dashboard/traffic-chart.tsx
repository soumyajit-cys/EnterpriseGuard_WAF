"use client"

import { useState } from "react"
import { useQuery, keepPreviousData } from "@tanstack/react-query"
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
import { Skeleton } from "@/components/ui/skeleton"
import { analyticsService } from "@/services/analytics"

const periods = ["live", "24h", "7d", "30d"] as const

type Period = (typeof periods)[number]

function formatTime(value: string) {
  const date = new Date(value)
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

function formatDay(value: string) {
  const date = new Date(value)
  return date.toLocaleDateString([], { month: "short", day: "numeric" })
}

export function TrafficChart() {
  const [period, setPeriod] = useState<Period>("live")

  const { data, isLoading, isFetching, isPlaceholderData } = useQuery({
    queryKey: ["traffic-chart", period],
    queryFn: () => analyticsService.getTraffic(period),
    refetchInterval: period === "7d" || period === "30d" ? 300000 : 30000,
    placeholderData: keepPreviousData,
  })

  const trend = data?.traffic_trend ?? []
  const isHourly = period === "24h" || period === "live"

  const chartData = (trend as Array<{ date: string; requests: number; blocked: number; allowed: number }>).map((row) => ({
    time: isHourly ? formatTime(row.date) : formatDay(row.date),
    requests: row.requests,
    blocked: row.blocked,
    allowed: row.allowed,
  }))

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
              {p === "live" ? "Since Start" : p}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[350px]">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <Skeleton className="h-[300px] w-full" />
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-zinc-500">
              {isFetching ? "Updating…" : "No traffic recorded in this period yet"}
            </div>
          ) : (
            <div
              className={`h-full transition-opacity duration-300 ${
                isPlaceholderData ? "opacity-60" : "opacity-100"
              }`}
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="requests" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1E9FD8" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#1E9FD8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="blocked" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#2E3E55"
                  vertical={false}
                />
                <XAxis
                  dataKey="time"
                  stroke="#6C7F99"
                  tick={{ fill: "#6C7F99", fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={30}
                />
                <YAxis
                  stroke="#6C7F99"
                  tick={{ fill: "#6C7F99", fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "#0F1622",
                    border: "1px solid #223044",
                    borderRadius: "8px",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
                  }}
                  labelStyle={{ color: "#DEE7F0" }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: "12px" }}
                  formatter={(value) => (
                    <span style={{ color: "#96A8BF", fontSize: "12px" }}>
                      {value}
                    </span>
                  )}
                />
                <Area
                  type="monotone"
                  dataKey="requests"
                  stroke="#1E9FD8"
                  strokeWidth={2}
                  fill="url(#requests)"
                  name="Total Requests"
                  isAnimationActive
                  animationDuration={500}
                />
                <Area
                  type="monotone"
                  dataKey="blocked"
                  stroke="#EF4444"
                  strokeWidth={2}
                  fill="url(#blocked)"
                  name="Blocked"
                  isAnimationActive
                  animationDuration={500}
                />
              </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
