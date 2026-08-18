import { cn } from "@/lib/utils"
import { severityBar, severityFromScore, severityText } from "@/lib/severity"

export function ScoreBar({
  score,
  className,
  showValue = false,
  widthClass = "w-20",
}: {
  score: number
  className?: string
  showValue?: boolean
  widthClass?: string
}) {
  const level = severityFromScore(score)
  const clamped = Math.min(100, Math.max(0, score))
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn("h-1.5 overflow-hidden rounded-full bg-zinc-800", widthClass)}
        role="img"
        aria-label={`score ${score}`}
      >
        <div
          className={cn("h-full rounded-full", severityBar[level])}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showValue && (
        <span className={cn("font-mono text-xs tabular-nums", severityText[level])}>
          {score}
        </span>
      )}
    </div>
  )
}
