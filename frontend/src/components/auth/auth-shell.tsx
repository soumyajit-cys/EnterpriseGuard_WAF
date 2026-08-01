"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import {
  ShieldCheck,
  ArrowLeft,
  Radar,
  Lock,
  Activity,
  CheckCircle2,
} from "lucide-react"

const highlights = [
  {
    icon: Radar,
    title: "Real-time threat scoring",
    description: "9 detection engines analyze every single request.",
  },
  {
    icon: Lock,
    title: "Automatic IP blocking",
    description: "Offenders are contained before damage spreads.",
  },
  {
    icon: Activity,
    title: "Full visibility",
    description: "Live traffic, alerts, and analytics in one place.",
  },
]

export function AuthShell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode
  title: string
  subtitle: string
}) {
  return (
    <div className="min-h-screen bg-zinc-950 relative overflow-hidden flex">
      {/* Background FX */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(37,99,235,0.12),transparent_55%)]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-blue-600/5 blur-[120px]" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-cyan-500/10 blur-[100px] animate-float" />
        <div className="absolute inset-0 opacity-[0.08] animate-grid-fade"
          style={{
            backgroundImage:
              "linear-gradient(rgba(148,163,184,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.08) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(ellipse at center, black 20%, transparent 80%)",
            WebkitMaskImage: "radial-gradient(ellipse at center, black 20%, transparent 80%)",
          }}
        />
      </div>

      {/* Brand panel */}
      <div className="hidden lg:flex lg:w-[46%] xl:w-1/2 relative flex-col justify-between border-r border-white/5 bg-zinc-900/30 backdrop-blur-sm p-12 xl:p-16">
        <Link href="/" className="flex items-center gap-2.5 group w-fit">
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-all">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
          </div>
          <div>
            <p className="font-bold text-[15px] leading-none tracking-tight text-zinc-100">
              Enterprise<span className="text-gradient">Guard</span>
            </p>
            <p className="text-[10px] text-zinc-500 leading-none mt-1 tracking-widest uppercase">
              WAF Platform
            </p>
          </div>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          <h2 className="text-3xl xl:text-4xl font-bold tracking-tight leading-[1.15] text-balance">
            One dashboard to see{" "}
            <span className="text-gradient">every threat.</span>
          </h2>
          <p className="mt-4 text-zinc-400 leading-relaxed max-w-md text-[15px]">
            Monitor live traffic, review block logs, and stay ahead of attackers
            with EnterpriseGuard&apos;s real-time WAF console.
          </p>

          <ul className="mt-10 space-y-5">
            {highlights.map((item, i) => (
              <motion.li
                key={item.title}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.12 }}
                className="flex items-start gap-4"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/70 text-blue-400">
                  <item.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-200">{item.title}</p>
                  <p className="text-sm text-zinc-500 mt-0.5">{item.description}</p>
                </div>
              </motion.li>
            ))}
          </ul>
        </motion.div>

        <div className="flex items-center gap-3">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <p className="text-xs text-zinc-500">
            Live protection active ·{" "}
            <span className="text-zinc-300 font-medium">prevention mode</span>
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-4 sm:px-8 py-12">
        <Link
          href="/"
          className="absolute top-6 left-6 inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to home
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="flex items-center justify-center gap-2.5 mb-6 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 shadow-lg shadow-blue-600/30">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <p className="font-bold text-lg text-zinc-100">
              Enterprise<span className="text-gradient">Guard</span> WAF
            </p>
          </div>

          <h1 className="text-2xl font-bold text-zinc-100">{title}</h1>
          <p className="mt-1.5 text-sm text-zinc-500">{subtitle}</p>

          <div className="card-surface rounded-2xl p-8 mt-6">{children}</div>

          <p className="mt-6 flex items-center justify-center gap-2 text-xs text-zinc-600">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500/70" />
            Protected by EnterpriseGuard WAF itself
          </p>
        </motion.div>
      </div>
    </div>
  )
}
