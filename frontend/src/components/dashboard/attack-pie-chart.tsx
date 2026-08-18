"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { analyticsService } from "@/services/analytics"

const COLORS = ["#E5484D", "#E87B2B", "#E3B341", "#4FA3E8", "#1FC6D8", "#7B95B0"]

const periods = ["live", "24h", "7d", "30d"] as const
type Period = (typeof periods)[number]

export function AttackPieChart() {
  const [period, setPeriod] = useState<Period>("live")

  const { data, isLoading } = useQuery({
    queryKey: ["attack-distribution", period],
    queryFn: () => analyticsService.getTraffic(period),
    refetchInterval: 30000,
  })

  const distribution = (data?.attack_distribution ?? []) as Array<{
    name: string
    value: number
  }>

  const chartData = distribution.slice(0, 6).map((item) => ({
    name: item.name.split(",")[0],
    fullName: item.name,
    value: item.value,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attack Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-end gap-1 mb-2">
          {periods.map((p) => (
            <Button
              key={p}
              variant={period === p ? "default" : "ghost"}
              size="sm"
              onClick={() => setPeriod(p)}
              className="text-xs"
            >
              {p === "live" ? "Live" : p}
            </Button>
          ))}
        </div>
        <div className="h-[300px]">
          {isLoading ? (
            <Skeleton className="h-[260px] w-full" />
          ) : chartData.length === 0 ? (
            <div className="flex h-[260px] items-center justify-center text-sm text-zinc-500">
              No attacks detected in this period
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {chartData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      stroke="transparent"
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#0F1622",
                    border: "1px solid #223044",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#DEE7F0" }}
                  formatter={(value, name, item) => {
                    const payload = (item as { payload?: { fullName?: string } } | undefined)?.payload
                    const fullName = payload?.fullName ?? String(name)
                    return [`${value} requests`, fullName]
                  }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: "12px" }}
                  formatter={(value) => (
                    <span style={{ color: "#A1A1AA", fontSize: "12px" }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
