import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FolderOpen, Printer, RefreshCw, Search } from 'lucide-react'
import { customersApi, employeesApi, jobOrdersApi, serviceTypesApi, vehiclesApi } from '../services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

function fmtDateInput(v) {
  if (!v) return ''
  return String(v).slice(0, 10)
}

function customerLabel(c) {
  if (!c) return ''
  const n = `${c.first_name || ''} ${c.last_name || ''}`.trim()
  return n || c.email || `#${c.customer_id}`
}

function addressLines(c) {
  if (!c) return ''
  const parts = [c.address, c.address_local, c.city, c.po_box].filter(Boolean)
  return parts.join(', ')
}

export default function ReopenJobOrder() {
  const queryClient = useQueryClient()
  const [jobNoInput, setJobNoInput] = useState('')
  const [jobOrderId, setJobOrderId] = useState(null)
  const [lookupOpen, setLookupOpen] = useState(false)
  const [lookupFilter, setLookupFilter] = useState('')

  const { data: mechanicsData } = useQuery({
    queryKey: ['mechanics'],
    queryFn: () => employeesApi.getMechanics(),
  })
  const mechanics = mechanicsData?.data || []

  const { data: jobRes, isLoading: jobLoading, refetch } = useQuery({
    queryKey: ['jobOrder', jobOrderId],
    queryFn: () => jobOrdersApi.getById(jobOrderId),
    enabled: Number.isFinite(jobOrderId) && jobOrderId > 0,
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

  const { data: serviceTypeRes } = useQuery({
    queryKey: ['serviceType', job?.service_type_id],
    queryFn: () => serviceTypesApi.getById(job.service_type_id),
    enabled: Boolean(job?.service_type_id),
  })
  const serviceType = serviceTypeRes?.data

  const { data: listRes } = useQuery({
    queryKey: ['jobOrdersLookupReopen', lookupOpen],
    queryFn: () => jobOrdersApi.list({ status: 'Closed', limit: 200 }),
    enabled: lookupOpen,
  })
  const listJobs = listRes?.data || []
  const filteredLookup = useMemo(() => {
    const q = lookupFilter.trim().toLowerCase()
    if (!q) return listJobs.slice(0, 80)
    return listJobs.filter((j) => j.job_order_number?.toLowerCase().includes(q)).slice(0, 80)
  }, [listJobs, lookupFilter])

  const loadByNumber = async () => {
    const n = jobNoInput.trim()
    if (!n) return
    const res = await jobOrdersApi.list({ job_order_number: n, limit: 5 })
    const rows = res.data || []
    const closed = rows.find((r) => r.status === 'Closed')
    if (!closed) {
      setJobOrderId(null)
      window.alert('Job order not found or not closed.')
      return
    }
    setJobOrderId(closed.job_order_id)
  }

  const reopenMutation = useMutation({
    mutationFn: () => jobOrdersApi.reopen(jobOrderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobOrder', jobOrderId] })
      window.alert('Job order reopened. You can edit it again from Job Orders.')
    },
  })

  const testedByName = useMemo(() => {
    if (!job?.close_tested_by_employee_id) return ''
    const m = mechanics.find((x) => Number(x.employee_id) === Number(job.close_tested_by_employee_id))
    return m?.name || ''
  }, [job?.close_tested_by_employee_id, mechanics])

  const canReopen = job?.status === 'Closed' && !job?.is_blocked && !job?.delivered_at

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2 print:hidden">
        <div>
          <div className="text-sm text-muted-foreground">
            <Link to="/utilities" className="text-primary hover:underline">
              Utilities
            </Link>
            <span className="mx-1">/</span>
            <span className="text-foreground font-medium">Reopen Job Order</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight mt-1">Reopen job order</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Select a <strong>closed</strong> job order, review details, then reopen to continue work or corrections.
            Delivered jobs cannot be reopened here.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-red-600 font-medium">ReOpen Job Order</span>
          <span className="text-blue-600 font-medium">{canReopen ? 'Ready' : job ? 'Not available' : 'Ready'}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 print:hidden">
        <Button
          type="button"
          variant="default"
          disabled={!canReopen || reopenMutation.isPending}
          onClick={() => {
            if (!window.confirm('Reopen this job order? It will return to Open status.')) return
            reopenMutation.mutate()
          }}
        >
          <FolderOpen className="h-4 w-4 mr-2" />
          {reopenMutation.isPending ? 'Reopening…' : 'Reopen job order'}
        </Button>
        <Button type="button" variant="outline" onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-2" />
          Print preview
        </Button>
        <Button type="button" variant="outline" onClick={() => refetch()} disabled={!jobOrderId}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
        {jobOrderId ? (
          <Button type="button" variant="ghost" asChild>
            <Link to={`/job-orders/${jobOrderId}`}>Job detail</Link>
          </Button>
        ) : null}
      </div>

      {reopenMutation.isError ? (
        <p className="text-sm text-destructive">{reopenMutation.error?.response?.data?.detail || 'Reopen failed'}</p>
      ) : null}

      <Card className="p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="lg:col-span-2 flex gap-2 items-end">
            <div className="flex-1 space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Job order no.</label>
              <Input value={jobNoInput} onChange={(e) => setJobNoInput(e.target.value)} placeholder="Closed job number" />
            </div>
            <Button type="button" variant="secondary" onClick={() => void loadByNumber()} disabled={!jobNoInput.trim()}>
              Load
            </Button>
            <Button type="button" variant="outline" size="icon" title="Lookup closed jobs" onClick={() => setLookupOpen(true)}>
              <Search className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Plate no.</label>
            <Input readOnly className="bg-muted/40" value={vehicle?.license_plate || ''} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Location</label>
            <Input
              readOnly
              className="bg-muted/40"
              value={job?.received_vehicle_location || job?.received_section || job?.dispatched_section || ''}
            />
          </div>
          <div className="lg:col-span-2 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Customer</label>
            <Input readOnly className="bg-muted/40" value={customerLabel(customer)} />
          </div>
          <div className="lg:col-span-2 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Address</label>
            <Input readOnly className="bg-muted/40" value={addressLines(customer)} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Engine no.</label>
            <Input readOnly className="bg-muted/40" value={vehicle?.engine_type || ''} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Model / serial</label>
            <Input
              readOnly
              className="bg-muted/40"
              value={vehicle ? `${vehicle.make || ''} ${vehicle.model || ''}`.trim() : ''}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Opening date</label>
            <Input readOnly className="bg-muted/40" value={fmtDateInput(job?.opened_date)} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Millage</label>
            <Input readOnly className="bg-muted/40" value={job?.mileage_in_km || ''} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Make</label>
            <Input readOnly className="bg-muted/40" value={vehicle?.make || ''} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Exp. finish date</label>
            <Input readOnly className="bg-muted/40" value={fmtDateInput(job?.expected_finish_date)} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Type of job</label>
            <Input readOnly className="bg-muted/40" value={serviceType?.type_name || ''} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Chassis / VIN</label>
            <Input readOnly className="bg-muted/40" value={vehicle?.vin || ''} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Opened for / section</label>
            <Input readOnly className="bg-muted/40" value={job?.dispatched_section || job?.received_section || ''} />
          </div>
          <div className="space-y-1 lg:col-span-2">
            <label className="text-xs font-medium text-muted-foreground">Repair type</label>
            <Input readOnly className="bg-muted/40" value={serviceType?.description || serviceType?.type_name || ''} />
          </div>
        </div>
        {jobLoading && jobOrderId ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4 space-y-3 bg-muted/20">
          <div className="text-sm font-semibold border-b pb-2">Job order closing status</div>
          <label className="flex items-center gap-2 text-sm opacity-80">
            <input type="checkbox" checked={job?.status === 'Closed'} readOnly disabled className="h-4 w-4" />
            Is closed?
          </label>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Date</label>
            <Input readOnly disabled className="bg-muted/30" value={job?.closed_at ? fmtDateInput(job.closed_at) : ''} />
          </div>
        </Card>
        <Card className="p-4 space-y-3 bg-muted/20">
          <div className="text-sm font-semibold border-b pb-2">Testing</div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Tested by</label>
            <Input readOnly disabled className="bg-muted/30" value={testedByName} placeholder="—" />
          </div>
          <label className="flex items-center gap-2 text-sm opacity-70">
            <input type="checkbox" checked={Boolean(job?.close_tested_on_road)} readOnly disabled className="h-4 w-4" />
            On road
          </label>
          <label className="flex items-center gap-2 text-sm opacity-70">
            <input type="checkbox" checked={Boolean(job?.close_tested_on_test_lane)} readOnly disabled className="h-4 w-4" />
            On test lane
          </label>
        </Card>
      </div>

      {job && job.status !== 'Closed' ? (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md p-3">This job is not closed.</p>
      ) : null}
      {job?.delivered_at ? (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md p-3">This job was already delivered and cannot be reopened from this screen.</p>
      ) : null}

      <Dialog open={lookupOpen} onOpenChange={setLookupOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Closed job orders</DialogTitle>
          </DialogHeader>
          <Input placeholder="Filter…" value={lookupFilter} onChange={(e) => setLookupFilter(e.target.value)} className="mb-3" />
          <ul className="space-y-1 text-sm max-h-72 overflow-y-auto">
            {filteredLookup.map((j) => (
              <li key={j.job_order_id}>
                <button
                  type="button"
                  className="w-full text-left rounded-md px-2 py-2 hover:bg-muted"
                  onClick={() => {
                    setJobNoInput(j.job_order_number)
                    setJobOrderId(j.job_order_id)
                    setLookupOpen(false)
                  }}
                >
                  <span className="font-medium">{j.job_order_number}</span>
                  <span className="text-muted-foreground"> — {j.status}</span>
                </button>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </div>
  )
}
