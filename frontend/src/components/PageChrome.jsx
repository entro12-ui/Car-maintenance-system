import { cn } from '@/lib/utils'
import LoadingSpinner from '@/components/LoadingSpinner'

/** Vertical rhythm wrapper for primary page content (optional). */
export function PageBody({ children, className }) {
  return <div className={cn('space-y-8', className)}>{children}</div>
}

/** Apply `.app-form-grid` styling (see index.css) to legacy `<label>` + `<input>` markup. */
export function FormGrid({ children, className }) {
  return <div className={cn('app-form-grid space-y-5', className)}>{children}</div>
}

/** Centered loading state aligned with the glass shell. */
export function PageLoading({ label = 'Loading…', className }) {
  return (
    <div className={cn('flex min-h-[45vh] flex-col items-center justify-center gap-4 py-16', className)}>
      <div className="relative">
        <div
          className="pointer-events-none absolute inset-[-18px] rounded-full bg-gradient-to-tr from-primary/20 via-teal-400/10 to-transparent blur-xl"
          aria-hidden
        />
        <LoadingSpinner size="lg" />
      </div>
      <p className="text-sm font-medium tracking-tight text-muted-foreground">{label}</p>
    </div>
  )
}

/**
 * Consistent page masthead for hub screens and simple CRUD pages.
 * Pass rich description/footer as React nodes when you need bold links or callouts.
 */
export function PageHeader({ eyebrow, title, description, actions, footer, className }) {
  return (
    <header
      className={cn(
        'relative mb-10 flex flex-col gap-5 pb-10',
        'after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-gradient-to-r after:from-transparent after:via-border after:to-transparent',
        className
      )}
    >
      <div className="pointer-events-none absolute -left-1 top-1 hidden h-[calc(100%-2rem)] w-[3px] rounded-full bg-gradient-to-b from-primary via-teal-500/70 to-primary/15 opacity-90 sm:block" />
      <div className="flex flex-col gap-5 sm:pl-4 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
        <div className="min-w-0 max-w-3xl space-y-3">
          {eyebrow ? (
            <span className="inline-flex w-fit items-center rounded-full border border-primary/20 bg-gradient-to-r from-primary/[0.09] to-teal-600/[0.06] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary shadow-sm shadow-primary/[0.06]">
              {eyebrow}
            </span>
          ) : null}
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-[1.85rem] sm:leading-tight">
            {title}
          </h1>
          {description ? (
            <div className="max-w-2xl text-sm leading-relaxed text-muted-foreground [&_strong]:font-semibold [&_strong]:text-foreground">
              {description}
            </div>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">{actions}</div>
        ) : null}
      </div>
      {footer ? <div className="max-w-3xl sm:pl-4">{footer}</div> : null}
    </header>
  )
}
