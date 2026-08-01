"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { useSidebarStore } from "@/store/sidebar-store"
import { useAuthStore } from "@/store/auth-store"
import {
  LayoutDashboard,
  Activity,
  ShieldAlert,
  Shield,
  Bell,
  ScrollText,
  Ban,
  CheckCircle,
  BarChart3,
  FileText,
  Users,
  Settings,
  UserCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from "lucide-react"

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  badge?: number
}

const mainNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Live Traffic", href: "/dashboard/live", icon: Activity },
  { label: "Alerts", href: "/dashboard/alerts", icon: Bell },
  { label: "Logs", href: "/dashboard/logs", icon: ScrollText },
  { label: "Rules", href: "/dashboard/rules", icon: Shield },
]

const securityNav: NavItem[] = [
  { label: "Blocked IPs", href: "/dashboard/blocked-ips", icon: Ban },
  { label: "Allowed IPs", href: "/dashboard/allowed-ips", icon: CheckCircle },
]

const analyticsNav: NavItem[] = [
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
]

const adminNav: NavItem[] = [
  { label: "Reports", href: "/dashboard/reports", icon: FileText },
  { label: "Users", href: "/dashboard/users", icon: Users },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
  { label: "Profile", href: "/dashboard/profile", icon: UserCircle },
]

export function Sidebar() {
  const pathname = usePathname()
  const { isCollapsed, toggle, isMobileOpen, closeMobile } = useSidebarStore()
  const { user, logout } = useAuthStore()

  const NavSection = ({
    title,
    items,
  }: {
    title?: string
    items: NavItem[]
  }) => (
    <div className="mb-4">
      {title && !isCollapsed && (
        <p className="px-4 mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          {title}
        </p>
      )}
      {items.map((item) => {
        const isActive = pathname === item.href
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={closeMobile}
            className={cn(
              "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-blue-500/10 text-blue-300 border border-blue-500/20 shadow-lg shadow-blue-500/5"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {!isCollapsed && (
              <>
                <span className="truncate">{item.label}</span>
                {item.badge && (
                  <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500/10 px-1.5 text-xs font-medium text-red-400">
                    {item.badge}
                  </span>
                )}
              </>
            )}
            {isActive && (
              <motion.div
                layoutId="sidebar-active"
                className="absolute left-0 top-0 h-full w-0.5 bg-blue-500 rounded-r-full"
              />
            )}
          </Link>
        )
      })}
    </div>
  )

  return (
    <>
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={closeMobile}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-full flex-col border-r border-white/5 bg-zinc-950/95 backdrop-blur-xl transition-all duration-300",
          isCollapsed ? "w-[72px]" : "w-[260px]",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex h-16 items-center border-b border-white/5 px-4">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg shadow-blue-600/30 group-hover:shadow-blue-500/50 transition-all">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <p className="text-sm font-bold text-zinc-100">
                  Enterprise<span className="text-gradient">Guard</span>
                </p>
                <p className="text-[10px] font-medium text-zinc-500">WAF Dashboard</p>
              </motion.div>
            )}
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto overflow-x-hidden p-3 scrollbar-thin scrollbar-track-zinc-900 scrollbar-thumb-zinc-700">
          <NavSection items={mainNav} />
          {!isCollapsed && (
            <div className="my-2 border-t border-white/5" />
          )}
          <NavSection items={securityNav} />
          {!isCollapsed && (
            <div className="my-2 border-t border-white/5" />
          )}
          <NavSection items={analyticsNav} />
          {user?.role === "admin" && (
            <>
              {!isCollapsed && (
                <div className="my-2 border-t border-white/5" />
              )}
              <NavSection items={adminNav} />
            </>
          )}
        </nav>

        <div className="border-t border-white/5 p-3">
          {!isCollapsed && user && (
            <Link
              href="/dashboard/profile"
              className="mb-3 flex items-center gap-3 rounded-lg bg-zinc-800/50 p-2 hover:bg-zinc-800/80 transition-all"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 text-white text-xs font-bold shadow-lg shadow-blue-600/25">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-200 truncate">
                  {user.username}
                </p>
                <p className="text-xs text-zinc-500 capitalize">{user.role}</p>
              </div>
            </Link>
          )}
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>

        <button
          onClick={toggle}
          className="absolute -right-3 top-20 hidden h-6 w-6 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/20 transition-all lg:flex"
        >
          {isCollapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </button>
      </aside>
    </>
  )
}
