import { Fragment, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Printer, RefreshCw } from 'lucide-react'
import { glApi } from '../services/api'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function JournalEntryListing() {
  const [selectionBy, setSelectionBy] = useState('reference')
  const [jvFormat, setJvFormat] = useState('yes')
  const [showType, setShowType] = useState('unposted')
  const [details, setDetails] = useState('yes')
  const [startRef, setStartRef] = useState('')
  const [endRef, setEndRef] = useState('')
  const [journalType, setJournalType] = useState('')
  const [period, setPeriod] = useState('')
  const [journalNo, setJournalNo] = useState('')
  const [narration, setNarration] = useState('')

  const statusParam = showType === 'unposted' ? 'Draft' : showType === 'posted' ? 'Posted' : ''

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['glJournalListing', statusParam],
    queryFn: () => glApi.listJournals(statusParam ? { status: statusParam } : {}),
  })
  const journals = data?.data || []

  const filtered = useMemo(() => {
    let rows = journals
    const nar = narration.trim().toLowerCase()
    if (nar) {
      rows = rows.filter((j) => (j.description || '').toLowerCase().includes(nar))
    }
    const jn = journalNo.trim().toLowerCase()
    if (jn) {
      rows = rows.filter((j) => (j.journal_number || '').toLowerCase().includes(jn))
    }
    const st = startRef.trim().toLowerCase()
    const en = endRef.trim().toLowerCase()
    if (st || en) {
      rows = rows.filter((j) => {
        const num = (j.journal_number || '').toLowerCase()
        if (st && num < st) return false
        if (en && num > en) return false
        return true
      })
    }
    if (journalType.trim()) {
      const t = journalType.trim().toLowerCase()
      rows = rows.filter((j) => (j.source_type || '').toLowerCase().includes(t))
    }
    return rows
  }, [journals, narration, journalNo, startRef, endRef, journalType])

  const refOptions = useMemo(() => {
    const nums = [...new Set(journals.map((j) => j.journal_number).filter(Boolean))].sort()
    return nums.slice(0, 200)
  }, [journals])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between gap-2">
        <div>
          <div className="text-sm text-muted-foreground">
            <Link to="/utilities" className="text-primary hover:underline">
              Utilities
            </Link>
            <span className="mx-1">/</span>
            <Link to="/gl/journals" className="text-primary hover:underline">
              GL journals
            </Link>
            <span className="mx-1">/</span>
            <span className="text-foreground font-medium">Journalized entry listing</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight mt-1">Journalized entry listing</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
            Filter journals (draft vs posted). JV format / period / reference range mirror the HillMaster listing; line
            detail expands when <strong>Details</strong> is Yes.
          </p>
        </div>
        <span className="text-sm text-blue-600 font-medium">Ready</span>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-2" />
          Print preview
        </Button>
        <Button type="button" variant="outline" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className="h-4 w-4 mr-2" />
          {isLoading || isFetching ? 'Loading…' : 'Refresh'}
        </Button>
        <Button type="button" variant="ghost" asChild>
          <Link to="/gl/journals">Open GL journals workspace</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4 space-y-2">
          <div className="text-xs font-semibold text-muted-foreground">Selection by</div>
          {['reference', 'period', 'date'].map((v) => (
            <label key={v} className="flex items-center gap-2 text-sm capitalize">
              <input type="radio" name="sel" checked={selectionBy === v} onChange={() => setSelectionBy(v)} />
              {v === 'date' ? 'By date' : v}
            </label>
          ))}
        </Card>
        <Card className="p-4 space-y-2">
          <div className="text-xs font-semibold text-muted-foreground">JV format</div>
          {['yes', 'no'].map((v) => (
            <label key={v} className="flex items-center gap-2 text-sm uppercase">
              <input type="radio" name="jv" checked={jvFormat === v} onChange={() => setJvFormat(v)} />
              {v}
            </label>
          ))}
          <p className="text-xs text-muted-foreground pt-1">Display-only in this web build.</p>
        </Card>
        <Card className="p-4 space-y-2">
          <div className="text-xs font-semibold text-muted-foreground">Show type</div>
          {[
            ['all', 'All'],
            ['unposted', 'Un posted to GL'],
            ['posted', 'Posted to GL'],
          ].map(([v, lab]) => (
            <label key={v} className="flex items-center gap-2 text-sm">
              <input type="radio" name="show" checked={showType === v} onChange={() => setShowType(v)} />
              {lab}
            </label>
          ))}
        </Card>
        <Card className="p-4 space-y-2">
          <div className="text-xs font-semibold text-muted-foreground">Details</div>
          {['yes', 'no'].map((v) => (
            <label key={v} className="flex items-center gap-2 text-sm uppercase">
              <input type="radio" name="det" checked={details === v} onChange={() => setDetails(v)} />
              {v}
            </label>
          ))}
        </Card>
      </div>

      <Card className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Starting ref no.</label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={startRef}
            onChange={(e) => setStartRef(e.target.value)}
          >
            <option value="">(any)</option>
            {refOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Ending ref no.</label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={endRef}
            onChange={(e) => setEndRef(e.target.value)}
          >
            <option value="">(any)</option>
            {refOptions.map((n) => (
              <option key={`e-${n}`} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Journal type (source type)</label>
          <Input value={journalType} onChange={(e) => setJournalType(e.target.value)} placeholder="e.g. GarageInvoice" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Period</label>
          <Input value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="Display-only" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Journal no.</label>
          <Input value={journalNo} onChange={(e) => setJournalNo(e.target.value)} />
        </div>
        <div className="space-y-1 md:col-span-2">
          <label className="text-xs font-medium text-muted-foreground">Narration</label>
          <textarea
            className="flex min-h-[72px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={narration}
            onChange={(e) => setNarration(e.target.value)}
            placeholder="Filter by text in journal description…"
          />
        </div>
      </Card>

      <Card className="p-0 overflow-hidden border">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 border-b">
            <tr>
              <th className="text-left p-2">Journal no.</th>
              <th className="text-left p-2">Date</th>
              <th className="text-left p-2">Status</th>
              <th className="text-left p-2">Description</th>
              <th className="text-right p-2">Debit</th>
              <th className="text-right p-2">Credit</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((j) => (
              <Fragment key={j.journal_id}>
                <tr className="border-t">
                  <td className="p-2 font-mono text-xs">{j.journal_number}</td>
                  <td className="p-2">{j.journal_date}</td>
                  <td className="p-2">{j.status}</td>
                  <td className="p-2 max-w-md truncate">{j.description || '—'}</td>
                  <td className="p-2 text-right">{Number(j.total_debit || 0).toFixed(2)}</td>
                  <td className="p-2 text-right">{Number(j.total_credit || 0).toFixed(2)}</td>
                </tr>
                {details === 'yes' && (j.lines || []).length ? (
                  <tr className="bg-muted/20">
                    <td colSpan={6} className="p-2 pl-6 text-xs">
                      <table className="w-full">
                        <tbody>
                          {(j.lines || []).map((ln) => (
                            <tr key={ln.journal_line_id}>
                              <td className="py-0.5 pr-2">{ln.account_code}</td>
                              <td className="py-0.5 pr-2">{ln.account_name}</td>
                              <td className="py-0.5 pr-2">{ln.description || '—'}</td>
                              <td className="py-0.5 text-right">{Number(ln.debit || 0).toFixed(2)}</td>
                              <td className="py-0.5 text-right">{Number(ln.credit || 0).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            ))}
          </tbody>
        </table>
        {!filtered.length ? <p className="p-4 text-sm text-muted-foreground">No journals match filters.</p> : null}
      </Card>
    </div>
  )
}
