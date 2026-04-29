import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Copy, RefreshCw, Search } from 'lucide-react'
import { customersApi, jobOrdersApi, vehiclesApi } from '../services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

function customerLabel(c) {
  if (!c) return ''
  const n = `${c.first_name || ''} ${c.last_name || ''}`.trim()
  return n || c.email || ''
}

export default function CopyJobOrder() {
  const navigate = useNavigate()
  const [fromNo, setFromNo] = useState('')
  const [fromId, setFromId] = useState(null)
  const [lookupOpen, setLookupOpen] = useState(false)
  const [lookupFilter, setLookupFilter] = useState('')
  const [toNumberPreview, setToNumberPreview] = useState('')

  const { data: jobRes, refetch } = useQuery({
    queryKey: ['jobOrder', fromId],
    queryFn: () => jobOrdersApi.getById(fromId),
    enabled: Number.isFinite(fromId) && fromId > 0,
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

  const { data: listRes } = useQuery({
    queryKey: ['jobOrdersCopyLookup', lookupOpen],
    queryFn: () => jobOrdersApi.list({ limit: 200 }),
    enabled: lookupOpen,
  })
  const listJobs = listRes?.data || []
  const filtered = lookupFilter.trim()
    ? listJobs.filter((j) => j.job_order_number?.toLowerCase().includes(lookupFilter.trim().toLowerCase())).slice(0, 80)
    : listJobs.slice(0, 80)

  const loadFrom = async () => {
    const n = fromNo.trim()
    if (!n) return
    const res = await jobOrdersApi.list({ job_order_number: n, limit: 5 })
    const row = res.data?.[0]
    if (!row) {
      window.alert('Job order not found.')
      setFromId(null)
      return
    }
    setFromId(row.job_order_id)
    const num = row.job_order_number || ''
    setToNumberPreview(num ? `${num}A` : '')
  }

  const copyMutation = useMutation({
    mutationFn: () => jobOrdersApi.copy(fromId, { copy_tasks: true }),
    onSuccess: (res) => {
      const newId = res.data?.job_order_id
      if (newId) {
        setToNumberPreview(res.data.job_order_number || '')
        navigate(`/job-orders/${newId}`)
      }
    },
  })

  /** Backend allows copy when Closed OR delivered_at is set. */
  const canCopyJob = job && (job.status === 'Closed' || job.delivered_at != null)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between gap-2">
        <div>
          <div className="text-sm text-muted-foreground">
            <Link to="/utilities" className="text-primary hover:underline">
              Utilities
            </Link>
            <span className="mx-1">/</span>
            <span className="text-foreground font-medium">Copy job order</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight mt-1">Copy job order</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Duplicate a <strong>closed</strong> or <strong>delivered</strong> job into a new open job (new job number is
            assigned by the server).
          </p>
        </div>
        <span className="text-sm text-blue-600 font-medium">Ready</span>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={!canCopyJob || copyMutation.isPending}
          onClick={() => copyMutation.mutate()}
        >
          <Copy className="h-4 w-4 mr-2" />
          {copyMutation.isPending ? 'Copying…' : 'Copy job'}
        </Button>
        <Button type="button" variant="outline" onClick={() => refetch()} disabled={!fromId}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {copyMutation.isError ? (
        <p className="text-sm text-destructive">{copyMutation.error?.response?.data?.detail || 'Copy failed'}</p>
      ) : null}

      <Card className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex gap-2 items-end">
          <div className="flex-1 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">From job order</label>
            <Input value={fromNo} onChange={(e) => setFromNo(e.target.value)} />
          </div>
          <Button type="button" variant="secondary" onClick={() => void loadFrom()}>
            Load
          </Button>
          <Button type="button" variant="outline" size="icon" onClick={() => setLookupOpen(true)}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Plate no.</label>
          <Input readOnly className="bg-muted/40" value={vehicle?.license_plate || ''} />
        </div>
        <div className="space-y-1 md:col-span-2">
          <label className="text-xs font-medium text-muted-foreground">To job order (after copy)</label>
          <Input readOnly className="bg-muted/40" value={toNumberPreview || '(generated on copy)'} />
        </div>
        <div className="space-y-1 md:col-span-2">
          <label className="text-xs font-medium text-muted-foreground">Customer name</label>
          <Input readOnly className="bg-muted/40" value={customerLabel(customer)} />
        </div>
      </Card>

      {job && !canCopyJob ? (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md p-3">
          This job must be <strong>Closed</strong> or have a <strong>delivery date</strong> before it can be copied.
        </p>
      ) : null}

      <Dialog open={lookupOpen} onOpenChange={setLookupOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select job</DialogTitle>
          </DialogHeader>
          <Input placeholder="Filter…" value={lookupFilter} onChange={(e) => setLookupFilter(e.target.value)} className="mb-2" />
          <ul className="max-h-72 overflow-y-auto text-sm space-y-1">
            {filtered.map((j) => (
              <li key={j.job_order_id}>
                <button
                  type="button"
                  className="w-full text-left rounded-md px-2 py-2 hover:bg-muted"
                  onClick={() => {
                    setFromNo(j.job_order_number)
                    setFromId(j.job_order_id)
                    setToNumberPreview(`${j.job_order_number}A`)
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
