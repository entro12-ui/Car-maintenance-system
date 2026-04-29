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
  className,
  children,
}) {
  return (
    <div className={cn('space-y-6', className)}>
      <nav className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <Link to={hubTo} className="font-medium text-primary hover:underline">
          {hubLabel}
        </Link>
        <span aria-hidden>/</span>
        <span className="font-medium text-foreground">{title}</span>
      </nav>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between border-b border-border/60 pb-5">
        <div className="space-y-1.5 min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          {subtitle ? <p className="text-sm text-muted-foreground max-w-3xl leading-relaxed">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex flex-shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>

      {children}
    </div>
  )
}
