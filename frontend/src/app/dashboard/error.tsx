"use client"

import { Button } from "@/components/ui/button"
import { ShieldAlert } from "lucide-react"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10">
        <ShieldAlert className="h-7 w-7 text-red-400" />
      </div>
      <h2 className="mt-6 text-xl font-semibold text-zinc-100">
        Something went wrong
      </h2>
      <p className="mt-2 max-w-md text-sm text-zinc-500">
        {error.message || "The dashboard hit an unexpected error. Try again or reload the page."}
      </p>
      <Button onClick={reset} className="mt-6">
        Try again
      </Button>
    </div>
  )
}