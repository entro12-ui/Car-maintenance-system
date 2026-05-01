import { useCallback, useMemo, useState } from 'react'

/** Locale-aware comparison for strings and numbers (dates as ISO strings work with numeric option). */
export function compareValues(a, b) {
  if (Object.is(a, b)) return 0
  if (a == null && b == null) return 0
  if (a == null) return 1
  if (b == null) return -1
  if (typeof a === 'boolean' && typeof b === 'boolean') return a === b ? 0 : a ? -1 : 1
  if (typeof a === 'number' && typeof b === 'number' && !Number.isNaN(a) && !Number.isNaN(b)) return a - b

  const na = Number(a)
  const nb = Number(b)
  const sa = String(a).trim()
  const sb = String(b).trim()
  if (sa !== '' && sb !== '' && !Number.isNaN(na) && !Number.isNaN(nb) && Number.isFinite(na) && Number.isFinite(nb)) {
    return na - nb
  }

  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' })
}

/**
 * Client-side filter (substring) + column sort.
 *
 * @param {any[]|undefined|null} rows
 * @param {Array<(row: any) => string>|undefined} searchFields — memoize in the caller for stable identity
 * @param {Record<string, (row: any) => any>|undefined} sortAccessors — memoize in the caller
 */
export function useClientTableSortFilter(rows, searchFields, sortAccessors) {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState({ key: null, dir: 'asc' })

  const items = useMemo(() => {
    const base = Array.isArray(rows) ? [...rows] : []
    const q = query.trim().toLowerCase()
    let next = base

    if (q && Array.isArray(searchFields) && searchFields.length > 0) {
      next = base.filter((row) =>
        searchFields.some((fn) => {
          try {
            return String(fn(row) ?? '').toLowerCase().includes(q)
          } catch {
            return false
          }
        })
      )
    }

    if (sort.key && sortAccessors && typeof sortAccessors[sort.key] === 'function') {
      const getVal = sortAccessors[sort.key]
      const dir = sort.dir === 'desc' ? -1 : 1
      next.sort((a, b) => dir * compareValues(getVal(a), getVal(b)))
    }

    return next
  }, [rows, query, sort, searchFields, sortAccessors])

  const toggleSort = useCallback(
    (key) => {
      if (!sortAccessors || typeof sortAccessors[key] !== 'function') return
      setSort((s) => {
        if (s.key !== key) return { key, dir: 'asc' }
        if (s.dir === 'asc') return { key, dir: 'desc' }
        return { key: null, dir: 'asc' }
      })
    },
    [sortAccessors]
  )

  return { query, setQuery, sort, toggleSort, items }
}
