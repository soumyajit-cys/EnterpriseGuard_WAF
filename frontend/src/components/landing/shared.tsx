import { useEffect, useRef, useState } from "react"
import { useInView } from "framer-motion"
import { cn, formatNumber } from "@/lib/utils"
import {
  ScanLine,
  Bug,
  Globe,
  Radar,
  Gauge,
  Fingerprint,
  Lock,
  BrainCircuit,
  Network,
  ShieldBan,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

export const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Playground", href: "#playground" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Threats blocked", href: "#threats" },
  { label: "Live stats", href: "#stats" },
]

export interface Feature {
  icon: LucideIcon
  title: string
  description: string
  iconBg: string
  iconShadow: string
  hoverBorder: string
  tag: string
}

export const features: Feature[] = [
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

export const steps = [
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

export const threatTypes = [
  { name: "SQL Injection", risk: "Critical", color: "text-red-400", bar: "bg-red-500" },
  { name: "XSS Attacks", risk: "High", color: "text-orange-400", bar: "bg-orange-500" },
  { name: "SSRF", risk: "High", color: "text-cyan-400", bar: "bg-cyan-500" },
  { name: "LDAP Injection", risk: "Critical", color: "text-red-400", bar: "bg-red-500" },
  { name: "Command Injection", risk: "Critical", color: "text-red-400", bar: "bg-red-500" },
  { name: "GraphQL Abuse", risk: "High", color: "text-fuchsia-400", bar: "bg-fuchsia-500" },
  { name: "HTTP Smuggling", risk: "Critical", color: "text-red-400", bar: "bg-red-500" },
  { name: "Malicious Upload", risk: "High", color: "text-amber-400", bar: "bg-amber-500" },
  { name: "Bot Traffic", risk: "Medium", color: "text-purple-400", bar: "bg-purple-500" },
  { name: "CSRF Abuse", risk: "High", color: "text-yellow-400", bar: "bg-yellow-500" },
  { name: "Path Traversal", risk: "Critical", color: "text-red-400", bar: "bg-red-500" },
  { name: "SSTI", risk: "High", color: "text-blue-400", bar: "bg-blue-500" },
]

export function AnimatedCounter({
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

export function SectionHeading({
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

export interface PublicStats {
  total_requests: number
  total_blocked: number
  total_alerts: number
  active_rules: number
  attack_rate_24h: number
}