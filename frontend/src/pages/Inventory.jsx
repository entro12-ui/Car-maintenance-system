import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Package,
  ClipboardList,
  Bookmark,
  Undo2,
  CheckCircle,
  Warehouse,
  Layers,
  AlertTriangle,
  Boxes,
  ArrowRight,
  FileSpreadsheet,
  Fuel,
} from 'lucide-react'
import { partsApi } from '../services/api'
import StatCard from '@/components/StatCard'
import LoadingSpinner from '@/components/LoadingSpinner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TRANSACTION_MENU, transactionPath } from './TransactionSidebarMenu'
import { PageHeader } from '@/components/PageChrome'

/** Transaction screens most relevant to stock movement and replenishment. */
const INVENTORY_SLUG_ORDER = [
  'item-issue',
  'garage-issue-requisition',
  'item-reserve',
  'item-issue-from-reserve',
  'request-for-return',
  'approve-request-for-return',
  'internal-fuel-and-lubricant-issue',
  'fuel-issue-km-editing',
]

const SLUG_ICON = {
  'item-issue': ClipboardList,
  'garage-issue-requisition': ClipboardList,
  'item-reserve': Bookmark,
  'item-issue-from-reserve': Layers,
  'request-for-return': Undo2,
  'approve-request-for-return': CheckCircle,
  'internal-fuel-and-lubricant-issue': Fuel,
  'fuel-issue-km-editing': Fuel,
}

const SLUG_BLURB = {
  'item-issue': 'Issue parts or stocked items against a job order.',
  'garage-issue-requisition': 'Raise or review requisitions before item issue.',
  'item-reserve': 'Reserve stock for a job before issue.',
  'item-issue-from-reserve': 'Convert reserved items into issued job consumption.',
  'request-for-return': 'Request return of issued items back to stock.',
  'approve-request-for-return': 'Approve pending return requests.',
  'internal-fuel-and-lubricant-issue': 'Record internal issue of fuel and lubricants.',
  'fuel-issue-km-editing': 'Correct odometer / KM linked with fuel issue records.',
}

function InventoryTxCard({ slug }) {
  const entry = TRANSACTION_MENU.find((item) => item.slug === slug)
  if (!entry) return null
  const Icon = SLUG_ICON[slug] || Boxes
  const blurb = SLUG_BLURB[slug] || 'Garage transaction entry.'
  const to = transactionPath(slug)

  return (
    <Link to={to} className="group block h-full">
      <Card className="h-full transition-all border-border/80 shadow-sm hover:border-primary/40 hover:shadow-md hover:bg-gradient-to-br hover:from-primary/[0.03] hover:to-transparent">
        <CardHeader className="space-y-2 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="h-4 w-4" aria-hidden />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <CardTitle className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-snug">
                {entry.label}
              </CardTitle>
              <CardDescription className="text-xs leading-relaxed">{blurb}</CardDescription>
            </div>
          </div>
          <span className="text-xs font-medium text-primary pt-0.5 group-hover:underline">Open →</span>
        </CardHeader>
      </Card>
    </Link>
  )
}

export default function Inventory() {
  const partsQuery = useQuery({
    queryKey: ['parts'],
    queryFn: async () => {
      const response = await partsApi.getAll({ limit: 10000, skip: 0 })
      return response.data
    },
  })

  const lowStockQuery = useQuery({
    queryKey: ['parts', 'low-stock'],
    queryFn: async () => {
      const response = await partsApi.getLowStock()
      return response.data
    },
  })

  const metrics = useMemo(() => {
    const parts = partsQuery.data || []
    const lowStock = lowStockQuery.data || []
    const totalSkus = parts.length
    const inactive = parts.filter((p) => !p.is_active).length
    let stockValue = 0
    for (const p of parts) {
      const qty = Number(p.stock_quantity) || 0
      const price = Number(p.unit_price) || 0
      stockValue += qty * price
    }
    return {
      totalSkus,
      inactive,
      lowCount: lowStock.length,
      stockValue,
    }
  }, [partsQuery.data, lowStockQuery.data])

  if (partsQuery.isLoading || lowStockQuery.isLoading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-muted-foreground">Loading inventory summary…</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Materials"
        title="Inventory"
        description={
          <>
            Parts master data, stock movement, and cycle-count preparation. Use <strong>Parts</strong> for SKU
            maintenance; open the transaction shortcuts below for issue, reserve, return, and fuel or lubricant flows.
          </>
        }
      />

      <div>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Summary</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Parts SKUs"
            value={metrics.totalSkus.toLocaleString()}
            subtitle="Summary loads up to 10,000 rows; use Parts for the full list."
            icon={Package}
            tone="teal"
          />
          <StatCard
            title="Low / out alerts"
            value={metrics.lowCount.toLocaleString()}
            subtitle="Below minimum stock level"
            icon={AlertTriangle}
            tone="rose"
            highlight={metrics.lowCount > 0}
          />
          <StatCard
            title="Inactive parts"
            value={metrics.inactive.toLocaleString()}
            subtitle="Excluded from normal issue lists"
            icon={Warehouse}
            tone="slate"
          />
          <StatCard
            title="Stock on hand (value)"
            subtitle="Qty × unit price (estimate)"
            value={`ETB ${Math.round(metrics.stockValue).toLocaleString()}`}
            icon={FileSpreadsheet}
            tone="indigo"
          />
        </div>
      </div>

      <div>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Master data
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link to="/parts" className="group block h-full">
            <Card className="h-full border-border/80 shadow-sm transition-all hover:border-primary/40 hover:shadow-md">
              <CardHeader className="py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-700">
                    <Package className="h-5 w-5" aria-hidden />
                  </div>
                  <div>
                    <CardTitle className="text-base group-hover:text-primary transition-colors">Parts inventory</CardTitle>
                    <CardDescription className="text-xs">SKU list, stock quantities, low-stock view, add parts.</CardDescription>
                  </div>
                </div>
                <span className="text-xs font-medium text-primary group-hover:underline">Open parts →</span>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>

      <div>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Stock movement
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {INVENTORY_SLUG_ORDER.map((slug) => (
            <InventoryTxCard key={slug} slug={slug} />
          ))}
        </div>
      </div>

      <Card className="border-dashed border-primary/25 bg-muted/20">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Boxes className="h-4 w-4 text-primary" aria-hidden />
            Cycle count (physical count)
          </CardTitle>
          <CardDescription>
            Prepare a counting session name and location. Full scan/import and variance posting can be wired to the
            backend when cycle-count APIs are available.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
          <div className="space-y-2">
            <label htmlFor="inv-session-name" className="text-sm font-medium text-foreground">
              Session name
            </label>
            <Input id="inv-session-name" placeholder="e.g. May 2026 cycle count — main store" />
          </div>
          <div className="space-y-2">
            <label htmlFor="inv-count-date" className="text-sm font-medium text-foreground">
              Count date
            </label>
            <Input id="inv-count-date" type="date" />
          </div>
          <div className="space-y-2">
            <label htmlFor="inv-warehouse" className="text-sm font-medium text-foreground">
              Warehouse / store
            </label>
            <Input id="inv-warehouse" placeholder="Main store" />
          </div>
          <div className="md:col-span-3 flex flex-wrap gap-2">
            <Button type="button" disabled className="gap-2">
              Start count
              <ArrowRight className="h-4 w-4 opacity-70" aria-hidden />
            </Button>
            <Button type="button" variant="outline" disabled>
              Review draft sessions
            </Button>
          </div>
          <p className="md:col-span-3 text-xs text-muted-foreground">
            Buttons stay disabled until server-side count sessions are implemented. Use{' '}
            <Link to="/parts" className="text-primary underline-offset-4 hover:underline">
              Parts inventory
            </Link>{' '}
            for current quantities in the meantime.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
