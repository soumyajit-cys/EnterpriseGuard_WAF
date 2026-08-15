"use client"

import { ShieldAlert } from "lucide-react"
import { threatTypes } from "@/components/landing/shared"

export function ThreatTicker() {
  return (
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
  )
}