import { useEffect, useMemo, useState } from 'react'
import {
  customersApi,
  jobOrderAdditionalChargesApi,
  jobOrderLaborApi,
  jobOrdersApi,
  systemSettingsApi,
  vehiclesApi,
} from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import SetupScreenFrame from './SetupScreenFrame'

const REGISTRY_CAT = 'canceled_jobs_registry'
const REGISTRY_KEY = 'rows'

function sumAmounts(rows, field = 'amount') {
  return (rows || []).reduce((acc, r) => acc + Number(r?.[field] || 0), 0)
}

export default function CanceledJobsRegistry() {
  const { user } = useAuth()
  const [registrySettingId, setRegistrySettingId] = useState(null)
  const [rows, setRows] = useState([])

  const [lookupOpen, setLookupOpen] = useState(false)
  const [lookup, setLookup] = useState('')

  const [jobOrderId, setJobOrderId] = useState('')
  const [jobOrderNo, setJobOrderNo] = useState('')
  const [plate, setPlate] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [totalPartsFuel, setTotalPartsFuel] = useState('')
  const [totalCharge, setTotalCharge] = useState('')

  const [closedJobs, setClosedJobs] = useState([])
  const [loadingLookup, setLoadingLookup] = useState(false)

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadRegistry = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await systemSettingsApi.list({ category: REGISTRY_CAT, limit: 50 })
      const row = (res.data || []).find((r) => r.setting_key === REGISTRY_KEY)
      setRegistrySettingId(row?.setting_id || null)
      if (row?.setting_value) {
        try {
          const parsed = JSON.parse(row.setting_value)
          setRows(Array.isArray(parsed) ? parsed : [])
        } catch {
          setRows([])
        }
      } else {
        setRows([])
      }
    } catch (e) {
      console.error(e)
      setError('Failed to load registry.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRegistry()
  }, [])

  const persistRegistry = async (nextRows) => {
    const json = JSON.stringify(nextRows)
    const payload = {
      setting_key: REGISTRY_KEY,
      setting_value: json,
      setting_type: 'json',
      category: REGISTRY_CAT,
      description: 'Cancelled jobs registry (HillMaster §4.6)',
    }
    if (registrySettingId) await systemSettingsApi.update(registrySettingId, payload)
    else await systemSettingsApi.create(payload)
    await loadRegistry()
  }

  const openLookup = async () => {
    setLookupOpen(true)
    setLookup('')
    setLoadingLookup(true)
    try {
      const res = await jobOrdersApi.list({ status: 'Closed', limit: 500 })
      setClosedJobs(res.data || [])
    } catch (e) {
      console.error(e)
      setClosedJobs([])
    } finally {
      setLoadingLookup(false)
    }
  }

  const filteredJobs = useMemo(() => {
    const q = lookup.trim().toLowerCase()
    if (!q) return closedJobs
    return closedJobs.filter((j) => String(j.job_order_number || '').toLowerCase().includes(q))
  }, [closedJobs, lookup])

  const hydrateJob = async (jo) => {
    setError('')
    setSuccess('')
    setJobOrderId(String(jo.job_order_id))
    setJobOrderNo(jo.job_order_number || '')

    try {
      const vehicleRes = await vehiclesApi.getById(jo.vehicle_id)
      const v = vehicleRes.data
      setPlate(v?.license_plate || '')

      let name = ''
      if (jo.customer_id) {
        try {
          const cRes = await customersApi.getAll()
          const c = (cRes.data || []).find((x) => x.customer_id === jo.customer_id)
          if (c) name = `${c.first_name || ''} ${c.last_name || ''}`.trim()
        } catch {
          name = ''
        }
      }
      setCustomerName(name)

      const [misc, fuel, sublet, other, labor] = await Promise.all([
        jobOrderAdditionalChargesApi.listMisc(jo.job_order_id),
        jobOrderAdditionalChargesApi.listFuel(jo.job_order_id),
        jobOrderAdditionalChargesApi.listSublet(jo.job_order_id),
        jobOrderAdditionalChargesApi.listOther(jo.job_order_id),
        jobOrderLaborApi.listCharges(jo.job_order_id),
      ])

      const partsFuel = sumAmounts(misc.data) + sumAmounts(fuel.data) + sumAmounts(sublet.data)
      const laborAmt = sumAmounts(labor.data)
      const otherAmt = sumAmounts(other.data)
      const total = partsFuel + laborAmt + otherAmt

      setTotalPartsFuel(partsFuel.toFixed(2))
      setTotalCharge(total.toFixed(2))
    } catch (e) {
      console.error(e)
      setPlate('')
      setCustomerName('')
      setTotalPartsFuel('')
      setTotalCharge('')
      setError('Could not load related vehicle/charges for this job.')
    }
  }

  const onSave = async () => {
    const id = Number(jobOrderId)
    if (!Number.isFinite(id) || id <= 0) {
      setError('Select a closed job order first.')
      return
    }
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const jobRes = await jobOrdersApi.getById(id)
      const job = jobRes.data
      if (job.status !== 'Closed' && job.status !== 'Cancelled') {
        throw new Error('Only closed jobs should be registered as cancelled (manual §4.6).')
      }

      if (job.status !== 'Cancelled') {
        await jobOrdersApi.cancel(id)
      }

      const workstation = typeof window !== 'undefined' ? window.location.hostname || 'WEB' : 'WEB'
      const entry = {
        job_order_no: job.job_order_number,
        canceled_by: user?.username || 'unknown',
        canceled_on: new Date().toISOString(),
        canceled_ws: workstation,
        plate_no: plate,
        customer_name: customerName,
        total_parts_fuel: totalPartsFuel,
        total_charge: totalCharge,
      }

      const exists = rows.some((r) => String(r.job_order_no) === String(entry.job_order_no))
      if (exists) {
        setSuccess('This job is already in the registry.')
        setLookupOpen(false)
        return
      }
      const next = [entry, ...rows]
      await persistRegistry(next)
      setSuccess('Registered as cancelled.')
      setLookupOpen(false)
    } catch (e) {
      console.error(e)
      setError(e?.response?.data?.detail || e?.message || 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  const status = loading ? 'Loading…' : saving ? 'Saving…' : 'Ready'

  return (
    <SetupScreenFrame
      hubTo="/maintenance-hub"
      hubLabel="Maintenance"
      title="Cancelled Jobs registry"
      subtitle="Register closed job orders as cancelled for reporting. This stores an audit list and updates the job order status to Cancelled."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-blue-700">{status}</span>
          <Button type="button" onClick={onSave} disabled={saving || !jobOrderId}>
            Save Record
          </Button>
          <Button type="button" variant="outline" onClick={() => loadRegistry()}>
            Refresh
          </Button>
        </div>
      }
    >
      {error && <div className="rounded border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">{error}</div>}
      {success && <div className="rounded border border-green-200 bg-green-50 text-green-700 px-3 py-2 text-sm">{success}</div>}

      <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        This page is used for registering cancelled jobs for different reasons. The job should be closed before
        registering it as a cancelled job.
      </div>

      <div className="bg-white border rounded-lg shadow-sm p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end">
          <label className="text-sm space-y-1">
            <div className="font-medium text-foreground">Job Order No</div>
            <Input value={jobOrderNo} readOnly placeholder="Pick a closed job…" />
          </label>
          <Button type="button" variant="outline" onClick={openLookup}>
            …
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="text-sm space-y-1">
            <div className="font-medium text-foreground">Plate No</div>
            <Input value={plate} readOnly />
          </label>
          <label className="text-sm space-y-1 md:col-span-2">
            <div className="font-medium text-foreground">Customer Name</div>
            <Input value={customerName} readOnly />
          </label>
          <label className="text-sm space-y-1">
            <div className="font-medium text-foreground">Total Parts/Fuel</div>
            <Input value={totalPartsFuel} readOnly />
          </label>
          <label className="text-sm space-y-1">
            <div className="font-medium text-foreground">Total Charge</div>
            <Input value={totalCharge} readOnly />
          </label>
        </div>

        <div className="border-t pt-4 overflow-auto">
          <table className="min-w-[900px] w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b">
                <th className="py-2 pr-2">Job Order No</th>
                <th className="py-2 pr-2">Canceled By</th>
                <th className="py-2 pr-2">Canceled On</th>
                <th className="py-2 pr-2">Canceled Ws</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => (
                <tr key={`${r.job_order_no}-${idx}`} className="border-b border-border/60 hover:bg-muted/45">
                  <td className="py-2 pr-2 font-medium">{r.job_order_no}</td>
                  <td className="py-2 pr-2">{r.canceled_by}</td>
                  <td className="py-2 pr-2">
                    {r.canceled_on ? new Date(r.canceled_on).toLocaleString() : ''}
                  </td>
                  <td className="py-2 pr-2">{r.canceled_ws}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {lookupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b flex items-center justify-between gap-3">
              <div className="font-semibold text-foreground">Select closed job order</div>
              <Button type="button" variant="outline" onClick={() => setLookupOpen(false)}>
                Close
              </Button>
            </div>
            <div className="p-4 border-b">
              <Input
                autoFocus
                value={lookup}
                onChange={(e) => setLookup(e.target.value)}
                placeholder="Filter by job order number…"
              />
              <div className="text-xs text-muted-foreground mt-2">
                {loadingLookup ? 'Loading closed jobs…' : `${filteredJobs.length} match(es)`}
              </div>
            </div>
            <div className="overflow-auto flex-1">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 sticky top-0">
                  <tr className="text-left text-muted-foreground border-b">
                    <th className="py-2 px-4">Job No</th>
                    <th className="py-2 px-4">Status</th>
                    <th className="py-2 px-4">Vehicle Id</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredJobs.map((j) => (
                    <tr
                      key={j.job_order_id}
                      className="border-b border-border/60 hover:bg-muted/45 cursor-pointer"
                      onClick={() => {
                        hydrateJob(j)
                      }}
                    >
                      <td className="py-2 px-4 font-medium">{j.job_order_number}</td>
                      <td className="py-2 px-4">{j.status}</td>
                      <td className="py-2 px-4">{j.vehicle_id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </SetupScreenFrame>
  )
}
