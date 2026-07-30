import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M"
  if (num >= 1000) return (num / 1000).toFixed(1) + "K"
  return num.toString()
}

export function formatDate(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function formatTime(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

export function timeAgo(date: string | Date): string {
  const now = new Date()
  const d = new Date(date)
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function severityColor(severity: string): string {
  switch (severity.toLowerCase()) {
    case "critical": return "text-red-500 bg-red-500/10 border-red-500/20"
    case "high": return "text-orange-500 bg-orange-500/10 border-orange-500/20"
    case "medium": return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20"
    case "low": return "text-blue-500 bg-blue-500/10 border-blue-500/20"
    default: return "text-gray-500 bg-gray-500/10 border-gray-500/20"
  }
}

export function statusColor(status: string): string {
  switch (status.toLowerCase()) {
    case "blocked":
    case "block":
    case "deny":
    case "critical": return "text-red-500 bg-red-500/10"
    case "allowed":
    case "allow":
    case "pass": return "text-green-500 bg-green-500/10"
    case "pending":
    case "detected": return "text-yellow-500 bg-yellow-500/10"
    default: return "text-gray-500 bg-gray-500/10"
  }
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + "..."
}
