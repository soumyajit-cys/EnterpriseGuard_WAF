import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
        success: "bg-green-500/10 text-green-400 border border-green-500/20",
        danger: "bg-red-500/10 text-red-400 border border-red-500/20",
        warning: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
        info: "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20",
        outline: "bg-transparent text-zinc-400 border border-zinc-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
