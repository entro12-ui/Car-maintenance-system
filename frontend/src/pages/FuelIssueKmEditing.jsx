import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { fuelLubricantsApi, jobOrderAdditionalChargesApi, jobOrdersApi } from '../services/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ExternalLink, Info, RefreshCw, Save } from 'lucide-react'

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

export default function FuelIssueKmEditing() {
  const queryClient = useQueryClient()
  const [jobOrderId, setJobOrderId] = useState('')
  const [draftKm, setDraftKm] = useState({})
  const [bannerError, setBannerError] = useState('')
  const [bannerSuccess, setBannerSuccess] = useState('')
  const [savingId, setSavingId] = useState(null)

  const jobsQuery = useQuery({
    queryKey: ['jobOrders', { screen: 'fuel-issue-km-editing' }],
    queryFn: async () => {
      const res = await jobOrdersApi.list({ limit: 500 })
      return normalizeArray(res.data)
    },
  })

  const fuelTypesQuery = useQuery({
    queryKey: ['fuelLubricants', { active_only: false, screen: 'fuel-km-edit' }],
    queryFn: async () => {
      const res = await fuelLubricantsApi.list({ active_only: false })
      return normalizeArray(res.data)
    },
  })

  const jobs = jobsQuery.data ?? []
  const fuelTypes = fuelTypesQuery.data ?? []

  const jobChoices = useMemo(
    () =>
      jobs.filter((j) => j && j.status !== 'Cancelled' && !j.is_blocked && !j.delivered_at),
    [jobs]
  )

  const selectedJob = useMemo(() => {
    const id = Number(jobOrderId)
    return jobChoices.find((j) => Number(j.job_order_id) === id) || null
  }, [jobOrderId, jobChoices])

  const fuelById = useMemo(() => {
    const m = new Map()
    for (const f of fuelTypes) m.set(f.fuel_lubricant_id, f)
    return m
  }, [fuelTypes])

  const chargesQuery = useQuery({
    queryKey: ['jobFuelCharges', Number(jobOrderId), 'km-edit'],
    queryFn: async () => {
      const res = await jobOrderAdditionalChargesApi.listFuel(Number(jobOrderId))
      return normalizeArray(res.data)
    },
    enabled: !!Number(jobOrderId),
  })

  const charges = chargesQuery.data ?? []

  useEffect(() => {
    const next = {}
    for (const r of charges) {
      const id = r.fuel_lubricant_entry_id
      next[id] = r.odometer_km != null && r.odometer_km !== '' ? String(r.odometer_km) : ''
    }
    setDraftKm(next)
  }, [charges])

  const patchMutation = useMutation({
    mutationFn: ({ entryId, odometer_km }) =>
      jobOrderAdditionalChargesApi.updateFuelCharge(Number(jobOrderId), entryId, { odometer_km }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['jobFuelCharges'] })
      setBannerSuccess('Odometer (KM) updated.')
      setBannerError('')
      setSavingId(null)
    },
    onError: (e) => {
      setBannerError(e?.response?.data?.detail || 'Update failed — ensure DB migration for odometer_km has been applied.')
      setBannerSuccess('')
      setSavingId(null)
    },
  })

  const refreshScreen = () => {
    setJobOrderId('')
    setDraftKm({})
    setBannerError('')
    setBannerSuccess('')
    queryClient.removeQueries({ queryKey: ['jobFuelCharges'] })
    jobsQuery.refetch()
  }

  const saveRow = (entryId) => {
    setBannerError('')
    setBannerSuccess('')
    const raw = (draftKm[entryId] ?? '').trim()
    let value = null
    if (raw !== '') {
      const n = Number(raw)
      if (!Number.isFinite(n) || n < 0) {
        setBannerError('KM must be empty or a non-negative number.')
        return
      }
      value = n
    }
    setSavingId(entryId)
    patchMutation.mutate({ entryId, odometer_km: value })
  }

  return (
    <div className="animate-fade-in space-y-4 pb-6">
      <nav className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <Link to="/transactions-hub" className="font-medium text-primary hover:underline">
          Transaction
        </Link>
        <span aria-hidden>/</span>
        <span className="font-medium text-foreground">Fuel issue KM editing</span>
      </nav>

      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-md ring-1 ring-black/[0.03]">
        <header className="border-b border-border/60 bg-gradient-to-br from-primary/[0.08] via-card to-teal-500/[0.05] px-5 py-5 sm:px-7 sm:py-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Transactions</p>
              <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Fuel issue KM editing
              </h1>
              <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                Correct <strong className="font-medium text-foreground">odometer (KM)</strong> readings recorded on fuel & lubricant charge lines.
                Select the job, adjust KM per line, then save that row.
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={refreshScreen}>
              <RefreshCw className="h-4 w-4" aria-hidden />
              Refresh
            </Button>
          </div>
        </header>

        <div className="space-y-5 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
          <Card className="border-primary/15 bg-primary/[0.03] shadow-sm">
            <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-2 pt-4">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
              <div>
                <CardTitle className="text-base">Tip</CardTitle>
                <CardDescription className="mt-2 text-sm leading-relaxed">
                  Leave KM blank and save to clear the stored reading. New issues can capture KM from{' '}
                  <Link to="/transactions/internal-fuel-and-lubricant-issue" className="font-semibold text-primary underline-offset-4 hover:underline">
                    Internal fuel & lubricant issue
                  </Link>
                  .
                </CardDescription>
                <Button variant="outline" size="sm" className="mt-3" asChild>
                  <Link to="/transactions/internal-fuel-and-lubricant-issue">
                    Open internal fuel issue <ExternalLink className="ml-1 h-3.5 w-3.5" aria-hidden />
                  </Link>
                </Button>
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
              <CardTitle className="text-lg">Job</CardTitle>
              <CardDescription>Includes closed jobs so historic KM corrections stay possible.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-3">
              <div className="min-w-[240px] flex-1 space-y-1.5">
                <label htmlFor="km-job" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Job card no.
                </label>
                <select
                  id="km-job"
                  className={cn(
                    'flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)]',
                    'transition-all hover:border-primary/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/30'
                  )}
                  value={jobOrderId}
                  onChange={(e) => setJobOrderId(e.target.value)}
                >
                  <option value="">Select job…</option>
                  {jobChoices.map((j) => (
                    <option key={j.job_order_id} value={String(j.job_order_id)}>
                      {j.job_order_number || `#${j.job_order_id}`} · {j.status}
                    </option>
                  ))}
                </select>
              </div>
              {selectedJob ? <Badge variant="outline">{selectedJob.status}</Badge> : null}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-lg">Fuel & lubricant lines</CardTitle>
              <CardDescription>Edit KM then click Save on that row.</CardDescription>
            </CardHeader>
            <CardContent className="pb-4 pt-0">
              {!jobOrderId ? (
                <p className="py-10 text-center text-sm text-muted-foreground">Select a job to load charge lines.</p>
              ) : chargesQuery.isLoading ? (
                <p className="py-10 text-center text-sm text-muted-foreground">Loading…</p>
              ) : charges.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">No fuel / lubricant charges on this job.</p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-border/70">
                  <table className="w-full min-w-[800px] text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/45 text-left">
                        <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Date</th>
                        <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Code</th>
                        <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Description</th>
                        <th className="whitespace-nowrap px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Qty
                        </th>
                        <th className="whitespace-nowrap px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Amount
                        </th>
                        <th className="whitespace-nowrap px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          KM (edit)
                        </th>
                        <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/70">
                      {charges.map((row) => {
                        const meta = fuelById.get(Number(row.fuel_lubricant_id))
                        const id = row.fuel_lubricant_entry_id
                        return (
                          <tr key={id} className="bg-card hover:bg-primary/[0.03]">
                            <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                              {row.created_at ? format(new Date(row.created_at), 'dd/MM/yyyy HH:mm') : '—'}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2 font-mono text-xs">{meta?.item_code || '—'}</td>
                            <td className="max-w-[220px] truncate px-3 py-2">{meta?.description || '—'}</td>
                            <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">{formatMoney(row.quantity)}</td>
                            <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">{formatMoney(row.amount)}</td>
                            <td className="px-3 py-2">
                              <Input
                                className="h-9 max-w-[140px] tabular-nums"
                                inputMode="decimal"
                                placeholder="KM"
                                value={draftKm[id] ?? ''}
                                onChange={(e) => setDraftKm((prev) => ({ ...prev, [id]: e.target.value }))}
                              />
                            </td>
                            <td className="whitespace-nowrap px-3 py-2 text-right">
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                className="gap-1"
                                disabled={patchMutation.isPending && savingId === id}
                                onClick={() => saveRow(id)}
                              >
                                <Save className="h-3.5 w-3.5" aria-hidden />
                                Save
                              </Button>
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
