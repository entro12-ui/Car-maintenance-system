import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import {
  customersApi,
  employeesApi,
  jobOrderInventoryApi,
  jobOrdersApi,
  partsApi,
  vehiclesApi,
} from '../services/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import LoadingSpinner from '@/components/LoadingSpinner'
import { cn } from '@/lib/utils'
import {
  Ban,
  ExternalLink,
  FilePlus2,
  Info,
  Printer,
  RefreshCw,
  Save,
  CheckCircle,
} from 'lucide-react'

/** Display-only VAT rate for voucher grid (parts do not carry taxable flag in this schema). */
const VAT_RATE = 0.15

function formatMoney(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function normalizeArray(payload) {
  if (Array.isArray(payload)) return payload
  if (payload?.data != null && Array.isArray(payload.data)) return payload.data
  return []
}

export default function GarageIssueVoucher() {
  const queryClient = useQueryClient()

  const [salesPersonId, setSalesPersonId] = useState('')
  const [jobOrderId, setJobOrderId] = useState('')
  const [requisitionNo, setRequisitionNo] = useState('')
  const [storeName, setStoreName] = useState('')
  const [partId, setPartId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [issueId, setIssueId] = useState(null)
  const [issueNo, setIssueNo] = useState('')
  const [bannerError, setBannerError] = useState('')
  const [bannerSuccess, setBannerSuccess] = useState('')
  const [isClockedIn, setIsClockedIn] = useState(null)

  const jobsQuery = useQuery({
    queryKey: ['jobOrders', { screen: 'garage-issue-voucher' }],
    queryFn: async () => {
      const res = await jobOrdersApi.list({ limit: 500 })
      return normalizeArray(res.data)
    },
  })

  const vehiclesQuery = useQuery({
    queryKey: ['vehicles', { screen: 'garage-issue-voucher' }],
    queryFn: async () => {
      const res = await vehiclesApi.getAll({ limit: 500 })
      return normalizeArray(res.data)
    },
  })

  const customersQuery = useQuery({
    queryKey: ['customers', { screen: 'garage-issue-voucher' }],
    queryFn: async () => {
      const res = await customersApi.getAll({ limit: 500 })
      return normalizeArray(res.data)
    },
  })

  const employeesQuery = useQuery({
    queryKey: ['employees', { screen: 'garage-issue-voucher' }],
    queryFn: async () => {
      const res = await employeesApi.list({ limit: 500 })
      return normalizeArray(res.data)
    },
  })

  const partsQuery = useQuery({
    queryKey: ['parts', { screen: 'garage-issue-voucher' }],
    queryFn: async () => {
      const res = await partsApi.getAll({ limit: 500 })
      return normalizeArray(res.data)
    },
  })

  const jobs = jobsQuery.data ?? []
  const vehicles = vehiclesQuery.data ?? []
  const customers = customersQuery.data ?? []
  const employees = employeesQuery.data ?? []
  const parts = partsQuery.data ?? []

  const eligibleJobs = useMemo(() => {
    return jobs.filter((j) => {
      if (!j || j.status === 'Cancelled' || j.status === 'Closed') return false
      if (j.is_blocked) return false
      if (j.delivered_at) return false
      return j.status === 'Received'
    })
  }, [jobs])

  const selectedJob = useMemo(() => {
    const id = Number(jobOrderId)
    return eligibleJobs.find((j) => Number(j.job_order_id) === id) || null
  }, [jobOrderId, eligibleJobs])

  const selectedVehicle = useMemo(() => {
    const id = Number(selectedJob?.vehicle_id)
    return vehicles.find((v) => Number(v.vehicle_id) === id) || null
  }, [selectedJob, vehicles])

  const selectedCustomer = useMemo(() => {
    const id = Number(selectedJob?.customer_id)
    return customers.find((c) => Number(c.customer_id) === id) || null
  }, [selectedJob, customers])

  const customerDisplay = useMemo(() => {
    if (!selectedCustomer) return ''
    return (
      selectedCustomer.contact_name ||
      [selectedCustomer.first_name, selectedCustomer.last_name].filter(Boolean).join(' ') ||
      selectedCustomer.email ||
      ''
    )
  }, [selectedCustomer])

  const customerAddress = useMemo(() => {
    if (!selectedCustomer) return ''
    const primary = selectedCustomer.address?.trim()
    if (primary) return primary
    const alt = [selectedCustomer.address_local, selectedCustomer.address_foreign].filter(Boolean).join(' · ')
    if (alt) return alt
    return selectedCustomer.city?.trim() || ''
  }, [selectedCustomer])

  const selectedPart = useMemo(() => {
    const id = Number(partId)
    return parts.find((p) => Number(p.part_id) === id) || null
  }, [partId, parts])

  const activeParts = useMemo(() => parts.filter((p) => p?.is_active !== false), [parts])

  const partById = useMemo(() => {
    const m = new Map()
    for (const p of parts) m.set(p.part_id, p)
    return m
  }, [parts])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      if (!selectedJob?.job_order_id) {
        setIsClockedIn(null)
        return
      }
      try {
        const res = await jobOrdersApi.listClocks(selectedJob.job_order_id)
        const clocks = normalizeArray(res.data)
        const active = clocks.some((c) => !c.clock_out_at)
        if (!cancelled) setIsClockedIn(active)
      } catch {
        if (!cancelled) setIsClockedIn(null)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [selectedJob?.job_order_id])

  const issueQuery = useQuery({
    queryKey: ['itemIssue', issueId],
    queryFn: async () => {
      const res = await jobOrderInventoryApi.getIssue(issueId)
      return res.data
    },
    enabled: !!issueId,
  })

  const draftIssue = issueQuery.data
  const lines = draftIssue?.lines ?? []

  const lineRows = useMemo(() => {
    return lines.map((line, idx) => {
      const p = partById.get(line.part_id)
      const code = p?.part_code || p?.part_number || `#${line.part_id}`
      const desc = p?.part_name || p?.description || '—'
      const qty = Number(line.quantity)
      const unit = Number(line.unit_price)
      const amount = qty * unit
      const vat = amount * VAT_RATE
      const totalInc = amount + vat
      return {
        ...line,
        idx: idx + 1,
        storeLabel: storeName?.trim() || 'HO',
        code,
        desc,
        qty,
        unit,
        amount,
        vat,
        totalInc,
      }
    })
  }, [lines, partById, storeName])

  const gridTotals = useMemo(() => {
    return lineRows.reduce(
      (acc, r) => ({
        amount: acc.amount + r.amount,
        vat: acc.vat + r.vat,
        total: acc.total + r.totalInc,
      }),
      { amount: 0, vat: 0, total: 0 }
    )
  }, [lineRows])

  const invalidateLists = () => {
    queryClient.invalidateQueries({ queryKey: ['jobOrders', { screen: 'garage-issue-voucher' }] })
    queryClient.invalidateQueries({ queryKey: ['parts', { screen: 'garage-issue-voucher' }] })
    queryClient.invalidateQueries({ queryKey: ['vehicles', { screen: 'garage-issue-voucher' }] })
    queryClient.invalidateQueries({ queryKey: ['customers', { screen: 'garage-issue-voucher' }] })
  }

  const createIssueMutation = useMutation({
    mutationFn: () => {
      const remarks = [
        requisitionNo.trim() ? `RequisitionNo:${requisitionNo.trim()}` : null,
        storeName.trim() ? `Store:${storeName.trim()}` : null,
      ]
        .filter(Boolean)
        .join(' | ')
      return jobOrderInventoryApi.createIssue(Number(jobOrderId), {
        issued_by_employee_id: salesPersonId ? Number(salesPersonId) : null,
        remarks: remarks || null,
      })
    },
    onSuccess: (res) => {
      const row = res?.data
      setIssueId(row?.issue_id ?? null)
      setIssueNo(row?.issue_number ?? '')
      setBannerSuccess('Issue voucher opened — issue number assigned automatically.')
      setBannerError('')
      if (row?.issue_id) {
        queryClient.invalidateQueries({ queryKey: ['itemIssue', row.issue_id] })
      }
      invalidateLists()
    },
    onError: (e) => {
      setBannerError(e?.response?.data?.detail || 'Failed to start issue voucher.')
      setBannerSuccess('')
    },
  })

  const addLineMutation = useMutation({
    mutationFn: ({ id, payload }) => jobOrderInventoryApi.addIssueLine(id, payload),
    onSuccess: (_, vars) => {
      setBannerSuccess('Line saved.')
      setBannerError('')
      queryClient.invalidateQueries({ queryKey: ['itemIssue', vars.id] })
      invalidateLists()
    },
    onError: (e) => {
      setBannerError(e?.response?.data?.detail || 'Failed to add line.')
      setBannerSuccess('')
    },
  })

  const finalizeMutation = useMutation({
    mutationFn: (id) => jobOrderInventoryApi.finalizeIssue(id),
    onSuccess: () => {
      setBannerSuccess('Issue voucher finalized — stock updated. Use Print preview for a paper voucher.')
      setBannerError('')
      setIssueId(null)
      setIssueNo('')
      setPartId('')
      setQuantity('')
      queryClient.removeQueries({ queryKey: ['itemIssue'] })
      invalidateLists()
    },
    onError: (e) => {
      setBannerError(e?.response?.data?.detail || 'Failed to finalize issue voucher.')
      setBannerSuccess('')
    },
  })

  const cancelMutation = useMutation({
    mutationFn: (id) => jobOrderInventoryApi.cancelIssue(id),
    onSuccess: () => {
      setBannerSuccess('Draft issue voucher cancelled.')
      setBannerError('')
      setIssueId(null)
      setIssueNo('')
      setPartId('')
      setQuantity('')
      queryClient.removeQueries({ queryKey: ['itemIssue'] })
      invalidateLists()
    },
    onError: (e) => {
      setBannerError(e?.response?.data?.detail || 'Failed to cancel issue voucher.')
      setBannerSuccess('')
    },
  })

  const resetForm = () => {
    setSalesPersonId('')
    setJobOrderId('')
    setRequisitionNo('')
    setStoreName('')
    setPartId('')
    setQuantity('')
    setIssueId(null)
    setIssueNo('')
    setBannerError('')
    setBannerSuccess('')
    setIsClockedIn(null)
    queryClient.removeQueries({ queryKey: ['itemIssue'] })
  }

  const onRefresh = () => {
    resetForm()
    invalidateLists()
    jobsQuery.refetch()
    partsQuery.refetch()
    employeesQuery.refetch()
    vehiclesQuery.refetch()
    customersQuery.refetch()
  }

  const onAddNew = () => {
    setBannerError('')
    setBannerSuccess('')
    if (!selectedJob?.job_order_id) {
      setBannerError('Select a job card first (only jobs in Received status are listed).')
      return
    }
    if (isClockedIn === false) {
      setBannerError('This job has no active technician clock-in. Item issue is blocked until someone is clocked in.')
      return
    }
    if (!salesPersonId && !window.confirm('No salesperson selected. Continue opening the voucher?')) return
    createIssueMutation.mutate()
  }

  const onSaveLine = () => {
    setBannerError('')
    setBannerSuccess('')
    if (!issueId) {
      setBannerError('Click Add New first to open an issue voucher.')
      return
    }
    const pid = Number(partId)
    const qty = Number(quantity)
    if (!Number.isFinite(pid) || pid <= 0) {
      setBannerError('Select an item code.')
      return
    }
    if (!Number.isFinite(qty) || qty <= 0 || !Number.isInteger(qty)) {
      setBannerError('Enter a valid whole-number quantity.')
      return
    }
    const stock = Number(selectedPart?.stock_quantity ?? 0)
    if (stock < qty) {
      setBannerError(
        `Insufficient quantity on hand (${stock}). Choose another store or transfer stock before issuing — or reduce quantity.`
      )
      return
    }
    addLineMutation.mutate({ id: issueId, payload: { part_id: pid, quantity: qty } })
    setQuantity('')
  }

  const onFinish = () => {
    setBannerError('')
    setBannerSuccess('')
    if (!issueId) {
      setBannerError('No issue voucher to finalize.')
      return
    }
    if (isClockedIn === false) {
      setBannerError('Finalize blocked: job has no active technician clock-in.')
      return
    }
    if (!window.confirm('Finish this garage issue voucher? Stock will be deducted when you confirm.')) return
    finalizeMutation.mutate(issueId)
  }

  const onCancelVoucher = () => {
    if (!issueId) return
    if (!window.confirm('Cancel this draft issue voucher? Lines will be discarded.')) return
    cancelMutation.mutate(issueId)
  }

  const handlePrint = () => {
    if (!issueId) return
    window.print()
  }

  const issueDateDisplay = draftIssue?.created_at
    ? format(new Date(draftIssue.created_at), 'dd/MM/yyyy HH:mm')
    : '—'

  const canOperate = isClockedIn !== false && selectedJob?.status === 'Received'

  return (
    <div className="animate-fade-in space-y-4 pb-6 print:pb-0">
      <nav className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground print:hidden" aria-label="Breadcrumb">
        <Link to="/transactions-hub" className="font-medium text-primary hover:underline">
          Transaction
        </Link>
        <span aria-hidden>/</span>
        <span className="font-medium text-foreground">Garage issue voucher</span>
      </nav>

      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-md ring-1 ring-black/[0.03]">
        <header className="border-b border-border/60 bg-gradient-to-br from-primary/[0.08] via-card to-teal-500/[0.05] px-5 py-5 sm:px-7 sm:py-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Transactions</p>
              <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Garage issue voucher
              </h1>
              <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                Record parts issued to an <strong className="font-medium text-foreground">active job order</strong>. The server
                assigns voucher numbers automatically (<span className="font-mono text-xs">MRV-YYYYMMDD-####</span>). Jobs must be{' '}
                <strong className="font-medium text-foreground">received</strong> and have an{' '}
                <strong className="font-medium text-foreground">active technician clock-in</strong> before adding lines or
                finishing.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 print:hidden">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={onAddNew}
                disabled={createIssueMutation.isPending || !canOperate || !jobOrderId}
              >
                <FilePlus2 className="h-4 w-4" aria-hidden />
                Add New
              </Button>
              <Button
                type="button"
                variant="default"
                size="sm"
                className="gap-1.5"
                onClick={onFinish}
                disabled={!issueId || finalizeMutation.isPending || !canOperate}
              >
                <CheckCircle className="h-4 w-4" aria-hidden />
                Finish issue voucher
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5 text-destructive hover:text-destructive"
                onClick={onCancelVoucher}
                disabled={!issueId || cancelMutation.isPending}
              >
                <Ban className="h-4 w-4" aria-hidden />
                Cancel voucher
              </Button>
              <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={handlePrint} disabled={!issueId}>
                <Printer className="h-4 w-4" aria-hidden />
                Print preview
              </Button>
              <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={onRefresh}>
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
                <CardTitle className="text-base">Procedure</CardTitle>
                <ul className="mt-2 list-inside list-disc space-y-1.5 text-sm leading-relaxed text-muted-foreground">
                  <li>
                    Click <strong className="text-foreground">Refresh</strong> to clear the screen and reload lists.
                  </li>
                  <li>
                    Choose <strong className="text-foreground">salesperson</strong> and <strong className="text-foreground">job card</strong>{' '}
                    (job must appear in the list and meet clock-in rules below).
                  </li>
                  <li>
                    <strong className="text-foreground">Add New</strong> opens a voucher; the system assigns the issue number automatically.
                  </li>
                  <li>Optional: enter requisition reference if parts follow a garage requisition.</li>
                  <li>
                    Choose <strong className="text-foreground">store</strong> label for fulfilment tracking (single stock pool today — use this as location code).
                  </li>
                  <li>
                    Pick item and quantity; if <strong className="text-foreground">qty on hand</strong> is zero, change store or transfer stock before saving the line.
                  </li>
                  <li>
                    <strong className="text-foreground">Save line</strong> for each item; when done, <strong className="text-foreground">Finish issue voucher</strong> to deduct stock.
                  </li>
                  <li>Use <strong className="text-foreground">Print preview</strong> for a printable garage issue voucher.</li>
                </ul>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" asChild className="gap-1">
                    <Link to="/transactions/garage-issue-requisition">
                      Garage issue requisition <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                    </Link>
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {bannerError ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {bannerError}
            </div>
          ) : null}
          {bannerSuccess ? (
            <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/90 px-4 py-3 text-sm text-emerald-900">
              {bannerSuccess}
            </div>
          ) : null}

          <Card className="shadow-sm">
            <CardHeader className="pb-3 pt-4">
              <CardTitle className="text-lg">Header</CardTitle>
              <CardDescription>Salesperson, voucher identity, job, and customer from the job card.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1.5">
                  <label htmlFor="giv-sales" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Sales person
                  </label>
                  <select
                    id="giv-sales"
                    className={cn(
                      'flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)]',
                      'transition-all hover:border-primary/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/30'
                    )}
                    value={salesPersonId}
                    onChange={(e) => setSalesPersonId(e.target.value)}
                  >
                    <option value="">Select…</option>
                    {employees.map((e) => (
                      <option key={e.employee_id} value={String(e.employee_id)}>
                        {`${e.first_name || ''} ${e.last_name || ''}`.trim() || e.employee_code || `#${e.employee_id}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="giv-job" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Job card no.
                  </label>
                  <select
                    id="giv-job"
                    className={cn(
                      'flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)]',
                      'transition-all hover:border-primary/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/30'
                    )}
                    value={jobOrderId}
                    onChange={(e) => {
                      setJobOrderId(e.target.value)
                      setIssueId(null)
                      setIssueNo('')
                    }}
                  >
                    <option value="">Select received job…</option>
                    {eligibleJobs.map((j) => (
                      <option key={j.job_order_id} value={String(j.job_order_id)}>
                        {j.job_order_number || `#${j.job_order_id}`} · {j.status}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-muted-foreground">Only jobs in Received status are eligible for item issue.</p>
                </div>
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Issue voucher no.</span>
                  <Input readOnly className="bg-muted/40 font-mono text-sm" value={issueNo || '(Add New — auto)'} />
                  <p className="text-[11px] text-muted-foreground">Always generated by the system for this build.</p>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="giv-date" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Voucher started
                  </label>
                  <Input readOnly className="bg-muted/40" value={issueDateDisplay} id="giv-date" />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label htmlFor="giv-req" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Requisition no.
                  </label>
                  <Input
                    id="giv-req"
                    placeholder="Optional — link to requisition document"
                    value={requisitionNo}
                    onChange={(e) => setRequisitionNo(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Plate no.</span>
                  <Input readOnly className="bg-muted/40 font-mono" value={selectedVehicle?.license_plate || '—'} />
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Clock-in</span>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={isClockedIn ? 'success' : isClockedIn === false ? 'danger' : 'secondary'}>
                      {isClockedIn == null ? 'Unknown' : isClockedIn ? 'Clocked-in' : 'Not clocked-in'}
                    </Badge>
                    {selectedJob ? <Badge variant="outline">{selectedJob.status}</Badge> : null}
                  </div>
                </div>
                <div className="space-y-1.5 md:col-span-2 lg:col-span-4">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cust. name</span>
                  <Input readOnly className="bg-muted/40" value={customerDisplay || '—'} />
                </div>
                <div className="space-y-1.5 md:col-span-2 lg:col-span-4">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Address</span>
                  <Input readOnly className="bg-muted/40" value={customerAddress || '—'} />
                  <p className="text-[11px] text-muted-foreground">
                    From customer/job records — correct on the job card if wrong.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="flex flex-col gap-2 border-b border-border/50 pb-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-lg">Issue line</CardTitle>
                <CardDescription>Select store label, item, and quantity; save each line to the draft voucher.</CardDescription>
              </div>
              <Button
                type="button"
                size="sm"
                className="gap-2 print:hidden"
                onClick={onSaveLine}
                disabled={!issueId || addLineMutation.isPending || !canOperate}
              >
                <Save className="h-4 w-4" aria-hidden />
                Save line
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
              <div className="grid gap-4 lg:grid-cols-12">
                <div className="space-y-1.5 lg:col-span-3">
                  <label htmlFor="giv-store" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Store
                  </label>
                  <Input
                    id="giv-store"
                    placeholder="e.g. HO"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:col-span-5">
                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">T / Qty on hand</span>
                    <Input readOnly className="bg-muted/40 tabular-nums" value={selectedPart != null ? String(selectedPart.stock_quantity ?? '') : ''} />
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">T / Qty on reserve</span>
                    <Input readOnly className="bg-muted/40" value="—" />
                  </div>
                </div>
                <div className="space-y-1.5 lg:col-span-4">
                  <label htmlFor="giv-part" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Item code
                  </label>
                  <select
                    id="giv-part"
                    className={cn(
                      'flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)]',
                      'transition-all hover:border-primary/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/30'
                    )}
                    value={partId}
                    onChange={(e) => setPartId(e.target.value)}
                  >
                    <option value="">Select item…</option>
                    {activeParts.map((p) => (
                      <option key={p.part_id} value={String(p.part_id)}>
                        {p.part_code || p.part_number || `#${p.part_id}`} — {p.part_name || '-'}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5 lg:col-span-8">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Description</span>
                  <Input readOnly className="bg-muted/40" value={selectedPart?.part_name || selectedPart?.description || ''} />
                </div>
                <div className="grid gap-3 sm:grid-cols-3 lg:col-span-12">
                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Qty on hand</span>
                    <Input readOnly className="bg-muted/40 tabular-nums" value={selectedPart != null ? String(selectedPart.stock_quantity ?? '') : ''} />
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Qty on reserve</span>
                    <Input readOnly className="bg-muted/40" value="—" />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="giv-qty" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Quantity
                    </label>
                    <Input
                      id="giv-qty"
                      inputMode="numeric"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="Whole units"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-3 lg:col-span-6">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Unit price</span>
                    <Input readOnly className="bg-muted/40 tabular-nums" value={selectedPart ? formatMoney(selectedPart.unit_price) : ''} />
                  </div>
                </div>
              </div>
              {!issueId ? (
                <p className="text-sm text-muted-foreground">Open a voucher with Add New before saving lines.</p>
              ) : issueQuery.isLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <LoadingSpinner size="sm" />
                  Loading voucher…
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Draft status: <Badge variant="secondary">{draftIssue?.status || '—'}</Badge>
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm print:border-0 print:shadow-none">
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-lg">Issue tab — lines</CardTitle>
              <CardDescription>
                Amount = qty × unit price. VAT column uses {(VAT_RATE * 100).toFixed(0)}% for display on this voucher only.
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-4 pt-0">
              {!issueId ? (
                <p className="py-10 text-center text-sm text-muted-foreground">No open voucher — lines appear after Add New.</p>
              ) : lineRows.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">No lines yet — save at least one line before finishing.</p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-border/70">
                  <table className="w-full min-w-[920px] text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/45 text-left">
                        <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">No</th>
                        <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Store</th>
                        <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Item code</th>
                        <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Description</th>
                        <th className="whitespace-nowrap px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Quantity
                        </th>
                        <th className="whitespace-nowrap px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Unit price
                        </th>
                        <th className="whitespace-nowrap px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Amount
                        </th>
                        <th className="whitespace-nowrap px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          VAT
                        </th>
                        <th className="whitespace-nowrap px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Total inc VAT
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/70">
                      {lineRows.map((r) => (
                        <tr key={r.issue_line_id} className="bg-card hover:bg-primary/[0.03]">
                          <td className="whitespace-nowrap px-3 py-2 tabular-nums">{r.idx}</td>
                          <td className="whitespace-nowrap px-3 py-2">{r.storeLabel}</td>
                          <td className="whitespace-nowrap px-3 py-2 font-mono text-xs">{r.code}</td>
                          <td className="max-w-[220px] truncate px-3 py-2">{r.desc}</td>
                          <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">{formatMoney(r.qty)}</td>
                          <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">{formatMoney(r.unit)}</td>
                          <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">{formatMoney(r.amount)}</td>
                          <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">{formatMoney(r.vat)}</td>
                          <td className="whitespace-nowrap px-3 py-2 text-right font-semibold tabular-nums">{formatMoney(r.totalInc)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-border bg-muted/25 font-semibold">
                        <td colSpan={6} className="px-3 py-2 text-right text-xs uppercase tracking-wide text-muted-foreground">
                          Totals
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">{formatMoney(gridTotals.amount)}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">{formatMoney(gridTotals.vat)}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">{formatMoney(gridTotals.total)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {issueId && draftIssue ? (
            <div className="hidden print:block">
              <div className="mx-auto max-w-[780px] border border-black p-8 text-black">
                <h2 className="text-center text-lg font-bold uppercase">Garage issue voucher</h2>
                <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                  <div>
                    <div>Voucher: {draftIssue.issue_number}</div>
                    <div>Job: {selectedJob?.job_order_number || jobOrderId}</div>
                    <div>Plate: {selectedVehicle?.license_plate || '—'}</div>
                  </div>
                  <div className="sm:text-right">
                    <div>Date: {issueDateDisplay}</div>
                    <div>Customer: {customerDisplay || '—'}</div>
                    <div>Req: {requisitionNo?.trim() || '—'}</div>
                  </div>
                </div>
                <table className="mt-6 w-full border border-black text-xs">
                  <thead>
                    <tr className="bg-neutral-100">
                      <th className="border border-black px-2 py-1 text-left">#</th>
                      <th className="border border-black px-2 py-1 text-left">Store</th>
                      <th className="border border-black px-2 py-1 text-left">Code</th>
                      <th className="border border-black px-2 py-1 text-left">Description</th>
                      <th className="border border-black px-2 py-1 text-right">Qty</th>
                      <th className="border border-black px-2 py-1 text-right">Amount</th>
                      <th className="border border-black px-2 py-1 text-right">VAT</th>
                      <th className="border border-black px-2 py-1 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineRows.map((r) => (
                      <tr key={`p-${r.issue_line_id}`}>
                        <td className="border border-black px-2 py-1">{r.idx}</td>
                        <td className="border border-black px-2 py-1">{r.storeLabel}</td>
                        <td className="border border-black px-2 py-1 font-mono">{r.code}</td>
                        <td className="border border-black px-2 py-1">{r.desc}</td>
                        <td className="border border-black px-2 py-1 text-right">{formatMoney(r.qty)}</td>
                        <td className="border border-black px-2 py-1 text-right">{formatMoney(r.amount)}</td>
                        <td className="border border-black px-2 py-1 text-right">{formatMoney(r.vat)}</td>
                        <td className="border border-black px-2 py-1 text-right">{formatMoney(r.totalInc)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="mt-6 text-center text-[10px]">Authorized signature: ___________________________</p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
