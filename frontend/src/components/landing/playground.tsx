"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Terminal, Radar, Globe, ArrowUpRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SectionHeading } from "@/components/landing/shared"

const playgroundPoints = [
  { icon: Terminal, text: "Live scoring against all 16 engines with per-rule evidence" },
  { icon: Radar, text: "Attacker dossiers: kill chains, threat types, and geo for every IP" },
  { icon: Globe, text: "Attack map: watch blocked traffic light up the globe in real time" },
]

export function Playground() {
  return (
    <section id="playground" className="py-24 sm:py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(217,70,239,0.07),transparent_55%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(34,211,238,0.06),transparent_55%)] pointer-events-none" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <SectionHeading
            align="left"
            eyebrow="Public Playground"
            eyebrowColor="text-fuchsia-400"
            title="Attack the WAF."
            highlight="It bites back."
            subtitle="No signup, no setup. Throw payloads at the live detection engine and watch it score, explain, and block them in real time — complete with the exact evidence snippet that tripped each rule."
          />
          <div className="space-y-4 -mt-4">
            {playgroundPoints.map((item) => (
              <div key={item.text} className="flex items-center gap-3 text-sm text-zinc-400">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-fuchsia-500/20 bg-fuchsia-500/10 text-fuchsia-400">
                  <item.icon className="h-4 w-4" />
                </span>
                {item.text}
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <Button
              asChild
              size="lg"
              className="h-12 px-7 text-[15px] bg-gradient-to-r from-fuchsia-600 to-purple-600 shadow-xl shadow-fuchsia-600/25 hover:scale-[1.02]"
            >
              <Link href="/playground">
                Open the Playground
                <ArrowUpRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-12 px-7 text-[15px] bg-zinc-900/50 hover:bg-zinc-800/70"
            >
              <Link href="/dashboard/attack-map">View the attack map</Link>
            </Button>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 32 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          <div className="absolute -inset-4 bg-gradient-to-br from-fuchsia-600/10 to-cyan-600/10 blur-2xl rounded-3xl pointer-events-none" />
          <div className="relative rounded-2xl border border-zinc-800 bg-zinc-950/90 shadow-2xl shadow-black/50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/60">
              <div className="flex items-center gap-2.5">
                <span className="h-3 w-3 rounded-full bg-red-500/80" />
                <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
                <span className="h-3 w-3 rounded-full bg-green-500/80" />
                <span className="ml-2 text-xs text-zinc-500 font-mono">/playground</span>
              </div>
              <span className="text-[10px] text-zinc-600 font-mono">shareable · no login</span>
            </div>
            <div className="p-5 space-y-3">
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-3.5 py-2.5 font-mono text-[13px] text-zinc-300">
                {"user=admin' OR '1'='1' --"}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {["SQLi", "XSS", "SSRF", "Cmd", "LFI", "SSTI", "Smuggling", "GraphQL"].map((chip) => (
                  <span key={chip} className="rounded-full border border-zinc-800 bg-zinc-900/60 px-2.5 py-1 text-[10px] font-medium text-zinc-500">
                    {chip}
                  </span>
                ))}
              </div>
              <div className="rounded-lg border border-red-500/25 bg-red-500/[0.07] p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-red-400 font-mono">SQL_INJECTION</span>
                  <span className="rounded-full bg-red-500/15 border border-red-500/30 px-2 py-0.5 text-[10px] font-semibold text-red-400">
                    BLOCKED · 403
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                  <span>score 100 · evidence</span>
                  <span className="text-red-400/70">{"' OR '1'='1' --"}</span>
                </div>
              </div>
              <div className="rounded-lg border border-yellow-500/25 bg-yellow-500/[0.06] p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-yellow-400 font-mono">BOT_TRAFFIC</span>
                  <span className="text-[11px] text-zinc-500">score 60</span>
                </div>
                <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: "60%" }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.9, ease: "easeOut" }}
                    className="h-full rounded-full bg-yellow-500"
                  />
                </div>
              </div>
              <p className="text-[11px] text-zinc-600 pt-1">
                Real verdicts from the live engine — copy any share link to embed a payload for your team.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}