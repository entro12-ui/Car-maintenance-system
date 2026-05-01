import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold tracking-tight transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-br from-primary via-primary to-teal-700 text-primary-foreground shadow-md shadow-primary/25 hover:brightness-[1.05] hover:shadow-lg hover:shadow-primary/30",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/88 hover:shadow-md",
        outline:
          "border border-input bg-background/95 shadow-sm hover:border-primary/35 hover:bg-accent/60 hover:text-accent-foreground hover:shadow-md hover:shadow-primary/[0.06]",
        ghost:
          "hover:bg-accent/70 hover:text-accent-foreground hover:shadow-sm shadow-none",
        destructive:
          "bg-gradient-to-br from-destructive to-red-700 text-destructive-foreground shadow-md shadow-destructive/20 hover:brightness-[1.05]",
        link: "text-primary underline-offset-4 hover:underline shadow-none active:scale-100",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3 text-xs",
        lg: "h-11 rounded-xl px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
