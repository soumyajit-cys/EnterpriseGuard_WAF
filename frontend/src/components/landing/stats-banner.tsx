"use client"

import { motion } from "framer-motion"
import { Activity, ShieldBan, AlertTriangle, Layers } from "lucide-react"
import { cn } from "@/lib/utils"
import { AnimatedCounter, SectionHeading } from "@/components/landing/shared"
import type { PublicStats } from "@/components/landing/shared"

export function StatsBanner({ stats }: { stats: PublicStats | null }) {
  return (
    <section id="stats" className="py-24 border-y border-zinc-800/50 bg-zinc-900/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(37,99,235,0.08),transparent_65%)] pointer-events-none" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Live Telemetry"
            title="Real numbers."
            highlight="Real protection."
            subtitle="Telemetry streamed straight from the WAF engine as it guards your application."
          />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Requests Analyzed", value: stats?.total_requests ?? 0, icon: Activity, chip: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
              { label: "Attacks Blocked", value: stats?.total_blocked ?? 0, icon: ShieldBan, chip: "bg-red-500/10 text-red-400 border-red-500/20" },
              { label: "Alerts Raised", value: stats?.total_alerts ?? 0, icon: AlertTriangle, chip: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
              { label: "Active Rules", value: stats?.active_rules ?? 16, icon: Layers, chip: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="card-surface rounded-2xl p-6 text-center glow"
              >
                <div className={cn("h-11 w-11 rounded-xl border flex items-center justify-center mx-auto mb-4", stat.chip)}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <p className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-b from-zinc-50 to-zinc-500 bg-clip-text text-transparent tabular-nums">
                  <AnimatedCounter value={stat.value} />
                </p>
                <p className="mt-2 text-sm text-zinc-500">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    )
}