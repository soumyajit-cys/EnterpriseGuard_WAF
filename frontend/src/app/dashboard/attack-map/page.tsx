"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { analyticsService } from "@/services/analytics"
import { useWebSocket } from "@/hooks/useWebSocket"
import { getWsURL } from "@/services/api"
import type { GeoCountry, TrafficEvent } from "@/types"
import { Radio, Crosshair, ShieldAlert } from "lucide-react"
import { VerdictChip } from "@/components/ui/verdict-chip"
import { ScoreBar } from "@/components/ui/score-bar"
import { EmptyState } from "@/components/ui/empty-state"
import { cn } from "@/lib/utils"
import { severityRail, severityFromScore, severityText } from "@/lib/severity"

const COUNTRY_COORDS: Record<string, [number, number]> = {
  US: [39.8, -98.6], CA: [56.1, -106.3], BR: [-14.2, -51.9], AR: [-38.4, -63.6],
  GB: [54.2, -2.4], DE: [51.2, 10.4], FR: [46.2, 2.2], ES: [40.4, -3.7],
  IT: [41.9, 12.6], NL: [52.1, 5.3], PL: [51.9, 19.1], SE: [60.1, 18.6],
  NO: [60.5, 8.5], FI: [61.9, 25.7], CH: [46.8, 8.2], UA: [48.4, 31.2],
  RU: [61.5, 39.3], TR: [39.0, 35.2], IL: [31.0, 34.9], AE: [24.0, 54.0],
  SA: [24.0, 45.0], IN: [20.6, 78.9], PK: [30.4, 69.3], CN: [35.9, 103.9],
  JP: [36.2, 138.2], KR: [35.9, 127.8], HK: [22.4, 114.1], TW: [23.7, 121.0],
  SG: [1.4, 103.8], ID: [-0.8, 113.9], MY: [4.2, 102.0], TH: [15.9, 101.0],
  VN: [16.0, 107.8], PH: [12.9, 121.8], AU: [-25.3, 133.8], NZ: [-40.9, 174.9],
  ZA: [-30.6, 22.9], NG: [9.1, 8.7], EG: [26.8, 30.8], KE: [-0.1, 37.9],
  MX: [23.6, -102.5], CO: [4.6, -74.3], CL: [-35.7, -71.5], PE: [-9.2, -75.0],
  IR: [32.4, 53.7], IQ: [33.2, 43.7], KZ: [48.0, 66.9], BD: [23.7, 90.4],
  RO: [45.9, 25.0], CZ: [49.8, 15.5], GR: [39.1, 21.8], PT: [39.4, -8.2],
  AT: [47.5, 14.6], BE: [50.5, 4.5], IE: [53.4, -8.2], DK: [56.3, 9.5],
}

const project = (lat: number, lng: number, w: number, h: number) => ({
  x: ((lng + 180) / 360) * w,
  y: ((90 - lat) / 180) * h,
})

export default function AttackMapPage() {
  const [hours, setHours] = useState(24)
  const [liveEvents, setLiveEvents] = useState<TrafficEvent[]>([])

  const { data: geoData, isLoading } = useQuery({
    queryKey: ["analytics", "geo", hours],
    queryFn: () => analyticsService.getGeo(hours),
  })

  const eventsRef = useRef<TrafficEvent[]>([])
  useEffect(() => {
    eventsRef.current = liveEvents
  }, [liveEvents])

  const wsUrl = useMemo(() => getWsURL("/ws/traffic"), [])

  useWebSocket(wsUrl, {
    onMessage: (data) => {
      if ((data as TrafficEvent | null)?.event !== "blocked") return
      const event = data as TrafficEvent
      setLiveEvents((prev) => [event, ...prev].slice(0, 12))
    },
    reconnectInterval: 4000,
  })

  const countries = geoData?.countries ?? []
  const maxTotal = Math.max(1, ...countries.map((c) => c.total ?? 0))
  const mapRef = useRef<SVGSVGElement | null>(null)
  const [mapSize] = useState({ w: 900, h: 460 })

  const dots = countries
    .map((c: GeoCountry) => {
      const coords = COUNTRY_COORDS[c.country]
      if (!coords) return null
      const { x, y } = project(coords[0], coords[1], mapSize.w, mapSize.h)
      return { ...c, x, y, intensity: c.total / maxTotal }
    })
    .filter((c): c is NonNullable<typeof c> => c !== null)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <PageHeader
        title="Attack Map"
        description="Live geographic visualization of blocked threats"
        actions={
          <div className="flex gap-1 rounded-lg border border-zinc-800 bg-zinc-900/50 p-1">
            {[6, 24, 168].map((h) => (
              <button
                key={h}
                onClick={() => setHours(h)}
                className={`rounded-md px-3 py-1 text-xs transition-all ${
                  hours === h ? "bg-blue-600/20 text-blue-300" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {h === 168 ? "7d" : `${h}h`}
              </button>
            ))}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Radio className="h-4 w-4 text-cyan-400" />
                <h3 className="font-medium text-zinc-200">Global Threat Radar</h3>
              </div>
              <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 uppercase tracking-widest">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
                Live
              </span>
            </div>

            {isLoading ? (
              <Skeleton className="h-[380px] rounded-xl" />
            ) : (
              <div className="relative overflow-hidden rounded-xl border border-zinc-800 bg-[#070B12]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(30,159,216,0.06),transparent_70%)]" />
                <div className="absolute inset-0 opacity-[0.35]" style={{
                  backgroundImage: "linear-gradient(rgba(34,48,68,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(34,48,68,0.5) 1px, transparent 1px)",
                  backgroundSize: "40px 40px",
                }} />
                <svg
                  ref={mapRef}
                  viewBox={`0 0 ${mapSize.w} ${mapSize.h}`}
                  className="relative w-full"
                >
                  <defs>
                    <radialGradient id="dotGlow">
                      <stop offset="0%" stopColor="#E5484D" stopOpacity="0.9" />
                      <stop offset="100%" stopColor="#E5484D" stopOpacity="0" />
                    </radialGradient>
                  </defs>

                  {dots.map((d, i: number) => (
                    <motion.g
                      key={`${d.country}-${i}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <circle cx={d.x} cy={d.y} r={6 + d.intensity * 22} fill="url(#dotGlow)" opacity={0.25} />
                      <motion.circle
                        cx={d.x}
                        cy={d.y}
                        r={3 + d.intensity * 7}
                        fill="#E5484D"
                        animate={{ r: [3 + d.intensity * 7, 5 + d.intensity * 9, 3 + d.intensity * 7] }}
                        transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.2 }}
                      />
                      {d.total >= 3 && (
                        <g>
                          <line x1={mapSize.w / 2} y1={mapSize.h / 2} x2={d.x} y2={d.y} stroke="#38B6EA" strokeOpacity={0.15} strokeWidth={0.8} strokeDasharray="3 3">
                            <animate attributeName="stroke-dashoffset" from="24" to="0" dur="1.2s" repeatCount="indefinite" />
                          </line>
                          <text x={d.x + 8} y={d.y - 6} fill="#a1a1aa" fontSize="9" fontFamily="monospace">
                            {d.country}
                          </text>
                        </g>
                      )}
                    </motion.g>
                  ))}

                  {dots.length === 0 && (
                    <text x={mapSize.w / 2} y={mapSize.h / 2} fill="#52525b" fontSize="12" textAnchor="middle" fontFamily="monospace">
                      No blocked traffic in this window — the map lights up when attacks arrive.
                    </text>
                  )}
                </svg>

                <div className="absolute bottom-3 left-3 rounded-lg border border-zinc-800 bg-zinc-950/80 backdrop-blur px-3 py-2">
                  <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                    <span className="h-2 w-2 rounded-full bg-sev-critical" /> blocked request
                    <span className="h-2 w-2 rounded-full bg-blue-500 ml-2" /> origin
                    <span className="ml-2">{countries.length} sources · {maxTotal} attacks</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Crosshair className="h-4 w-4 text-red-400" />
              <h3 className="font-medium text-zinc-200">Live Block Feed</h3>
            </div>
            {liveEvents.length === 0 ? (
              <EmptyState
                icon={ShieldAlert}
                title="No blocks yet"
                description="Fire an attack at the API and watch blocked requests stream in here, with their origin plotted on the map."
              />
            ) : (
              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {liveEvents.map((e, i: number) => (
                  <motion.div
                    key={e.id ?? i}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="relative overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2.5"
                  >
                    <span
                      className={cn(
                        "absolute left-0 top-0 h-full w-1",
                        severityRail[severityFromScore(e.score)]
                      )}
                      aria-hidden
                    />
                    <div className="flex items-center gap-2 pl-1">
                      <VerdictChip verdict={e.action ?? "BLOCK"} />
                      <ScoreBar score={e.score ?? 0} className="ml-auto" />
                      <span className="text-[10px] text-zinc-600 font-mono">
                        {e.timestamp
                          ? new Date(e.timestamp).toLocaleTimeString()
                          : new Date().toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="mt-1.5 pl-1 font-mono text-xs text-zinc-400 truncate">
                      <span className="text-zinc-600">{e.ip_address}</span> · {e.method} {e.path}
                    </p>
                    {e.attack_type && (
                      <p className={cn("mt-0.5 pl-1 font-mono text-[10px]", severityText[severityFromScore(e.score)])}>
                        {e.attack_type}
                      </p>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}
