"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useWebSocket } from "@/hooks/useWebSocket"
import { getWsURL } from "@/services/api"
import type { TrafficEvent } from "@/types"

export default function LiveTrafficPage() {
  const [events, setEvents] = useState<TrafficEvent[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [authError, setAuthError] = useState(false)
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
        description="Real-time request monitoring"
      />

      <div className="flex items-center gap-2">
        <div className={`h-2 w-2 rounded-full ${isConnected ? "bg-green-400" : "bg-red-400"}`} />
        <span className="text-sm text-zinc-500">{isConnected ? "Connected" : "Disconnected"}</span>
        {authError && (
          <Badge variant="danger">Auth failed — log in again</Badge>
        )}
      </div>

      <Card>
        <CardContent className="p-0 h-[600px] overflow-y-auto">
          <AnimatePresence>
            {events.map((event, i) => (
              <motion.div
                key={event.id ? `${event.id}-${i}` : i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-4 p-3 border-b border-zinc-800/50 hover:bg-zinc-800/30 text-sm"
              >
                <span className="text-xs text-zinc-600 font-mono w-16 shrink-0">
                  {event.timestamp
                    ? new Date(event.timestamp).toLocaleTimeString()
                    : "—"}
                </span>
                <span className="font-mono text-zinc-400 w-36 shrink-0">{event.ip_address || "-"}</span>
                <Badge variant={event.action === "BLOCK" ? "danger" : "success"} className="w-16 justify-center shrink-0">
                  {event.action || event.status || "ALLOW"}
                </Badge>
                <span className="text-zinc-300 truncate">{event.path || "-"}</span>
                {event.score != null && (
                  <span className={`font-mono shrink-0 ${
                    event.score >= 80 ? "text-red-400" :
                    event.score >= 50 ? "text-yellow-400" :
                    "text-green-400"
                  }`}>
                    {event.score}
                  </span>
                )}
                {event.attack_type && (
                  <Badge variant="warning" className="shrink-0">{event.attack_type}</Badge>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          {events.length === 0 && (
            <div className="text-center py-20 text-zinc-500">
              Waiting for traffic events...
            </div>
          )}
          <div ref={bottomRef} />
        </CardContent>
      </Card>
    </motion.div>
  )
}
