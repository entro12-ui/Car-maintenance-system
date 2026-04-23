import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { garageInvoicesApi } from '../services/api'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function daysAgoISO(days) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

export default function GarageClearUncollectedSales() {
  const queryClient = useQueryClient()

  const [startDate, setStartDate] = useState(daysAgoISO(30))
  const [endDate, setEndDate] = useState(todayISO())
  const [selected, setSelected] = useState(() => new Set())

  const enabled = !!startDate && !!endDate

  const { data, isLoading, error } = useQuery({
    queryKey: ['uncollectedInvoices', { startDate, endDate }],
    queryFn: () => garageInvoicesApi.listUncollected(startDate, endDate),
    enabled,
  })

  const rows = useMemo(() => data?.data || [], [data])

  const clearMutation = useMutation({
    mutationFn: ({ ids }) => {
      const payload = ids ? { invoice_ids: ids } : {}
      return garageInvoicesApi.clearUncollected(startDate, endDate, payload)
    },
    onSuccess: async () => {
      setSelected(new Set())
      await queryClient.invalidateQueries({ queryKey: ['uncollectedInvoices'] })
    },
  })

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const clearSelected = () => {
    if (selected.size === 0) return
    clearMutation.mutate({ ids: Array.from(selected) })
  }

  const clearAll = () => {
    clearMutation.mutate({ ids: null })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Clear Uncollected Sales Order</h1>
        <p className="text-gray-600">List uncollected invoices by date range and clear them.</p>
      </div>

      <Card className="p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Start Date</label>
            <Input className="mt-1" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">End Date</label>
            <Input className="mt-1" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div className="flex items-end gap-2">
            <Button type="button" variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['uncollectedInvoices'] })}>
              Refresh
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button type="button" onClick={clearSelected} disabled={clearMutation.isPending || selected.size === 0}>
            {clearMutation.isPending ? 'Clearing...' : 'Clear Selected'}
          </Button>
          <Button type="button" variant="outline" onClick={clearAll} disabled={clearMutation.isPending || rows.length === 0}>
            Clear All
          </Button>
          {clearMutation.error && (
            <div className="text-sm text-red-600">
              {clearMutation.error?.response?.data?.detail || 'Clear failed'}
            </div>
          )}
          {clearMutation.isSuccess && <div className="text-sm text-green-700">Cleared.</div>}
        </div>
      </Card>

      <Card className="p-4">
        {isLoading ? (
          <div className="text-sm text-gray-500">Loading...</div>
        ) : error ? (
          <div className="text-sm text-red-600">Failed to load uncollected invoices</div>
        ) : rows.length === 0 ? (
          <div className="text-sm text-gray-500">No uncollected invoices in this date range.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">Sel</th>
                  <th className="text-left py-2 px-2">Invoice</th>
                  <th className="text-left py-2 px-2">Type</th>
                  <th className="text-left py-2 px-2">Job</th>
                  <th className="text-left py-2 px-2">Customer</th>
                  <th className="text-right py-2 px-2">Total</th>
                  <th className="text-left py-2 px-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.invoice_id} className="border-b last:border-0">
                    <td className="py-2 px-2">
                      <input type="checkbox" checked={selected.has(r.invoice_id)} onChange={() => toggle(r.invoice_id)} />
                    </td>
                    <td className="py-2 px-2 font-mono">{r.invoice_number}</td>
                    <td className="py-2 px-2">{r.invoice_type}</td>
                    <td className="py-2 px-2 font-mono">{r.job_order_number}</td>
                    <td className="py-2 px-2">{r.customer_name || '-'}</td>
                    <td className="py-2 px-2 text-right">{Number(r.total_amount || 0).toFixed(2)}</td>
                    <td className="py-2 px-2">{r.created_at ? new Date(r.created_at).toLocaleString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
