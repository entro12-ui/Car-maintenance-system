import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import {
  jobOrdersApi,
  jobOrderSubletOrdersApi,
  subletWorkTypesApi,
  subletWorkSuppliersApi,
  employeesApi,
  vehiclesApi,
  customersApi,
} from '../services/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import LoadingSpinner from '@/components/LoadingSpinner'
import { cn } from '@/lib/utils'
import { CheckCircle, CornerUpLeft, RefreshCw, Printer, XCircle, Info } from 'lucide-react'

const TABS = [
  { key: 'Finalized', label: 'Sublet order approval' },
  { key: 'Approved', label: 'Approved' },
  { key: 'Rejected', label: 'Rejected' },
  { key: 'Cancelled', label: 'Cancelled' },
]

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
    return format(d, 'dd/MM/yyyy HH:mm')
  } catch {
    return String(iso)
  }
}

export default function SubletOrderApproval() {
  const queryClient = useQueryClient()

  const [tabStatus, setTabStatus] = useState('Finalized')
  const [selectedId, setSelectedId] = useState(null)
  const [decisionRemark, setDecisionRemark] = useState('')

  const { data: jobs = [] } = useQuery({
    queryKey: ['jobOrders', { for: 'subletOrderApproval' }],
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

  const { data: employeesData } = useQuery({
    queryKey: ['employees', { for: 'subletOrderApproval' }],
    queryFn: async () => {
      const res = await employeesApi.list()
      const d = res.data
      return Array.isArray(d) ? d : []
    },
  })
  const employees = employeesData ?? []
  const employeeNameById = useMemo(() => {
    const map = new Map()
    for (const e of employees) {
      map.set(e.employee_id, `${e.first_name || ''} ${e.last_name || ''}`.trim())
    }
    return map
  }, [employees])

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['subletOrders', tabStatus],
    queryFn: async () => {
      const res = await jobOrderSubletOrdersApi.list({ status: tabStatus })
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
    queryKey: ['jobOrder', selectedJobId, 'approval-context'],
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

  const decide = useMutation({
    mutationFn: ({ action, id, payload }) => jobOrderSubletOrdersApi[action](id, payload),
    onSuccess: async () => {
      setDecisionRemark('')
      setSelectedId(null)
      await queryClient.invalidateQueries({ queryKey: ['subletOrders'] })
    },
  })

  const approve = () => {
    if (!selected) return
    decide.mutate({
      action: 'approve',
      id: selected.sublet_order_id,
      payload: { decision_remark: (decisionRemark || '').trim() || null },
    })
  }

  const returnToRequester = () => {
    if (!selected) return
    decide.mutate({
      action: 'returnToRequester',
      id: selected.sublet_order_id,
      payload: { decision_remark: (decisionRemark || '').trim() || null },
    })
  }

  const reject = () => {
    if (!selected) return
    decide.mutate({
      action: 'reject',
      id: selected.sublet_order_id,
      payload: { decision_remark: (decisionRemark || '').trim() || null },
    })
  }

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ['subletOrders'] })
    queryClient.invalidateQueries({ queryKey: ['jobOrders', { for: 'subletOrderApproval' }] })
    queryClient.invalidateQueries({ queryKey: ['subletWorkTypes'] })
    queryClient.invalidateQueries({ queryKey: ['subletWorkSuppliers'] })
    queryClient.invalidateQueries({ queryKey: ['employees', { for: 'subletOrderApproval' }] })
    if (selectedJobId) queryClient.invalidateQueries({ queryKey: ['jobOrder', selectedJobId] })
  }

  const handlePrint = () => {
    if (!selected) return
    window.print()
  }

  const supplierForPrint = selected ? supplierById.get(selected.supplier_id) : null
  const jobNoPrint = selected ? jobNumberById.get(selected.job_order_id) || `#${selected.job_order_id}` : ''

  const canDecide = tabStatus === 'Finalized' && !!selected && !decide.isPending

  return (
    <div className="animate-fade-in space-y-4 pb-6 print:pb-0">
      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-md ring-1 ring-black/[0.03]">
        <header className="border-b border-border/60 bg-gradient-to-br from-primary/[0.08] via-card to-teal-500/[0.05] px-5 py-5 sm:px-7 sm:py-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Transactions</p>
              <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Sublet order approval
              </h1>
              <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                Use this page for approving <strong className="font-medium text-foreground">finalized</strong> sublet work
                orders. Only <strong className="font-medium text-foreground">approved</strong> orders are ready to send to
                the sublet supplier. Select a row in the list on the left; job order, customer, and line details appear on
                the right.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 print:hidden">
              <Button
                type="button"
                variant="default"
                size="sm"
                className="gap-1.5"
                disabled={!canDecide}
                onClick={approve}
              >
                <CheckCircle className="h-4 w-4" aria-hidden />
                Approve
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="gap-1.5"
                disabled={!canDecide}
                onClick={returnToRequester}
              >
                <CornerUpLeft className="h-4 w-4" aria-hidden />
                Return
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="gap-1.5"
                disabled={!canDecide}
                onClick={reject}
              >
                <XCircle className="h-4 w-4" aria-hidden />
                Reject
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
                      Click a sublet order in the left-hand list. The right-hand pane shows full detail and which{' '}
                      <strong className="font-medium text-foreground">job order</strong> it belongs to.
                    </li>
                    <li>
                      On <strong className="font-medium text-foreground">Sublet order approval</strong>, use Approve,
                      Return (send back as draft for correction), or Reject. Records move to the matching tab after each
                      action.
                    </li>
                    <li>Optional approver notes go in <strong className="font-medium text-foreground">Approver remark</strong>.</li>
                  </ul>
                </CardDescription>
              </div>
            </CardHeader>
          </Card>

          <Card className="p-3 shadow-sm print:hidden">
            <div className="flex flex-wrap gap-2">
              {TABS.map((t) => (
                <Button
                  key={t.key}
                  type="button"
                  variant={tabStatus === t.key ? 'default' : 'secondary'}
                  size="sm"
                  onClick={() => {
                    setTabStatus(t.key)
                    setSelectedId(null)
                    setDecisionRemark('')
                  }}
                >
                  {t.label}
                </Button>
              ))}
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            <Card className="shadow-sm xl:col-span-5 print:hidden">
              <CardHeader className="pb-2 pt-4">
                <CardTitle className="text-lg">Sublet orders</CardTitle>
                <CardDescription>Order no., date, and job card no.</CardDescription>
              </CardHeader>
              <CardContent className="pb-4 pt-0">
                {isLoading ? (
                  <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
                    <LoadingSpinner size="sm" />
                    Loading…
                  </div>
                ) : orders.length === 0 ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">No orders in this tab.</p>
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
                              onClick={() => setSelectedId(o.sublet_order_id)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault()
                                  setSelectedId(o.sublet_order_id)
                                }
                              }}
                              className={cn(
                                'cursor-pointer transition-colors',
                                active ? 'bg-primary/[0.12]' : 'bg-card hover:bg-primary/[0.04]'
                              )}
                            >
                              <td className="whitespace-nowrap px-3 py-2 font-mono text-xs font-semibold">
                                {o.sublet_order_number}
                              </td>
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
                  <CardTitle className="text-lg">Order detail</CardTitle>
                  <CardDescription>Header from the job order and selected sublet line.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pb-4 pt-0">
                  {!selected ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      Select a sublet order from the list to view details.
                    </p>
                  ) : jobDetailLoading ? (
                    <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
                      <LoadingSpinner size="sm" />
                      Loading job…
                    </div>
                  ) : (
                    <>
                      {(() => {
                        const wt = workTypeById.get(selected.sublet_work_type_id)
                        const supplier = supplierById.get(selected.supplier_id)
                        const jobNo = jobNumberById.get(selected.job_order_id) || `#${selected.job_order_id}`
                        const requestedBy = employeeNameById.get(selected.requested_by_employee_id) || '—'
                        const decidedBy = employeeNameById.get(selected.decided_by_employee_id) || '—'

                        return (
                          <div className="grid gap-3 rounded-xl border border-border/70 bg-muted/15 p-4 sm:grid-cols-2 lg:grid-cols-3">
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Order no.</p>
                              <p className="mt-1 font-mono text-sm font-semibold">{selected.sublet_order_number}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Job card no.</p>
                              <p className="mt-1 text-sm font-semibold">{jobNo}</p>
                            </div>
                            <div className="sm:col-span-2 lg:col-span-3">
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Customer name</p>
                              <p className="mt-1 text-sm font-medium leading-snug">{customerDisplay}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Supplied by</p>
                              <p className="mt-1 text-sm font-medium">{supplier?.supplier_name || '—'}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Order date</p>
                              <p className="mt-1 text-sm tabular-nums">{formatLongDateTime(selected.created_at)}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Plate no.</p>
                              <p className="mt-1 font-mono text-sm font-semibold">{vehicle?.license_plate || '—'}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Date opened</p>
                              <p className="mt-1 text-sm tabular-nums">{formatOpened(jobDetail?.opened_date)}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Date closed</p>
                              <p className="mt-1 text-sm tabular-nums">{formatLongDateTime(jobDetail?.closed_at)}</p>
                            </div>
                            <div className="sm:col-span-2 lg:col-span-3">
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Work type</p>
                              <p className="mt-1 text-sm font-medium">
                                {wt ? `${wt.work_code} — ${wt.description}` : `#${selected.sublet_work_type_id}`}
                              </p>
                            </div>
                            <div className="sm:col-span-2 lg:col-span-3">
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Entry remark</p>
                              <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{selected.remark?.trim() || '—'}</p>
                            </div>
                            <div className="sm:col-span-2 lg:col-span-3 flex flex-wrap items-center gap-2">
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Status</p>
                              <Badge variant="outline">{selected.status}</Badge>
                              <span className="text-xs text-muted-foreground">
                                Requested by <strong className="text-foreground">{requestedBy}</strong>
                              </span>
                            </div>
                            {selected.decided_at ? (
                              <div className="sm:col-span-2 lg:col-span-3 grid gap-2 sm:grid-cols-2">
                                <div>
                                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Decided by</p>
                                  <p className="mt-1 text-sm">{decidedBy}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                    Decision remark
                                  </p>
                                  <p className="mt-1 whitespace-pre-wrap text-sm">{selected.decision_remark || '—'}</p>
                                </div>
                              </div>
                            ) : null}
                          </div>
                        )
                      })()}

                      {tabStatus === 'Finalized' ? (
                        <div className="space-y-2 print:hidden">
                          <label htmlFor="approver-remark" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Approver remark (optional)
                          </label>
                          <Textarea
                            id="approver-remark"
                            rows={3}
                            placeholder="Notes for the requester or audit trail."
                            value={decisionRemark}
                            onChange={(e) => setDecisionRemark(e.target.value)}
                          />
                        </div>
                      ) : null}
                    </>
                  )}
                </CardContent>
              </Card>

              {selected ? (
                <Card className="shadow-sm print:border-0 print:shadow-none">
                  <CardHeader className="pb-2 pt-4">
                    <CardTitle className="text-lg">Lines on this job ({tabStatus})</CardTitle>
                    <CardDescription>
                      All sublet orders for this job card in the current tab{jobLines.length > 1 ? ' — click another row to focus it.' : '.'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-4 pt-0">
                    <div className="overflow-x-auto rounded-xl border border-border/70">
                      <table className="w-full min-w-[880px] text-sm">
                        <thead>
                          <tr className="border-b border-border bg-muted/45 text-left">
                            <th className="whitespace-nowrap px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              No
                            </th>
                            <th className="whitespace-nowrap px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Date
                            </th>
                            <th className="whitespace-nowrap px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Charge code
                            </th>
                            <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Description
                            </th>
                            <th className="whitespace-nowrap px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Unit price
                            </th>
                            <th className="whitespace-nowrap px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Order qty
                            </th>
                            <th className="whitespace-nowrap px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Amount
                            </th>
                            <th className="whitespace-nowrap px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Recvd qty
                            </th>
                            <th className="whitespace-nowrap px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Charge qty
                            </th>
                            <th className="whitespace-nowrap px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Created by
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/70">
                          {jobLines.map((line, idx) => {
                            const wt = workTypeById.get(line.sublet_work_type_id)
                            const amt = Number(line.quantity) * Number(line.unit_price)
                            const createdBy = employeeNameById.get(line.requested_by_employee_id) || '—'
                            const isFocus = line.sublet_order_id === selectedId
                            return (
                              <tr
                                key={line.sublet_order_id}
                                className={cn(isFocus ? 'bg-primary/[0.08]' : 'bg-card hover:bg-primary/[0.03]')}
                              >
                                <td className="whitespace-nowrap px-3 py-2 tabular-nums">{idx + 1}</td>
                                <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">{formatShortDate(line.created_at)}</td>
                                <td className="whitespace-nowrap px-3 py-2 font-mono text-xs">{wt?.work_code || '—'}</td>
                                <td className="max-w-[220px] truncate px-3 py-2">{wt?.description || `#${line.sublet_work_type_id}`}</td>
                                <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">{formatMoney(line.unit_price)}</td>
                                <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">{formatMoney(line.quantity)}</td>
                                <td className="whitespace-nowrap px-3 py-2 text-right font-semibold tabular-nums">{formatMoney(amt)}</td>
                                <td className="whitespace-nowrap px-3 py-2 text-right text-muted-foreground tabular-nums">—</td>
                                <td className="whitespace-nowrap px-3 py-2 text-right text-muted-foreground tabular-nums">—</td>
                                <td className="whitespace-nowrap px-3 py-2 text-xs">{createdBy}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              ) : null}

              {/* Printable work order (browser print / PDF) */}
              {selected ? (
                <div className="hidden print:block">
                  <div className="mx-auto max-w-[720px] border border-black p-8 text-black">
                    <h2 className="text-center text-lg font-bold uppercase tracking-wide">Sublet work order</h2>
                    <div className="mt-4 flex justify-end text-xs leading-relaxed">
                      <div className="text-right">
                        <div>Date: {formatShortDate(selected.created_at)}</div>
                        <div>Order no.: {selected.sublet_order_number}</div>
                        <div>Jc no.: {jobNoPrint}</div>
                        <div>Plate no.: {vehicle?.license_plate || '—'}</div>
                      </div>
                    </div>
                    <div className="mt-6 text-sm">
                      <p className="font-semibold">To: {supplierForPrint?.supplier_name || '—'}</p>
                      <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed">
                        {supplierForPrint?.address ||
                          [supplierForPrint?.address_line1, supplierForPrint?.address_line2, supplierForPrint?.address_line3]
                            .filter(Boolean)
                            .join(', ') ||
                          'Address: _________________________________'}
                      </p>
                      <p className="mt-1 text-xs">P.O. Box: {supplierForPrint?.po_box || '_____________'}</p>
                      <p className="mt-1 text-xs">Tel: {supplierForPrint?.phone || '_____________'}</p>
                      <p className="mt-1 text-xs">Fax: {supplierForPrint?.fax_no || '_____________'}</p>
                      <p className="mt-3 text-xs">
                        Contact person: {supplierForPrint?.contact_person?.trim() || 'No contact'}
                      </p>
                    </div>
                    <p className="mt-6 text-sm font-medium">Please carry out the following repairs:</p>
                    <table className="mt-2 w-full border border-black text-xs">
                      <thead>
                        <tr className="bg-neutral-100">
                          <th className="border border-black px-2 py-1 text-left font-semibold">Our code</th>
                          <th className="border border-black px-2 py-1 text-left font-semibold">Job description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {jobLines.map((line) => {
                          const wt = workTypeById.get(line.sublet_work_type_id)
                          return (
                            <tr key={`print-${line.sublet_order_id}`}>
                              <td className="border border-black px-2 py-1 font-mono">{wt?.work_code || '—'}</td>
                              <td className="border border-black px-2 py-1">{wt?.description || `#${line.sublet_work_type_id}`}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                    <div className="mt-6 text-xs whitespace-pre-wrap border-t border-black pt-3">
                      <span className="font-semibold">Remark:</span> {selected.remark?.trim() || decisionRemark?.trim() || '—'}
                    </div>
                    <div className="mt-10 grid grid-cols-3 gap-6 text-xs">
                      <div>
                        <div className="border-t border-black pt-1">Requested by</div>
                        <div className="mt-1">{requestedByName(selected, employeeNameById)}</div>
                      </div>
                      <div>
                        <div className="border-t border-black pt-1">Approved by</div>
                        <div className="mt-1">
                          {selected.status === 'Approved' ? decidedByName(selected, employeeNameById) : '___________________'}
                        </div>
                      </div>
                      <div>
                        <div className="border-t border-black pt-1">Received by</div>
                        <div className="mt-1">___________________</div>
                      </div>
                    </div>
                    <p className="mt-8 text-center text-[10px]">
                      ***** This order is valid if stamped and signed by authorized personnel *****
                    </p>
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

function requestedByName(row, employeeNameById) {
  return employeeNameById.get(row.requested_by_employee_id) || '—'
}

function decidedByName(row, employeeNameById) {
  return employeeNameById.get(row.decided_by_employee_id) || '—'
}
