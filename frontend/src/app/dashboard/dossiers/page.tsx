"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { VerdictChip } from "@/components/ui/verdict-chip"
import { analyticsService } from "@/services/analytics"
import { cn } from "@/lib/utils"
import { severityText, severityFromScore } from "@/lib/severity"
import {
  UserX,
  Flame,
  Ban,
  Globe2,
  Activity,
  ShieldAlert,
  Loader2,
} from "lucide-react"

const countryFlag = (country?: string | null) => {
  if (!country) return "🌐"
  const cc = country.length === 2 ? country.toUpperCase() : undefined
  if (!cc) return "🌐"
  return String.fromCodePoint(...[...cc].map((c) => 127397 + c.charCodeAt(0)))
}

export default function DossiersPage() {
  const [hours, setHours] = useState(168)
  const [selected, setSelected] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["attackers", hours],
    queryFn: () => analyticsService.getAttackers(hours),
    refetchInterval: 30000,
  })

  const { data: detail, isFetching: detailLoading } = useQuery({
    queryKey: ["attacker-detail", selected, hours],
    queryFn: () => analyticsService.getAttackerDetail(selected!, hours),
    enabled: !!selected,
  })

  const dossiers = data?.dossiers ?? []

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <PageHeader
        title="Attacker Dossiers"
        description="Profiles of every IP that targeted your infrastructure"
        actions={
          <div className="flex gap-1 rounded-lg border border-zinc-800 bg-zinc-900/50 p-1">
            {[24, 168, 720].map((h) => (
              <button
                key={h}
                onClick={() => setHours(h)}
                className={`rounded-md px-3 py-1 text-xs transition-all ${
                  hours === h ? "bg-blue-600/20 text-blue-300" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {h === 168 ? "7d" : h === 720 ? "30d" : "24h"}
              </button>
            ))}
          </div>
        }
      />

      <Card>
        <CardContent className="p-5">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))}
            </div>
          ) : dossiers.length === 0 ? (
            <EmptyState
              icon={UserX}
              title="No attackers in this window"
              description="Blocked IPs with repeat behavior show up here with full profiles."
            />
          ) : (
            <div className="space-y-2.5">
              {dossiers.map((d, i) => (
                <motion.button
                  key={d.ip}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => setSelected(selected === d.ip ? null : d.ip)}
                  className={`w-full text-left rounded-xl border px-4 py-3.5 transition-all ${
                    selected === d.ip
                      ? "border-blue-500/50 bg-blue-500/[0.06]"
                      : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900/70"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-lg">{countryFlag(d.country)}</span>
                    <span className="font-mono font-medium text-zinc-200">{d.ip}</span>
                    {d.kill_chain && (
                      <Badge variant="danger" className="gap-1">
                        <Flame className="h-3 w-3" /> Kill-chain
                      </Badge>
                    )}
                    {d.banned && (
                      <Badge variant="danger" className="gap-1">
                        <Ban className="h-3 w-3" /> Banned
                      </Badge>
                    )}
                    <span className="ml-auto flex items-center gap-4 text-xs text-zinc-500 tabular-nums">
                      <span className="flex items-center gap-1">
                        <ShieldAlert className={cn("h-3.5 w-3.5", severityText[severityFromScore(d.max_score ?? 0)])} />
                        {d.blocks} blocks
                      </span>
                      <span>{d.distinct_threats} threat types</span>
                      <span className={severityText[severityFromScore(d.max_score ?? 0)]}>max {d.max_score} pts</span>
                    </span>
                  </div>
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    {d.threat_types.slice(0, 6).map((t) => (
                      <span
                        key={t.type}
                        className={cn(
                          "rounded-full border px-2 py-0.5 font-mono text-[10px]",
                          severityText[severityFromScore(d.max_score ?? 0)],
                          severityBorder[severityFromScore(d.max_score ?? 0)]
                        )}
                      >
                        {t.type} ×{t.count}
                      </span>
                    ))}
                    {d.threat_types.length > 6 && (
                      <span className="text-[10px] text-zinc-600">+{d.threat_types.length - 6} more</span>
                    )}
                    {d.top_paths?.[0] && (
                      <span className="ml-auto font-mono text-[10px] text-zinc-600 truncate max-w-[220px]">
                        {d.top_paths[0].path}
                      </span>
                    )}
                  </div>

                  <AnimatePresence>
                    {selected === d.ip && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-950/60 p-4">
                          {detailLoading ? (
                            <div className="flex items-center gap-2 text-sm text-zinc-500 py-4">
                              <Loader2 className="h-4 w-4 animate-spin" /> Loading timeline...
                            </div>
                          ) : (
                            <>
                              <div className="flex flex-wrap items-center gap-3 mb-3">
                                <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                                  <Activity className="h-3.5 w-3.5" />
                                  {detail?.timeline?.length ?? 0} events
                                </span>
                                <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                                  <Globe2 className="h-3.5 w-3.5" />
                                  {detail?.country ?? "Unknown"}
                                </span>
                                {d.user_agents?.[0] && (
                                  <span className="text-[10px] text-zinc-600 font-mono truncate max-w-xs">
                                    {d.user_agents[0]}
                                  </span>
                                )}
                              </div>
                              <div className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
                              {(detail?.timeline ?? []).map((e, idx: number) => (
                                <div
                                  key={idx}
                                  className="flex items-center gap-3 rounded-md bg-zinc-900/50 px-3 py-2 text-xs"
                                >
                                  <span className="font-mono text-zinc-600 shrink-0">
                                    {new Date(e.time).toLocaleString()}
                                  </span>
                                  <Badge
                                    variant={e.action === "BLOCK" ? "danger" : e.action === "RATE_LIMIT" ? "warning" : "default"}
                                    className="font-mono shrink-0"
                                  >
                                    {e.action}
                                  </Badge>
                                  {e.attack_type && (
                                    <span className="font-mono text-red-300/90 shrink-0">{e.attack_type}</span>
                                  )}
                                  <span className="truncate text-zinc-500 font-mono">
                                    {e.method} {e.path}
                                  </span>
                                  <span className="ml-auto font-mono text-zinc-600 tabular-nums">
                                    {e.score} pts
                                  </span>
                                </div>
                              ))}
                              {detail?.timeline?.length === 0 && (
                                <p className="py-6 text-center text-zinc-600 text-sm">
                                  No logged events in this window.
                                </p>
                              )}
                              </div>
                            </>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
