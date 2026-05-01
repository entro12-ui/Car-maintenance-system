import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import {
  jobOrdersApi,
  jobOrderSubletOrdersApi,
  subletWorkTypesApi,
  subletWorkSuppliersApi,
  vehiclesApi,
  customersApi,
  employeesApi,
} from '../services/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import LoadingSpinner from '@/components/LoadingSpinner'
import { cn } from '@/lib/utils'
import { Info, Printer, RefreshCw, Save } from 'lucide-react'

function formatMoney(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatShortDate(iso) {
  if (!iso) return '—'
  try {
    return format(new Date(iso), 'dd/MM/yyyy')
  } catch {
    return String(iso)
  }
}

function formatLongDateTime(iso) {
  if (!iso) return '—'
  try {
    return format(new Date(iso), 'dd/MM/yyyy hh:mm:ss a')
  } catch {
    return String(iso)
  }
}

function formatOpened(iso) {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return String(iso)
    return format(d, 'dd/MM/yyyy')
  } catch {
    return String(iso)
  }
}

function todayInputDate() {
  try {
    return format(new Date(), 'yyyy-MM-dd')
  } catch {
    return ''
  }
}

export default function SubletOrderReceiving() {
  const queryClient = useQueryClient()

  const [tab, setTab] = useState('to-receive')
  const [selectedId, setSelectedId] = useState(null)
  const [deliveryOrderNumber, setDeliveryOrderNumber] = useState('')
  const [doDate, setDoDate] = useState(todayInputDate)
  const [postChargeToJob, setPostChargeToJob] = useState(true)

  const { data: jobs = [] } = useQuery({
    queryKey: ['jobOrders', { for: 'subletOrderReceiving' }],
    queryFn: async () => {
      const res = await jobOrdersApi.list()
      const d = res.data
      return Array.isArray(d) ? d : []
    },
  })

  const jobNumberById = useMemo(() => {
    const map = new Map()
    for (const j of jobs) map.set(j.job_order_id, j.job_order_number)
    return map
  }, [jobs])

  const { data: workTypesData } = useQuery({
    queryKey: ['subletWorkTypes', { active_only: false }],
    queryFn: () => subletWorkTypesApi.list({ active_only: false }),
  })
  const workTypes = useMemo(() => {
    const d = workTypesData?.data
    return Array.isArray(d) ? d : []
  }, [workTypesData])
  const workTypeById = useMemo(() => {
    const map = new Map()
    for (const w of workTypes) map.set(w.sublet_work_type_id, w)
    return map
  }, [workTypes])

  const { data: suppliersData } = useQuery({
    queryKey: ['subletWorkSuppliers', { active_only: false }],
    queryFn: () => subletWorkSuppliersApi.list({ active_only: false }),
  })
  const suppliers = useMemo(() => {
    const d = suppliersData?.data
    return Array.isArray(d) ? d : []
  }, [suppliersData])
  const supplierById = useMemo(() => {
    const map = new Map()
    for (const s of suppliers) map.set(s.supplier_id, s)
    return map
  }, [suppliers])

  const { data: employees = [] } = useQuery({
    queryKey: ['employees', { for: 'subletOrderReceiving' }],
    queryFn: async () => {
      const res = await employeesApi.list()
      const d = res.data
      return Array.isArray(d) ? d : []
    },
  })

  const employeeNameById = useMemo(() => {
    const map = new Map()
    for (const e of employees) {
      map.set(e.employee_id, `${e.first_name || ''} ${e.last_name || ''}`.trim())
    }
    return map
  }, [employees])

  const statusFilter = tab === 'received' ? 'Received' : 'Approved'
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['subletOrders', { status: statusFilter, for: 'receiving' }],
    queryFn: async () => {
      const res = await jobOrderSubletOrdersApi.list({ status: statusFilter })
      const d = res.data
      return Array.isArray(d) ? d : []
    },
  })

  const selected = useMemo(
    () => orders.find((o) => o.sublet_order_id === selectedId) || null,
    [orders, selectedId]
  )

  const selectedJobId = selected?.job_order_id ?? null

  const { data: jobDetail, isLoading: jobDetailLoading } = useQuery({
    queryKey: ['jobOrder', selectedJobId, 'sublet-receiving'],
    queryFn: async () => {
      const res = await jobOrdersApi.getById(selectedJobId)
      return res.data
    },
    enabled: !!selectedJobId && Number.isFinite(Number(selectedJobId)),
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

  const customerDisplay = useMemo(() => {
    if (!customer) return '—'
    return (
      customer.company_name ||
      [customer.first_name, customer.last_name].filter(Boolean).join(' ') ||
      customer.email ||
      `Customer #${customer.customer_id}`
    )
  }, [customer])

  const jobLines = useMemo(() => {
    if (!selected) return []
    const jid = selected.job_order_id
    return orders
      .filter((o) => o.job_order_id === jid)
      .slice()
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
  }, [orders, selected])

  const receiveMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      const res = await jobOrderSubletOrdersApi.receive(id, payload)
      return res.data
    },
    onSuccess: async (row) => {
      const jid = row?.job_order_id
      setDeliveryOrderNumber('')
      setSelectedId(null)
      setDoDate(todayInputDate())
      await queryClient.invalidateQueries({ queryKey: ['subletOrders'] })
      if (jid != null) {
        await queryClient.invalidateQueries({ queryKey: ['jobOrder', jid] })
      }
    },
    onError: (err) => {
      const msg = err.response?.data?.detail || err.message || 'Receive failed'
      window.alert(typeof msg === 'string' ? msg : JSON.stringify(msg))
    },
  })

  const selectOrder = (o) => {
    setSelectedId(o.sublet_order_id)
    setDeliveryOrderNumber(`D-${o.sublet_order_number}`)
    setDoDate(todayInputDate())
  }

  const saveReceiving = () => {
    if (!selected || tab !== 'to-receive') return
    const don = (deliveryOrderNumber || '').trim()
    if (!don) {
      window.alert('Enter the supplier delivery order (DO) number.')
      return
    }
    receiveMutation.mutate({
      id: selected.sublet_order_id,
      payload: {
        delivery_order_number: don,
        post_charge_to_job: postChargeToJob,
      },
    })
  }

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ['subletOrders'] })
    queryClient.invalidateQueries({ queryKey: ['jobOrders', { for: 'subletOrderReceiving' }] })
    if (selectedJobId) queryClient.invalidateQueries({ queryKey: ['jobOrder', selectedJobId] })
  }

  const handlePrint = () => {
    if (!selected) return
    window.print()
  }

  const approvalStatusText = (row) => {
    const name = employeeNameById.get(row.decided_by_employee_id) || '—'
    if (!row.decided_at) return '—'
    return `Approved by ${name} on ${formatLongDateTime(row.decided_at)}`
  }

  const receivedStatusText = (row) => {
    const name = employeeNameById.get(row.received_by_employee_id) || '—'
    if (!row.received_at) return '—'
    return `Received by ${name} on ${formatLongDateTime(row.received_at)} · DO ${row.delivery_order_number || '—'}`
  }

  return (
    <div className="animate-fade-in space-y-4 pb-6 print:pb-0">
      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-md ring-1 ring-black/[0.03]">
        <header className="border-b border-border/60 bg-gradient-to-br from-primary/[0.08] via-card to-teal-500/[0.05] px-5 py-5 sm:px-7 sm:py-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Transactions</p>
              <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Sublet order receiving
              </h1>
              <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                Record receipt of <strong className="font-medium text-foreground">approved</strong> sublet work when the supplier
                completes it. Enter their <strong className="font-medium text-foreground">delivery order (DO)</strong> reference,
                then save. Use the list on the left and confirm header details on the right.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 print:hidden">
              <Button
                type="button"
                variant="default"
                size="sm"
                className="gap-1.5"
                disabled={!selected || tab !== 'to-receive' || receiveMutation.isPending}
                onClick={saveReceiving}
              >
                <Save className="h-4 w-4" aria-hidden />
                Save
              </Button>
              <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={handlePrint} disabled={!selected}>
                <Printer className="h-4 w-4" aria-hidden />
                Print preview
              </Button>
              <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={refreshAll}>
                <RefreshCw className="h-4 w-4" aria-hidden />
                Refresh
              </Button>
            </div>
          </div>
        </header>

        <div className="space-y-5 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
          <Card className="border-primary/15 bg-primary/[0.03] shadow-sm print:hidden">
            <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-2 pt-4">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
              <div>
                <CardTitle className="text-base">How this screen works</CardTitle>
                <CardDescription className="mt-2 space-y-2 text-sm leading-relaxed">
                  <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                    <li>
                      Under <strong className="font-medium text-foreground">Sublet order to be received</strong>, choose a row
                      (double-click is supported). Approved orders for that job card appear together in the lines grid.
                    </li>
                    <li>
                      Enter the supplier&apos;s <strong className="font-medium text-foreground">DO number</strong> and optional{' '}
                      <strong className="font-medium text-foreground">DO date</strong> for your records, then click{' '}
                      <strong className="font-medium text-foreground">Save</strong>.
                    </li>
                    <li>
                      With <strong className="font-medium text-foreground">Post charge to job</strong> enabled, the system adds a
                      matching sublet work charge on the job so billing reflects this receipt (full quantity per line — partial
                      receipts are not stored on this version).
                    </li>
                  </ul>
                </CardDescription>
              </div>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            <Card className="shadow-sm xl:col-span-5 print:hidden">
              <CardHeader className="flex flex-col gap-3 pb-2 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-lg">
                    {tab === 'received' ? 'Received sublet orders' : 'Sublet order to be received'}
                  </CardTitle>
                  <CardDescription>Order no., date, and job card no.</CardDescription>
                </div>
                <div className="flex rounded-lg border border-border/80 p-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setTab('to-receive')
                      setSelectedId(null)
                      setDeliveryOrderNumber('')
                    }}
                    className={cn(
                      'rounded-md px-3 py-1.5 text-xs font-semibold transition-colors',
                      tab === 'to-receive' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted/80'
                    )}
                  >
                    To be received
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTab('received')
                      setSelectedId(null)
                      setDeliveryOrderNumber('')
                    }}
                    className={cn(
                      'rounded-md px-3 py-1.5 text-xs font-semibold transition-colors',
                      tab === 'received' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted/80'
                    )}
                  >
                    Received
                  </button>
                </div>
              </CardHeader>
              <CardContent className="pb-4 pt-0">
                {isLoading ? (
                  <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
                    <LoadingSpinner size="sm" />
                    Loading…
                  </div>
                ) : orders.length === 0 ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">
                    {tab === 'received' ? 'No received orders yet.' : 'No approved orders waiting for receipt.'}
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-border/70">
                    <table className="w-full min-w-[280px] text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/45 text-left">
                          <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Order no.
                          </th>
                          <th className="whitespace-nowrap px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Date
                          </th>
                          <th className="whitespace-nowrap px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Jc no.
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/70">
                        {orders.map((o) => {
                          const active = o.sublet_order_id === selectedId
                          const jc = jobNumberById.get(o.job_order_id) || `#${o.job_order_id}`
                          return (
                            <tr
                              key={o.sublet_order_id}
                              role="button"
                              tabIndex={0}
                              onClick={() => selectOrder(o)}
                              onDoubleClick={() => selectOrder(o)}
                              className={cn(
                                'cursor-pointer transition-colors',
                                active ? 'bg-primary/[0.12]' : 'bg-card hover:bg-primary/[0.04]'
                              )}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault()
                                  selectOrder(o)
                                }
                              }}
                            >
                              <td className="whitespace-nowrap px-3 py-2 font-mono text-xs font-semibold">{o.sublet_order_number}</td>
                              <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">{formatShortDate(o.created_at)}</td>
                              <td className="whitespace-nowrap px-3 py-2 font-medium">{jc}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-4 xl:col-span-7">
              <Card className="shadow-sm print:border-0 print:shadow-none">
                <CardHeader className="pb-2 pt-4">
                  <CardTitle className="text-lg">Receiving detail</CardTitle>
                  <CardDescription>
                    {!selected
                      ? 'Select an order from the list.'
                      : jobDetailLoading
                        ? 'Loading job…'
                        : 'Header is read-only from the order and job card.'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pb-4 pt-0">
                  {!selected ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      Select an approved or received sublet order (double-click the list row).
                    </p>
                  ) : jobDetailLoading ? (
                    <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
                      <LoadingSpinner size="sm" />
                      Loading job…
                    </div>
                  ) : (
                    <>
                      {(() => {
                        const supplier = supplierById.get(selected.supplier_id)
                        const jobNo = jobNumberById.get(selected.job_order_id) || `#${selected.job_order_id}`
                        const jobClosed = jobDetail?.status === 'Closed'

                        return (
                          <div className="grid gap-3 rounded-xl border border-border/70 bg-muted/15 p-4 sm:grid-cols-2 lg:grid-cols-3">
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Order no.</p>
                              <p className="mt-1 font-mono text-sm font-semibold">{selected.sublet_order_number}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Order date</p>
                              <p className="mt-1 text-sm tabular-nums">{formatShortDate(selected.created_at)}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Date closed</p>
                              <p className="mt-1 text-sm tabular-nums">{formatLongDateTime(jobDetail?.closed_at)}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Job card no.</p>
                              <p className="mt-1 text-sm font-semibold">{jobNo}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Plate no.</p>
                              <p className="mt-1 font-mono text-sm font-semibold">{vehicle?.license_plate || '—'}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Date opened</p>
                              <p className="mt-1 text-sm tabular-nums">{formatOpened(jobDetail?.opened_date)}</p>
                            </div>
                            <div className="sm:col-span-2 lg:col-span-3">
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Customer name</p>
                              <p className="mt-1 text-sm font-medium leading-snug">{customerDisplay}</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 sm:col-span-2 lg:col-span-3">
                              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                Job order closed
                              </span>
                              <Badge variant={jobClosed ? 'default' : 'secondary'}>{jobClosed ? 'Yes' : 'No'}</Badge>
                            </div>
                            <div className="sm:col-span-2 lg:col-span-3">
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Supplied by</p>
                              <p className="mt-1 text-sm font-medium">{supplier?.supplier_name || '—'}</p>
                            </div>
                            <div className="sm:col-span-2 lg:col-span-3">
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Remark if any</p>
                              <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{selected.remark?.trim() || '—'}</p>
                            </div>
                            <div className="sm:col-span-2 lg:col-span-3 rounded-lg border border-border/60 bg-background/80 p-3">
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Status</p>
                              <p className="mt-2 text-sm leading-relaxed text-foreground">
                                {tab === 'received' ? receivedStatusText(selected) : approvalStatusText(selected)}
                              </p>
                            </div>
                          </div>
                        )
                      })()}

                      {tab === 'to-receive' ? (
                        <div className="space-y-4 rounded-xl border border-border/70 bg-card p-4 print:hidden">
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                              <label htmlFor="do-no" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                DO no.
                              </label>
                              <Input
                                id="do-no"
                                value={deliveryOrderNumber}
                                onChange={(e) => setDeliveryOrderNumber(e.target.value)}
                                placeholder="Supplier delivery order #"
                                autoComplete="off"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label htmlFor="do-date" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                DO date
                              </label>
                              <Input id="do-date" type="date" value={doDate} onChange={(e) => setDoDate(e.target.value)} />
                              <p className="text-[11px] text-muted-foreground">
                                For your records only. The server stores the receipt timestamp when you save.
                              </p>
                            </div>
                          </div>
                          <label className="flex cursor-pointer items-start gap-3 text-sm">
                            <input
                              type="checkbox"
                              className="mt-1 h-4 w-4 rounded border-input"
                              checked={postChargeToJob}
                              onChange={(e) => setPostChargeToJob(e.target.checked)}
                            />
                            <span>
                              <span className="font-semibold text-foreground">Post charge to job</span>
                              <span className="block text-muted-foreground">
                                Adds a sublet work charge line on the job (qty × unit price from this order) for invoicing.
                              </span>
                            </span>
                          </label>
                        </div>
                      ) : selected?.delivery_order_number ? (
                        <div className="rounded-xl border border-border/70 bg-muted/20 p-4 text-sm print:hidden">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Recorded DO no.</p>
                          <p className="mt-1 font-mono font-semibold">{selected.delivery_order_number}</p>
                        </div>
                      ) : null}
                    </>
                  )}
                </CardContent>
              </Card>

              {selected ? (
                <Card className="shadow-sm print:border-0 print:shadow-none">
                  <CardHeader className="pb-2 pt-4">
                    <CardTitle className="text-lg">Lines on this job ({statusFilter})</CardTitle>
                    <CardDescription>
                      Quantities reflect full-line receipt (partial shipment is not tracked per line in this build).
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-4 pt-0">
                    <div className="overflow-x-auto rounded-xl border border-border/70">
                      <table className="w-full min-w-[960px] text-sm">
                        <thead>
                          <tr className="border-b border-border bg-muted/45 text-left">
                            <th className="whitespace-nowrap px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              No
                            </th>
                            <th className="whitespace-nowrap px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Charge code
                            </th>
                            <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Description
                            </th>
                            <th className="whitespace-nowrap px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Order qty
                            </th>
                            <th className="whitespace-nowrap px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Received qty so far
                            </th>
                            <th className="whitespace-nowrap px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Qty to receive
                            </th>
                            <th className="whitespace-nowrap px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Charge qty
                            </th>
                            <th className="whitespace-nowrap px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Unit price
                            </th>
                            <th className="whitespace-nowrap px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Amount
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/70">
                          {jobLines.map((line, idx) => {
                            const wt = workTypeById.get(line.sublet_work_type_id)
                            const orderQty = Number(line.quantity)
                            const isReceived = line.status === 'Received'
                            const receivedSoFar = isReceived ? orderQty : 0
                            const qtyToReceive = isReceived ? 0 : orderQty
                            const chargeQty = isReceived ? orderQty : null
                            const amt = orderQty * Number(line.unit_price)
                            const focus = line.sublet_order_id === selectedId
                            return (
                              <tr key={line.sublet_order_id} className={cn(focus ? 'bg-primary/[0.08]' : 'bg-card hover:bg-primary/[0.03]')}>
                                <td className="whitespace-nowrap px-3 py-2 tabular-nums">{idx + 1}</td>
                                <td className="whitespace-nowrap px-3 py-2 font-mono text-xs">{wt?.work_code || '—'}</td>
                                <td className="max-w-[240px] truncate px-3 py-2">{wt?.description || `#${line.sublet_work_type_id}`}</td>
                                <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">{formatMoney(line.quantity)}</td>
                                <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">{formatMoney(receivedSoFar)}</td>
                                <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">{formatMoney(qtyToReceive)}</td>
                                <td className="whitespace-nowrap px-3 py-2 text-right text-muted-foreground tabular-nums">
                                  {chargeQty != null ? formatMoney(chargeQty) : '—'}
                                </td>
                                <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">{formatMoney(line.unit_price)}</td>
                                <td className="whitespace-nowrap px-3 py-2 text-right font-semibold tabular-nums">{formatMoney(amt)}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              ) : null}

              {selected ? (
                <div className="hidden print:block">
                  <div className="mx-auto max-w-[720px] border border-black p-8 text-black">
                    <h2 className="text-center text-lg font-bold uppercase tracking-wide">Sublet receipt</h2>
                    <div className="mt-4 grid gap-1 text-xs sm:grid-cols-2">
                      <div>
                        <div>Order: {selected.sublet_order_number}</div>
                        <div>Job card: {jobNumberById.get(selected.job_order_id) || `#${selected.job_order_id}`}</div>
                        <div>Plate: {vehicle?.license_plate || '—'}</div>
                      </div>
                      <div className="sm:text-right">
                        <div>Customer: {customerDisplay}</div>
                        <div>Supplier DO: {(deliveryOrderNumber || selected.delivery_order_number || '').trim() || '—'}</div>
                        <div>DO date (record): {doDate || '—'}</div>
                      </div>
                    </div>
                    <table className="mt-6 w-full border border-black text-xs">
                      <thead>
                        <tr className="bg-neutral-100">
                          <th className="border border-black px-2 py-1 text-left">Code</th>
                          <th className="border border-black px-2 py-1 text-left">Description</th>
                          <th className="border border-black px-2 py-1 text-right">Qty</th>
                          <th className="border border-black px-2 py-1 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {jobLines.map((line) => {
                          const wt = workTypeById.get(line.sublet_work_type_id)
                          const amt = Number(line.quantity) * Number(line.unit_price)
                          return (
                            <tr key={`pr-${line.sublet_order_id}`}>
                              <td className="border border-black px-2 py-1 font-mono">{wt?.work_code || '—'}</td>
                              <td className="border border-black px-2 py-1">{wt?.description || `#${line.sublet_work_type_id}`}</td>
                              <td className="border border-black px-2 py-1 text-right">{formatMoney(line.quantity)}</td>
                              <td className="border border-black px-2 py-1 text-right">{formatMoney(amt)}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
