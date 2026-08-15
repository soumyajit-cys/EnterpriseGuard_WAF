"use client"

import { useEffect, useState } from "react"
import { useAuthStore } from "@/store/auth-store"
import { publicService } from "@/services/public"
import { LandingNav } from "@/components/landing/nav"
import { Hero } from "@/components/landing/hero"
import { ThreatTicker } from "@/components/landing/threat-ticker"
import { Features } from "@/components/landing/features"
import { HowItWorks } from "@/components/landing/how-it-works"
import { Threats } from "@/components/landing/threats"
import { StatsBanner } from "@/components/landing/stats-banner"
import { Playground } from "@/components/landing/playground"
import { Cta } from "@/components/landing/cta"
import { LandingFooter } from "@/components/landing/footer"
import type { PublicStats } from "@/components/landing/shared"

export default function LandingPage() {
  const { isAuthenticated } = useAuthStore()
  const [stats, setStats] = useState<PublicStats | null>(null)

  useEffect(() => {
    let mounted = true
    const fetchStats = async () => {
      try {
        const data = await publicService.getStats()
        if (mounted) setStats(data)
      } catch {
        if (mounted) setStats(null)
      }
    }
    fetchStats()
    const interval = setInterval(fetchStats, 30000)
    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 overflow-x-hidden">
      <LandingNav isAuthenticated={isAuthenticated} />
      <Hero stats={stats} isAuthenticated={isAuthenticated} />
      <ThreatTicker />
      <Features />
      <HowItWorks />
      <Threats />
      <StatsBanner stats={stats} />
      <Playground />
      <Cta isAuthenticated={isAuthenticated} />
      <LandingFooter />
    </div>
  )
}