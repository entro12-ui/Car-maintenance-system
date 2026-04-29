import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Printer, RefreshCw, Save } from 'lucide-react'
import { customersApi, jobOrdersApi, vehiclesApi } from '../services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

function fmtDateInput(v) {
  if (!v) return ''
  return String(v).slice(0, 10)
}

function customerLabel(c) {
  if (!c) return '—'
  const n = `${c.first_name || ''} ${c.last_name || ''}`.trim()
  return n || c.email || '—'
}

export default function ReceiveAssembledJob() {
  const queryClient = useQueryClient()
  const [referenceNo, setReferenceNo] = useState('')
  const [receiveDate, setReceiveDate] = useState(() => fmtDateInput(new Date()))
  const [requestingUnit, setRequestingUnit] = useState('')
  const [selected, setSelected] = useState(() => new Set())

  const { data: listRes, isLoading, refetch } = useQuery({
    queryKey: ['closedJobsAssembly'],
    queryFn: () => jobOrdersApi.list({ status: 'Closed', limit: 300 }),
  })
  const jobs = listRes?.data || []

  const vehicleIds = useMemo(() => [...new Set(jobs.map((j) => j.vehicle_id).filter(Boolean))], [jobs])
  const { data: vehiclesMap } = useQuery({
    queryKey: ['vehiclesBulkAssembly', vehicleIds.slice(0, 50).join(',')],
    queryFn: async () => {
      const entries = await Promise.all(
        vehicleIds.slice(0, 50).map(async (id) => {
          try {
            const r = await vehiclesApi.getById(id)
            return [id, r.data]
          } catch {
            return [id, null]
          }
        })
      )
      return Object.fromEntries(entries)
    },
    enabled: vehicleIds.length > 0,
  })
  const vmap = vehiclesMap || {}

  const { data: customersMap } = useQuery({
    queryKey: ['customersBulkAssembly', jobs.map((j) => j.customer_id).filter(Boolean).slice(0, 40).join(',')],
    queryFn: async () => {
      const cids = [...new Set(jobs.map((j) => j.customer_id).filter(Boolean))].slice(0, 40)
      const entries = await Promise.all(
        cids.map(async (id) => {
          try {
            const r = await customersApi.getById(id)
            return [id, r.data]
          } catch {
            return [id, null]
          }
        })
      )
      return Object.fromEntries(entries)
    },
    enabled: jobs.some((j) => j.customer_id),
  })
  const cmap = customersMap || {}

  const saveMutation = useMutation({
    mutationFn: (body) => jobOrdersApi.assemblyLineReceive(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['closedJobsAssembly'] })
      setSelected(new Set())
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

  const onSave = () => {
    if (!referenceNo.trim() || !requestingUnit.trim()) {
      window.alert('Reference no. and requesting unit are required.')
      return
    }
    if (!selected.size) {
      window.alert('Select at least one closed job in the grid.')
      return
    }
    saveMutation.mutate({
      reference_no: referenceNo.trim(),
      receive_date: receiveDate || fmtDateInput(new Date()),
      requesting_unit: requestingUnit.trim(),
      job_order_ids: [...selected],
    })
  }

  const onVoid = () => {
    setSelected(new Set())
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between gap-2 print:hidden">
        <div>
          <div className="text-sm text-muted-foreground">
            <Link to="/utilities" className="text-primary hover:underline">
              Utilities
            </Link>
            <span className="mx-1">/</span>
            <span className="text-foreground font-medium">Receive assembled job</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight mt-1">Receive closed job</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
            Assembly line use only. Enter a reference and requesting unit, select closed jobs, then save to record the
            receipt.
          </p>
        </div>
        <div className="text-sm">
          <span className="text-blue-600 font-medium">Ready</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 print:hidden">
        <Button type="button" variant="secondary" disabled title="Not used in this web module">
          Add new
        </Button>
        <Button type="button" onClick={onSave} disabled={saveMutation.isPending}>
          <Save className="h-4 w-4 mr-2" />
          {saveMutation.isPending ? 'Saving…' : 'Save data'}
        </Button>
        <Button type="button" variant="outline" onClick={onVoid}>
          Void
        </Button>
        <Button type="button" variant="outline" onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-2" />
          Print preview
        </Button>
        <Button type="button" variant="outline" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {saveMutation.isError ? (
        <p className="text-sm text-destructive">{saveMutation.error?.response?.data?.detail || 'Save failed'}</p>
      ) : null}
      {saveMutation.isSuccess ? (
        <p className="text-sm text-emerald-700 border border-emerald-200 rounded-md p-2 bg-emerald-50">Receipt saved.</p>
      ) : null}

      <Card className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Reference no.</label>
          <Input value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} placeholder="e.g. R00112-19" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Date</label>
          <Input type="date" value={receiveDate} onChange={(e) => setReceiveDate(e.target.value)} />
        </div>
        <div className="md:col-span-2 space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Requesting unit</label>
          <Input value={requestingUnit} onChange={(e) => setRequestingUnit(e.target.value)} placeholder="e.g. Engineering" />
        </div>
      </Card>

      <Card className="p-0 overflow-hidden border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 border-b">
              <tr>
                <th className="p-2 w-10" />
                <th className="text-left p-2">Chassis / VIN</th>
                <th className="text-left p-2">Job order</th>
                <th className="text-left p-2">Customer</th>
                <th className="text-left p-2">Date closed</th>
                <th className="text-left p-2">Model</th>
                <th className="text-left p-2">Date opened</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j, idx) => {
                const v = vmap[j.vehicle_id]
                const c = j.customer_id ? cmap[j.customer_id] : null
                return (
                  <tr key={j.job_order_id} className={idx % 2 === 0 ? 'bg-sky-50/40' : ''}>
                    <td className="p-2 text-center">
                      <input
                        type="checkbox"
                        checked={selected.has(j.job_order_id)}
                        onChange={() => toggle(j.job_order_id)}
                        className="h-4 w-4"
                      />
                    </td>
                    <td className="p-2 font-mono text-xs">{v?.vin || '—'}</td>
                    <td className="p-2 font-medium">{j.job_order_number}</td>
                    <td className="p-2">{customerLabel(c)}</td>
                    <td className="p-2">{j.closed_at ? fmtDateInput(j.closed_at) : '—'}</td>
                    <td className="p-2">{v ? `${v.make || ''} ${v.model || ''}`.trim() : '—'}</td>
                    <td className="p-2">{j.opened_date ? fmtDateInput(j.opened_date) : '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {isLoading ? <p className="p-3 text-sm text-muted-foreground">Loading closed jobs…</p> : null}
        {!isLoading && !jobs.length ? <p className="p-3 text-sm text-muted-foreground">No closed job orders.</p> : null}
      </Card>
    </div>
  )
}
