import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import SetupScreenFrame from './SetupScreenFrame'
import { systemSettingsApi } from '../services/api'

const CATEGORY = 'company_vehicle_plate_number'

const EMPTY_FORM = {
  setting_id: null,
  plate_number: '',
  owner_name: '',
  department: '',
  use_diesel_fuel: false,
  account_number: '',
  is_active: true,
  created_by: 'administrator',
  created_on: '',
  created_ws: '',
  modified_by: '',
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function parseRecord(row) {
  let data = {}
  try {
    data = row.setting_value ? JSON.parse(row.setting_value) : {}
  } catch {
    data = {}
  }
  return {
    ...EMPTY_FORM,
    ...data,
    setting_id: row.setting_id,
    plate_number: data.plate_number || row.setting_key || '',
    owner_name: data.owner_name || row.description || '',
    created_on: data.created_on || row.created_at || row.created_on || '',
  }
}

export default function PlateNumberMaintenance() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await systemSettingsApi.list({ category: CATEGORY, limit: 1000 })
      setRows((res.data || []).map(parseRecord))
    } catch (err) {
      console.error(err)
      setError('Failed to load plate number setup.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const sortedRows = useMemo(
    () => [...rows].sort((a, b) => String(a.plate_number).localeCompare(String(b.plate_number))),
    [rows]
  )

  const startNew = () => {
    setForm({ ...EMPTY_FORM, created_on: today(), created_ws: 'USER-PC' })
    setEditing(true)
    setError('')
    setSuccess('')
  }

  const startEdit = (row) => {
    setForm(row)
    setEditing(true)
    setError('')
    setSuccess('')
  }

  const save = async (e) => {
    e.preventDefault()
    if (!form.plate_number.trim()) {
      setError('Plate number is required.')
      return
    }

    const payload = {
      plate_number: form.plate_number.trim(),
      owner_name: form.owner_name || null,
      department: form.department || null,
      use_diesel_fuel: !!form.use_diesel_fuel,
      account_number: form.account_number || null,
      is_active: !!form.is_active,
      created_by: form.created_by || 'administrator',
      created_on: form.created_on || today(),
      created_ws: form.created_ws || null,
      modified_by: form.modified_by || null,
    }

    setSaving(true)
    setError('')
    setSuccess('')
    try {
      if (form.setting_id) {
        await systemSettingsApi.update(form.setting_id, {
          setting_value: JSON.stringify(payload),
          setting_type: 'json',
          category: CATEGORY,
          description: payload.owner_name,
        })
      } else {
        await systemSettingsApi.create({
          setting_key: payload.plate_number,
          setting_value: JSON.stringify(payload),
          setting_type: 'json',
          category: CATEGORY,
          description: payload.owner_name,
        })
      }
      setEditing(false)
      setForm(EMPTY_FORM)
      setSuccess('Saved.')
      await load()
    } catch (err) {
      console.error(err)
      setError(err?.response?.data?.detail || 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (row) => {
    if (!window.confirm(`Delete plate number ${row.plate_number}?`)) return
    setError('')
    setSuccess('')
    try {
      await systemSettingsApi.remove(row.setting_id)
      setSuccess('Deleted.')
      await load()
    } catch (err) {
      console.error(err)
      setError('Delete failed.')
    }
  }

  return (
    <SetupScreenFrame
      hubTo="/maintenance-hub"
      hubLabel="Maintenance"
      title="Company Vehicles Plate Number Setup"
      subtitle="Record vehicles owned by the company. Internal vehicles can be treated differently for spare parts, labour costs, and standard invoice printing."
      actions={
        <>
          <Button type="button" variant="outline" onClick={startNew}>
            Add New Record
          </Button>
          <Button type="button" variant="outline" onClick={() => window.print()}>
            Print Preview
          </Button>
          <Button type="button" variant="outline" onClick={load}>
            Refresh
          </Button>
          <span className="text-sm font-semibold text-blue-700 self-center">Ready</span>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
          This page is used to record vehicles that belong to the company. These vehicles are treated as internal,
          owned by the company, where standard customer invoices may not be printed and spare-parts/labor cost
          treatment can differ from external customer vehicles.
        </div>
        {error && <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        {success && (
          <div className="rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{success}</div>
        )}

        <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-600">
                <tr>
                  <th className="px-3 py-2 text-left">No</th>
                  <th className="px-3 py-2 text-left">Plate Number</th>
                  <th className="px-3 py-2 text-left">Owned By</th>
                  <th className="px-3 py-2 text-left">Department</th>
                  <th className="px-3 py-2 text-center">Diesel</th>
                  <th className="px-3 py-2 text-left">Account Number</th>
                  <th className="px-3 py-2 text-center">Active</th>
                  <th className="px-3 py-2 text-left">Created By</th>
                  <th className="px-3 py-2 text-left">Created On</th>
                  <th className="px-3 py-2 text-left">Created WS</th>
                  <th className="px-3 py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {sortedRows.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-3 py-6 text-center text-gray-500">
                      {loading ? 'Loading...' : 'No company vehicle plate numbers found.'}
                    </td>
                  </tr>
                ) : (
                  sortedRows.map((row, idx) => (
                    <tr key={row.setting_id} className="border-t">
                      <td className="px-3 py-2">{idx + 1}</td>
                      <td className="px-3 py-2 font-medium">{row.plate_number}</td>
                      <td className="px-3 py-2">{row.owner_name || '-'}</td>
                      <td className="px-3 py-2">{row.department || '-'}</td>
                      <td className="px-3 py-2 text-center">{row.use_diesel_fuel ? 'Yes' : 'No'}</td>
                      <td className="px-3 py-2">{row.account_number || '-'}</td>
                      <td className="px-3 py-2 text-center">{row.is_active ? 'Yes' : 'No'}</td>
                      <td className="px-3 py-2">{row.created_by || '-'}</td>
                      <td className="px-3 py-2">{row.created_on || '-'}</td>
                      <td className="px-3 py-2">{row.created_ws || '-'}</td>
                      <td className="px-3 py-2 text-right">
                        <button type="button" className="text-indigo-600 hover:text-indigo-800 text-xs mr-3" onClick={() => startEdit(row)}>
                          Edit
                        </button>
                        <button type="button" className="text-red-600 hover:text-red-800 text-xs" onClick={() => remove(row)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {editing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog">
            <form onSubmit={save} className="w-full max-w-4xl rounded-lg bg-white shadow-xl border">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <h2 className="font-semibold text-gray-900">{form.setting_id ? 'Edit Plate No Setup' : 'Add Plate No Setup'}</h2>
                <button type="button" className="text-gray-500 hover:text-gray-800" onClick={() => setEditing(false)}>
                  Close
                </button>
              </div>
              <div className="p-5 grid grid-cols-1 md:grid-cols-[160px_minmax(0,1fr)] gap-x-4 gap-y-3">
                <label className="text-sm md:text-right md:pt-1.5">Plate Number:</label>
                <input className="border rounded px-2 py-1 text-sm" value={form.plate_number} disabled={!!form.setting_id} onChange={(e) => setForm((p) => ({ ...p, plate_number: e.target.value }))} />
                <label className="text-sm md:text-right md:pt-1.5">Owner Name:</label>
                <input className="border rounded px-2 py-1 text-sm" value={form.owner_name} onChange={(e) => setForm((p) => ({ ...p, owner_name: e.target.value }))} />
                <label className="text-sm md:text-right md:pt-1.5">Department:</label>
                <input className="border rounded px-2 py-1 text-sm" value={form.department} onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))} />
                <label className="text-sm md:text-right">Use Diesel Fuel:</label>
                <input type="checkbox" className="justify-self-start" checked={!!form.use_diesel_fuel} onChange={(e) => setForm((p) => ({ ...p, use_diesel_fuel: e.target.checked }))} />
                <label className="text-sm md:text-right md:pt-1.5">Account No/COA:</label>
                <input className="border rounded px-2 py-1 text-sm" value={form.account_number} onChange={(e) => setForm((p) => ({ ...p, account_number: e.target.value }))} />
                <label className="text-sm md:text-right">Is Active:</label>
                <input type="checkbox" className="justify-self-start" checked={!!form.is_active} onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))} />
                <label className="text-sm md:text-right md:pt-1.5">Created By:</label>
                <input className="border rounded px-2 py-1 text-sm" value={form.created_by} onChange={(e) => setForm((p) => ({ ...p, created_by: e.target.value }))} />
                <label className="text-sm md:text-right md:pt-1.5">Created On:</label>
                <input type="date" className="border rounded px-2 py-1 text-sm" value={form.created_on || ''} onChange={(e) => setForm((p) => ({ ...p, created_on: e.target.value }))} />
                <label className="text-sm md:text-right md:pt-1.5">Created WS:</label>
                <input className="border rounded px-2 py-1 text-sm" value={form.created_ws} onChange={(e) => setForm((p) => ({ ...p, created_ws: e.target.value }))} />
                <label className="text-sm md:text-right md:pt-1.5">Modified By:</label>
                <input className="border rounded px-2 py-1 text-sm" value={form.modified_by} onChange={(e) => setForm((p) => ({ ...p, modified_by: e.target.value }))} />
              </div>
              <div className="flex justify-end gap-2 border-t px-4 py-3">
                <Button type="submit" disabled={saving}>{saving ? 'Saving...' : form.setting_id ? 'Update' : 'Save'}</Button>
                <Button type="button" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </SetupScreenFrame>
  )
}
