import { cn } from '@/lib/utils'

const toneStyles = {
  teal: 'bg-gradient-to-br from-teal-400 via-teal-600 to-emerald-700 shadow-lg shadow-teal-600/25 ring-2 ring-white/25',
  emerald:
    'bg-gradient-to-br from-emerald-400 via-emerald-600 to-teal-800 shadow-lg shadow-emerald-600/25 ring-2 ring-white/25',
  amber:
    'bg-gradient-to-br from-amber-400 via-amber-500 to-orange-600 shadow-lg shadow-amber-500/25 ring-2 ring-white/25',
  violet:
    'bg-gradient-to-br from-violet-400 via-violet-600 to-purple-800 shadow-lg shadow-violet-600/25 ring-2 ring-white/25',
  rose: 'bg-gradient-to-br from-rose-400 via-rose-600 to-red-700 shadow-lg shadow-rose-600/25 ring-2 ring-white/25',
  indigo:
    'bg-gradient-to-br from-indigo-400 via-indigo-600 to-blue-800 shadow-lg shadow-indigo-600/25 ring-2 ring-white/25',
  slate:
    'bg-gradient-to-br from-slate-500 via-slate-700 to-slate-900 shadow-lg shadow-slate-700/20 ring-2 ring-white/15',
}

/**
 * Metric tile used on admin / accountant dashboards.
 */
export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  tone = 'teal',
  className,
  highlight,
}) {
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-[calc(var(--radius)+6px)] border bg-card p-4 shadow-[0_6px_24px_-14px_rgba(15,23,42,0.08)] transition-all duration-300 sm:p-5',
        'border-border/60 hover:-translate-y-0.5 hover:border-primary/28 hover:shadow-[0_18px_44px_-20px_rgba(15,23,42,0.12),0_0_0_1px_hsl(var(--primary)/0.06)]',
        highlight && 'border-primary/35 ring-2 ring-primary/15',
        className
      )}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-primary/0 via-primary/50 to-teal-500/0 opacity-80"
        aria-hidden
      />
      <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br from-primary/[0.07] to-transparent opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
      <div className="pointer-events-none absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-teal-500/[0.06] opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100" />

      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
          <p className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{value}</p>
          {subtitle ? (
            <p className="text-xs leading-relaxed text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        <div
          className={cn(
            'flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl text-white transition-transform duration-300 group-hover:scale-105',
            toneStyles[tone] ?? toneStyles.teal
          )}
        >
          {Icon ? (
            <Icon className="h-[22px] w-[22px] drop-shadow-sm" strokeWidth={2} aria-hidden />
          ) : null}
        </div>
      </div>
    </div>
  )
}
