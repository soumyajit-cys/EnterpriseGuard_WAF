"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { Navbar } from "@/components/layout/navbar"
import { useSidebarStore } from "@/store/sidebar-store"
import { useAuthStore } from "@/store/auth-store"
import { cn } from "@/lib/utils"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { isCollapsed } = useSidebarStore()
  const { isAuthenticated, isLoading, initialize } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isLoading, isAuthenticated, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-10 w-10">
            <div className="h-10 w-10 rounded-full border-2 border-zinc-800" />
            <div className="absolute inset-0 h-10 w-10 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
          </div>
          <p className="font-mono text-xs text-zinc-500">
            Contacting WAF core<span className="animate-pulse">…</span>
          </p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <Sidebar />
      <div
        className={cn(
          "transition-all duration-300",
          isCollapsed ? "lg:ml-[72px]" : "lg:ml-[260px]"
        )}
      >
        <Navbar />
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
