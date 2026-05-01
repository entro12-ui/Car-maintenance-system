import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import {
  jobOrdersApi,
  jobOrderSubletOrdersApi,
  subletWorkTypesApi,
  subletWorkSuppliersApi,
  vehiclesApi,
  customersApi,
} from '../services/api'
import {
  RefreshCw,
  Printer,
  CheckCircle,
  PlusCircle,
  AlertTriangle,
  Info,
  ExternalLink,
  Ban,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import LoadingSpinner from '@/components/LoadingSpinner'
import { cn } from '@/lib/utils'

function formatMoney(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatOrderDate(iso) {
  if (!iso) return '—'
  try {
    return format(new Date(iso), 'dd/MM/yyyy HH:mm')
  } catch {
    return String(iso)
  }
}

export default function SubletOrderEntry() {
  const queryClient = useQueryClient()

  const [jobSearch, setJobSearch] = useState('')
  const [jobOrderId, setJobOrderId] = useState('')
  const [subletWorkTypeId, setSubletWorkTypeId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [remark, setRemark] = useState('')

  const { data: jobsPayload, isLoading: jobsLoading } = useQuery({
    queryKey: ['jobOrders', { for: 'subletOrderEntry' }],
    queryFn: async () => {
      const res = await jobOrdersApi.list()
      const payload = res.data
      return Array.isArray(payload) ? payload : []
    },
  })

  const jobs = jobsPayload ?? []

  const selectableJobs = useMemo(
    () => jobs.filter((j) => j?.status !== 'Closed' && j?.status !== 'Cancelled'),
    [jobs]
  )

  const filteredJobs = useMemo(() => {
    const q = jobSearch.trim().toLowerCase()
    if (!q) return selectableJobs
    return selectableJobs.filter((j) => String(j.job_order_number || '').toLowerCase().includes(q))
  }, [selectableJobs, jobSearch])

  const selectedJobIdNum = jobOrderId ? Number(jobOrderId) : null

  const { data: jobDetail, isLoading: jobDetailLoading } = useQuery({
    queryKey: ['jobOrder', selectedJobIdNum],
    queryFn: async () => {
      const res = await jobOrdersApi.getById(selectedJobIdNum)
      return res.data
    },
    enabled: !!selectedJobIdNum && Number.isFinite(selectedJobIdNum),
  })

  const vehicleId = jobDetail?.vehicle_id

  const { data: vehicle } = useQuery({
    queryKey: ['vehicle', vehicleId],
    queryFn: async () => {
      const res = await vehiclesApi.getById(vehicleId)
      return res.data
    },
    enabled: !!vehicleId,
  })

  const customerId = jobDetail?.customer_id

  const { data: customer } = useQuery({
    queryKey: ['customer', customerId],
    queryFn: async () => {
      const res = await customersApi.getById(customerId)
      return res.data
    },
    enabled: !!customerId,
  })

  const { data: workTypesData } = useQuery({
    queryKey: ['subletWorkTypes', { active_only: false }],
    queryFn: () => subletWorkTypesApi.list({ active_only: false }),
  })
  const workTypes = useMemo(() => {
    const d = workTypesData?.data
    return Array.isArray(d) ? d : []
  }, [workTypesData])

  const activeWorkTypes = useMemo(() => workTypes.filter((w) => w?.is_active !== false), [workTypes])

  const { data: suppliersData } = useQuery({
    queryKey: ['subletWorkSuppliers', { active_only: false }],
    queryFn: () => subletWorkSuppliersApi.list({ active_only: false }),
  })
  const suppliers = useMemo(() => {
    const d = suppliersData?.data
    return Array.isArray(d) ? d : []
  }, [suppliersData])

  const activeSuppliers = useMemo(() => suppliers.filter((s) => s?.is_active !== false), [suppliers])

  const workTypeById = useMemo(() => {
    const map = new Map()
    for (const w of workTypes) map.set(w.sublet_work_type_id, w)
    return map
  }, [workTypes])

  const supplierById = useMemo(() => {
    const map = new Map()
    for (const s of suppliers) map.set(s.supplier_id, s)
    return map
  }, [suppliers])

  const selectedWorkType = subletWorkTypeId ? workTypeById.get(Number(subletWorkTypeId)) : null
  const derivedSupplier = selectedWorkType?.supplier_id
    ? supplierById.get(selectedWorkType.supplier_id)
    : null

  const qtyNum = Number(quantity)
  const unitPriceNum = selectedWorkType ? Number(selectedWorkType.unit_price) : NaN
  const linePreview =
    selectedWorkType && Number.isFinite(qtyNum) && qtyNum > 0 && Number.isFinite(unitPriceNum)
      ? qtyNum * unitPriceNum
      : null

  const { data: ordersPayload, isLoading: ordersLoading } = useQuery({
    queryKey: ['subletOrdersForJob', selectedJobIdNum],
    queryFn: async () => {
      const res = await jobOrderSubletOrdersApi.listForJob(selectedJobIdNum)
      const d = res.data
      return Array.isArray(d) ? d : []
    },
    enabled: !!selectedJobIdNum && Number.isFinite(selectedJobIdNum),
  })

  const orders = ordersPayload ?? []

  const draftCount = useMemo(() => orders.filter((o) => o.status === 'Draft').length, [orders])

  const customerDisplay = customer
    ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || customer.email || `#${customerId}`
    : customerId
      ? `Customer #${customerId}`
      : '—'

  const createMutation = useMutation({
    mutationFn: ({ jobOrderId: jid, payload }) => jobOrderSubletOrdersApi.create(jid, payload),
    onSuccess: async () => {
      setSubletWorkTypeId('')
      setQuantity('1')
      setRemark('')
      await queryClient.invalidateQueries({ queryKey: ['subletOrdersForJob', selectedJobIdNum] })
    },
    onError: (err) => {
      window.alert(err.response?.data?.detail || err.message || 'Could not save sublet order')
    },
  })

  const finishMutation = useMutation({
    mutationFn: (jid) => jobOrderSubletOrdersApi.finishForJob(jid),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['subletOrdersForJob', selectedJobIdNum] })
    },
    onError: (err) => {
      window.alert(err.response?.data?.detail || err.message || 'Could not finish sublet orders')
    },
  })

  const cancelMutation = useMutation({
    mutationFn: (subletOrderId) =>
      jobOrderSubletOrdersApi.cancel(subletOrderId, { decision_remark: null }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['subletOrdersForJob', selectedJobIdNum] })
    },
    onError: (err) => {
      window.alert(err.response?.data?.detail || err.message || 'Could not cancel order')
    },
  })

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ['jobOrders'] })
    queryClient.invalidateQueries({ queryKey: ['subletWorkTypes'] })
    queryClient.invalidateQueries({ queryKey: ['subletWorkSuppliers'] })
    if (selectedJobIdNum) {
      queryClient.invalidateQueries({ queryKey: ['subletOrdersForJob', selectedJobIdNum] })
      queryClient.invalidateQueries({ queryKey: ['jobOrder', selectedJobIdNum] })
    }
  }

  const addOrder = () => {
    if (!selectedJobIdNum) return
    const wtId = Number(subletWorkTypeId)
    if (!Number.isFinite(wtId) || wtId <= 0) {
      window.alert('Select a sublet work type (charge).')
      return
    }
    const qty = Number(quantity)
    if (!Number.isFinite(qty) || qty <= 0) {
      window.alert('Quantity must be greater than zero.')
      return
    }

    const wt = workTypeById.get(wtId)
    if (!wt?.supplier_id) {
      window.alert(
        'This sublet work type has no supplier linked. Maintain the work type with a supplier before entering orders.'
      )
      return
    }

    createMutation.mutate({
      jobOrderId: selectedJobIdNum,
      payload: {
        sublet_work_type_id: wtId,
        quantity: qty,
        remark: (remark || '').trim() || null,
      },
    })
  }

  const finish = () => {
    if (!selectedJobIdNum) return
    if (!window.confirm('Finish all draft sublet orders for this job? They will move to the approval queue.')) return
    finishMutation.mutate(selectedJobIdNum)
  }

  const handlePrint = () => {
    window.print()
  }

  const maintenanceMissing = activeSuppliers.length === 0 || activeWorkTypes.length === 0

  return (
    <div className="animate-fade-in space-y-4 pb-6 print:pb-0">
      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-md ring-1 ring-black/[0.03]">
        <header className="border-b border-border/60 bg-gradient-to-br from-primary/[0.08] via-card to-teal-500/[0.05] px-5 py-5 sm:px-7 sm:py-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Transactions</p>
              <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Sublet order entry
              </h1>
              <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                Record sublet work required for a <strong className="font-medium text-foreground">specified job order</strong>.
                The supplier and sublet work type must already exist — maintain{' '}
                <Link to="/sublet-supplier-maintenance" className="font-semibold text-primary underline-offset-4 hover:underline">
                  suppliers
                </Link>{' '}
                and{' '}
                <Link
                  to="/job-orders/additional-charges/sublet-work-type"
                  className="font-semibold text-primary underline-offset-4 hover:underline"
                >
                  sublet work types
                </Link>{' '}
                before processing this screen.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 print:hidden">
              <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={refreshAll}>
                <RefreshCw className="h-4 w-4" aria-hidden />
                Refresh
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={handlePrint}
                disabled={!selectedJobIdNum}
              >
                <Printer className="h-4 w-4" aria-hidden />
                Print
              </Button>
            </div>
          </div>
        </header>

        <div className="space-y-5 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
          <Card className="border-primary/15 bg-primary/[0.03] shadow-sm">
            <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-2 pt-4">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
              <div>
                <CardTitle className="text-base">How to use this page</CardTitle>
                <CardDescription className="mt-2 space-y-2 text-sm leading-relaxed">
                  <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                    <li>Select the job order, choose the sublet charge (work type), enter quantity and optional remark.</li>
                    <li>
                      Click <strong className="text-foreground">Save line</strong> for each type of sublet work you need.
                    </li>
                    <li>Repeat for additional sublet lines on the same job.</li>
                    <li>
                      When finished recording drafts, click <strong className="text-foreground">Finish</strong> to submit them for approval.
                    </li>
                  </ul>
                </CardDescription>
              </div>
            </CardHeader>
          </Card>

          {maintenanceMissing ? (
            <Card className="border-amber-200/90 bg-gradient-to-r from-amber-50/90 to-orange-50/40 shadow-sm">
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-3">
                  <AlertTriangle className="h-10 w-10 shrink-0 text-amber-600" aria-hidden />
                  <div>
                    <p className="font-semibold text-amber-950">Setup required</p>
                    <p className="text-sm text-amber-900/85">
                      {activeSuppliers.length === 0 && <span>No active sublet suppliers. </span>}
                      {activeWorkTypes.length === 0 && <span>No active sublet work types. </span>}
                      Create records first, then return here.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" asChild className="border-amber-300/80 bg-white">
                    <Link to="/sublet-supplier-maintenance">
                      Suppliers <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild className="border-amber-300/80 bg-white">
                    <Link to="/job-orders/additional-charges/sublet-work-type">
                      Work types <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* Job context */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 pt-4">
              <CardTitle className="text-lg">Job order</CardTitle>
              <CardDescription>Search open jobs, then confirm header details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 lg:grid-cols-12 lg:items-end">
                <div className="space-y-1.5 lg:col-span-5">
                  <label htmlFor="sublet-job-search" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Find job (number)
                  </label>
                  <Input
                    id="sublet-job-search"
                    placeholder="Filter by job number…"
                    value={jobSearch}
                    onChange={(e) => setJobSearch(e.target.value)}
                    disabled={jobsLoading}
                    className="print:hidden"
                  />
                </div>
                <div className="space-y-1.5 lg:col-span-7">
                  <label htmlFor="sublet-job-select" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Job card no.
                  </label>
                  <select
                    id="sublet-job-select"
                    className={cn(
                      'flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)]',
                      'transition-all hover:border-primary/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/30'
                    )}
                    value={jobOrderId}
                    onChange={(e) => {
                      setJobOrderId(e.target.value)
                      setSubletWorkTypeId('')
                    }}
                    disabled={jobsLoading}
                  >
                    <option value="">Select job order…</option>
                    {filteredJobs.map((j) => (
                      <option key={j.job_order_id} value={j.job_order_id}>
                        {j.job_order_number} · {j.status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {!selectedJobIdNum ? (
                <p className="text-sm text-muted-foreground">Choose a job order to load plate, customer, and sublet lines.</p>
              ) : jobDetailLoading ? (
                <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                  <LoadingSpinner size="sm" />
                  Loading job…
                </div>
              ) : (
                <div className="grid gap-3 rounded-xl border border-border/70 bg-muted/15 p-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Plate no.</p>
                    <p className="mt-1 font-mono text-sm font-semibold text-foreground">{vehicle?.license_plate || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Opened</p>
                    <p className="mt-1 text-sm text-foreground">{formatOrderDate(jobDetail?.opened_date)}</p>
                  </div>
                  <div className="sm:col-span-2 lg:col-span-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Customer</p>
                    <p className="mt-1 text-sm font-medium leading-snug text-foreground">{customerDisplay}</p>
                  </div>
                  <div className="sm:col-span-2 lg:col-span-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Job status</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{jobDetail?.status}</Badge>
                      {jobDetail?.is_blocked ? (
                        <Badge variant="danger">Blocked</Badge>
                      ) : null}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Entry */}
          <Card className="shadow-sm">
            <CardHeader className="flex flex-col gap-2 border-b border-border/50 pb-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-lg">New sublet line</CardTitle>
                <CardDescription>
                  Supplier and unit pricing come from the work type record (Sublet charge).
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2 print:hidden">
                <Button
                  type="button"
                  onClick={addOrder}
                  disabled={!selectedJobIdNum || createMutation.isPending || maintenanceMissing}
                  className="gap-2"
                >
                  <PlusCircle className="h-4 w-4" aria-hidden />
                  Save line
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={finish}
                  disabled={!selectedJobIdNum || draftCount === 0 || finishMutation.isPending}
                  title={draftCount === 0 ? 'No draft lines to finish' : undefined}
                  className="gap-2"
                >
                  <CheckCircle className="h-4 w-4" aria-hidden />
                  Finish
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
              <div className="grid gap-4 lg:grid-cols-12">
                <div className="space-y-1.5 lg:col-span-6">
                  <label htmlFor="sublet-charge" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Sublet charge (work type)
                  </label>
                  <select
                    id="sublet-charge"
                    className={cn(
                      'flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)]',
                      'transition-all hover:border-primary/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/30',
                      !selectedJobIdNum && 'opacity-60'
                    )}
                    value={subletWorkTypeId}
                    onChange={(e) => setSubletWorkTypeId(e.target.value)}
                    disabled={!selectedJobIdNum || maintenanceMissing}
                  >
                    <option value="">Select charge…</option>
                    {activeWorkTypes.map((w) => (
                      <option key={w.sublet_work_type_id} value={w.sublet_work_type_id}>
                        {w.work_code} — {w.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5 lg:col-span-6">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Supplied by</span>
                  <Input
                    readOnly
                    value={derivedSupplier?.supplier_name || (selectedWorkType && !selectedWorkType.supplier_id ? 'No supplier on work type' : '—')}
                    className="bg-muted/40 font-medium"
                    disabled={!selectedJobIdNum}
                  />
                </div>

                <div className="space-y-1.5 lg:col-span-3">
                  <label htmlFor="sublet-qty" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Quantity
                  </label>
                  <Input
                    id="sublet-qty"
                    type="number"
                    min="0"
                    step="0.01"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    disabled={!selectedJobIdNum}
                  />
                </div>

                <div className="space-y-1.5 lg:col-span-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Unit price</span>
                  <Input readOnly value={selectedWorkType ? formatMoney(selectedWorkType.unit_price) : ''} className="bg-muted/40 tabular-nums" />
                </div>

                <div className="space-y-1.5 lg:col-span-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Unit cost</span>
                  <Input readOnly value={selectedWorkType ? formatMoney(selectedWorkType.unit_cost) : ''} className="bg-muted/40 tabular-nums" />
                </div>

                <div className="flex flex-col justify-end gap-2 lg:col-span-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Taxable</span>
                  <div className="flex h-11 items-center rounded-xl border border-border/70 bg-muted/25 px-3">
                    <Badge variant={selectedWorkType?.taxable ? 'success' : 'secondary'}>
                      {selectedWorkType ? (selectedWorkType.taxable ? 'Yes' : 'No') : '—'}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-1.5 lg:col-span-12">
                  <label htmlFor="sublet-remark" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Remark if any
                  </label>
                  <Textarea
                    id="sublet-remark"
                    rows={3}
                    placeholder="Type a remark here if required."
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    disabled={!selectedJobIdNum}
                  />
                </div>
              </div>

              {linePreview != null ? (
                <p className="text-sm text-muted-foreground">
                  Line amount preview:{' '}
                  <strong className="font-display tabular-nums text-foreground">ETB {formatMoney(linePreview)}</strong>{' '}
                  <span className="text-xs">(qty × unit price from work type)</span>
                </p>
              ) : null}

              {selectedJobIdNum ? (
                <p className="text-xs text-muted-foreground">
                  Draft lines ready to finish: <strong className="text-foreground">{draftCount}</strong>
                </p>
              ) : null}
            </CardContent>
          </Card>

          {/* Grid */}
          <Card className="shadow-sm print:border-0 print:shadow-none">
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-lg">Sublet orders for this job</CardTitle>
              <CardDescription>All recorded lines — cancel draft rows here if entered by mistake.</CardDescription>
            </CardHeader>
            <CardContent className="pb-4 pt-0">
              {!selectedJobIdNum ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Select a job order to list sublet orders.</p>
              ) : ordersLoading ? (
                <div className="flex items-center justify-center gap-2 py-14 text-sm text-muted-foreground">
                  <LoadingSpinner size="sm" />
                  Loading…
                </div>
              ) : orders.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">No sublet orders for this job yet.</p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-border/70">
                  <table className="w-full min-w-[920px] text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/45 text-left">
                        <th className="whitespace-nowrap px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Order no.
                        </th>
                        <th className="whitespace-nowrap px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Created
                        </th>
                        <th className="whitespace-nowrap px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Code
                        </th>
                        <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Description
                        </th>
                        <th className="whitespace-nowrap px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Supplier
                        </th>
                        <th className="whitespace-nowrap px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Qty
                        </th>
                        <th className="whitespace-nowrap px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Unit price
                        </th>
                        <th className="whitespace-nowrap px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Amount
                        </th>
                        <th className="whitespace-nowrap px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Status
                        </th>
                        <th className="min-w-[140px] px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Remark
                        </th>
                        <th className="whitespace-nowrap px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground print:hidden">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/70">
                      {orders.map((o) => {
                        const wt = workTypeById.get(o.sublet_work_type_id)
                        const supplier = supplierById.get(o.supplier_id)
                        const amt = Number(o.quantity) * Number(o.unit_price)
                        return (
                          <tr key={o.sublet_order_id} className="bg-card hover:bg-primary/[0.03]">
                            <td className="whitespace-nowrap px-3 py-2 font-mono text-xs font-semibold">{o.sublet_order_number}</td>
                            <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">{formatOrderDate(o.created_at)}</td>
                            <td className="whitespace-nowrap px-3 py-2 font-mono text-xs">{wt?.work_code || '—'}</td>
                            <td className="max-w-[220px] truncate px-3 py-2">{wt?.description || `#${o.sublet_work_type_id}`}</td>
                            <td className="max-w-[140px] truncate px-3 py-2">{supplier?.supplier_name || '—'}</td>
                            <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">{formatMoney(o.quantity)}</td>
                            <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">{formatMoney(o.unit_price)}</td>
                            <td className="whitespace-nowrap px-3 py-2 text-right font-semibold tabular-nums text-foreground">
                              {formatMoney(amt)}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2">
                              <Badge variant={o.status === 'Draft' ? 'secondary' : 'outline'}>{o.status}</Badge>
                            </td>
                            <td className="max-w-[180px] truncate px-3 py-2 text-muted-foreground">{o.remark || '—'}</td>
                            <td className="whitespace-nowrap px-3 py-2 text-right print:hidden">
                              {o.status === 'Draft' ? (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 gap-1 text-destructive hover:text-destructive"
                                  disabled={cancelMutation.isPending}
                                  onClick={() => {
                                    if (
                                      window.confirm(
                                        `Cancel draft order ${o.sublet_order_number}? This cannot be undone from here.`
                                      )
                                    ) {
                                      cancelMutation.mutate(o.sublet_order_id)
                                    }
                                  }}
                                >
                                  <Ban className="h-3.5 w-3.5" aria-hidden />
                                  Cancel
                                </Button>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
