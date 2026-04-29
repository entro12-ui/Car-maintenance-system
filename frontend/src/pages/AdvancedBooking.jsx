import { useEffect, useState } from 'react'
import { appointmentsApi, customersApi, serviceTypesApi, vehiclesApi } from '../services/api'

const DEFAULT_TIME = '09:00'

function formatApNo(id, dt = new Date()) {
  if (!id) return ''
  const yy = String(dt.getFullYear()).slice(-2)
  return `AP-${String(id).padStart(5, '0')}-${yy}`
}

function norm(s) {
  return String(s || '').trim().toLowerCase()
}

export default function AdvancedBooking() {
  const [rows, setRows] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [customers, setCustomers] = useState([])
  const [serviceTypes, setServiceTypes] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [nextApNo, setNextApNo] = useState('')

  const [form, setForm] = useState({
    appointment_id: null,
    plate_no: '',
    vin: '',
    model_code: '',
    customer_name: '',
    telephone: '',
    repair_type: '',
    appointment_date: '',
    booking_date: new Date().toISOString().slice(0, 10),
    scheduled_time: DEFAULT_TIME,
    from_reminder: false,
    sa: false,
    notes: '',
  })

  const loadAll = async () => {
    setLoading(true)
    setError('')
    try {
      const [a, v, c, s] = await Promise.all([
        appointmentsApi.getAll({ limit: 1000 }),
        // Backend caps vehicles/customers at limit=100 (422 if higher).
        vehiclesApi.getAll({ limit: 100 }),
        customersApi.getAll({ limit: 100 }),
        serviceTypesApi.getAll(),
      ])
      const appts = a.data || []
      setRows(appts)
      setVehicles(v.data || [])
      setCustomers(c.data || [])
      setServiceTypes(s.data || [])

      const maxId = appts.reduce((m, r) => Math.max(m, Number(r.appointment_id || 0)), 0)
      setNextApNo(formatApNo(maxId + 1))
    } catch (e) {
      console.error(e)
      const detail =
        e?.response?.data?.detail ||
        (Array.isArray(e?.response?.data) && e.response.data[0]?.msg) ||
        e?.message
      setError(detail ? `Failed to load advanced booking data: ${detail}` : 'Failed to load advanced booking data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  const lookupVehicleByPlate = (plate) => {
    const p = norm(plate)
    if (!p) return null
    return vehicles.find((v) => norm(v.license_plate) === p) || null
  }

  const lookupServiceTypeByName = (name) => {
    const n = norm(name)
    if (!n) return null
    return (
      serviceTypes.find((s) => norm(s.type_name) === n) ||
      serviceTypes.find((s) => norm(s.type_name).includes(n) || n.includes(norm(s.type_name))) ||
      null
    )
  }

  const onPlateBlur = () => {
    setForm((prev) => {
      const vehicle = lookupVehicleByPlate(prev.plate_no)
      if (!vehicle) return prev
      const cust = customers.find((c) => c.customer_id === vehicle.customer_id)
      return {
        ...prev,
        vin: prev.vin || vehicle.vin || '',
        model_code: prev.model_code || vehicle.model || '',
        customer_name:
          prev.customer_name ||
          (cust ? `${cust.first_name || ''} ${cust.last_name || ''}`.trim() : '') ||
          '',
        telephone: prev.telephone || cust?.phone || '',
      }
    })
  }

  const onRefresh = () => {
    setError('')
    setSuccess('')
    setForm({
      appointment_id: null,
      plate_no: '',
      vin: '',
      model_code: '',
      customer_name: '',
      telephone: '',
      repair_type: '',
      appointment_date: '',
      booking_date: new Date().toISOString().slice(0, 10),
      scheduled_time: DEFAULT_TIME,
      from_reminder: false,
      sa: false,
      notes: '',
    })
  }

  const onAddNew = () => {
    onRefresh()
    setForm((p) => ({ ...p, appointment_id: -1 }))
  }

  const onSave = async () => {
    if (!form.appointment_date?.trim()) {
      setError('Appointment Date is required.')
      return
    }
    if (!form.plate_no?.trim()) {
      setError('Plate No is required.')
      return
    }
    if (!form.repair_type?.trim()) {
      setError('Repair type is required.')
      return
    }

    const vehicle = lookupVehicleByPlate(form.plate_no)
    if (!vehicle) {
      setError('No vehicle found for this plate. Register the vehicle first, or check the plate number.')
      return
    }

    const st = lookupServiceTypeByName(form.repair_type)
    if (!st) {
      setError(
        'Repair type not found. Enter a service type name that matches Service Types (same spelling as setup).'
      )
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const extra = []
      if (form.sa) extra.push('SA')
      if (form.from_reminder) extra.push('From Scheduled Service Reminder')
      if (form.notes?.trim()) extra.push(form.notes.trim())
      const typed = [
        form.customer_name?.trim() && `Customer: ${form.customer_name.trim()}`,
        form.telephone?.trim() && `Tel: ${form.telephone.trim()}`,
        form.vin?.trim() && `VIN: ${form.vin.trim()}`,
        form.model_code?.trim() && `Model: ${form.model_code.trim()}`,
      ].filter(Boolean)
      if (typed.length) extra.push(typed.join(' | '))
      const notes = extra.length ? extra.join(' — ') : null

      await appointmentsApi.create({
        vehicle_id: Number(vehicle.vehicle_id),
        service_type_id: Number(st.service_type_id),
        scheduled_date: form.appointment_date,
        scheduled_time: form.scheduled_time || DEFAULT_TIME,
        notes,
        estimated_duration_minutes: 60,
      })
      await loadAll()
      onRefresh()
      setSuccess('Advanced booking saved.')
    } catch (e) {
      console.error(e)
      setError(e?.response?.data?.detail || 'Failed to save booking.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="border-b pb-2">
        <h1 className="text-2xl font-semibold text-gray-800">Service Advance Booking</h1>
      </div>

      <div className="bg-white border rounded p-2 flex flex-wrap items-center gap-3 text-sm">
        <button type="button" className="text-gray-700 hover:text-gray-900" onClick={onAddNew}>
          Add New
        </button>
        <button type="button" className="text-gray-700 hover:text-gray-900" onClick={onSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button type="button" className="text-gray-700 hover:text-gray-900" onClick={() => window.print()}>
          Print Preview
        </button>
        <button type="button" className="text-gray-700 hover:text-gray-900" onClick={onRefresh}>
          Refresh
        </button>
        <span className="text-blue-700 font-semibold">Ready</span>
      </div>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">{error}</div>
      )}
      {success && (
        <div className="rounded border border-green-200 bg-green-50 text-green-700 px-3 py-2 text-sm">{success}</div>
      )}

      <div className="bg-white border rounded p-3 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <label className="text-sm md:col-span-4">
            <span className="text-gray-700">Appointment No.:</span>
            <input
              className="w-full mt-1 border rounded px-2 py-1.5 bg-gray-50"
              readOnly
              value={form.appointment_id ? nextApNo : ''}
            />
          </label>
          <label className="text-sm md:col-span-1 mt-7 flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.sa}
              onChange={(e) => setForm((p) => ({ ...p, sa: e.target.checked }))}
            />
            SA
          </label>
          <label className="text-sm md:col-span-3">
            <span className="text-gray-700">Date:</span>
            <input
              type="date"
              className="w-full mt-1 border rounded px-2 py-1.5"
              value={form.booking_date}
              onChange={(e) => setForm((p) => ({ ...p, booking_date: e.target.value }))}
            />
          </label>
          <label className="text-sm md:col-span-4">
            <span className="text-gray-700">Appointment Date:</span>
            <input
              type="date"
              className="w-full mt-1 border rounded px-2 py-1.5"
              value={form.appointment_date}
              onChange={(e) => setForm((p) => ({ ...p, appointment_date: e.target.value }))}
            />
          </label>

          <label className="text-sm md:col-span-4">
            <span className="text-gray-700">Plate No:</span>
            <input
              type="text"
              className="w-full mt-1 border rounded px-2 py-1.5"
              value={form.plate_no}
              onChange={(e) => setForm((p) => ({ ...p, plate_no: e.target.value }))}
              onBlur={onPlateBlur}
              placeholder="e.g. 3-17247"
            />
          </label>
          <label className="text-sm md:col-span-8">
            <span className="text-gray-700">Chassis/VIN/Frame #</span>
            <input
              type="text"
              className="w-full mt-1 border rounded px-2 py-1.5"
              value={form.vin}
              onChange={(e) => setForm((p) => ({ ...p, vin: e.target.value }))}
              placeholder="VIN or chassis number"
            />
          </label>

          <label className="text-sm md:col-span-4">
            <span className="text-gray-700">Model Code:</span>
            <input
              type="text"
              className="w-full mt-1 border rounded px-2 py-1.5"
              value={form.model_code}
              onChange={(e) => setForm((p) => ({ ...p, model_code: e.target.value }))}
              placeholder="e.g. Corolla"
            />
          </label>
          <label className="text-sm md:col-span-8">
            <span className="text-gray-700">Customer Name:</span>
            <input
              type="text"
              className="w-full mt-1 border rounded px-2 py-1.5"
              value={form.customer_name}
              onChange={(e) => setForm((p) => ({ ...p, customer_name: e.target.value }))}
              placeholder="Customer name"
            />
          </label>

          <label className="text-sm md:col-span-5">
            <span className="text-gray-700">Telephone No.:</span>
            <input
              type="text"
              className="w-full mt-1 border rounded px-2 py-1.5"
              value={form.telephone}
              onChange={(e) => setForm((p) => ({ ...p, telephone: e.target.value }))}
              placeholder="Phone"
            />
          </label>
          <label className="text-sm md:col-span-4">
            <span className="text-gray-700">Time:</span>
            <input
              type="time"
              className="w-full mt-1 border rounded px-2 py-1.5"
              value={form.scheduled_time}
              onChange={(e) => setForm((p) => ({ ...p, scheduled_time: e.target.value }))}
            />
          </label>
          <label className="text-sm md:col-span-3">
            <span className="text-gray-700">Repair type:</span>
            <input
              type="text"
              className="w-full mt-1 border rounded px-2 py-1.5"
              value={form.repair_type}
              onChange={(e) => setForm((p) => ({ ...p, repair_type: e.target.value }))}
              placeholder="Service type name"
            />
          </label>

          <label className="text-sm md:col-span-12">
            <span className="text-gray-700">Notes (optional):</span>
            <input
              type="text"
              className="w-full mt-1 border rounded px-2 py-1.5"
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
            />
          </label>

          <label className="text-sm md:col-span-12 flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.from_reminder}
              onChange={(e) => setForm((p) => ({ ...p, from_reminder: e.target.checked }))}
            />
            <span className="font-medium">From Scheduled Service Reminder</span>
          </label>
        </div>
        <p className="text-xs text-gray-500">
          All main fields are free text. Save still requires the plate to match a registered vehicle and repair type to
          match a service type name. Leaving a field blank after typing a known plate may auto-fill from master data when
          you leave the Plate field.
        </p>
      </div>

      <div className="bg-white border rounded overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 py-2 text-left">No</th>
              <th className="px-2 py-2 text-left">Appointment No</th>
              <th className="px-2 py-2 text-left">Date</th>
              <th className="px-2 py-2 text-left">App. Date</th>
              <th className="px-2 py-2 text-left">Plate No</th>
              <th className="px-2 py-2 text-left">VIN/Chassis</th>
              <th className="px-2 py-2 text-left">Customer</th>
              <th className="px-2 py-2 text-left">Tel No</th>
              <th className="px-2 py-2 text-left">Model Code</th>
              <th className="px-2 py-2 text-left">Service Type</th>
              <th className="px-2 py-2 text-left">Status</th>
              <th className="px-2 py-2 text-left">From Reminder</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && !loading && (
              <tr>
                <td className="px-2 py-3 text-center text-gray-500" colSpan={12}>
                  No bookings found.
                </td>
              </tr>
            )}
            {rows.map((r, idx) => (
              <tr key={r.appointment_id} className="border-t">
                <td className="px-2 py-2">{idx + 1}</td>
                <td className="px-2 py-2 font-mono">
                  {formatApNo(r.appointment_id, new Date(r.created_at || Date.now()))}
                </td>
                <td className="px-2 py-2">{r.created_at ? String(r.created_at).slice(0, 10) : '-'}</td>
                <td className="px-2 py-2">{r.scheduled_date || '-'}</td>
                <td className="px-2 py-2">{r.vehicle?.license_plate || '-'}</td>
                <td className="px-2 py-2">{r.vehicle?.vin || '-'}</td>
                <td className="px-2 py-2">
                  {`${r.vehicle?.customer?.first_name || ''} ${r.vehicle?.customer?.last_name || ''}`.trim() || '-'}
                </td>
                <td className="px-2 py-2">{r.vehicle?.customer?.phone || '-'}</td>
                <td className="px-2 py-2">{r.vehicle?.model || '-'}</td>
                <td className="px-2 py-2">{r.service_type?.type_name || '-'}</td>
                <td className="px-2 py-2">{r.status || '-'}</td>
                <td className="px-2 py-2">{String(r.notes || '').includes('Reminder') ? 'Yes' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
