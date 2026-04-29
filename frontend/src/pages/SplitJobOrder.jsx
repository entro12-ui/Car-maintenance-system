import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowRightLeft, RefreshCw, Search } from 'lucide-react'
import { customersApi, jobOrderLaborApi, jobOrdersApi, vehiclesApi } from '../services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

function fmtDateTime(v) {
  if (!v) return ''
  const s = String(v)
  return s.length > 16 ? s.slice(0, 16).replace('T', ' ') : s
}

function customerLabel(c) {
  if (!c) return ''
  return `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.email || ''
}

export default function SplitJobOrder({ aiHint = false }) {
  const queryClient = useQueryClient()
  const [jobNo, setJobNo] = useState('')
  const [sourceId, setSourceId] = useState(null)
  const [lookupOpen, setLookupOpen] = useState(false)
  const [lookupFilter, setLookupFilter] = useState('')
  const [selectedTaskIds, setSelectedTaskIds] = useState(() => new Set())
  const [splitCustomerId, setSplitCustomerId] = useState('')
  const [newJobNumber, setNewJobNumber] = useState('')
  const [newJobId, setNewJobId] = useState(null)

  const { data: jobRes, refetch } = useQuery({
    queryKey: ['jobOrder', sourceId],
    queryFn: () => jobOrdersApi.getById(sourceId),
    enabled: Number.isFinite(sourceId) && sourceId > 0,
  })
  const job = jobRes?.data

  const { data: vehicleRes } = useQuery({
    queryKey: ['vehicle', job?.vehicle_id],
    queryFn: () => vehiclesApi.getById(job.vehicle_id),
    enabled: Boolean(job?.vehicle_id),
  })
  const vehicle = vehicleRes?.data

  const { data: customerRes } = useQuery({
    queryKey: ['customer', job?.customer_id],
    queryFn: () => customersApi.getById(job.customer_id),
    enabled: Boolean(job?.customer_id),
  })
  const customer = customerRes?.data

  const { data: laborRes } = useQuery({
    queryKey: ['laborChargesSplit', sourceId],
    queryFn: () => jobOrderLaborApi.listCharges(sourceId),
    enabled: Number.isFinite(sourceId) && sourceId > 0,
  })
  const laborRows = laborRes?.data || []

  const { data: listRes } = useQuery({
    queryKey: ['jobOrdersSplitLookup', lookupOpen],
    queryFn: () => jobOrdersApi.list({ limit: 200 }),
    enabled: lookupOpen,
  })
  const listJobs = listRes?.data || []
  const filtered = useMemo(() => {
    const q = lookupFilter.trim().toLowerCase()
    if (!q) return listJobs.slice(0, 80)
    return listJobs.filter((j) => j.job_order_number?.toLowerCase().includes(q)).slice(0, 80)
  }, [listJobs, lookupFilter])

  const loadJob = async () => {
    const n = jobNo.trim()
    if (!n) return
    const res = await jobOrdersApi.list({ job_order_number: n, limit: 3 })
    const row = res.data?.[0]
    if (!row) {
      window.alert('Job not found.')
      setSourceId(null)
      return
    }
    setSourceId(row.job_order_id)
    setSelectedTaskIds(new Set())
    setNewJobNumber('')
  }

  const toggleTask = (taskId) => {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev)
      if (next.has(taskId)) next.delete(taskId)
      else next.add(taskId)
      return next
    })
  }

  const splitMutation = useMutation({
    mutationFn: () =>
      jobOrdersApi.split(sourceId, {
        task_ids: [...selectedTaskIds],
        customer_id: splitCustomerId ? Number(splitCustomerId) : null,
      }),
    onSuccess: (res) => {
      const body = res?.data ?? res
      const nj = body?.new_job_order
      if (nj?.job_order_number) setNewJobNumber(nj.job_order_number)
      if (nj?.job_order_id) setNewJobId(nj.job_order_id)
      queryClient.invalidateQueries({ queryKey: ['jobOrder', sourceId] })
      queryClient.invalidateQueries({ queryKey: ['laborChargesSplit', sourceId] })
    },
  })

  const canSplit =
    job &&
    !['Closed', 'Cancelled'].includes(job.status) &&
    !job.delivered_at &&
    !job.is_blocked &&
    selectedTaskIds.size > 0

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between gap-2">
        <div>
          <div className="text-sm text-muted-foreground">
            <Link to="/utilities" className="text-primary hover:underline">
              Utilities
            </Link>
            <span className="mx-1">/</span>
            <span className="text-foreground font-medium">Split job order</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight mt-1">Split job order</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
            Move selected <strong>tasks</strong> (and their clock rows) to a new open job. Job must not be closed,
            cancelled, delivered, blocked, or have open inventory issues.
          </p>
          {aiHint ? (
            <p className="text-xs text-muted-foreground mt-2 border-l-2 pl-2 border-primary">
              Split Job Order — AI: use your standard split rules; this web build uses the same transfer as the manual
              split (task-based).
            </p>
          ) : null}
        </div>
        <div className="text-sm flex flex-col items-end gap-0.5">
          <span className="text-red-600 font-medium">Before invoicing</span>
          <span className="text-blue-600 font-medium">Ready</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={!canSplit || splitMutation.isPending}
          onClick={() => splitMutation.mutate()}
        >
          <ArrowRightLeft className="h-4 w-4 mr-2" />
          {splitMutation.isPending ? 'Splitting…' : 'Transfer to new job'}
        </Button>
        <Button type="button" variant="outline" onClick={() => refetch()} disabled={!sourceId}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {splitMutation.isError ? (
        <p className="text-sm text-destructive">{splitMutation.error?.response?.data?.detail || 'Split failed'}</p>
      ) : null}
      {splitMutation.isSuccess && newJobNumber ? (
        <p className="text-sm text-emerald-800 border border-emerald-200 rounded-md p-2 bg-emerald-50">
          New job: <strong>{newJobNumber}</strong>.{' '}
          {newJobId ? (
            <Link className="text-primary underline" to={`/job-orders/${newJobId}`}>
              Open new job
            </Link>
          ) : null}
        </p>
      ) : null}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card className="p-4 space-y-3">
          <div className="text-sm font-semibold border-b pb-2">Source job</div>
          <div className="flex gap-2 items-end">
            <div className="flex-1 space-y-1">
              <label className="text-xs text-muted-foreground">Job number</label>
              <Input value={jobNo} onChange={(e) => setJobNo(e.target.value)} />
            </div>
            <Button type="button" variant="secondary" onClick={() => void loadJob()}>
              Load
            </Button>
            <Button type="button" variant="outline" size="icon" onClick={() => setLookupOpen(true)}>
              <Search className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Plate</span>
              <div className="font-medium">{vehicle?.license_plate || '—'}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Date/time</span>
              <div className="font-medium">{fmtDateTime(job?.created_at)}</div>
            </div>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Customer</span>
            <div className="text-sm font-medium">{customerLabel(customer)}</div>
          </div>
          <div className="flex flex-wrap gap-4 text-xs">
            <label className="flex items-center gap-1 opacity-80">
              <input type="checkbox" checked={job?.status === 'Closed'} readOnly disabled /> Is closed?
            </label>
            <label className="flex items-center gap-1 opacity-80">
              <input type="checkbox" readOnly disabled /> Is invoiced?
            </label>
            <label className="flex items-center gap-1 opacity-80">
              <input type="checkbox" checked={Boolean(job?.delivered_at)} readOnly disabled /> Delivered?
            </label>
          </div>
          <div className="text-xs font-semibold text-muted-foreground pt-2">Tasks to move</div>
          <div className="border rounded-md overflow-hidden max-h-56 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="p-2 w-8" />
                  <th className="text-left p-2">Task</th>
                </tr>
              </thead>
              <tbody>
                {(job?.tasks || []).map((t, idx) => (
                  <tr key={t.task_id} className={idx % 2 ? 'bg-muted/20' : ''}>
                    <td className="p-2 text-center">
                      <input
                        type="checkbox"
                        checked={selectedTaskIds.has(t.task_id)}
                        onChange={() => toggleTask(t.task_id)}
                        className="h-4 w-4"
                      />
                    </td>
                    <td className="p-2">{t.task_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!job?.tasks?.length ? <p className="p-3 text-xs text-muted-foreground">No tasks on this job.</p> : null}
          </div>
          <div className="text-xs font-semibold text-muted-foreground">Labor charges (reference)</div>
          <div className="border rounded-md overflow-x-auto max-h-40 overflow-y-auto text-xs">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-1">Product</th>
                  <th className="text-right p-1">Qty</th>
                  <th className="text-right p-1">Amount</th>
                </tr>
              </thead>
              <tbody>
                {laborRows.map((r) => (
                  <tr key={r.labor_charge_id}>
                    <td className="p-1">{r.labor_type_name || r.charge_code || '—'}</td>
                    <td className="p-1 text-right">{r.hours_worked}</td>
                    <td className="p-1 text-right">{r.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!laborRows.length ? <p className="p-2 text-muted-foreground">No labor lines.</p> : null}
          </div>
        </Card>

        <Card className="p-4 space-y-3">
          <div className="text-sm font-semibold border-b pb-2">Target job</div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">To job order no. (after split)</label>
            <Input readOnly className="bg-muted/40" value={newJobNumber || '(created on transfer)'} />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Optional customer override (ID)</label>
            <Input
              value={splitCustomerId}
              onChange={(e) => setSplitCustomerId(e.target.value)}
              placeholder="Leave blank to keep source customer"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            After transfer, labor and other charges remain on the original job unless you move them from job detail.
          </p>
        </Card>
      </div>

      <Dialog open={lookupOpen} onOpenChange={setLookupOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select job</DialogTitle>
          </DialogHeader>
          <Input value={lookupFilter} onChange={(e) => setLookupFilter(e.target.value)} className="mb-2" placeholder="Filter…" />
          <ul className="max-h-72 overflow-y-auto text-sm space-y-1">
            {filtered.map((j) => (
              <li key={j.job_order_id}>
                <button
                  type="button"
                  className="w-full text-left rounded-md px-2 py-2 hover:bg-muted"
                  onClick={() => {
                    setJobNo(j.job_order_number)
                    setSourceId(j.job_order_id)
                    setLookupOpen(false)
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
