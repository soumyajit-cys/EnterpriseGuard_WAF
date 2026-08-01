"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: { value: number; positive: boolean }
  variant?: "default" | "danger" | "success" | "warning"
  onClick?: () => void
}

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  variant = "default",
  onClick,
}: StatCardProps) {
  const variantStyles = {
    default:
      "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700",
    danger:
      "border-red-900/50 bg-red-950/20 hover:border-red-800/50",
    success:
      "border-green-900/50 bg-green-950/20 hover:border-green-800/50",
    warning:
      "border-yellow-900/50 bg-yellow-950/20 hover:border-yellow-800/50",
  }

  const iconStyles = {
    default: "text-blue-400 bg-blue-500/10 border-blue-500/20 shadow-blue-500/10",
    danger: "text-red-400 bg-red-500/10 border-red-500/20 shadow-red-500/10",
    success: "text-green-400 bg-green-500/10 border-green-500/20 shadow-green-500/10",
    warning: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20 shadow-yellow-500/10",
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-xl border p-5 transition-all duration-200 cursor-pointer ring-1 ring-inset ring-white/5 backdrop-blur-sm",
        variantStyles[variant]
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-zinc-500">{title}</p>
          <p className="text-3xl font-bold tracking-tight text-zinc-100 tabular-nums">
            {value}
          </p>
          {trend && (
            <div className="flex items-center gap-1">
              <span
                className={cn(
                  "text-xs font-medium",
                  trend.positive ? "text-green-400" : "text-red-400"
                )}
              >
                {trend.positive ? "+" : "-"}
                {trend.value}%
              </span>
              <span className="text-xs text-zinc-600">vs yesterday</span>
            </div>
          )}
        </div>
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl border shadow-lg",
            iconStyles[variant]
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
      <div
        className={cn(
          "absolute bottom-0 left-0 h-0.5 w-full opacity-50",
          variant === "default" && "bg-gradient-to-r from-blue-600 to-transparent",
          variant === "danger" && "bg-gradient-to-r from-red-600 to-transparent",
          variant === "success" && "bg-gradient-to-r from-green-600 to-transparent",
          variant === "warning" && "bg-gradient-to-r from-yellow-600 to-transparent"
        )}
      />
    </motion.div>
  )
}
