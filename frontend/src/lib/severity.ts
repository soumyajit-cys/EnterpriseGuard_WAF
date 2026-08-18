export type SeverityLevel = "info" | "low" | "medium" | "high" | "critical"

const LEVELS: SeverityLevel[] = ["info", "low", "medium", "high", "critical"]

export function severityFromScore(score?: number | null): SeverityLevel {
  if (score == null || score < 1) return "info"
  if (score >= 80) return "critical"
  if (score >= 50) return "high"
  if (score >= 20) return "medium"
  return "low"
}

export function severityOf(
  value: string | number | null | undefined
): SeverityLevel {
  if (typeof value === "number") return severityFromScore(value)
  const v = String(value ?? "")
    .toLowerCase()
    .trim()
  if ((LEVELS as string[]).includes(v)) return v as SeverityLevel
  if (v === "warning" || v === "warn") return "medium"
  return "info"
}

export const severityChip: Record<SeverityLevel, string> = {
  info: "bg-sev-info/10 text-sev-info border-sev-info/25",
  low: "bg-sev-low/10 text-sev-low border-sev-low/25",
  medium: "bg-sev-medium/10 text-sev-medium border-sev-medium/25",
  high: "bg-sev-high/10 text-sev-high border-sev-high/25",
  critical: "bg-sev-critical/10 text-sev-critical border-sev-critical/25",
}

export const severityText: Record<SeverityLevel, string> = {
  info: "text-sev-info",
  low: "text-sev-low",
  medium: "text-sev-medium",
  high: "text-sev-high",
  critical: "text-sev-critical",
}

export const severityRail: Record<SeverityLevel, string> = {
  info: "bg-sev-info",
  low: "bg-sev-low",
  medium: "bg-sev-medium",
  high: "bg-sev-high",
  critical: "bg-sev-critical",
}

export const severityBar: Record<SeverityLevel, string> = {
  info: "bg-sev-info",
  low: "bg-sev-low",
  medium: "bg-sev-medium",
  high: "bg-sev-high",
  critical: "bg-sev-critical",
}

export const severityDot: Record<SeverityLevel, string> = {
  info: "bg-sev-info",
  low: "bg-sev-low",
  medium: "bg-sev-medium",
  high: "bg-sev-high",
  critical: "bg-sev-critical",
}
