import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { jobOrdersApi, partsApi, systemSettingsApi, vehiclesApi, customersApi } from '../services/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ExternalLink, FilePlus2, Info, RefreshCw, Save, Trash2 } from 'lucide-react'

const RESERVE_CAT = 'item_reserve_transactions'

function normalizeArray(payload) {
  if (Array.isArray(payload)) return payload
  if (payload?.data != null && Array.isArray(payload.data)) return payload.data
  return []
}

function parseJsonSafe(value, fallback) {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value
    return Array.isArray(parsed) ? parsed : fallback
  } catch {
    return fallback
  }
}

function genReserveBatchNo() {
  const d = new Date()
  const ymd = d.toISOString().slice(0, 10).replace(/-/g, '')
  const seq = String(Math.floor(Math.random() * 900000) + 100000)
  return `IRS-${ymd}-${seq}`
}

function formatMoney(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  return n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

export default function ItemReserve() {
  const [jobOrderId, setJobOrderId] = useState('')
  const [reserveSettingId, setReserveSettingId] = useState(null)
  const [reserveRows, setReserveRows] = useState([])
  const [reserveBatchNo, setReserveBatchNo] = useState('')
  const [partId, setPartId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [bannerError, setBannerError] = useState('')
  const [bannerSuccess, setBannerSuccess] = useState('')
  const [loadingReserve, setLoadingReserve] = useState(false)
  const [saving, setSaving] = useState(false)

  const [jobs, setJobs] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [customers, setCustomers] = useState([])
  const [parts, setParts] = useState([])
  const [listsLoading, setListsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setListsLoading(true)
      try {
        const [jr, vr, cr, pr] = await Promise.all([
          jobOrdersApi.list({ limit: 500 }),
          vehiclesApi.getAll({ limit: 500 }),
          customersApi.getAll({ limit: 500 }),
          partsApi.getAll({ limit: 500 }),
        ])
        if (!cancelled) {
          setJobs(normalizeArray(jr.data))
          setVehicles(normalizeArray(vr.data))
          setCustomers(normalizeArray(cr.data))
          setParts(normalizeArray(pr.data))
        }
      } catch {
        if (!cancelled) {
          setJobs([])
          setVehicles([])
          setCustomers([])
          setParts([])
        }
      } finally {
        if (!cancelled) setListsLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const selectableJobs = useMemo(
    () =>
      jobs.filter(
        (j) =>
          j &&
          !j.delivered_at &&
          j.status !== 'Closed' &&
          j.status !== 'Cancelled' &&
          !j.is_blocked
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

  const activeParts = useMemo(() => parts.filter((p) => p?.is_active !== false), [parts])

  const selectedPart = useMemo(() => {
    const id = Number(partId)
    return activeParts.find((p) => Number(p.part_id) === id) || null
  }, [partId, activeParts])

  const loadReserveForJob = useCallback(async (targetJobId) => {
    const id = Number(targetJobId)
    if (!Number.isFinite(id) || id <= 0) {
      setReserveSettingId(null)
      setReserveRows([])
      return
    }
    setLoadingReserve(true)
    try {
      const res = await systemSettingsApi.list({ category: RESERVE_CAT, limit: 500 })
      const all = normalizeArray(res.data)
      const row = all.find((r) => String(r.setting_key) === `job_${id}`)
      setReserveSettingId(row?.setting_id || null)
      setReserveRows(parseJsonSafe(row?.setting_value, []))
    } catch {
      setReserveSettingId(null)
      setReserveRows([])
    } finally {
      setLoadingReserve(false)
    }
  }, [])

  useEffect(() => {
    loadReserveForJob(jobOrderId)
  }, [jobOrderId, loadReserveForJob])

  const persistReserve = async (nextRows) => {
    const jid = Number(jobOrderId)
    const payload = {
      setting_key: `job_${jid}`,
      setting_value: JSON.stringify(nextRows),
      setting_type: 'json',
      category: RESERVE_CAT,
      description: `Item reserve for job ${selectedJob?.job_order_number || jid}`,
    }
    if (reserveSettingId) {
      await systemSettingsApi.update(reserveSettingId, payload)
    } else {
      const created = await systemSettingsApi.create(payload)
      setReserveSettingId(created?.data?.setting_id || null)
    }
    setReserveRows(nextRows)
  }

  const onAddNewBatch = () => {
    setBannerError('')
    setBannerSuccess('')
    setReserveBatchNo(genReserveBatchNo())
    setPartId('')
    setQuantity('1')
    setBannerSuccess('New reserve batch reference generated — add lines with Save reserve line.')
  }

  const onRefresh = () => {
    setJobOrderId('')
    setReserveSettingId(null)
    setReserveRows([])
    setReserveBatchNo('')
    setPartId('')
    setQuantity('1')
    setBannerError('')
    setBannerSuccess('')
  }

  const onSaveReserveLine = async () => {
    setBannerError('')
    setBannerSuccess('')
    if (!selectedJob?.job_order_id) {
      setBannerError('Select a job card.')
      return
    }
    const pid = Number(partId)
    const qty = Number(quantity)
    if (!Number.isFinite(pid) || pid <= 0) {
      setBannerError('Select a parts item.')
      return
    }
    if (!Number.isFinite(qty) || qty <= 0) {
      setBannerError('Enter a valid quantity.')
      return
    }

    const batch = reserveBatchNo || genReserveBatchNo()
    if (!reserveBatchNo) setReserveBatchNo(batch)

    const stock = Number(selectedPart?.stock_quantity ?? 0)
    if (qty > stock) {
      if (
        !window.confirm(
          `Quantity (${qty}) exceeds stock on hand (${stock}). Reserve anyway? Inventory is not deducted until garage issue.`
        )
      ) {
        return
      }
    }

    const code = selectedPart?.part_code || selectedPart?.part_number || `#${pid}`
    const desc = selectedPart?.part_name || selectedPart?.description || ''

    let next = [...reserveRows]
    const idx = next.findIndex((r) => Number(r.part_id) === pid)
    if (idx >= 0) {
      const row = next[idx]
      const supplied = Number(row.supplied_qty || 0)
      next[idx] = {
        ...row,
        reserve_no: row.reserve_no || batch,
        item_code: code,
        description: desc || row.description,
        reserved_qty: Number(row.reserved_qty || 0) + qty,
        supplied_qty: supplied,
      }
    } else {
      next.push({
        reserve_no: batch,
        part_id: pid,
        item_code: code,
        description: desc,
        reserved_qty: qty,
        supplied_qty: 0,
      })
    }

    setSaving(true)
    try {
      await persistReserve(next)
      setBannerSuccess('Reserve line saved.')
      setPartId('')
      setQuantity('1')
    } catch (e) {
      setBannerError(e?.response?.data?.detail || 'Failed to save reserve.')
    } finally {
      setSaving(false)
    }
  }

  const onDeleteLine = async (rowKey) => {
    const row = reserveRows[rowKey]
    if (!row) return
    const supplied = Number(row.supplied_qty || 0)
    if (supplied > 0) {
      setBannerError('Cannot remove a line that already has quantity supplied from reserve.')
      return
    }
    if (!window.confirm(`Remove reserve for ${row.item_code || row.part_id}?`)) return
    const next = reserveRows.filter((_, i) => i !== rowKey)
    setSaving(true)
    try {
      await persistReserve(next)
      setBannerSuccess('Reserve line removed.')
    } catch (e) {
      setBannerError(e?.response?.data?.detail || 'Failed to update reserve.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="animate-fade-in space-y-4 pb-6">
      <nav className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <Link to="/transactions-hub" className="font-medium text-primary hover:underline">
          Transaction
        </Link>
        <span aria-hidden>/</span>
        <span className="font-medium text-foreground">Item reserve</span>
      </nav>

      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-md ring-1 ring-black/[0.03]">
        <header className="border-b border-border/60 bg-gradient-to-br from-primary/[0.08] via-card to-teal-500/[0.05] px-5 py-5 sm:px-7 sm:py-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Transactions</p>
              <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Item reserve</h1>
              <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                Reserve parts against a <strong className="font-medium text-foreground">job order</strong> before garage issue.
                Reserved quantities are stored per job and consumed when you use{' '}
                <strong className="font-medium text-foreground">Item issue from reserve</strong>. This screen does not deduct stock.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={onAddNewBatch}>
                <FilePlus2 className="h-4 w-4" aria-hidden />
                Add new batch
              </Button>
              <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={onRefresh}>
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
                <CardTitle className="text-base">Workflow</CardTitle>
                <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted-foreground">
                  <li>Select job → reserve lines load automatically if they exist.</li>
                  <li>
                    Optional: <strong className="text-foreground">Add new batch</strong> assigns a reserve reference for new lines.
                  </li>
                  <li>
                    Choose part and quantity → <strong className="text-foreground">Save reserve line</strong> (same part increments reserved qty).
                  </li>
                  <li>Issue stock later from the linked screen — supplied qty updates there.</li>
                </ul>
                <Button variant="outline" size="sm" className="mt-3" asChild>
                  <Link to="/transactions/item-issue-from-reserve">
                    Item issue from reserve <ExternalLink className="ml-1 h-3.5 w-3.5" aria-hidden />
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
              <CardDescription>Open jobs only — customer and plate from the job card.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5 lg:col-span-2">
                <label htmlFor="ir-job" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Job card no.
                </label>
                <select
                  id="ir-job"
                  disabled={listsLoading}
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
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Reserve batch ref.</span>
                <Input readOnly className="bg-muted/40 font-mono text-sm" value={reserveBatchNo || '(optional — set via Add new batch)'} />
              </div>
              <div className="flex flex-wrap items-end gap-2">
                <Badge variant="outline">{selectedJob?.status || '—'}</Badge>
                {loadingReserve ? <span className="text-xs text-muted-foreground">Loading reserve…</span> : null}
              </div>
              <div className="space-y-1.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Plate no.</span>
                <Input readOnly className="bg-muted/40 font-mono" value={vehicle?.license_plate || '—'} />
              </div>
              <div className="space-y-1.5 lg:col-span-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Customer</span>
                <Input readOnly className="bg-muted/40" value={customerLabel || '—'} />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="flex flex-col gap-2 border-b border-border/50 pb-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-lg">Reserve line</CardTitle>
                <CardDescription>Select item and quantity — merges with existing line for the same part.</CardDescription>
              </div>
              <Button
                type="button"
                size="sm"
                className="gap-2"
                disabled={!jobOrderId || saving || listsLoading}
                onClick={onSaveReserveLine}
              >
                <Save className="h-4 w-4" aria-hidden />
                Save reserve line
              </Button>
            </CardHeader>
            <CardContent className="grid gap-4 pt-5 lg:grid-cols-12">
              <div className="space-y-1.5 lg:col-span-6">
                <label htmlFor="ir-part" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Item code
                </label>
                <select
                  id="ir-part"
                  disabled={!jobOrderId || listsLoading}
                  className={cn(
                    'flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)]',
                    'transition-all hover:border-primary/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/30'
                  )}
                  value={partId}
                  onChange={(e) => setPartId(e.target.value)}
                >
                  <option value="">Select part…</option>
                  {activeParts.map((p) => (
                    <option key={p.part_id} value={String(p.part_id)}>
                      {p.part_code || p.part_number || `#${p.part_id}`} — {p.part_name || '-'}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5 lg:col-span-3">
                <label htmlFor="ir-qty" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Quantity to reserve
                </label>
                <Input
                  id="ir-qty"
                  type="number"
                  min="0"
                  step="1"
                  disabled={!jobOrderId}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>
              <div className="space-y-1.5 lg:col-span-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Qty on hand</span>
                <Input readOnly className="bg-muted/40 tabular-nums" value={selectedPart != null ? String(selectedPart.stock_quantity ?? '') : ''} />
              </div>
              <div className="space-y-1.5 lg:col-span-12">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Description</span>
                <Input readOnly className="bg-muted/40" value={selectedPart?.part_name || selectedPart?.description || ''} />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-lg">Reserved lines for this job</CardTitle>
              <CardDescription>
                Supplied increases when parts are issued via Item issue from reserve. Lines with supplied qty cannot be deleted here.
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-4 pt-0">
              {!jobOrderId ? (
                <p className="py-10 text-center text-sm text-muted-foreground">Select a job to view or edit reserves.</p>
              ) : reserveRows.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">No reserve lines for this job yet.</p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-border/70">
                  <table className="w-full min-w-[840px] text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/45 text-left">
                        <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Reserve no.
                        </th>
                        <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Code</th>
                        <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Description</th>
                        <th className="whitespace-nowrap px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Reserved
                        </th>
                        <th className="whitespace-nowrap px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Supplied
                        </th>
                        <th className="whitespace-nowrap px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Available
                        </th>
                        <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground print:hidden">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/70">
                      {reserveRows.map((r, idx) => {
                        const reserved = Number(r.reserved_qty || 0)
                        const supplied = Number(r.supplied_qty || 0)
                        const available = reserved - supplied
                        return (
                          <tr key={`${r.part_id}-${idx}`} className="bg-card hover:bg-primary/[0.03]">
                            <td className="whitespace-nowrap px-3 py-2 font-mono text-xs">{r.reserve_no || '—'}</td>
                            <td className="whitespace-nowrap px-3 py-2 font-mono text-xs">{r.item_code || `#${r.part_id}`}</td>
                            <td className="max-w-[240px] truncate px-3 py-2">{r.description || '—'}</td>
                            <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">{formatMoney(reserved)}</td>
                            <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">{formatMoney(supplied)}</td>
                            <td className="whitespace-nowrap px-3 py-2 text-right font-medium tabular-nums">{formatMoney(available)}</td>
                            <td className="whitespace-nowrap px-3 py-2 text-right print:hidden">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 gap-1 text-destructive hover:text-destructive"
                                disabled={saving || supplied > 0}
                                onClick={() => onDeleteLine(idx)}
                                title={supplied > 0 ? 'Already supplied from reserve' : 'Remove reserve line'}
                              >
                                <Trash2 className="h-3.5 w-3.5" aria-hidden />
                                Remove
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
