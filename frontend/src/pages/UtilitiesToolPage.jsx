import { useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { UTILITIES_MENU } from './UtilitiesHub'
import CloseJobOrder from './CloseJobOrder'
import JobOrderQualityCheckSheet from './JobOrderQualityCheckSheet'
import ReopenJobOrder from './ReopenJobOrder'
import DeliverJobOrder from './DeliverJobOrder'
import ReceiveAssembledJob from './ReceiveAssembledJob'
import CopyJobOrder from './CopyJobOrder'
import SplitJobOrder from './SplitJobOrder'
import PairingJobOrder from './PairingJobOrder'
import JournalEntryListing from './JournalEntryListing'

const REDIRECTS = {
  'journalize-transaction': '/gl/journals',
  'post-journals-gl': '/gl/journals',
  'estimation-letters': '/garage-invoices/job-estimation',
}

function MiniCalculator() {
  const [display, setDisplay] = useState('0')
  const append = (ch) => {
    setDisplay((d) => {
      if (d === 'Error') return ch
      if (d === '0' && /[0-9]/.test(ch)) return ch
      if (ch === '.' && /\./.test(d.split(/[-+*/]/).pop() || '')) return d
      return d + ch
    })
  }
  const clear = () => setDisplay('0')
  const equals = () => {
    try {
      const sanitized = display.replace(/[^0-9+\-*/.]/g, '')
      const fn = new Function(`return (${sanitized})`)
      const v = Number(fn())
      if (!Number.isFinite(v)) throw new Error('bad')
      setDisplay(String(v))
    } catch {
      setDisplay('Error')
    }
  }

  const digitRow = (keys) =>
    keys.map((k) => (
      <button
        key={k}
        type="button"
        className="rounded border bg-white py-2 text-sm hover:bg-muted/70"
        onClick={() => append(k)}
      >
        {k}
      </button>
    ))

  return (
    <div className="max-w-xs border rounded-lg p-4 bg-muted/35 shadow-sm">
      <div className="mb-3 rounded bg-white border px-3 py-2 text-right font-mono text-lg min-h-[2.5rem]">{display}</div>
      <div className="grid grid-cols-4 gap-2">
        <button type="button" className="col-span-4 rounded bg-red-100 py-2 text-sm font-medium" onClick={clear}>
          Clear
        </button>
        {digitRow(['7', '8', '9', '/'])}
        {digitRow(['4', '5', '6', '*'])}
        {digitRow(['1', '2', '3', '-'])}
        <button type="button" className="col-span-2 rounded border bg-white py-2 text-sm hover:bg-muted/70" onClick={() => append('0')}>
          0
        </button>
        <button type="button" className="rounded border bg-white py-2 text-sm hover:bg-muted/70" onClick={() => append('.')}>
          .
        </button>
        <button type="button" className="rounded bg-emerald-600 text-white py-2 text-sm font-medium hover:bg-emerald-700" onClick={equals}>
          =
        </button>
        <button type="button" className="col-span-4 rounded border bg-white py-2 text-sm hover:bg-muted/70" onClick={() => append('+')}>
          +
        </button>
      </div>
    </div>
  )
}

export default function UtilitiesToolPage() {
  const { slug } = useParams()
  const entry = useMemo(() => UTILITIES_MENU.find((x) => x.slug === slug), [slug])

  if (!slug || !entry) {
    return <Navigate to="/utilities" replace />
  }

  const label = entry.label
  const redirect = REDIRECTS[slug]

  if (redirect) {
    return <Navigate to={redirect} replace />
  }

  if (slug === 'close-job-order') {
    return <CloseJobOrder />
  }

  if (slug === 'job-order-check-sheet') {
    return <JobOrderQualityCheckSheet />
  }

  if (slug === 'reopen-job-order') {
    return <ReopenJobOrder />
  }

  if (slug === 'deliver-job-order') {
    return <DeliverJobOrder />
  }

  if (slug === 'receive-assembled-job') {
    return <ReceiveAssembledJob />
  }

  if (slug === 'copy-job-waiting' || slug === 'copy-invoiced-job-order') {
    return <CopyJobOrder />
  }

  if (slug === 'split-job-order' || slug === 'split-job-order-ai') {
    return <SplitJobOrder aiHint={slug === 'split-job-order-ai'} />
  }

  if (slug === 'pairing-job-order') {
    return <PairingJobOrder />
  }

  if (slug === 'journal-listing') {
    return <JournalEntryListing />
  }

  if (slug === 'calculator') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/utilities" className="text-indigo-600 hover:underline">
            Utilities
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">{label}</span>
        </div>
        <h1 className="text-2xl font-semibold text-foreground">{label}</h1>
        <MiniCalculator />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/utilities" className="text-indigo-600 hover:underline">
          Utilities
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">{label}</span>
      </div>
      <h1 className="text-2xl font-semibold text-foreground">{label}</h1>
      <p className="text-sm text-muted-foreground max-w-2xl">
        This utility matches the HillMaster <strong>Job Order → Utilities</strong> menu. Full workflow wiring (close,
        reopen, deliver, copy/split/pair, check sheet, etc.) is done from{' '}
        <Link to="/job-orders" className="text-indigo-600 font-medium hover:underline">
          Job Orders
        </Link>{' '}
        (open a job from the list for detail actions) where APIs exist; this page is the navigation entry so every menu
        item is reachable from the sidebar.
      </p>
      <div className="flex flex-wrap gap-2">
        <Link
          to="/job-orders"
          className="inline-flex items-center rounded-md border border-border bg-white px-4 py-2 text-sm font-medium hover:bg-muted/45"
        >
          Open Job Orders
        </Link>
        <Link
          to="/utilities"
          className="inline-flex items-center rounded-md border border-border bg-white px-4 py-2 text-sm font-medium hover:bg-muted/45"
        >
          All utilities
        </Link>
      </div>
    </div>
  )
}
