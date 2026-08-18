import { ShieldCheck, ShieldX, Timer } from "lucide-react"
import { cn } from "@/lib/utils"

type VerdictConfig = {
  label: string
  cls: string
  icon?: typeof ShieldCheck
}

const VERDICTS: Record<string, VerdictConfig> = {
  BLOCK: {
    label: "BLOCK",
    cls: "bg-sev-critical/10 text-sev-critical border-sev-critical/30",
    icon: ShieldX,
  },
  ALLOW: {
    label: "ALLOW",
    cls: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    icon: ShieldCheck,
  },
  RATE_LIMIT: {
    label: "RATE LIMIT",
    cls: "bg-sev-medium/10 text-sev-medium border-sev-medium/30",
    icon: Timer,
  },
}

export function VerdictChip({
  verdict,
  className,
}: {
  verdict: string
  className?: string
}) {
  const cfg =
    VERDICTS[String(verdict).toUpperCase()] ?? {
      label: String(verdict).toUpperCase(),
      cls: "bg-transparent text-zinc-400 border-zinc-700",
    }
  const Icon = cfg.icon
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded border px-2 py-0.5 font-mono text-[11px] font-medium uppercase tracking-wider",
        cfg.cls,
        className
      )}
    >
      {Icon ? <Icon className="h-3 w-3" aria-hidden /> : null}
      {cfg.label}
    </span>
  )
}
