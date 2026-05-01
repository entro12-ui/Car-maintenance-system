import * as React from 'react'

import { cn } from '@/lib/utils'

/**
 * Wraps data tables with consistent chrome (gradient accent, shadow, rounded frame).
 * Use `embed` when the table sits inside a Card; `elevated` for standalone tables.
 */
export function DataTableShell({ className, children }) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-b from-card via-card/98 to-muted/25 shadow-[0_18px_52px_-26px_rgba(15,23,42,0.28),inset_0_1px_0_0_rgba(255,255,255,0.72)] ring-1 ring-black/[0.035]',
        className
      )}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-primary/0 via-primary/45 to-primary/0 opacity-90"
        aria-hidden
      />
      <div className="overflow-x-auto">{children}</div>
    </div>
  )
}

/** Subtle frame for tables nested inside cards or dense layouts */
export function DataTableEmbed({ className, children }) {
  return (
    <div
      className={cn(
        'overflow-x-auto rounded-xl border border-border/60 bg-background/50 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)]',
        className
      )}
    >
      {children}
    </div>
  )
}

/**
 * @param {'elevated' | 'embed' | false} shell - elevated: full chrome; embed: light inset; false: plain scroll
 */
export function Table({ className, shell = 'elevated', ...props }) {
  const table = (
    <table className={cn('w-full caption-bottom text-sm text-foreground antialiased', className)} {...props} />
  )

  if (shell === false) {
    return <div className="overflow-x-auto">{table}</div>
  }

  if (shell === 'embed') {
    return <DataTableEmbed>{table}</DataTableEmbed>
  }

  return <DataTableShell>{table}</DataTableShell>
}

export function TableHeader({ className, ...props }) {
  return (
    <thead
      className={cn(
        '[&_tr]:border-b [&_tr]:border-border/65 [&_tr]:bg-muted/60 [&_tr]:backdrop-blur-[2px] [&_tr]:shadow-[inset_0_-1px_0_0_rgba(255,255,255,0.45)]',
        className
      )}
      {...props}
    />
  )
}

export function TableBody({ className, ...props }) {
  return (
    <tbody
      className={cn('[&_tr:last-child]:border-0 [&_tr:nth-child(even)]:bg-muted/[0.22]', className)}
      {...props}
    />
  )
}

export function TableRow({ className, ...props }) {
  return (
    <tr
      className={cn(
        'border-b border-border/55 transition-colors duration-150 hover:bg-primary/[0.055] data-[state=selected]:bg-muted',
        className
      )}
      {...props}
    />
  )
}

export function TableHead({ className, ...props }) {
  return (
    <th
      className={cn(
        'h-12 px-4 text-left align-middle text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground [&:has([role=checkbox])]:pr-0',
        className
      )}
      {...props}
    />
  )
}

export function TableCell({ className, ...props }) {
  return (
    <td className={cn('p-4 align-middle text-[13px] leading-snug [&:has([role=checkbox])]:pr-0', className)} {...props} />
  )
}

export function TableCaption({ className, ...props }) {
  return <caption className={cn('mt-4 px-4 text-sm text-muted-foreground', className)} {...props} />
}
