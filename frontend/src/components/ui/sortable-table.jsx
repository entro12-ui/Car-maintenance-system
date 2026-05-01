import { ArrowDown, ArrowUp, ArrowUpDown, Search } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { TableHead } from '@/components/ui/table'

export function TableSearchBar({ value, onChange, placeholder = 'Filter table…', className }) {
  return (
    <div className={cn('relative mb-4 max-w-md', className)}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <Input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9"
        autoComplete="off"
      />
    </div>
  )
}

function SortIndicator({ active, dir }) {
  if (!active) {
    return <ArrowUpDown className="h-3.5 w-3.5 shrink-0 opacity-45" aria-hidden />
  }
  return dir === 'asc' ? (
    <ArrowUp className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
  ) : (
    <ArrowDown className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
  )
}

/** Native `<table>` header cell with sort control */
export function SortableTh({ columnKey, sort, onSort, children, className, align = 'left' }) {
  const active = sort.key === columnKey
  const alignCls =
    align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'

  return (
    <th
      scope="col"
      className={cn(
        'px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground',
        alignCls,
        className
      )}
    >
      <button
        type="button"
        onClick={() => onSort(columnKey)}
        className={cn(
          'inline-flex max-w-full items-center gap-1.5 rounded-lg px-1 py-0.5 font-[inherit] text-[inherit] tracking-[inherit] transition-colors hover:bg-primary/10 hover:text-foreground',
          align === 'right' && 'ml-auto',
          align === 'center' && 'mx-auto',
          active && 'text-primary'
        )}
      >
        <span className="truncate">{children}</span>
        <SortIndicator active={active} dir={sort.dir} />
      </button>
    </th>
  )
}

/** Use inside `@/components/ui/table` `<TableHead>` */
export function SortableTableHead({ columnKey, sort, onSort, children, className }) {
  const active = sort.key === columnKey
  return (
    <TableHead className={cn(className)}>
      <button
        type="button"
        onClick={() => onSort(columnKey)}
        className={cn(
          '-mx-1 inline-flex w-full min-w-0 items-center gap-1.5 rounded-lg px-1 py-0.5 text-left font-[inherit] text-[11px] font-semibold uppercase tracking-[0.08em] transition-colors hover:bg-primary/10 hover:text-foreground',
          active && 'text-primary'
        )}
      >
        <span className="truncate">{children}</span>
        <SortIndicator active={active} dir={sort.dir} />
      </button>
    </TableHead>
  )
}
