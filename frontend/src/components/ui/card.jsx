import * as React from "react"

import { cn } from "@/lib/utils"

function Card({ className, ...props }) {
  return (
    <div
      className={cn(
        "rounded-[calc(var(--radius)+4px)] border border-border/65 bg-card text-card-foreground",
        "shadow-[0_1px_0_0_rgba(255,255,255,0.58)_inset,0_6px_28px_-14px_rgba(15,23,42,0.09),0_2px_8px_-6px_hsl(var(--primary)/0.09)]",
        "transition-[box-shadow,border-color,transform] duration-300 ease-out",
        "hover:-translate-y-[1px] hover:border-primary/22 hover:shadow-[0_1px_0_0_rgba(255,255,255,0.72)_inset,0_18px_44px_-18px_rgba(15,23,42,0.12),0_4px_14px_-8px_hsl(var(--primary)/0.14)]",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }) {
  return <div className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
}

function CardTitle({ className, ...props }) {
  return (
    <h3
      className={cn("font-display text-lg font-semibold leading-none tracking-tight text-foreground", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }) {
  return <p className={cn("text-sm leading-relaxed text-muted-foreground", className)} {...props} />
}

function CardContent({ className, ...props }) {
  return <div className={cn("p-6 pt-0", className)} {...props} />
}

function CardFooter({ className, ...props }) {
  return <div className={cn("flex items-center p-6 pt-0", className)} {...props} />
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }
