"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSidebarStore } from "@/store/sidebar-store"
import { useAuthStore } from "@/store/auth-store"
import { cn } from "@/lib/utils"
import {
  Menu,
  Bell,
  Shield,
  Wifi,
  Database,
  Activity,
} from "lucide-react"

export function Navbar() {
  const { setMobileOpen } = useSidebarStore()
  const { user } = useAuthStore()
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const statusItems = [
    { label: "API", icon: Activity, status: "online" as const },
    { label: "DB", icon: Database, status: "online" as const },
    { label: "Redis", icon: Wifi, status: "online" as const },
  ]

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl px-4 lg:px-6">
      <div className="flex items-center gap-4 flex-1">
        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden text-zinc-400 hover:text-zinc-200"
        >
          <Menu className="h-6 w-6" />
        </button>

        <div className="hidden sm:flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.06] px-3 py-1">
          <div className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
          </div>
          <span className="text-xs font-medium text-green-400">System Online</span>
        </div>

        <div className="hidden md:flex items-center gap-4 ml-4">
          {statusItems.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.label}
                className="flex items-center gap-1.5 text-xs text-zinc-500"
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{item.label}</span>
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    item.status === "online" ? "bg-green-500" : "bg-red-500"
                  )}
                />
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden lg:flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-1.5 text-xs text-zinc-500">
          <Shield className="h-3.5 w-3.5 text-blue-400" />
          <span className="font-mono">
            {currentTime.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: false,
            })}
          </span>
        </div>

        <Link
          href="/dashboard/alerts"
          className="relative p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-all"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 shadow-lg shadow-red-500/50" />
        </Link>

        {user && (
          <Link
            href="/dashboard/profile"
            className="flex items-center gap-2 pl-2 border-l border-white/5 hover:opacity-80 transition-opacity"
          >
            <div className="hidden sm:block text-right">
              <p className="text-xs font-medium text-zinc-300">{user.username}</p>
              <p className="text-[10px] text-zinc-500 capitalize">{user.role}</p>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 text-white text-sm font-bold shadow-lg shadow-blue-600/25">
              {user.username.charAt(0).toUpperCase()}
            </div>
          </Link>
        )}
      </div>
    </header>
  )
}
