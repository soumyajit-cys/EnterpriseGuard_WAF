"use client"

import { motion } from "framer-motion"
import { Globe, User } from "lucide-react"
import type { TrafficEvent } from "@/types"
import { VerdictChip } from "@/components/ui/verdict-chip"
import { ScoreBar } from "@/components/ui/score-bar"
import { SeverityChip } from "@/components/ui/severity-chip"

export function EventInspector({ event }: { event: TrafficEvent }) {
  const attackTypes = (event.attack_type ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="overflow-hidden"
    >
      <div className="border-t border-zinc-800 bg-zinc-950/70 px-4 py-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
            Inspection — {event.id}
          </span>
          <VerdictChip
            verdict={event.action === "RATE_LIMIT" ? "RATE_LIMIT" : event.action}
          />
        </div>

        <p className="truncate font-mono text-xs text-zinc-400">
          <span
            className={
              event.action === "BLOCK" ? "text-sev-critical" : "text-blue-400"
            }
          >
            {event.method}
          </span>{" "}
          <span className="text-zinc-200">{event.path || "-"}</span>{" "}
          <span className="text-zinc-600">HTTP/1.1</span>
        </p>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
            <Globe className="h-3 w-3" aria-hidden />
            <span className="truncate font-mono">{event.ip_address || "-"}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
            <User className="h-3 w-3" aria-hidden />
            <span className="truncate">{event.user_agent || "no user-agent"}</span>
          </div>
          <div className="text-[11px] text-zinc-500">
            status <span className="font-mono">{event.status ?? "-"}</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-zinc-500">
            score
            <ScoreBar score={event.score ?? 0} showValue />
          </div>
        </div>

        {attackTypes.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {attackTypes.map((t) => (
              <span
                key={t}
                className="rounded border border-sev-critical/25 bg-sev-critical/[0.05] px-2 py-0.5 font-mono text-[10px] text-sev-critical"
              >
                {t}
              </span>
            ))}
          </div>
        )}

        <div className="mt-3 flex items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
            Effective score
          </span>
          <ScoreBar score={event.score ?? 0} widthClass="w-full max-w-xs" />
        </div>
      </div>
    </motion.div>
  )
}