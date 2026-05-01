import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef(({ className, type, ...props }, ref) => (
  <input
    type={type}
    className={cn(
      'flex h-11 w-full rounded-xl border border-input bg-background/95 px-4 py-2 text-sm text-foreground antialiased shadow-[inset_0_1px_2px_rgba(15,23,42,0.045)] transition-all duration-200 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground/65 hover:border-primary/40 hover:shadow-[inset_0_1px_2px_rgba(15,23,42,0.05),0_0_0_1px_rgba(20,184,166,0.07)] focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/35 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50',
      className
    )}
    ref={ref}
    {...props}
  />
))
Input.displayName = "Input"

export { Input }
