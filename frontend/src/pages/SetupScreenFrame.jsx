import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

/**
 * Shared chrome for HillMaster-style hub screens: breadcrumb, title, actions, and content.
 * Defaults match Setup; pass hubTo/hubLabel for Task (or other) hubs.
 */
export default function SetupScreenFrame({
  hubTo = '/setup',
  hubLabel = 'Setup',
  title,
  subtitle,
  actions = null,
  reviewPoints = null,
  relatedLinks = null,
  className,
  children,
}) {
  const points = Array.isArray(reviewPoints) ? reviewPoints : null
  const links = Array.isArray(relatedLinks) ? relatedLinks : null

  return (
    <div className={cn('space-y-8', className)}>
      <nav className="flex flex-wrap items-center gap-2 text-xs sm:text-sm" aria-label="Breadcrumb">
        <Link
          to={hubTo}
          className="rounded-full border border-primary/20 bg-primary/[0.07] px-3 py-1.5 font-semibold text-primary shadow-sm transition hover:border-primary/35 hover:bg-primary/[0.11]"
        >
          {hubLabel}
        </Link>
        <span className="font-medium text-muted-foreground/70" aria-hidden>
          ›
        </span>
        <span className="rounded-full border border-border/70 bg-muted/35 px-3 py-1.5 font-medium text-foreground shadow-sm">
          {title}
        </span>
      </nav>

      <div className="relative flex flex-col gap-4 pb-8 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-gradient-to-r after:from-transparent after:via-border after:to-transparent sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-[1.85rem]">{title}</h1>
          {subtitle ? <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex flex-shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>

      {points && points.length > 0 ? (
        <div className="rounded-2xl border border-primary/18 bg-gradient-to-br from-primary/[0.08] via-transparent to-teal-500/[0.04] p-4 sm:p-5">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-primary">Review points</p>
          <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground marker:text-primary/70">
            {points.map((pt, i) => (
              <li key={i}>{pt}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {links && links.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-full border border-border/75 bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-sm transition hover:border-primary/35 hover:bg-primary/[0.05]"
            >
              {l.label}
            </Link>
          ))}
        </div>
      ) : null}

      {children}
    </div>
  )
}
