import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-12 text-center",
        className
      )}
    >
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-800/40">
        <Icon className="h-5 w-5 text-zinc-400" aria-hidden />
      </div>
      <h3 className="font-display text-sm font-semibold text-zinc-200">
        {title}
      </h3>
      {description ? (
        <p className="mt-1 max-w-sm text-xs leading-relaxed text-zinc-500">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}
