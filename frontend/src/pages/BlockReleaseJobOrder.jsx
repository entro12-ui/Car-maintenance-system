import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { customersApi, jobOrdersApi, systemSettingsApi, vehiclesApi } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import SetupScreenFrame from './SetupScreenFrame'

const HISTORY_CAT = 'customer_job_block_history'

const PARK_OPTIONS = [
  { key: 'opening_job', label: 'Opening Job' },
  { key: 'closing_job', label: 'Closing Job' },
  { key: 'proforma_invoice', label: 'Proforma Invoice' },
  { key: 'invoicing', label: 'Invoicing' },
  { key: 'reopen_job', label: 'Re-Open Job' },
  { key: 'delivery_letter', label: 'Delivery Letter' },
  { key: 'estimation', label: 'Estimation' },
  { key: 'delivery', label: 'Delivery' },
]

function customerLabel(c) {
  const name = `${c.first_name || ''} ${c.last_name || ''}`.trim()
  return c.status_label ? `${c.status_label} — ${name}` : name
}

export default function BlockReleaseJobOrder() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState('plate')

  const [plate, setPlate] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [reason, setReason] = useState('')
  const [parkFor, setParkFor] = useState(() =>
    PARK_OPTIONS.reduce((acc, o) => {
      acc[o.key] = o.key === 'opening_job' || o.key === 'closing_job'
      return acc
    }, {}),
  )

  const [history, setHistory] = useState([])

  const customersQuery = useQuery({
    queryKey: ['customers', { for: 'blockRelease' }],
    queryFn: () => customersApi.getAll(),
  })

  const vehiclesQuery = useQuery({
    queryKey: ['vehicles', { for: 'blockRelease' }],
    queryFn: () => vehiclesApi.getAll(),
  })

  const blockedJobsQuery = useQuery({
    queryKey: ['jobOrders', { blocked: true }],
    queryFn: async () => {
      const res = await jobOrdersApi.list({ limit: 500 })
      return (res.data || []).filter((j) => j.is_blocked)
    },
  })

  const customers = useMemo(() => customersQuery.data?.data || [], [customersQuery.data])
  const vehicles = useMemo(() => vehiclesQuery.data?.data || [], [vehiclesQuery.data])

  const selectedCustomer = useMemo(() => {
    const id = Number(customerId)
    if (!Number.isFinite(id) || id <= 0) return null
    return customers.find((c) => c.customer_id === id) || null
  }, [customerId, customers])

  const appendHistoryLocal = (rows) => {
    setHistory((prev) => [...rows, ...prev].slice(0, 200))
  }

  const persistHistory = async (rows) => {
    for (const r of rows) {
      // eslint-disable-next-line no-await-in-loop
      await systemSettingsApi.create({
        setting_key: `hist_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        setting_value: JSON.stringify(r),
        setting_type: 'json',
        category: HISTORY_CAT,
        description: 'Customer/plate block history',
      })
    }
  }

  const blockJobsMutation = useMutation({
    mutationFn: async ({ jobs, historyRows, blockReason }) => {
      for (const j of jobs) {
        // eslint-disable-next-line no-await-in-loop
        await jobOrdersApi.block(j.job_order_id, { blocked_reason: blockReason || null })
      }
      if (historyRows?.length) await persistHistory(historyRows)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['jobOrders'] })
      await blockedJobsQuery.refetch()
    },
  })

  const releaseMutation = useMutation({
    mutationFn: async (jobOrderId) => jobOrdersApi.release(jobOrderId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['jobOrders'] })
      await blockedJobsQuery.refetch()
    },
  })

  const onSavePlate = async () => {
    const p = (plate || '').trim().toLowerCase()
    if (!p) return
    const v = vehicles.find((x) => (x.license_plate || '').trim().toLowerCase() === p)
    if (!v) {
      window.alert('Plate not found in vehicles master.')
      return
    }
    const jobsRes = await jobOrdersApi.list({ vehicle_id: v.vehicle_id, limit: 500 })
    const jobs = (jobsRes.data || []).filter((j) => !j.delivered_at && j.status !== 'Closed' && j.status !== 'Cancelled')
    if (!jobs.length) {
      window.alert('No open job orders found for this plate.')
      return
    }
    const selected = PARK_OPTIONS.filter((o) => parkFor[o.key]).map((o) => o.label)
    const blockReason = [reason.trim() || null, selected.length ? `Park: ${selected.join('; ')}` : null]
      .filter(Boolean)
      .join(' | ')
    const historyRows = selected.map((label) => {
      const createdOn = new Date().toISOString()
      return {
        customer_name: `${v.make || ''} ${v.model || ''} (${v.license_plate})`.trim(),
        reason_for_park: (reason || '').trim() || null,
        park_for: `${label} (plate)`,
        created_by: user?.username || 'unknown',
        created_on: createdOn,
        created_ws: typeof window !== 'undefined' ? window.location.hostname || 'WEB' : 'WEB',
      }
    })
    blockJobsMutation.mutate({ jobs, historyRows, blockReason })
    appendHistoryLocal(historyRows)
  }

  const onSaveCustomer = async () => {
    const id = Number(customerId)
    if (!Number.isFinite(id) || id <= 0) return
    const jobsRes = await jobOrdersApi.list({ customer_id: id, limit: 500 })
    const jobs = (jobsRes.data || []).filter((j) => !j.delivered_at && j.status !== 'Closed' && j.status !== 'Cancelled')
    if (!jobs.length) {
      window.alert('No open job orders found for this customer.')
      return
    }
    const selected = PARK_OPTIONS.filter((o) => parkFor[o.key]).map((o) => o.label)
    const name = selectedCustomer ? customerLabel(selectedCustomer) : `Customer #${id}`
    const blockReason = [reason.trim() || null, selected.length ? `Park: ${selected.join('; ')}` : null]
      .filter(Boolean)
      .join(' | ')
    const historyRows = selected.map((label) => {
      const createdOn = new Date().toISOString()
      return {
        customer_name: name,
        reason_for_park: (reason || '').trim() || null,
        park_for: `${label} (customer)`,
        created_by: user?.username || 'unknown',
        created_on: createdOn,
        created_ws: typeof window !== 'undefined' ? window.location.hostname || 'WEB' : 'WEB',
      }
    })
    blockJobsMutation.mutate({ jobs, historyRows, blockReason })
    appendHistoryLocal(historyRows)
  }

  const status = blockJobsMutation.isPending || releaseMutation.isPending ? 'Working…' : 'Ready'

  return (
    <SetupScreenFrame
      hubTo="/maintenance-hub"
      hubLabel="Maintenance"
      title="Block and Release Job Order"
      subtitle="Block open job orders by plate or customer (uses job order block flags). Release clears the block on individual jobs."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-blue-700">{status}</span>
          <Button type="button" variant="outline" onClick={() => blockedJobsQuery.refetch()}>
            Refresh
          </Button>
        </div>
      }
    >
      <div className="bg-white border rounded-lg shadow-sm">
        <div className="flex flex-wrap border-b bg-slate-50/80">
          {[
            { id: 'plate', label: 'Block By PlateNo' },
            { id: 'customer', label: 'Block By Customer' },
            { id: 'release', label: 'Release Blocked Job' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px ${
                tab === t.id ? 'border-indigo-600 text-indigo-700 bg-white' : 'border-transparent text-muted-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-4 space-y-4">
          {tab === 'plate' && (
            <div className="space-y-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <p className="font-semibold text-slate-900">Blocking by Plate Number</p>
                <ul className="mt-2 list-disc pl-5 space-y-1">
                  <li>Click <strong>Refresh</strong> to load latest data.</li>
                  <li>Click <strong>New</strong> by starting a new block entry.</li>
                  <li>Specify the plate number to block for job opening/closing.</li>
                  <li>Provide customer context and reason for blocking.</li>
                  <li>Tick the stages to block in <strong>Block/Park For</strong>.</li>
                  <li>Click <strong>Save</strong> to apply the block and show it in the grid/history.</li>
                </ul>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="text-sm space-y-1">
                  <div className="font-medium text-foreground">Plate No</div>
                  <Input value={plate} onChange={(e) => setPlate(e.target.value)} placeholder="e.g. AA-12345" />
                </label>
                <label className="text-sm space-y-1">
                  <div className="font-medium text-foreground">Reason / Remark</div>
                  <Input value={reason} onChange={(e) => setReason(e.target.value)} />
                </label>
              </div>
              <div className="border rounded-md p-3 bg-slate-50/60">
                <div className="text-sm font-semibold text-foreground mb-2">Block/Park For</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PARK_OPTIONS.map((o) => (
                    <label key={o.key} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={!!parkFor[o.key]}
                        onChange={(e) => setParkFor((prev) => ({ ...prev, [o.key]: e.target.checked }))}
                      />
                      <span>{o.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <Button type="button" onClick={onSavePlate} disabled={blockJobsMutation.isPending}>
                Save (block matching jobs)
              </Button>
              <p className="text-xs text-muted-foreground">
                This applies <span className="font-medium">jobOrdersApi.block</span> to all non-delivered, non-closed jobs for the
                plate. Workflow enforcement for each checkbox is not yet centralized — this screen records intent in history.
              </p>
            </div>
          )}

          {tab === 'customer' && (
            <div className="space-y-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <p className="font-semibold text-slate-900">Blocking by Customer Name</p>
                <ul className="mt-2 list-disc pl-5 space-y-1">
                  <li>Click <strong>Refresh</strong> to load latest data.</li>
                  <li>Click <strong>New</strong> by starting a new block entry.</li>
                  <li>Select the customer to block for job opening/closing workflows.</li>
                  <li>Provide reason for blocking.</li>
                  <li>Tick the stages to block in <strong>Block/Park For</strong>.</li>
                  <li>Click <strong>Save</strong> to apply the block and show it in the grid/history.</li>
                </ul>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="text-sm space-y-1">
                  <div className="font-medium text-foreground">Customer</div>
                  <select
                    className="w-full border rounded-md px-3 py-2 text-sm"
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                  >
                    <option value="">Select customer…</option>
                    {customers.map((c) => (
                      <option key={c.customer_id} value={String(c.customer_id)}>
                        {customerLabel(c)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm space-y-1">
                  <div className="font-medium text-foreground">Full name</div>
                  <Input readOnly value={selectedCustomer ? customerLabel(selectedCustomer) : ''} />
                </label>
                <label className="text-sm space-y-1 md:col-span-2">
                  <div className="font-medium text-foreground">Address</div>
                  <Input readOnly value={selectedCustomer?.address || ''} />
                </label>
                <label className="text-sm space-y-1">
                  <div className="font-medium text-foreground">Tel. No</div>
                  <Input readOnly value={selectedCustomer?.phone || ''} />
                </label>
                <label className="text-sm space-y-1">
                  <div className="font-medium text-foreground">Cell No</div>
                  <Input readOnly value={selectedCustomer?.alt_phone || ''} />
                </label>
                <label className="text-sm space-y-1 md:col-span-2">
                  <div className="font-medium text-foreground">Contact</div>
                  <Input readOnly value={selectedCustomer?.contact_name || ''} />
                </label>
                <label className="text-sm space-y-1">
                  <div className="font-medium text-foreground">Account No</div>
                  <Input readOnly value={selectedCustomer?.sub_ledger || ''} />
                </label>
                <label className="text-sm space-y-1">
                  <div className="font-medium text-foreground">Cust No</div>
                  <Input readOnly value={selectedCustomer ? String(selectedCustomer.customer_id) : ''} />
                </label>
                <label className="text-sm space-y-1 md:col-span-2">
                  <div className="font-medium text-foreground">TIN</div>
                  <Input readOnly value={selectedCustomer?.tin || ''} />
                </label>
                <label className="text-sm space-y-1 md:col-span-2">
                  <div className="font-medium text-foreground">Reason / Remark</div>
                  <Input value={reason} onChange={(e) => setReason(e.target.value)} />
                </label>
              </div>
              <div className="border rounded-md p-3 bg-slate-50/60">
                <div className="text-sm font-semibold text-foreground mb-2">Block/Park For</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PARK_OPTIONS.map((o) => (
                    <label key={o.key} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={!!parkFor[o.key]}
                        onChange={(e) => setParkFor((prev) => ({ ...prev, [o.key]: e.target.checked }))}
                      />
                      <span>{o.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <Button type="button" onClick={onSaveCustomer} disabled={!customerId || blockJobsMutation.isPending}>
                Save (block matching jobs)
              </Button>
            </div>
          )}

          {tab === 'release' && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Blocked job orders (latest 500 scan). Click Release to clear the flag.</p>
              <div className="overflow-auto">
                <table className="min-w-[900px] w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground border-b">
                      <th className="py-2 pr-2">Job No</th>
                      <th className="py-2 pr-2">Status</th>
                      <th className="py-2 pr-2">Reason</th>
                      <th className="py-2 pr-2">Blocked At</th>
                      <th className="py-2 pr-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {(blockedJobsQuery.data || []).map((j) => (
                      <tr key={j.job_order_id} className="border-b border-border/60 hover:bg-muted/45">
                        <td className="py-2 pr-2 font-medium">{j.job_order_number}</td>
                        <td className="py-2 pr-2">{j.status}</td>
                        <td className="py-2 pr-2">{j.blocked_reason || ''}</td>
                        <td className="py-2 pr-2">{j.blocked_at ? String(j.blocked_at) : ''}</td>
                        <td className="py-2 pr-2 text-right">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={releaseMutation.isPending}
                            onClick={() => releaseMutation.mutate(j.job_order_id)}
                          >
                            Release
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {history.length > 0 && (
            <div className="border-t pt-4 space-y-2">
              <div className="text-base font-semibold text-foreground">Session history</div>
              <div className="overflow-auto">
                <table className="min-w-[900px] w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground border-b">
                      <th className="py-2 pr-2">Customer Name</th>
                      <th className="py-2 pr-2">Reason</th>
                      <th className="py-2 pr-2">Park For</th>
                      <th className="py-2 pr-2">Created By</th>
                      <th className="py-2 pr-2">Created On</th>
                      <th className="py-2 pr-2">Created Ws</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((h, idx) => (
                      <tr key={idx} className="border-b border-border/60">
                        <td className="py-2 pr-2">{h.customer_name}</td>
                        <td className="py-2 pr-2">{h.reason_for_park || ''}</td>
                        <td className="py-2 pr-2">{h.park_for}</td>
                        <td className="py-2 pr-2">{h.created_by || user?.username || ''}</td>
                        <td className="py-2 pr-2">
                          {h.created_on ? new Date(h.created_on).toLocaleString() : ''}
                        </td>
                        <td className="py-2 pr-2">{h.created_ws || (typeof window !== 'undefined' ? window.location.hostname : '')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </SetupScreenFrame>
  )
}
