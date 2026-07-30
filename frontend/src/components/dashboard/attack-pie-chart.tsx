"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const data = [
  { name: "SQL Injection", value: 35 },
  { name: "XSS", value: 28 },
  { name: "Command Injection", value: 15 },
  { name: "Path Traversal", value: 12 },
  { name: "Bot Traffic", value: 10 },
]

const COLORS = ["#EF4444", "#F59E0B", "#06B6D4", "#8B5CF6", "#22C55E"]

export function AttackPieChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Attack Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={4}
                dataKey="value"
              >
                {data.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                    stroke="transparent"
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "#18181B",
                  border: "1px solid #27272A",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#E4E4E7" }}
              />
              <Legend
                wrapperStyle={{ paddingTop: "12px" }}
                formatter={(value) => (
                  <span style={{ color: "#A1A1AA", fontSize: "12px" }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
