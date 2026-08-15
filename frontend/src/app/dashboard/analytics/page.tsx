"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { analyticsService } from "@/services/analytics"
import type { GeoCountry } from "@/types"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from "recharts"
import { Activity, Shield, AlertTriangle, Ban, Globe2 } from "lucide-react"

export default function AnalyticsPage() {
  const [geoHours, setGeoHours] = useState(24)

  const { data: trafficData } = useQuery({
    queryKey: ["analytics", "traffic"],
    queryFn: () => analyticsService.getTrafficStats("7d"),
  })

  const { data: overview } = useQuery({
    queryKey: ["analytics", "overview"],
    queryFn: () => analyticsService.getOverview(),
  })

  const { data: geoData, isLoading: geoLoading } = useQuery({
    queryKey: ["analytics", "geo", geoHours],
    queryFn: () => analyticsService.getGeo(geoHours),
  })

  const trafficChart = trafficData?.traffic_trend?.map((d) => ({
    date: d.date?.slice(5, 10) || d.date,
    requests: d.requests || d.total_requests || d.count || 0,
    blocked: d.blocked || 0,
    allowed: d.allowed || 0,
  })) || []

  const attackChart = trafficData?.attack_distribution?.map((d) => ({
    name: d.name || d.attack_type || "Unknown",
    count: d.value || d.count || 0,
  })) || []

  const countries = geoData?.countries ?? []
  const maxTotal = Math.max(1, ...countries.map((c) => c.total ?? 0))

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

      <Card>
        <CardContent className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                <Globe2 className="h-5 w-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="font-medium text-zinc-200">Geographic Threat Map</h3>
                <p className="text-xs text-zinc-500">
                  Traffic and attack volume by source country
                </p>
              </div>
            </div>
            <div className="flex gap-1 rounded-lg border border-zinc-800 bg-zinc-900/50 p-1">
              {[6, 24, 168].map((h) => (
                <button
                  key={h}
                  onClick={() => setGeoHours(h)}
                  className={`rounded-md px-3 py-1 text-xs transition-all ${
                    geoHours === h
                      ? "bg-blue-600/20 text-blue-300"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {h === 168 ? "7d" : `${h}h`}
                </button>
              ))}
            </div>
          </div>

          {geoLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 rounded-lg" />
              ))}
            </div>
          ) : countries.length === 0 ? (
            <p className="py-10 text-center text-sm text-zinc-600">
              No geo data yet — blocked traffic will appear here.
            </p>
          ) : (
            <div className="space-y-2.5">
              {countries.map((c: GeoCountry, i: number) => (
                <div key={c.country} className="group">
                  <div className="flex items-center gap-3 text-sm mb-1">
                    <span className="w-6 text-xs text-zinc-600 font-mono">#{i + 1}</span>
                    <span className="w-32 font-medium text-zinc-300">
                      {c.country === "Unknown" ? "Unknown / Tor" : c.country}
                    </span>
                    <span className="ml-auto text-xs text-zinc-500 tabular-nums">
                      {c.total} requests
                    </span>
                  </div>
                  <div className="ml-9 flex h-2 overflow-hidden rounded-full bg-zinc-800/60">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                      style={{ width: `${Math.max(3, (c.total / maxTotal) * 100)}%` }}
                    />
                  </div>
                  {(c.attacks ?? []).length > 0 && (
                    <div className="ml-9 mt-1.5 flex flex-wrap gap-1.5">
                      {c.attacks.map((a) => (
                        <span
                          key={a.type}
                          className="rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-[10px] text-red-400"
                        >
                          {a.type} × {a.count}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
