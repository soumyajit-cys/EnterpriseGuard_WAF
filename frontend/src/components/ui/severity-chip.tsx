import { cn } from "@/lib/utils"
import {
  severityChip,
  severityDot,
  severityOf,
} from "@/lib/severity"

export function SeverityChip({
  value,
  className,
}: {
  value: string | number | null | undefined
  className?: string
}) {
  const level = severityOf(value)
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
        severityChip[level],
        className
      )}
    >
      <span
        className={cn("h-1.5 w-1.5 rounded-full", severityDot[level])}
        aria-hidden
      />
      {level}
    </span>
  )
}
