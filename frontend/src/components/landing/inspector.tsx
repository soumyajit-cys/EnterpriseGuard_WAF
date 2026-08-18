"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { Activity, ScanLine, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { VerdictChip } from "@/components/ui/verdict-chip"
import { ScoreBar } from "@/components/ui/score-bar"
import { SeverityChip } from "@/components/ui/severity-chip"

const HEX_LINES = [
  {
    hex: "47 45 54 20 2f 73 65 61 72 63 68 3f 71 3d 25 33",
    ascii: "GET /search?q=%3",
  },
  {
    hex: "43 73 63 72 69 70 74 25 33 45 61 6c 65 72 74 25",
    ascii: "Cscript%3Ealert%",
    highlighted: true,
  },
  {
    hex: "32 38 25 32 37 78 73 73 25 32 37 25 32 39 25 33",
    ascii: "28%27xss%27%29%3",
    highlighted: true,
  },
  {
    hex: "43 25 32 46 73 63 72 69 70 74 25 33 45 20 48 54",
    ascii: "C%2Fscript%3E HT",
    highlighted: true,
  },
  { hex: "54 50 2f 31 2e 31 0d 0a", ascii: "TP/1.1.." },
]

const FINDINGS = [
  { type: "XSS", source: "param q", score: 25 },
  { type: "ENCODED", source: "param q", score: 35 },
]

const EFFECTIVE_SCORE = 60

type Phase = "scan" | "findings" | "score" | "verdict"

const NEXT_PHASE: Record<Phase, Phase> = {
  scan: "findings",
  findings: "score",
  score: "verdict",
  verdict: "scan",
}

const PHASE_MS: Record<Phase, number> = {
  scan: 1700,
  findings: 1000,
  score: 950,
  verdict: 1500,
}

function ScoreCounter({
  target,
  active,
  reduceMotion = false,
}: {
  target: number
  active: boolean
  reduceMotion?: boolean
}) {
  const [value, setValue] = useState(reduceMotion ? target : 0)

  useEffect(() => {
    if (!active) return
    if (reduceMotion) {
      setValue(target)
      return
    }
    const start = performance.now()
    let raf = 0
    const tick = (t: number) => {
      const p = Math.min((t - start) / 800, 1)
      setValue(Math.round(target * (1 - Math.pow(1 - p, 2))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [active, target, reduceMotion])

  return <span className="tabular-nums">{value}</span>
}

export function Inspector() {
  const reduceMotion = useReducedMotion()
  const [phase, setPhase] = useState<Phase>(reduceMotion ? "verdict" : "scan")

  useEffect(() => {
    if (reduceMotion) return
    const t = setTimeout(() => setPhase(NEXT_PHASE[phase]), PHASE_MS[phase])
    return () => clearTimeout(t)
  }, [phase, reduceMotion])

  const showFindings = phase === "findings" || phase === "score" || phase === "verdict"

  return (
    <div className="card-surface relative overflow-hidden rounded-2xl">
      <div className="absolute -top-20 right-0 h-48 w-48 rounded-full bg-blue-500/10 blur-[70px]" />

      <div className="relative">
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400">
              Live inspection
            </span>
          </div>
          <span className="rounded border border-sev-low/30 bg-sev-low/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-sev-low">
            prevention
          </span>
        </div>

        <div className="px-4 pt-3">
          <p className="truncate font-mono text-[11px] text-zinc-400">
            <span className="text-sev-critical">POST</span>{" "}
            <span className="text-zinc-200">
              /search?q=%3Cscript%3Ealert(&apos;xss&apos;)%3C%2Fscript%3E
            </span>{" "}
            <span className="text-zinc-600">HTTP/1.1</span>
          </p>
        </div>

        <div className="mx-4 mt-3 rounded-lg border border-zinc-800 bg-zinc-950/70 p-3 font-mono text-[11px] leading-6">
          <div className="relative overflow-hidden">
            <AnimatePresence>
              {phase === "scan" && (
                <motion.div
                  initial={{ top: "0%" }}
                  animate={{ top: "100%" }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.45, ease: "easeInOut" }}
                  className="pointer-events-none absolute left-0 right-0 -mt-8 flex h-8 items-center"
                  aria-hidden
                >
                  <div className="h-px w-full bg-blue-400/70 shadow-[0_0_12px_rgba(56,182,234,0.9)]" />
                  <ScanLine className="absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 text-blue-300" />
                </motion.div>
              )}
            </AnimatePresence>
            {HEX_LINES.map((line, i) => (
              <div key={i} className="flex">
                <span className="w-10 shrink-0 select-none text-zinc-700">
                  {(i * 16).toString(16).padStart(4, "0")}
                </span>
                <span
                  className={cn(
                    "shrink-0 transition-colors",
                    line.highlighted && showFindings
                      ? "text-sev-critical"
                      : "text-zinc-500"
                  )}
                >
                  {line.hex}
                </span>
                <span className="ml-4 truncate text-zinc-600">
                  {line.ascii}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="px-4 py-3">
          <AnimatePresence>
            {showFindings && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                    Findings — {FINDINGS.length} matches
                  </span>
                  <SeverityChip value={EFFECTIVE_SCORE} />
                </div>
                <div className="space-y-1.5">
                  {FINDINGS.map((f) => (
                    <div
                      key={f.type}
                      className="flex items-center gap-2 rounded border border-sev-critical/20 bg-sev-critical/[0.04] px-2.5 py-1.5"
                    >
                      <X className="h-3 w-3 text-sev-critical" aria-hidden />
                      <span className="font-mono text-[11px] text-zinc-200">
                        {f.type}
                      </span>
                      <span className="font-mono text-[10px] text-zinc-600">
                        {f.source}
                      </span>
                      <span className="ml-auto font-mono text-[11px] tabular-nums text-sev-critical">
                        +{f.score}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-3 border-t border-zinc-800 px-4 py-3">
          <div className="flex-1">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                Effective score
              </span>
              <span
                className={cn(
                  "font-mono text-lg font-bold leading-none",
                  showFindings ? "text-sev-critical" : "text-zinc-600"
                )}
              >
                {showFindings ? (
                  <ScoreCounter target={EFFECTIVE_SCORE} active={phase === "score" || phase === "verdict"} />
                ) : (
                  "0"
                )}
              </span>
            </div>
            <ScoreBar score={showFindings ? EFFECTIVE_SCORE : 0} widthClass="w-full" />
          </div>
          <AnimatePresence>
            {phase === "verdict" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="flex flex-col items-center gap-1"
              >
                <VerdictChip verdict="BLOCK" className="text-xs px-3 py-1" />
                <span className="font-mono text-[10px] text-zinc-600">
                  403 Forbidden
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
