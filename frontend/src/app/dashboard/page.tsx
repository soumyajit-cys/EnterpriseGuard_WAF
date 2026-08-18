"use client"

import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import {
  Activity,
  ShieldBan,
  ShieldCheck,
  AlertTriangle,
  Gauge,
  Cpu,
  HardDrive,
} from "lucide-react"
import { StatCard } from "@/components/layout/stat-card"
import { PageHeader } from "@/components/layout/page-header"
import { TrafficChart } from "@/components/dashboard/traffic-chart"
import { AttackPieChart } from "@/components/dashboard/attack-pie-chart"
import { RecentAlerts } from "@/components/dashboard/recent-alerts"
import { TopAttackers } from "@/components/dashboard/top-attackers"
import { dashboardService } from "@/services/dashboard"
import { Skeleton } from "@/components/ui/skeleton"

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: dashboardService.getStats,
    refetchInterval: 30000,
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[400px] rounded-xl" />
      </div>
    )
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <PageHeader
        title="Security Overview"
        description="Real-time overview of your WAF security posture"
        actions={
          <>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.06] px-3 py-1.5 text-xs font-medium text-emerald-400">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              Live
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/[0.06] px-3 py-1.5 text-xs font-medium text-blue-400 capitalize">
              <ShieldCheck className="h-3.5 w-3.5" />
              {stats?.mode ?? "prevention"} mode
            </span>
          </>
        }
      />

      <motion.div
        variants={item}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <StatCard
          title="Requests Today"
          value={stats?.requests_today ?? 0}
          icon={Activity}
          variant="default"
          trend={{ value: 12, positive: true }}
        />
        <StatCard
          title="Blocked Requests"
          value={stats?.blocked_today ?? 0}
          icon={ShieldBan}
          variant="danger"
          trend={{ value: 8, positive: false }}
        />
        <StatCard
          title="Allowed Requests"
          value={stats?.allowed_today ?? 0}
          icon={ShieldCheck}
          variant="success"
          trend={{ value: 15, positive: true }}
        />
        <StatCard
          title="Attack Rate"
          value={stats?.attack_rate ?? "0%"}
          icon={AlertTriangle}
          variant="warning"
          trend={{ value: 2, positive: false }}
        />
      </motion.div>

      <motion.div
        variants={item}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <StatCard
          title="System CPU"
          value={stats ? `${stats.cpu_percent}%` : "—"}
          icon={Cpu}
          variant="success"
        />
        <StatCard
          title="Memory"
          value={
            stats
              ? `${((stats.memory_used_mb ?? 0) / 1024).toFixed(1)} GB`
              : "—"
          }
          icon={HardDrive}
          variant="default"
        />
        <StatCard
          title="WAF Mode"
          value={stats?.mode ?? "unknown"}
          icon={Gauge}
          variant="warning"
        />
        <StatCard
          title="Active Rules"
          value={stats?.active_rules ?? 0}
          icon={ShieldCheck}
          variant="success"
        />
      </motion.div>

      <motion.div variants={item} className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TrafficChart />
        </div>
        <AttackPieChart />
      </motion.div>

      <motion.div variants={item} className="grid gap-6 lg:grid-cols-2">
        <RecentAlerts />
        <TopAttackers />
      </motion.div>
    </motion.div>
  )
}
