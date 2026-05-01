import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef(({ className, ...props }, ref) => (
  <textarea
    className={cn(
      'flex min-h-[92px] w-full rounded-xl border border-input bg-background/95 px-4 py-3 text-sm text-foreground antialiased shadow-[inset_0_1px_2px_rgba(15,23,42,0.045)] transition-all duration-200 ring-offset-background placeholder:text-muted-foreground/65 hover:border-primary/40 hover:shadow-[inset_0_1px_2px_rgba(15,23,42,0.05),0_0_0_1px_rgba(20,184,166,0.06)] focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/35 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50',
      className
    )}
    ref={ref}
    {...props}
  />
))
Textarea.displayName = "Textarea"

export { Textarea }
