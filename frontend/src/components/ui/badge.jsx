import * as React from "react"
import { cva } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide transition-[color,box-shadow,transform] duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-gradient-to-br from-primary via-primary to-teal-700 text-primary-foreground shadow-[0_2px_10px_-4px_hsl(var(--primary)/0.55)]",
        secondary:
          "border-border/55 bg-muted/85 text-secondary-foreground shadow-sm backdrop-blur-sm",
        outline:
          "border-border/75 bg-card/90 text-foreground shadow-sm backdrop-blur-sm",
        success:
          "border-emerald-300/70 bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-900 shadow-[0_2px_8px_-4px_rgba(16,185,129,0.35)]",
        danger:
          "border-rose-300/70 bg-gradient-to-br from-rose-50 to-orange-50 text-rose-900 shadow-[0_2px_8px_-4px_rgba(244,63,94,0.28)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({ className, variant, ...props }) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
