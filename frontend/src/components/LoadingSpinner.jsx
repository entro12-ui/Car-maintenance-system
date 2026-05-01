import { cn } from '@/lib/utils'

export default function LoadingSpinner({ size = 'md', className = '' }) {
  const wrap = {
    sm: 'h-8 w-8',
    md: 'h-11 w-11',
    lg: 'h-14 w-14',
  }

  const spin = {
    sm: 'h-5 w-5 border-2',
    md: 'h-9 w-9 border-[3px]',
    lg: 'h-11 w-11 border-[3px]',
  }

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div
        className={cn('relative flex items-center justify-center', wrap[size])}
        role="status"
        aria-label="Loading"
      >
        <div
          className="absolute inset-0 rounded-full border-2 border-primary/12 bg-gradient-to-br from-primary/[0.04] to-transparent"
          aria-hidden
        />
        <div
          className={cn(
            spin[size],
            'relative rounded-full border-primary/15 border-t-primary border-r-teal-500/45',
            'animate-spin shadow-[0_0_16px_rgba(20,184,166,0.25)]'
          )}
        />
        <span className="sr-only">Loading…</span>
      </div>
    </div>
  )
}
