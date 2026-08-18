"use client"

import { motion } from "framer-motion"
import { Terminal } from "lucide-react"
import { SectionHeading, threatTypes } from "@/components/landing/shared"

const blockLogRows = [
  { time: "10:42:17", ip: "203.0.113.45", type: "SQL_INJECTION", score: 100 },
  { time: "10:41:58", ip: "198.51.100.8", type: "SSRF", score: 85 },
  { time: "10:41:03", ip: "203.0.113.99", type: "BOT_TRAFFIC", score: 60 },
  { time: "10:40:44", ip: "192.0.2.77", type: "XSS", score: 95 },
  { time: "10:39:31", ip: "198.51.100.21", type: "COMMAND_INJECTION", score: 90 },
]

export function Threats() {
  return (
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
              {blockLogRows.map((row, i) => (
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
  )
}