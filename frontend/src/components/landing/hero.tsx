"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import {
  ShieldCheck,
  Activity,
  ShieldBan,
  AlertTriangle,
  Gauge,
  ArrowRight,
  Wifi,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { AnimatedCounter } from "@/components/landing/shared"
import type { PublicStats } from "@/components/landing/shared"

export function Hero({ stats, isAuthenticated }: { stats: PublicStats | null; isAuthenticated: boolean }) {
  return (
    <section className="relative pt-36 pb-24 sm:pt-44 sm:pb-32">
      {/* Background FX */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(37,99,235,0.14),transparent_60%)]" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-blue-600/10 blur-[120px] animate-pulse-slow" />
        <div className="absolute top-20 left-[10%] w-64 h-64 rounded-full bg-cyan-500/10 blur-[80px] animate-float" />
        <div className="absolute top-40 right-[10%] w-72 h-72 rounded-full bg-purple-600/10 blur-[90px] animate-float" style={{ animationDelay: "2s" }} />
        <div className="absolute inset-0 opacity-[0.15] animate-grid-fade"
          style={{
            backgroundImage:
              "linear-gradient(rgba(148,163,184,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.08) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
            maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
            WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2.5 rounded-full border border-blue-500/20 bg-blue-500/[0.06] px-4 py-1.5 mb-8 shadow-lg shadow-blue-500/5"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-xs text-zinc-300 font-medium">
              Prevention mode active
            </span>
            <span className="h-3 w-px bg-zinc-700" />
            <span className="text-xs text-zinc-500">
              {stats ? `${stats.active_rules} detection engines` : "16 detection engines"}
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] text-balance"
          >
            Web Application Firewall,{" "}
            <span className="text-gradient">reimagined</span>
            <br />
            for modern threats.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 text-base sm:text-lg text-zinc-400 max-w-xl mx-auto leading-relaxed"
          >
            EnterpriseGuard inspects every request in real time, scores it against
            16 attack detection engines, and blocks malicious traffic before it
            touches your application. No proxies. No agents. Just protection.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto h-12 px-8 text-[15px] bg-gradient-to-r from-blue-600 to-cyan-600 shadow-xl shadow-blue-600/30 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Link href={isAuthenticated ? "/dashboard" : "/register"}>
                {isAuthenticated ? "Open Dashboard" : "Start Securing Now"}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full sm:w-auto h-12 px-8 text-[15px] bg-zinc-900/50 hover:bg-zinc-800/70"
            >
              <a href="#how-it-works">See how it works</a>
            </Button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="mt-8 flex items-center justify-center gap-2 text-xs text-zinc-600"
          >
            <Wifi className="h-3.5 w-3.5 text-emerald-500/70" />
            No agents to install · Sub-millisecond overhead · Works with any stack
          </motion.p>

          {/* Live hero stats */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-3 max-w-2xl mx-auto"
          >
            {[
              { label: "Requests analyzed", value: stats?.total_requests ?? 0, icon: Activity, chip: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
              { label: "Threats blocked", value: stats?.total_blocked ?? 0, icon: ShieldBan, chip: "bg-red-500/10 text-red-400 border-red-500/20" },
              { label: "Alerts generated", value: stats?.total_alerts ?? 0, icon: AlertTriangle, chip: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
              { label: "Attack rate (24h)", value: stats?.attack_rate_24h ?? 0, icon: Gauge, chip: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20", suffix: "%" },
            ].map((stat) => (
              <div key={stat.label} className="card-surface rounded-xl p-4 text-left">
                <div className="flex items-center gap-2 mb-2">
                  <span className={cn("flex h-6 w-6 items-center justify-center rounded-md border", stat.chip)}>
                    <stat.icon className="h-3.5 w-3.5" />
                  </span>
                  <p className="text-[11px] text-zinc-500 truncate">{stat.label}</p>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-zinc-100 tabular-nums">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix ?? ""} />
                </p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}