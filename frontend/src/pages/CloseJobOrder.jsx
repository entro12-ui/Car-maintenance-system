import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Printer, RefreshCw, Search } from 'lucide-react'
import {
  customersApi,
  employeesApi,
  garageInvoicesApi,
  jobOrdersApi,
  serviceTypesApi,
  vehiclesApi,
} from '../services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

function fmtDateInput(v) {
  if (!v) return ''
  return String(v).slice(0, 10)
}

function formatDetail(detail) {
  if (detail == null) return 'Request failed'
  if (typeof detail === 'string') return detail
  if (typeof detail === 'object' && detail.message) return detail.message
  try {
    return JSON.stringify(detail)
  } catch {
    return 'Request failed'
  }
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

export default function CloseJobOrder() {
  const queryClient = useQueryClient()
  const [jobNoInput, setJobNoInput] = useState('')
  const [jobOrderId, setJobOrderId] = useState(null)
  const [lookupOpen, setLookupOpen] = useState(false)
  const [lookupFilter, setLookupFilter] = useState('')

  const [testedById, setTestedById] = useState('')
  const [onRoad, setOnRoad] = useState(false)
  const [onTestLane, setOnTestLane] = useState(true)
  const [detailWork, setDetailWork] = useState('')
  const [closeRemark, setCloseRemark] = useState('')
  const [sendEmail, setSendEmail] = useState(false)
  const [closeDate, setCloseDate] = useState(() => fmtDateInput(new Date()))
  const [confirmClose, setConfirmClose] = useState(false)

  const { data: mechanicsData } = useQuery({
    queryKey: ['mechanics'],
    queryFn: () => employeesApi.getMechanics(),
  })
  const mechanics = mechanicsData?.data || []

  const { data: jobRes, isLoading: jobLoading, error: jobError, refetch } = useQuery({
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

  const { data: invoicesRes } = useQuery({
    queryKey: ['garageInvoicesByJob', jobOrderId],
    queryFn: () => garageInvoicesApi.list({ job_order_id: jobOrderId }),
    enabled: Number.isFinite(jobOrderId) && jobOrderId > 0,
  })
  const invoices = invoicesRes?.data || []
  const issuedInvoice = useMemo(
    () => invoices.find((inv) => inv.status === 'Issued') || invoices[0],
    [invoices]
  )

  useEffect(() => {
    closeMutation.reset()
    setConfirmClose(false)
    setTestedById('')
    setOnRoad(false)
    setOnTestLane(true)
    setDetailWork('')
    setCloseRemark('')
    setSendEmail(false)
    setCloseDate(fmtDateInput(new Date()))
  }, [jobOrderId])

  useEffect(() => {
    if (!job || job.status !== 'Closed') return
    if (job.close_tested_by_employee_id) setTestedById(String(job.close_tested_by_employee_id))
    setOnRoad(Boolean(job.close_tested_on_road))
    setOnTestLane(Boolean(job.close_tested_on_test_lane))
    setDetailWork(job.close_work_description || '')
    setCloseRemark(job.close_process_remark || '')
    setSendEmail(Boolean(job.close_send_email))
    if (job.closed_at) setCloseDate(fmtDateInput(job.closed_at))
    setConfirmClose(true)
  }, [job?.job_order_id, job?.status, job?.closed_at, job?.close_work_description, job?.close_process_remark])

  const { data: listRes } = useQuery({
    queryKey: ['jobOrdersLookup', lookupOpen],
    queryFn: () => jobOrdersApi.list({ limit: 200 }),
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
    if (!rows.length) {
      setJobOrderId(null)
      return
    }
    setJobOrderId(rows[0].job_order_id)
  }

  const closeMutation = useMutation({
    mutationFn: () =>
      jobOrdersApi.close(jobOrderId, {
        tested_by_employee_id: Number(testedById),
        tested_on_road: onRoad,
        tested_on_test_lane: onTestLane,
        detail_work_description: detailWork || null,
        close_remark: closeRemark || null,
        send_email: sendEmail,
        close_date: closeDate || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobOrder', jobOrderId] })
      queryClient.invalidateQueries({ queryKey: ['garageInvoicesByJob', jobOrderId] })
      if (typeof window !== 'undefined') {
        const print = window.confirm(
          'Print job statement for your review? (Cancel skips printing — you can use Print Preview anytime.)'
        )
        if (print) {
          window.print()
        }
      }
    },
  })

  const isClosed = job?.status === 'Closed'
  const isBlocked = job?.is_blocked
  const isDispatched = job?.status === 'Dispatched'
  const canCloseForm =
    job &&
    !isClosed &&
    !isBlocked &&
    !isDispatched &&
    (job.status === 'Open' || job.status === 'Received')

  const statusPill = useMemo(() => {
    if (!job) return { label: 'No job loaded', className: 'text-muted-foreground' }
    if (isBlocked) return { label: 'Blocked', className: 'text-red-600 font-semibold' }
    if (isClosed) return { label: 'Closed', className: 'text-foreground/90 font-semibold' }
    if (isDispatched) return { label: 'Awaiting receive from section', className: 'text-amber-700 font-semibold' }
    return { label: 'Ready', className: 'text-blue-600 font-semibold' }
  }, [job, isBlocked, isClosed, isDispatched])

  const handlePrintPreview = () => {
    window.print()
  }

  const tryClose = () => {
    if (!jobOrderId || !job) return
    if (!confirmClose) return
    if (!testedById) return
    if (!onRoad && !onTestLane) return
    closeMutation.mutate()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <div>
          <div className="text-sm text-muted-foreground">
            <Link to="/utilities" className="text-primary hover:underline">
              Utilities
            </Link>
            <span className="mx-1">/</span>
            <span className="text-foreground font-medium">Close Job Order</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight mt-1">Close Job Order</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
            Close completed job orders so they can be invoiced and delivered. The job must be{' '}
            <strong>received back from the section</strong> after dispatch before closing. Use{' '}
            <Link className="text-primary hover:underline" to="/task-operations">
              Task Operations
            </Link>{' '}
            or the job detail screen to receive first. When you close from this screen, choose the tester and test
            method; the system can prompt you to print a job statement for review.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-red-600 font-medium">Close Job Order</span>
          <span className="text-sm text-blue-600 font-medium">{statusPill.label}</span>
        </div>
      </div>

      <div className="space-y-4 rounded-lg border border-border bg-card p-4 sm:p-6 print:border-0 print:shadow-none">
        <div className="flex flex-wrap gap-2 print:hidden">
          <Button type="button" variant="default" disabled={!canCloseForm || closeMutation.isPending} onClick={() => tryClose()}>
            {closeMutation.isPending ? 'Closing…' : 'Close Job Order'}
          </Button>
          <Button type="button" variant="outline" onClick={handlePrintPreview}>
            <Printer className="h-4 w-4 mr-2" />
            Print Preview
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              refetch()
              if (jobOrderId) queryClient.invalidateQueries({ queryKey: ['garageInvoicesByJob', jobOrderId] })
            }}
            disabled={!jobOrderId}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          {jobOrderId ? (
            <Button type="button" variant="ghost" asChild>
              <Link to={`/job-orders/${jobOrderId}`}>Open job detail</Link>
            </Button>
          ) : null}
        </div>

        <Card className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="lg:col-span-2 flex gap-2 items-end">
              <div className="flex-1 space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Job Order No.</label>
                <Input value={jobNoInput} onChange={(e) => setJobNoInput(e.target.value)} placeholder="e.g. JO-20260424-0001" />
              </div>
              <Button type="button" variant="secondary" onClick={() => void loadByNumber()} disabled={!jobNoInput.trim()}>
                Load
              </Button>
              <Button type="button" variant="outline" size="icon" title="Lookup" onClick={() => setLookupOpen(true)}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Plate No</label>
              <Input readOnly value={vehicle?.license_plate || ''} className="bg-muted/40" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Location</label>
              <Input
                readOnly
                value={job?.received_vehicle_location || job?.received_section || job?.dispatched_section || ''}
                className="bg-muted/40"
              />
            </div>
            <div className="lg:col-span-2 space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Customer</label>
              <Input readOnly value={customerLabel(customer)} className="bg-muted/40" />
            </div>
            <div className="lg:col-span-2 space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Address</label>
              <Input readOnly value={addressLines(customer)} className="bg-muted/40" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Engine No</label>
              <Input readOnly value={vehicle?.engine_type || ''} className="bg-muted/40" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Model / Serial</label>
              <Input
                readOnly
                value={vehicle ? `${vehicle.make || ''} ${vehicle.model || ''} ${vehicle.year || ''}`.trim() : ''}
                className="bg-muted/40"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Opening Date</label>
              <Input readOnly value={fmtDateInput(job?.opened_date)} className="bg-muted/40" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Millage</label>
              <Input readOnly value={job?.mileage_in_km || ''} className="bg-muted/40" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Make</label>
              <Input readOnly value={vehicle?.make || ''} className="bg-muted/40" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Exp. Finish Date</label>
              <Input readOnly value={fmtDateInput(job?.expected_finish_date)} className="bg-muted/40" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Type of Job</label>
              <Input readOnly value={serviceType?.type_name || ''} className="bg-muted/40" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Chassis / VIN</label>
              <Input readOnly value={vehicle?.vin || ''} className="bg-muted/40" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Opened For / Repair Section</label>
              <Input readOnly value={job?.dispatched_section || job?.received_section || ''} className="bg-muted/40" />
            </div>
            <div className="space-y-1 lg:col-span-2">
              <label className="text-xs font-medium text-muted-foreground">Repair type / service</label>
              <Input readOnly value={serviceType?.description || serviceType?.type_name || ''} className="bg-muted/40" />
            </div>
          </div>
          {jobLoading && jobOrderId ? <p className="text-sm text-muted-foreground">Loading job…</p> : null}
          {jobError ? <p className="text-sm text-destructive">Failed to load job.</p> : null}
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="p-4 space-y-4 bg-muted/20">
            <div className="text-sm font-semibold border-b pb-2">Job order closing status</div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={confirmClose}
                onChange={(e) => setConfirmClose(e.target.checked)}
                disabled={!canCloseForm}
                className="h-4 w-4 rounded border"
              />
              Is closed?
            </label>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Date</label>
              <Input type="date" value={closeDate} onChange={(e) => setCloseDate(e.target.value)} disabled={!canCloseForm} />
            </div>
            {job?.closed_at ? (
              <p className="text-xs text-muted-foreground">Closed at: {String(job.closed_at).slice(0, 10)}</p>
            ) : null}

            <div className="text-sm font-semibold border-b pt-4 pb-2 text-muted-foreground">Job order delivery status</div>
            <label className="flex items-center gap-2 text-sm opacity-60">
              <input type="checkbox" checked={Boolean(job?.delivered_at)} readOnly disabled className="h-4 w-4" />
              Delivered?
            </label>
            <Input readOnly disabled className="bg-muted/30" value={job?.delivered_at ? fmtDateInput(job.delivered_at) : ''} />

            <div className="text-sm font-semibold border-b pt-4 pb-2 text-muted-foreground">Job order invoice status</div>
            <label className="flex items-center gap-2 text-sm opacity-60">
              <input type="checkbox" checked={Boolean(issuedInvoice)} readOnly disabled className="h-4 w-4" />
              Is invoiced?
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Date</label>
                <Input readOnly disabled className="bg-muted/30" value={issuedInvoice ? fmtDateInput(issuedInvoice.created_at) : ''} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Invoice No</label>
                <Input readOnly disabled className="bg-muted/30" value={issuedInvoice?.invoice_number || ''} />
              </div>
              <div className="space-y-1 col-span-2">
                <label className="text-xs text-muted-foreground">Invoice type</label>
                <Input readOnly disabled className="bg-muted/30" value={issuedInvoice?.invoice_type || job?.invoice_type || ''} />
              </div>
            </div>
          </Card>

          <Card className="p-4 space-y-4 bg-muted/20">
            <div className="text-sm font-semibold border-b pb-2">Testing</div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Tested by</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={testedById}
                onChange={(e) => setTestedById(e.target.value)}
                disabled={!canCloseForm}
              >
                <option value="">Select…</option>
                {mechanics.map((m) => (
                  <option key={m.employee_id} value={m.employee_id}>
                    {m.name || `${m.first_name || ''} ${m.last_name || ''}`.trim()}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={onRoad}
                  onChange={(e) => setOnRoad(e.target.checked)}
                  disabled={!canCloseForm}
                  className="h-4 w-4"
                />
                On road
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={onTestLane}
                  onChange={(e) => setOnTestLane(e.target.checked)}
                  disabled={!canCloseForm}
                  className="h-4 w-4"
                />
                On test lane
              </label>
            </div>

            <div className="relative space-y-1 pt-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-medium text-muted-foreground">Detail work description</label>
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <input type="checkbox" checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} disabled={!canCloseForm} />
                  Send email
                </label>
              </div>
              <Textarea rows={5} value={detailWork} onChange={(e) => setDetailWork(e.target.value)} disabled={!canCloseForm} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Remark</label>
              <Textarea rows={4} value={closeRemark} onChange={(e) => setCloseRemark(e.target.value)} disabled={!canCloseForm} />
            </div>
          </Card>
        </div>

        {!canCloseForm && job ? (
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md p-3">
            {isDispatched
              ? 'This job is still dispatched to a section. Receive it back before closing.'
              : isClosed
                ? 'This job is already closed.'
                : isBlocked
                  ? 'This job is blocked.'
                  : 'This job cannot be closed from this screen in its current status.'}
          </p>
        ) : null}

        {closeMutation.isError ? (
          <p className="text-sm text-destructive">{formatDetail(closeMutation.error?.response?.data?.detail)}</p>
        ) : null}

        {!testedById && confirmClose && canCloseForm ? (
          <p className="text-sm text-amber-800">Select the employee who tested the vehicle.</p>
        ) : null}
        {!onRoad && !onTestLane && confirmClose && canCloseForm ? (
          <p className="text-sm text-amber-800">Select at least one test method (On road or On test lane).</p>
        ) : null}
        {canCloseForm && !confirmClose ? (
          <p className="text-sm text-muted-foreground">Tick &quot;Is closed?&quot; then use the Close Job Order toolbar button to save.</p>
        ) : null}
      </div>

      <Dialog open={lookupOpen} onOpenChange={setLookupOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Lookup job order</DialogTitle>
          </DialogHeader>
          <Input placeholder="Filter by number…" value={lookupFilter} onChange={(e) => setLookupFilter(e.target.value)} className="mb-3" />
          <ul className="space-y-1 text-sm">
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
