import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import {
  customersApi,
  fuelLubricantsApi,
  jobOrderAdditionalChargesApi,
  jobOrdersApi,
  vehiclesApi,
} from '../services/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ExternalLink, Info, PlusCircle, RefreshCw, Trash2 } from 'lucide-react'

const VAT_RATE = 0.15

function normalizeArray(payload) {
  if (Array.isArray(payload)) return payload
  if (payload?.data != null && Array.isArray(payload.data)) return payload.data
  return []
}

function formatMoney(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function InternalFuelLubricantIssue() {
  const queryClient = useQueryClient()
  const [jobOrderId, setJobOrderId] = useState('')
  const [fuelLubricantId, setFuelLubricantId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [odometerKm, setOdometerKm] = useState('')
  const [remark, setRemark] = useState('')
  const [internalIssue, setInternalIssue] = useState(false)
  const [bannerError, setBannerError] = useState('')
  const [bannerSuccess, setBannerSuccess] = useState('')

  const jobsQuery = useQuery({
    queryKey: ['jobOrders', { screen: 'internal-fuel-lubricant-issue' }],
    queryFn: async () => {
      const res = await jobOrdersApi.list({ limit: 500 })
      return normalizeArray(res.data)
    },
  })

  const vehiclesQuery = useQuery({
    queryKey: ['vehicles', { screen: 'internal-fuel-lubricant-issue' }],
    queryFn: async () => {
      const res = await vehiclesApi.getAll({ limit: 500 })
      return normalizeArray(res.data)
    },
  })

  const customersQuery = useQuery({
    queryKey: ['customers', { screen: 'internal-fuel-lubricant-issue' }],
    queryFn: async () => {
      const res = await customersApi.getAll({ limit: 500 })
      return normalizeArray(res.data)
    },
  })

  const fuelTypesQuery = useQuery({
    queryKey: ['fuelLubricants', { active_only: true, screen: 'internal-fuel-issue' }],
    queryFn: async () => {
      const res = await fuelLubricantsApi.list({ active_only: true })
      return normalizeArray(res.data)
    },
  })

  const jobs = jobsQuery.data ?? []
  const vehicles = vehiclesQuery.data ?? []
  const customers = customersQuery.data ?? []
  const fuelTypes = fuelTypesQuery.data ?? []

  const selectableJobs = useMemo(
    () =>
      jobs.filter(
        (j) =>
          j &&
          j.status !== 'Cancelled' &&
          j.status !== 'Closed' &&
          !j.is_blocked &&
          !j.delivered_at
      ),
    [jobs]
  )

  const selectedJob = useMemo(() => {
    const id = Number(jobOrderId)
    return selectableJobs.find((j) => Number(j.job_order_id) === id) || null
  }, [jobOrderId, selectableJobs])

  const vehicle = useMemo(() => {
    const vid = Number(selectedJob?.vehicle_id)
    return vehicles.find((v) => Number(v.vehicle_id) === vid) || null
  }, [selectedJob, vehicles])

  const customer = useMemo(() => {
    const cid = Number(selectedJob?.customer_id)
    return customers.find((c) => Number(c.customer_id) === cid) || null
  }, [selectedJob, customers])

  const customerLabel = useMemo(() => {
    if (!customer) return ''
    return (
      customer.contact_name ||
      [customer.first_name, customer.last_name].filter(Boolean).join(' ') ||
      customer.email ||
      ''
    )
  }, [customer])

  const fuelById = useMemo(() => {
    const m = new Map()
    for (const f of fuelTypes) m.set(f.fuel_lubricant_id, f)
    return m
  }, [fuelTypes])

  const selectedFuel = fuelById.get(Number(fuelLubricantId)) || null

  const chargesQuery = useQuery({
    queryKey: ['jobFuelCharges', Number(jobOrderId), 'internal-screen'],
    queryFn: async () => {
      const res = await jobOrderAdditionalChargesApi.listFuel(Number(jobOrderId))
      return normalizeArray(res.data)
    },
    enabled: !!Number(jobOrderId),
  })

  const charges = chargesQuery.data ?? []

  const createMutation = useMutation({
    mutationFn: (payload) => jobOrderAdditionalChargesApi.createFuel(Number(jobOrderId), payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['jobFuelCharges'] })
      setBannerSuccess('Fuel / lubricant line recorded.')
      setBannerError('')
      setFuelLubricantId('')
      setQuantity('1')
      setRemark('')
      setOdometerKm('')
    },
    onError: (e) => {
      setBannerError(e?.response?.data?.detail || 'Save failed.')
      setBannerSuccess('')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: ({ entryId }) =>
      jobOrderAdditionalChargesApi.deleteFuel(Number(jobOrderId), entryId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['jobFuelCharges'] })
      setBannerSuccess('Line removed.')
      setBannerError('')
    },
    onError: (e) => {
      setBannerError(e?.response?.data?.detail || 'Delete failed.')
      setBannerSuccess('')
    },
  })

  const refreshScreen = () => {
    setJobOrderId('')
    setFuelLubricantId('')
    setQuantity('1')
    setOdometerKm('')
    setRemark('')
    setInternalIssue(false)
    setBannerError('')
    setBannerSuccess('')
    jobsQuery.refetch()
    fuelTypesQuery.refetch()
    queryClient.removeQueries({ queryKey: ['jobFuelCharges'] })
  }

  const unitPrice = Number(selectedFuel?.unit_price || 0)
  const qtyNum = Number(quantity || 0)
  const previewAmount = Number.isFinite(qtyNum) && qtyNum > 0 ? qtyNum * unitPrice : 0
  const previewVat = selectedFuel?.taxable ? previewAmount * VAT_RATE : 0

  const onSaveLine = () => {
    setBannerError('')
    setBannerSuccess('')
    const jid = Number(jobOrderId)
    const fid = Number(fuelLubricantId)
    if (!Number.isFinite(jid) || jid <= 0) {
      setBannerError('Select a job order.')
      return
    }
    if (!Number.isFinite(fid) || fid <= 0) {
      setBannerError('Select a fuel / lubricant item.')
      return
    }
    if (!Number.isFinite(qtyNum) || qtyNum <= 0) {
      setBannerError('Enter a quantity greater than zero.')
      return
    }
    let combinedRemark = (remark || '').trim()
    if (internalIssue) {
      combinedRemark = `[INTERNAL] ${combinedRemark}`.trim()
    }
    let km = null
    const kmRaw = (odometerKm || '').trim()
    if (kmRaw !== '') {
      const k = Number(kmRaw)
      if (!Number.isFinite(k) || k < 0) {
        setBannerError('Odometer (KM) must be a non-negative number.')
        return
      }
      km = k
    }

    createMutation.mutate({
      fuel_lubricant_id: fid,
      quantity: qtyNum,
      remark: combinedRemark || null,
      odometer_km: km,
    })
  }

  const totals = useMemo(() => {
    return charges.reduce(
      (acc, row) => {
        const item = fuelById.get(Number(row.fuel_lubricant_id))
        const amt = Number(row.amount ?? 0)
        const vat = item?.taxable ? amt * VAT_RATE : 0
        return {
          subtotal: acc.subtotal + amt,
          vat: acc.vat + vat,
          total: acc.total + amt + vat,
        }
      },
      { subtotal: 0, vat: 0, total: 0 }
    )
  }, [charges, fuelById])

  return (
    <div className="animate-fade-in space-y-4 pb-6">
      <nav className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <Link to="/transactions-hub" className="font-medium text-primary hover:underline">
          Transaction
        </Link>
        <span aria-hidden>/</span>
        <span className="font-medium text-foreground">Internal fuel & lubricant issue</span>
      </nav>

      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-md ring-1 ring-black/[0.03]">
        <header className="border-b border-border/60 bg-gradient-to-br from-primary/[0.08] via-card to-teal-500/[0.05] px-5 py-5 sm:px-7 sm:py-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Transactions</p>
              <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Internal fuel & lubricant issue
              </h1>
              <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                Record fuel and lubricant consumed against an <strong className="font-medium text-foreground">active job</strong>.
                Optional <strong className="font-medium text-foreground">odometer (KM)</strong> is stored on each line for audit and can be corrected from{' '}
                <strong className="font-medium text-foreground">Fuel issue KM editing</strong>.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={refreshScreen}>
                <RefreshCw className="h-4 w-4" aria-hidden />
                Refresh
              </Button>
            </div>
          </div>
        </header>

        <div className="space-y-5 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
          <Card className="border-primary/15 bg-primary/[0.03] shadow-sm">
            <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-2 pt-4">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
              <div>
                <CardTitle className="text-base">Related screens</CardTitle>
                <p className="mt-2 text-sm text-muted-foreground">
                  Standard billing-style fuel charge entry uses the same API with a different layout.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/transactions/lubricants-and-fuel-charge-entry">
                      Lubricants & fuel charge entry <ExternalLink className="ml-1 h-3.5 w-3.5" aria-hidden />
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/job-orders/additional-charges/lubricants-and-fuel">
                      Maintain fuel & lubricant items <ExternalLink className="ml-1 h-3.5 w-3.5" aria-hidden />
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/transactions/fuel-issue-km-editing">
                      Fuel issue KM editing <ExternalLink className="ml-1 h-3.5 w-3.5" aria-hidden />
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
              <CardTitle className="text-lg">Job context</CardTitle>
              <CardDescription>Open jobs only — customer and plate come from the job card.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5 lg:col-span-2">
                <label htmlFor="if-job" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Job card no.
                </label>
                <select
                  id="if-job"
                  className={cn(
                    'flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)]',
                    'transition-all hover:border-primary/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/30'
                  )}
                  value={jobOrderId}
                  onChange={(e) => setJobOrderId(e.target.value)}
                >
                  <option value="">Select job…</option>
                  {selectableJobs.map((j) => (
                    <option key={j.job_order_id} value={String(j.job_order_id)}>
                      {j.job_order_number || `#${j.job_order_id}`} · {j.status}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Plate no.</span>
                <Input readOnly className="bg-muted/40 font-mono" value={vehicle?.license_plate || '—'} />
              </div>
              <div className="space-y-1.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Vehicle KM</span>
                <Input
                  readOnly
                  className="bg-muted/40 tabular-nums"
                  value={vehicle?.current_mileage != null ? formatMoney(vehicle.current_mileage) : '—'}
                />
              </div>
              <div className="space-y-1.5 md:col-span-2 lg:col-span-4">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Customer</span>
                <Input readOnly className="bg-muted/40" value={customerLabel || '—'} />
              </div>
              <div className="flex flex-wrap gap-2 md:col-span-2 lg:col-span-4">
                <Badge variant="outline">{selectedJob?.status || '—'}</Badge>
                {selectedJob?.is_blocked ? <Badge variant="danger">Blocked</Badge> : null}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="flex flex-col gap-2 border-b border-border/50 pb-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-lg">New issue line</CardTitle>
                <CardDescription>Quantity × master unit price. Tick internal issue to tag the remark.</CardDescription>
              </div>
              <Button
                type="button"
                size="sm"
                className="gap-2"
                disabled={!jobOrderId || createMutation.isPending}
                onClick={onSaveLine}
              >
                <PlusCircle className="h-4 w-4" aria-hidden />
                Save line
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
              <div className="grid gap-4 lg:grid-cols-12">
                <div className="space-y-1.5 lg:col-span-5">
                  <label htmlFor="if-fuel" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Fuel / lubricant item
                  </label>
                  <select
                    id="if-fuel"
                    disabled={!jobOrderId}
                    className={cn(
                      'flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)]',
                      'transition-all hover:border-primary/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/30'
                    )}
                    value={fuelLubricantId}
                    onChange={(e) => setFuelLubricantId(e.target.value)}
                  >
                    <option value="">Select item…</option>
                    {fuelTypes.map((f) => (
                      <option key={f.fuel_lubricant_id} value={String(f.fuel_lubricant_id)}>
                        {f.item_code} — {f.description}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5 lg:col-span-3">
                  <label htmlFor="if-qty" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Quantity
                  </label>
                  <Input
                    id="if-qty"
                    type="number"
                    min="0"
                    step="0.01"
                    disabled={!jobOrderId}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5 lg:col-span-4">
                  <label htmlFor="if-km" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Odometer (KM) at issue
                  </label>
                  <Input
                    id="if-km"
                    inputMode="decimal"
                    placeholder="Optional"
                    disabled={!jobOrderId}
                    value={odometerKm}
                    onChange={(e) => setOdometerKm(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5 lg:col-span-6">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Unit price</span>
                  <Input readOnly className="bg-muted/40 tabular-nums" value={selectedFuel ? formatMoney(unitPrice) : ''} />
                </div>
                <div className="space-y-1.5 lg:col-span-6">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Line preview</span>
                  <Input
                    readOnly
                    className="bg-muted/40 tabular-nums"
                    value={
                      previewAmount > 0
                        ? `${formatMoney(previewAmount)} + VAT ${formatMoney(previewVat)} = ${formatMoney(previewAmount + previewVat)}`
                        : ''
                    }
                  />
                </div>
                <label className="flex cursor-pointer items-start gap-3 text-sm lg:col-span-12">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-input"
                    checked={internalIssue}
                    onChange={(e) => setInternalIssue(e.target.checked)}
                  />
                  <span>
                    <span className="font-semibold text-foreground">Internal consumption issue</span>
                    <span className="block text-muted-foreground">
                      Prefixes remark with <code className="rounded bg-muted px-1 text-xs">[INTERNAL]</code> for filtering / audit.
                    </span>
                  </span>
                </label>
                <div className="space-y-1.5 lg:col-span-12">
                  <label htmlFor="if-remark" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Remark
                  </label>
                  <Textarea
                    id="if-remark"
                    rows={2}
                    disabled={!jobOrderId}
                    placeholder="Pump ticket, bay, batch reference…"
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-lg">Lines on this job</CardTitle>
              <CardDescription>VAT shown at {(VAT_RATE * 100).toFixed(0)}% when the fuel/lubricant master is taxable.</CardDescription>
            </CardHeader>
            <CardContent className="pb-4 pt-0">
              {!jobOrderId ? (
                <p className="py-10 text-center text-sm text-muted-foreground">Choose a job to list fuel & lubricant charges.</p>
              ) : chargesQuery.isLoading ? (
                <p className="py-10 text-center text-sm text-muted-foreground">Loading…</p>
              ) : charges.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">No fuel / lubricant lines yet.</p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-border/70">
                  <table className="w-full min-w-[960px] text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/45 text-left">
                        <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">#</th>
                        <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Date</th>
                        <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Code</th>
                        <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Description</th>
                        <th className="whitespace-nowrap px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Qty
                        </th>
                        <th className="whitespace-nowrap px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          KM
                        </th>
                        <th className="whitespace-nowrap px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Amount
                        </th>
                        <th className="whitespace-nowrap px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          VAT
                        </th>
                        <th className="whitespace-nowrap px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Total
                        </th>
                        <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Remark</th>
                        <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground print:hidden">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/70">
                      {charges.map((row, idx) => {
                        const meta = fuelById.get(Number(row.fuel_lubricant_id))
                        const amt = Number(row.amount ?? 0)
                        const vat = meta?.taxable ? amt * VAT_RATE : 0
                        return (
                          <tr key={row.fuel_lubricant_entry_id} className="bg-card hover:bg-primary/[0.03]">
                            <td className="whitespace-nowrap px-3 py-2 tabular-nums">{idx + 1}</td>
                            <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                              {row.created_at ? format(new Date(row.created_at), 'dd/MM/yyyy HH:mm') : '—'}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2 font-mono text-xs">{meta?.item_code || '—'}</td>
                            <td className="max-w-[200px] truncate px-3 py-2">{meta?.description || '—'}</td>
                            <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">{formatMoney(row.quantity)}</td>
                            <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-muted-foreground">
                              {row.odometer_km != null ? formatMoney(row.odometer_km) : '—'}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">{formatMoney(amt)}</td>
                            <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">{formatMoney(vat)}</td>
                            <td className="whitespace-nowrap px-3 py-2 text-right font-semibold tabular-nums">
                              {formatMoney(amt + vat)}
                            </td>
                            <td className="max-w-[160px] truncate px-3 py-2 text-muted-foreground">{row.remark || '—'}</td>
                            <td className="whitespace-nowrap px-3 py-2 text-right print:hidden">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 gap-1 text-destructive hover:text-destructive"
                                disabled={deleteMutation.isPending}
                                onClick={() => {
                                  if (window.confirm('Remove this fuel / lubricant line from the job?')) {
                                    deleteMutation.mutate({ entryId: row.fuel_lubricant_entry_id })
                                  }
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5" aria-hidden />
                                Delete
                              </Button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-border bg-muted/25 font-semibold">
                        <td colSpan={6} className="px-3 py-2 text-right text-xs uppercase tracking-wide text-muted-foreground">
                          Totals
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">{formatMoney(totals.subtotal)}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">{formatMoney(totals.vat)}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">{formatMoney(totals.total)}</td>
                        <td colSpan={2} />
                      </tr>
                    </tfoot>
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
