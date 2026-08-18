import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-zinc-800/70",
        className
      )}
      aria-hidden
      {...props}
    >
      <div className="animate-shimmer absolute inset-0 bg-gradient-to-r from-transparent via-zinc-700/40 to-transparent" />
    </div>
  )
}

export { Skeleton }
