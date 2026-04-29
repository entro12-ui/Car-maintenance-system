import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link2, RefreshCw, Search } from 'lucide-react'
import { customersApi, jobOrdersApi, vehiclesApi } from '../services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

function customerLabel(c) {
  if (!c) return ''
  return `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.email || ''
}

export default function PairingJobOrder() {
  const queryClient = useQueryClient()
  const [fromNo, setFromNo] = useState('')
  const [fromId, setFromId] = useState(null)
  const [toNo, setToNo] = useState('')
  const [toId, setToId] = useState(null)
  const [lookup, setLookup] = useState({ open: false, side: 'from' })
  const [lookupFilter, setLookupFilter] = useState('')

  const { data: fromJobRes } = useQuery({
    queryKey: ['jobOrder', fromId],
    queryFn: () => jobOrdersApi.getById(fromId),
    enabled: Number.isFinite(fromId) && fromId > 0,
  })
  const fromJob = fromJobRes?.data

  const { data: toJobRes } = useQuery({
    queryKey: ['jobOrder', toId],
    queryFn: () => jobOrdersApi.getById(toId),
    enabled: Number.isFinite(toId) && toId > 0,
  })
  const toJob = toJobRes?.data

  const { data: vFrom } = useQuery({
    queryKey: ['vehicle', fromJob?.vehicle_id],
    queryFn: () => vehiclesApi.getById(fromJob.vehicle_id),
    enabled: Boolean(fromJob?.vehicle_id),
  })
  const { data: vTo } = useQuery({
    queryKey: ['vehicle', toJob?.vehicle_id],
    queryFn: () => vehiclesApi.getById(toJob.vehicle_id),
    enabled: Boolean(toJob?.vehicle_id),
  })
  const { data: cFrom } = useQuery({
    queryKey: ['customer', fromJob?.customer_id],
    queryFn: () => customersApi.getById(fromJob.customer_id),
    enabled: Boolean(fromJob?.customer_id),
  })
  const { data: cTo } = useQuery({
    queryKey: ['customer', toJob?.customer_id],
    queryFn: () => customersApi.getById(toJob.customer_id),
    enabled: Boolean(toJob?.customer_id),
  })

  const { data: p1 } = useQuery({
    queryKey: ['pairings', fromId],
    queryFn: () => jobOrdersApi.listPairings(fromId),
    enabled: Number.isFinite(fromId) && fromId > 0,
  })
  const { data: p2 } = useQuery({
    queryKey: ['pairings', toId],
    queryFn: () => jobOrdersApi.listPairings(toId),
    enabled: Number.isFinite(toId) && toId > 0,
  })

  const pairingRows = useMemo(() => {
    const map = new Map()
    for (const r of [...(p1?.data || []), ...(p2?.data || [])]) {
      map.set(r.pairing_id, r)
    }
    return [...map.values()].sort((a, b) => String(b.paired_at).localeCompare(String(a.paired_at)))
  }, [p1?.data, p2?.data])

  const jobNumById = useMemo(() => {
    const m = {}
    if (fromJob?.job_order_id) m[fromJob.job_order_id] = fromJob.job_order_number
    if (toJob?.job_order_id) m[toJob.job_order_id] = toJob.job_order_number
    return m
  }, [fromJob, toJob])

  const { data: listRes } = useQuery({
    queryKey: ['jobOrdersPairLookup', lookup.open],
    queryFn: () => jobOrdersApi.list({ limit: 200 }),
    enabled: lookup.open,
  })
  const listJobs = listRes?.data || []
  const filtered = lookupFilter.trim()
    ? listJobs.filter((j) => j.job_order_number?.toLowerCase().includes(lookupFilter.trim().toLowerCase())).slice(0, 80)
    : listJobs.slice(0, 80)

  const loadSide = async (side) => {
    const n = (side === 'from' ? fromNo : toNo).trim()
    if (!n) return
    const res = await jobOrdersApi.list({ job_order_number: n, limit: 3 })
    const row = res.data?.[0]
    if (!row) {
      window.alert('Job not found.')
      return
    }
    if (side === 'from') setFromId(row.job_order_id)
    else setToId(row.job_order_id)
  }

  const pairMutation = useMutation({
    mutationFn: () => jobOrdersApi.pair({ job_order_id_1: fromId, job_order_id_2: toId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pairings', fromId] })
      queryClient.invalidateQueries({ queryKey: ['pairings', toId] })
    },
  })

  const canPair = fromId && toId && fromId !== toId

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between gap-2">
        <div>
          <div className="text-sm text-muted-foreground">
            <Link to="/utilities" className="text-primary hover:underline">
              Utilities
            </Link>
            <span className="mx-1">/</span>
            <span className="text-foreground font-medium">Pairing job order</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight mt-1">Pairing job order</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Link two active job orders. Pairs already linked are returned without error.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" disabled={!canPair || pairMutation.isPending} onClick={() => pairMutation.mutate()}>
          <Link2 className="h-4 w-4 mr-2" />
          {pairMutation.isPending ? 'Pairing…' : 'Pair'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ['pairings', fromId] })
            queryClient.invalidateQueries({ queryKey: ['pairings', toId] })
          }}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {pairMutation.isError ? (
        <p className="text-sm text-destructive">{pairMutation.error?.response?.data?.detail || 'Pair failed'}</p>
      ) : null}
      {pairMutation.isSuccess ? <p className="text-sm text-emerald-700">Pair saved.</p> : null}

      <Card className="p-4 space-y-4">
        <div className="text-sm font-semibold border-b pb-2">Source</div>
        <div className="flex gap-2 items-end">
          <div className="flex-1 space-y-1">
            <label className="text-xs text-muted-foreground">Job order no.</label>
            <Input value={fromNo} onChange={(e) => setFromNo(e.target.value)} />
          </div>
          <Button type="button" variant="secondary" onClick={() => void loadSide('from')}>
            Load
          </Button>
          <Button type="button" variant="outline" size="icon" onClick={() => setLookup({ open: true, side: 'from' })}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-xs text-muted-foreground">Plate</span>
            <div>{vFrom?.data?.license_plate || '—'}</div>
          </div>
          <div className="md:col-span-2">
            <span className="text-xs text-muted-foreground">Customer</span>
            <div>{customerLabel(cFrom?.data)}</div>
          </div>
        </div>
      </Card>

      <Card className="p-4 space-y-4">
        <div className="text-sm font-semibold border-b pb-2">Target</div>
        <div className="flex gap-2 items-end">
          <div className="flex-1 space-y-1">
            <label className="text-xs text-muted-foreground">To job order no.</label>
            <Input value={toNo} onChange={(e) => setToNo(e.target.value)} />
          </div>
          <Button type="button" variant="secondary" onClick={() => void loadSide('to')}>
            Load
          </Button>
          <Button type="button" variant="outline" size="icon" onClick={() => setLookup({ open: true, side: 'to' })}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-xs text-muted-foreground">Plate</span>
            <div>{vTo?.data?.license_plate || '—'}</div>
          </div>
          <div className="md:col-span-2">
            <span className="text-xs text-muted-foreground">Customer</span>
            <div>{customerLabel(cTo?.data)}</div>
          </div>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden border">
        <div className="text-sm font-semibold p-3 border-b bg-muted/30">Pairing history (from / to job)</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-2">From JC</th>
                <th className="text-left p-2">To JC</th>
                <th className="text-left p-2">Created by</th>
                <th className="text-left p-2">Created on</th>
                <th className="text-left p-2">Created WS</th>
              </tr>
            </thead>
            <tbody>
              {pairingRows.map((r) => (
                <tr key={r.pairing_id} className="border-t">
                  <td className="p-2 font-medium">{jobNumById[r.job_order_id_a] || `Job #${r.job_order_id_a}`}</td>
                  <td className="p-2 font-medium">{jobNumById[r.job_order_id_b] || `Job #${r.job_order_id_b}`}</td>
                  <td className="p-2">{r.paired_by_employee_id ?? '—'}</td>
                  <td className="p-2">{r.paired_at ? String(r.paired_at).slice(0, 19) : '—'}</td>
                  <td className="p-2 text-muted-foreground">—</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!pairingRows.length ? <p className="p-4 text-sm text-muted-foreground">Load a job to see pairings.</p> : null}
        </div>
      </Card>

      <Dialog open={lookup.open} onOpenChange={(o) => setLookup((s) => ({ ...s, open: o }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select job ({lookup.side})</DialogTitle>
          </DialogHeader>
          <Input value={lookupFilter} onChange={(e) => setLookupFilter(e.target.value)} placeholder="Filter…" className="mb-2" />
          <ul className="max-h-72 overflow-y-auto text-sm space-y-1">
            {filtered.map((j) => (
              <li key={j.job_order_id}>
                <button
                  type="button"
                  className="w-full text-left rounded-md px-2 py-2 hover:bg-muted"
                  onClick={() => {
                    if (lookup.side === 'from') {
                      setFromNo(j.job_order_number)
                      setFromId(j.job_order_id)
                    } else {
                      setToNo(j.job_order_number)
                      setToId(j.job_order_id)
                    }
                    setLookup({ open: false, side: 'from' })
                  }}
                >
                  {j.job_order_number} — {j.status}
                </button>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </div>
  )
}
