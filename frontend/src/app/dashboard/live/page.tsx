"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, RadioTower } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScoreBar } from "@/components/ui/score-bar"
import { VerdictChip } from "@/components/ui/verdict-chip"
import { EventInspector } from "@/components/live-traffic/event-inspector"
import { EmptyState } from "@/components/ui/empty-state"
import { useWebSocket } from "@/hooks/useWebSocket"
import { getWsURL } from "@/services/api"
import { cn } from "@/lib/utils"
import { severityRail, severityFromScore } from "@/lib/severity"
import type { TrafficEvent } from "@/types"

export default function LiveTrafficPage() {
  const [events, setEvents] = useState<TrafficEvent[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [authError, setAuthError] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const wsUrl = getWsURL("/ws/traffic")

  useWebSocket(wsUrl, {
    onOpen: () => {
      setIsConnected(true)
      setAuthError(false)
    },
    onClose: (code) => {
      setIsConnected(false)
      if (code === 4401) setAuthError(true)
    },
    onMessage: (data) => {
      setEvents(prev => {
        const event = data as TrafficEvent
        if (prev.some(e => e.id === event.id)) return prev
        const next = [event, ...prev]
        return next.slice(0, 100)
      })
    },
    noRetryCodes: [4401],
  })

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [events])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <PageHeader
        title="Live Traffic"
        description="Every request the engine inspects, in order — click a row to open its inspection."
      />

      <div className="flex items-center gap-2">
        <span className={cn("h-2 w-2 rounded-full", isConnected ? "bg-emerald-400" : "bg-sev-critical")} />
        <span className="font-mono text-xs text-zinc-500">{isConnected ? "CONNECTED" : "DISCONNECTED"}</span>
        <span className="font-mono text-xs text-zinc-700">·</span>
        <span className="font-mono text-xs text-zinc-500">{events.length} buffered</span>
        {authError && (
          <Badge variant="danger">Auth failed — log in again</Badge>
        )}
      </div>

      <Card>
        <CardContent className="p-0 h-[600px] overflow-y-auto">
          <AnimatePresence initial={false}>
            {events.map((event, i) => {
              const isExpanded = expandedId === event.id
              const level = severityFromScore(event.score)
              return (
                <motion.div
                  key={event.id ? `${event.id}-${i}` : i}
                  layout
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="border-b border-zinc-800/50"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedId(isExpanded ? null : (event.id ?? null))
                    }
                    aria-expanded={isExpanded}
                    className={cn(
                      "flex w-full items-center gap-3 p-3 text-left text-sm transition-colors",
                      isExpanded ? "bg-zinc-800/40" : "hover:bg-zinc-800/30"
                    )}
                  >
                    <span
                      className={cn(
                        "h-8 w-1 shrink-0 rounded-full",
                        severityRail[level]
                      )}
                      aria-hidden
                    />
                    <span className="font-mono text-xs text-zinc-600 w-16 shrink-0">
                      {event.timestamp
                        ? new Date(event.timestamp).toLocaleTimeString()
                        : "—"}
                    </span>
                    <span className="font-mono text-xs text-zinc-500 w-14 shrink-0 hidden sm:inline">
                      {event.method}
                    </span>
                    <span className="font-mono text-xs text-zinc-400 w-36 shrink-0">
                      {event.ip_address || "-"}
                    </span>
                    <span className="text-zinc-300 truncate flex-1">
                      {event.path || "-"}
                    </span>
                    {event.attack_type && (
                      <span className="hidden sm:inline font-mono text-[10px] text-sev-critical truncate max-w-[140px] shrink-0">
                        {event.attack_type}
                      </span>
                    )}
                    <ScoreBar score={event.score ?? 0} className="shrink-0 hidden md:flex" />
                    <VerdictChip
                      verdict={
                        event.action === "RATE_LIMIT" ? "RATE_LIMIT" : event.action
                      }
                      className="shrink-0"
                    />
                    <ChevronDown
                      className={cn(
                        "h-3.5 w-3.5 shrink-0 text-zinc-600 transition-transform",
                        isExpanded && "rotate-180"
                      )}
                      aria-hidden
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {isExpanded && event.id && <EventInspector event={event} />}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </AnimatePresence>
          {events.length === 0 && (
            <EmptyState
              icon={RadioTower}
              title="No requests inspected yet"
              description="Live events appear here as the engine inspects them. Send traffic to your API, or open the playground to generate a few."
            />
          )}
          <div ref={bottomRef} />
        </CardContent>
      </Card>
    </motion.div>
  )
}