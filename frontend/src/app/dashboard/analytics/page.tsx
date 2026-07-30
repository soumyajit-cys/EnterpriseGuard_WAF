"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { analyticsService } from "@/services/analytics"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from "recharts"
import { Activity, Shield, AlertTriangle, Ban } from "lucide-react"

export default function AnalyticsPage() {
  const { data: trafficData } = useQuery({
    queryKey: ["analytics", "traffic"],
    queryFn: () => analyticsService.getTrafficStats("7d"),
  })

  const { data: attackData } = useQuery({
    queryKey: ["analytics", "attacks"],
    queryFn: () => analyticsService.getAttackStats("7d"),
  })

  const { data: overview } = useQuery({
    queryKey: ["analytics", "overview"],
    queryFn: () => analyticsService.getOverview(),
  })

  const trafficChart = trafficData?.map((d: any) => ({
    date: d.date?.slice(5, 10) || d.date,
    requests: d.total_requests || d.count || 0,
    blocked: d.blocked || 0,
    allowed: d.allowed || 0,
  })) || []

  const attackChart = attackData?.map((d: any) => ({
    name: d.attack_type || d.name || "Unknown",
    count: d.count || 0,
  })) || []

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <PageHeader title="Analytics" description="Security analytics and insights" />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600/10"><Activity className="h-6 w-6 text-blue-400" /></div>
            <div>
              <p className="text-2xl font-bold text-zinc-100">{overview?.total_requests || 0}</p>
              <p className="text-xs text-zinc-500">Total Requests</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-600/10"><Shield className="h-6 w-6 text-green-400" /></div>
            <div>
              <p className="text-2xl font-bold text-zinc-100">{overview?.blocked || 0}</p>
              <p className="text-xs text-zinc-500">Blocked</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-600/10"><AlertTriangle className="h-6 w-6 text-red-400" /></div>
            <div>
              <p className="text-2xl font-bold text-zinc-100">{overview?.alerts || 0}</p>
              <p className="text-xs text-zinc-500">Alerts</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-600/10"><Ban className="h-6 w-6 text-purple-400" /></div>
            <div>
              <p className="text-2xl font-bold text-zinc-100">{overview?.blocked_ips || 0}</p>
              <p className="text-xs text-zinc-500">Blocked IPs</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium text-zinc-200 mb-4">Traffic Overview</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trafficChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="date" stroke="#a1a1aa" fontSize={12} />
                  <YAxis stroke="#a1a1aa" fontSize={12} />
                  <Tooltip
                    contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: "8px" }}
                    labelStyle={{ color: "#e4e4e7" }}
                  />
                  <Area type="monotone" dataKey="requests" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} />
                  <Area type="monotone" dataKey="blocked" stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium text-zinc-200 mb-4">Attack Distribution</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attackChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="name" stroke="#a1a1aa" fontSize={12} />
                  <YAxis stroke="#a1a1aa" fontSize={12} />
                  <Tooltip
                    contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: "8px" }}
                    labelStyle={{ color: "#e4e4e7" }}
                  />
                  <Bar dataKey="count" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}
