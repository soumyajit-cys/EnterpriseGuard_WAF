"use client"

import { useEffect, useState } from "react"
import { useRef } from "react"
import Link from "next/link"
import { motion, useInView } from "framer-motion"
import {
  ShieldCheck,
  ShieldAlert,
  ShieldBan,
  Activity,
  Globe,
  Lock,
  Radar,
  BrainCircuit,
  ArrowRight,
  Gauge,
  AlertTriangle,
  Layers,
  Network,
  ScanLine,
  Terminal,
  Bug,
  ArrowUpRight,
  Sparkles,
  Fingerprint,
  Wifi,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn, formatNumber } from "@/lib/utils"
import { useAuthStore } from "@/store/auth-store"
import { publicService } from "@/services/public"

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Playground", href: "#playground" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Threats blocked", href: "#threats" },
  { label: "Live stats", href: "#stats" },
]

const features = [
  {
    icon: ScanLine,
    title: "SQL Injection Shield",
    description:
      "Real-time detection of SQLi payloads across query params, bodies, and headers using a multi-pattern scoring engine.",
    iconBg: "from-red-500 to-rose-600",
    iconShadow: "shadow-red-500/25",
    hoverBorder: "hover:border-red-500/40",
    tag: "SQLi",
  },
  {
    icon: Bug,
    title: "XSS & Command Injection",
    description:
      "Neutralizes cross-site scripting, command injection, and LDAP injection before they ever reach your application.",
    iconBg: "from-orange-500 to-amber-600",
    iconShadow: "shadow-orange-500/25",
    hoverBorder: "hover:border-orange-500/40",
    tag: "XSS",
  },
  {
    icon: Globe,
    title: "SSRF Protection",
    description:
      "Blocks server-side request forgery attempts that try to pivot into your internal network from the edge.",
    iconBg: "from-cyan-500 to-sky-600",
    iconShadow: "shadow-cyan-500/25",
    hoverBorder: "hover:border-cyan-500/40",
    tag: "SSRF",
  },
  {
    icon: Radar,
    title: "Bot Traffic Detection",
    description:
      "Identifies automated scraping, credential stuffing, and brute-force traffic patterns instantly.",
    iconBg: "from-purple-500 to-violet-600",
    iconShadow: "shadow-purple-500/25",
    hoverBorder: "hover:border-purple-500/40",
    tag: "BOT",
  },
  {
    icon: Gauge,
    title: "Rate Limiting",
    description:
      "Per-IP sliding window rate limits stop DDoS and abuse without affecting legitimate users.",
    iconBg: "from-blue-500 to-indigo-600",
    iconShadow: "shadow-blue-500/25",
    hoverBorder: "hover:border-blue-500/40",
    tag: "DDoS",
  },
  {
    icon: Fingerprint,
    title: "CSRF Protection",
    description:
      "Token-based CSRF validation on all state-changing requests out of the box.",
    iconBg: "from-emerald-500 to-green-600",
    iconShadow: "shadow-emerald-500/25",
    hoverBorder: "hover:border-emerald-500/40",
    tag: "CSRF",
  },
  {
    icon: Lock,
    title: "Block & Allow Lists",
    description:
      "Manage persistent blocklists and allowlists per IP with expiry, straight from the dashboard.",
    iconBg: "from-indigo-500 to-blue-600",
    iconShadow: "shadow-indigo-500/25",
    hoverBorder: "hover:border-indigo-500/40",
    tag: "IP",
  },
  {
    icon: BrainCircuit,
    title: "Scoring Engine",
    description:
      "Every request is layered across 16 detection engines — SQLi, XSS, SSRF, smuggling, GraphQL abuse, malicious uploads and more. High scores auto-block in prevention mode.",
    iconBg: "from-pink-500 to-fuchsia-600",
    iconShadow: "shadow-pink-500/25",
    hoverBorder: "hover:border-pink-500/40",
    tag: "16 ENGINES",
  },
]

const steps = [
  {
    icon: Network,
    step: "01",
    title: "Inspect",
    description:
      "Every request passes through the WAF middleware before reaching your API. No blind spots, no exceptions.",
  },
  {
    icon: BrainCircuit,
    step: "02",
    title: "Score",
    description:
      "16 detection engines analyze the request across patterns, headers, and body — producing a threat score.",
  },
  {
    icon: ShieldBan,
    step: "03",
    title: "Block or Allow",
    description:
      "Scores above the threshold are blocked with a 403. Everything is logged, alerting in real time.",
  },
]

const threatTypes = [
  { name: "SQL Injection", risk: "Critical", color: "text-red-400", bar: "bg-red-500" },
  { name: "XSS Attacks", risk: "High", color: "text-orange-400", bar: "bg-orange-500" },
  { name: "SSRF", risk: "High", color: "text-cyan-400", bar: "bg-cyan-500" },
  { name: "LDAP Injection", risk: "Critical", color: "text-red-400", bar: "bg-red-500" },
  { name: "Command Injection", risk: "Critical", color: "text-red-400", bar: "bg-red-500" },
  { name: "Bot Traffic", risk: "Medium", color: "text-purple-400", bar: "bg-purple-500" },
  { name: "CSRF Abuse", risk: "High", color: "text-yellow-400", bar: "bg-yellow-500" },
]

function AnimatedCounter({
  value,
  suffix = "",
  duration = 1.5,
}: {
  value: number
  suffix?: string
  duration?: number
}) {
  const [display, setDisplay] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (!inView) return
    let start: number | null = null
    const step = (ts: number) => {
      if (!start) start = ts
      const progress = Math.min((ts - start) / (duration * 1000), 1)
      setDisplay(Math.round(value * (1 - Math.pow(1 - progress, 3))))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [inView, value, duration])

  return (
    <span ref={ref}>
      {formatNumber(display)}
      {suffix}
    </span>
  )
}

function SectionHeading({
  eyebrow,
  eyebrowColor = "text-blue-400",
  title,
  highlight,
  subtitle,
  align = "center",
}: {
  eyebrow: string
  eyebrowColor?: string
  title: string
  highlight: string
  subtitle: string
  align?: "center" | "left"
}) {
  return (
    <div
      className={cn(
        "max-w-2xl mb-16",
        align === "center" && "text-center mx-auto"
      )}
    >
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest",
          eyebrowColor
        )}
      >
        {eyebrow}
      </span>
      <h2 className="mt-4 text-3xl sm:text-4xl lg:text-[2.75rem] font-bold tracking-tight leading-[1.1] text-balance">
        {title} <span className="text-gradient">{highlight}</span>
      </h2>
      <p className="mt-4 text-zinc-400 leading-relaxed text-[15px]">{subtitle}</p>
    </div>
  )
}

export default function LandingPage() {
  const { isAuthenticated } = useAuthStore()
  const [stats, setStats] = useState<{
    total_requests: number
    total_blocked: number
    total_alerts: number
    active_rules: number
    attack_rate_24h: number
  } | null>(null)
  const statsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let mounted = true
    const fetchStats = async () => {
      try {
        const data = await publicService.getStats()
        if (mounted) setStats(data)
      } catch {
        if (mounted) setStats(null)
      }
    }
    fetchStats()
    const interval = setInterval(fetchStats, 30000)
    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 overflow-x-hidden">
      {/* ============ NAV ============ */}
      <header className="fixed top-0 inset-x-0 z-50 border-b border-white/5 bg-zinc-950/70 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-all">
                <ShieldCheck className="h-5 w-5 text-white" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
            </div>
            <div>
              <p className="font-bold text-[15px] leading-none tracking-tight">
                Enterprise<span className="text-gradient">Guard</span>
              </p>
              <p className="text-[10px] text-zinc-500 leading-none mt-1 tracking-widest uppercase">
                WAF Platform
              </p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-3.5 py-2 rounded-lg text-sm text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60 transition-all"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2.5">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="h-9 bg-gradient-to-r from-blue-600 to-cyan-600 shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40"
            >
              <Link href={isAuthenticated ? "/dashboard" : "/register"}>
                {isAuthenticated ? "Open Dashboard" : "Get Started"}
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* ============ HERO ============ */}
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
                {stats ? `${stats.active_rules} detection engines` : "9 detection engines"}
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
              9 attack detection engines, and blocks malicious traffic before it
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

      {/* ============ THREAT TICKER ============ */}
      <section className="border-y border-zinc-800/50 bg-zinc-900/30 py-3 overflow-hidden">
        <div className="flex whitespace-nowrap animate-marquee">
          {[0, 1].map((dup) => (
            <div key={dup} className="flex shrink-0">
              {threatTypes.map((t) => (
                <span key={`${dup}-${t.name}`} className="flex items-center gap-2 mx-6 text-sm">
                  <ShieldAlert className="h-3.5 w-3.5 text-red-500" />
                  <span className="text-zinc-300">{t.name}</span>
                  <span className={`text-xs font-medium ${t.color}`}>{t.risk}</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ============ FEATURES ============ */}
      <section id="features" className="py-24 sm:py-32 relative">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Protection Stack"
            title="Every attack class,"
            highlight="covered"
            subtitle="A defense-in-depth engine that inspects headers, query strings, and request bodies — catching what signature-based WAFs miss."
          />

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: (i % 4) * 0.08 }}
                whileHover={{ y: -6 }}
                className={cn(
                  "group relative rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 transition-all duration-300 hover:bg-zinc-900/70 hover:shadow-2xl hover:shadow-black/40",
                  feature.hoverBorder
                )}
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/[0.06] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                <div className="flex items-start justify-between mb-5">
                  <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3", feature.iconBg, feature.iconShadow)}>
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <span className="rounded-full border border-zinc-800 bg-zinc-950/60 px-2 py-0.5 text-[9px] font-semibold tracking-widest text-zinc-500">
                    {feature.tag}
                  </span>
                </div>
                <h3 className="font-semibold text-[15px] mb-2">{feature.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section id="how-it-works" className="py-24 sm:py-32 bg-zinc-900/20 border-y border-zinc-800/50 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(34,211,238,0.06),transparent_60%)] pointer-events-none" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Architecture"
            eyebrowColor="text-cyan-400"
            title="Three steps."
            highlight="Zero latency grief."
            subtitle="The engine sits as ASGI middleware — every request is inspected with sub-millisecond overhead."
          />

          <div className="grid md:grid-cols-3 gap-6 relative">
            <div className="hidden md:block absolute top-16 left-[16%] right-[16%] h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent" />
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="relative text-center"
              >
                <div className="relative inline-flex">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700 flex items-center justify-center mx-auto glow">
                    <step.icon className="h-6 w-6 text-blue-400" />
                  </div>
                  <span className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 text-white text-[11px] font-bold flex items-center justify-center shadow-lg shadow-blue-600/30">
                    {i + 1}
                  </span>
                </div>
                <h3 className="mt-5 font-semibold text-lg">{step.title}</h3>
                <p className="mt-2 text-sm text-zinc-500 leading-relaxed max-w-xs mx-auto">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Terminal mockup */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.6 }}
            className="mt-20 max-w-2xl mx-auto"
          >
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/90 shadow-2xl shadow-black/50 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800 bg-zinc-900/60">
                <span className="h-3 w-3 rounded-full bg-red-500/80" />
                <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
                <span className="h-3 w-3 rounded-full bg-green-500/80" />
                <span className="ml-3 text-xs text-zinc-500 font-mono">
                  enterpriseguard — waf engine
                </span>
              </div>
              <div className="p-5 font-mono text-[13px] leading-7">
                <p className="text-zinc-500">
                  <span className="text-emerald-400">$</span> curl -X POST /api/login \
                  <span className="text-zinc-600"> -d 'user=admin&#39; OR 1=1--'</span>
                </p>
                <p className="text-red-400 mt-2">
                  {"[WAF] SQL_INJECTION detected · score 100"}
                </p>
                <p className="text-red-400">
                  {"[WAF] LDAP_INJECTION detected · score 70"}
                </p>
                <p className="text-yellow-400">
                  {"[WAF] Request blocked · 403 Forbidden"}
                </p>
                <p className="text-zinc-600 mt-2">HTTP/1.1 403 Forbidden</p>
                <p className="text-zinc-500">
                  {"{"} "status": "blocked", "reason": "SQL_INJECTION" {"}"}
                </p>
                <p className="text-emerald-400 mt-3">
                  {"[ALERT] Critical alert created → dashboard"}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============ THREATS BLOCKED ============ */}
      <section id="threats" className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <SectionHeading
              align="left"
              eyebrow="Threat Coverage"
              eyebrowColor="text-red-400"
              title="The OWASP Top 10,"
              highlight="handled."
              subtitle="Each detection rule is a dedicated scoring engine with curated payload patterns — layered so a single attack often trips multiple detectors, producing a combined threat score that's hard to evade."
            />
            <div className="space-y-4 -mt-4">
              {threatTypes.slice(0, 4).map((t) => (
                <div key={t.name} className="flex items-center gap-4">
                  <span className={`text-sm font-medium w-44 ${t.color}`}>{t.name}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${100 - t.name.length * 3}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={`h-full rounded-full ${t.bar}`}
                    />
                  </div>
                  <span className="text-xs text-zinc-500">{t.risk}</span>
                </div>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="absolute -inset-4 bg-gradient-to-br from-blue-600/10 to-cyan-600/10 blur-2xl rounded-3xl pointer-events-none" />
            <div className="relative card-surface rounded-2xl p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                    <Terminal className="h-4 w-4 text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Live Block Log</p>
                    <p className="text-xs text-zinc-500">Prevention mode · real-time</p>
                  </div>
                </div>
                <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  LIVE
                </span>
              </div>
              <div className="space-y-3 font-mono text-xs">
                {[
                  { time: "10:42:17", ip: "203.0.113.45", type: "SQL_INJECTION", score: 100, action: "BLOCKED" },
                  { time: "10:41:58", ip: "198.51.100.8", type: "SSRF", score: 85, action: "BLOCKED" },
                  { time: "10:41:03", ip: "203.0.113.99", type: "BOT_TRAFFIC", score: 60, action: "BLOCKED" },
                  { time: "10:40:44", ip: "192.0.2.77", type: "XSS", score: 95, action: "BLOCKED" },
                  { time: "10:39:31", ip: "198.51.100.21", type: "CMD_INJECTION", score: 90, action: "BLOCKED" },
                ].map((row, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.12 }}
                    className="flex items-center justify-between rounded-lg bg-zinc-950/70 border border-zinc-800 px-3 py-2.5"
                  >
                    <span className="text-zinc-600">{row.time}</span>
                    <span className="text-zinc-400">{row.ip}</span>
                    <span className="text-yellow-400">{row.type}</span>
                    <span className="text-zinc-500">score {row.score}</span>
                    <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 text-[10px] border border-red-500/20">
                      {row.action}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============ STATS BANNER ============ */}
      <section id="stats" ref={statsRef} className="py-24 border-y border-zinc-800/50 bg-zinc-900/20 relative overflow-hidden">
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
              { label: "Active Rules", value: stats?.active_rules ?? 9, icon: Layers, chip: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" },
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

      {/* ============ CTA ============ */}
      <section className="py-24 sm:py-32 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(37,99,235,0.12),transparent_60%)] pointer-events-none" />
        <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-3xl bg-gradient-to-b from-blue-500/40 via-zinc-700/60 to-zinc-800/60 p-px"
          >
            <div className="rounded-[calc(1.5rem-1px)] bg-zinc-950/95 p-10 sm:p-14">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-500/30">
                <ShieldCheck className="h-7 w-7 text-white" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-balance">
                Ready to see what's attacking{" "}
                <span className="text-gradient">your app?</span>
              </h2>
              <p className="mt-4 text-zinc-400 leading-relaxed">
                Spin up the dashboard and watch live traffic get scored and blocked
                in real time. Set up takes less than a minute.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  asChild
                  size="lg"
                  className="w-full sm:w-auto h-12 px-8 text-[15px] bg-gradient-to-r from-blue-600 to-cyan-600 shadow-xl shadow-blue-600/30 hover:scale-[1.02]"
                >
                  <Link href={isAuthenticated ? "/dashboard" : "/register"}>
                    {isAuthenticated ? "Open Dashboard" : "Get Started Free"}
                    <ArrowUpRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto h-12 px-8 text-[15px] bg-zinc-900/50 hover:bg-zinc-800/70"
                >
                  <Link href="/login">Sign In</Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="border-t border-white/5 bg-zinc-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/25">
                  <ShieldCheck className="h-4 w-4 text-white" />
                </div>
                <p className="font-bold text-sm leading-none">
                  Enterprise<span className="text-gradient">Guard</span>
                </p>
              </Link>
              <p className="mt-4 text-sm text-zinc-500 leading-relaxed max-w-xs">
                The edge against modern web threats. A lightweight, self-hosted WAF
                that scores every request and blocks what matters.
              </p>
              <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                </span>
                <span className="text-[11px] text-zinc-400">All systems operational</span>
              </div>
            </div>

            {[
              {
                title: "Product",
                links: ["Features", "How it works", "Threat coverage", "Live stats"],
              },
              {
                title: "Resources",
                links: ["Documentation", "Status", "Changelog", "Security"],
              },
              {
                title: "Company",
                links: ["About", "Contact", "Privacy", "Terms"],
              },
            ].map((col) => (
              <div key={col.title}>
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-4">
                  {col.title}
                </p>
                <ul className="space-y-3">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-14 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-zinc-600">
              © {new Date().getFullYear()} EnterpriseGuard WAF · Built with FastAPI, Redis & Next.js
            </p>
            <div className="flex items-center gap-2 text-xs text-zinc-600">
              <Sparkles className="h-3.5 w-3.5 text-blue-500/60" />
              Protection that never sleeps
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
