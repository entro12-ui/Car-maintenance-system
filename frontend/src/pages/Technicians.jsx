import { useEffect, useMemo, useState } from 'react'
import { employeesApi, systemSettingsApi } from '../services/api'
import SetupScreenFrame from './SetupScreenFrame'

function Technicians() {
  const [technicians, setTechnicians] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [workGroups, setWorkGroups] = useState([])

  const [form, setForm] = useState({
    employee_id: null,
    employee_code: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: 'Mechanic',
    specialization: '',
    hourly_rate: '',
    work_unit: '',
    supervisor_employee_id: '',
    can_dispatch_job: false,
    on_payroll: false,
    payroll_no: '',
    hire_date: '',
    date_of_termination: '',
    is_active: true,
  })

  const loadTechnicians = async () => {
    setLoading(true)
    setError(null)
    try {
      const [techRes, wgRes] = await Promise.all([
        employeesApi.list({ role: 'Mechanic', include_inactive: true }),
        systemSettingsApi.list({ category: 'work_group_setup', limit: 20 }),
      ])
      setTechnicians(techRes.data || [])
      const wgRow = (wgRes?.data || []).find((r) => r.setting_key === 'default')
      if (wgRow?.setting_value) {
        const parsed = JSON.parse(wgRow.setting_value)
        setWorkGroups(Array.isArray(parsed?.workGroups) ? parsed.workGroups : [])
      } else {
        setWorkGroups([])
      }
    } catch (err) {
      console.error(err)
      setError('Failed to load technicians')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTechnicians()
  }, [])

  const resetForm = () => {
    setForm({
      employee_id: null,
      employee_code: '',
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      role: 'Mechanic',
      specialization: '',
      hourly_rate: '',
      work_unit: '',
      supervisor_employee_id: '',
      can_dispatch_job: false,
      on_payroll: false,
      payroll_no: '',
      hire_date: '',
      date_of_termination: '',
      is_active: true,
    })
  }

  const handleEdit = (t) => {
    setForm({
      employee_id: t.employee_id,
      employee_code: t.employee_code,
      first_name: t.first_name,
      last_name: t.last_name,
      email: t.email,
      phone: t.phone,
      role: t.role,
      specialization: t.specialization || '',
      hourly_rate: t.hourly_rate?.toString() || '',
      work_unit: t.work_unit || '',
      supervisor_employee_id: t.supervisor_employee_id || '',
      can_dispatch_job: !!t.can_dispatch_job,
      on_payroll: !!t.on_payroll,
      payroll_no: t.payroll_no || '',
      hire_date: t.hire_date || '',
      date_of_termination: t.date_of_termination || '',
      is_active: t.is_active,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!form.employee_code || !form.first_name || !form.last_name || !form.email || !form.phone) {
      setError('Code, name, email and phone are required')
      return
    }

    try {
      const payload = {
        employee_code: form.employee_code,
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        phone: form.phone,
        role: form.role || 'Mechanic',
        specialization: form.specialization || null,
        hourly_rate: form.hourly_rate ? parseFloat(form.hourly_rate) : 0,
        work_unit: form.work_unit || null,
        supervisor_employee_id: form.supervisor_employee_id ? Number(form.supervisor_employee_id) : null,
        can_dispatch_job: !!form.can_dispatch_job,
        on_payroll: !!form.on_payroll,
        payroll_no: form.payroll_no || null,
        hire_date: form.hire_date || null,
        date_of_termination: form.date_of_termination || null,
        is_active: form.is_active,
      }

      if (form.employee_id) {
        const { employee_code, ...updatePayload } = payload
        await employeesApi.update(form.employee_id, updatePayload)
      } else {
        await employeesApi.create(payload)
      }

      resetForm()
      await loadTechnicians()
    } catch (err) {
      console.error(err)
      const msg =
        err.response?.data?.detail ||
        (Array.isArray(err.response?.data) && err.response.data[0]?.msg) ||
        'Failed to save technician'
      setError(msg)
    }
  }

  const handleToggleActive = async (t) => {
    setError(null)
    try {
      await employeesApi.update(t.employee_id, { is_active: !t.is_active })
      await loadTechnicians()
    } catch (err) {
      console.error(err)
      setError('Failed to update technician status')
    }
  }

  const handleDelete = async (t) => {
    if (!window.confirm('Delete this technician?')) return
    setError(null)
    try {
      await employeesApi.remove(t.employee_id)
      await loadTechnicians()
    } catch (err) {
      console.error(err)
      setError('Failed to delete technician')
    }
  }

  const supervisorOptions = technicians.filter((t) => !form.employee_id || t.employee_id !== form.employee_id)
  const workUnitOptions = useMemo(() => {
    const fromWorkGroups = (workGroups || [])
      .filter((g) => ['Department', 'Section', 'Unit'].includes(String(g.group_type || '')))
      .map((g) => String(g.name || '').trim())
      .filter(Boolean)
    const fromTechs = (technicians || []).map((t) => String(t.work_unit || '').trim()).filter(Boolean)
    return Array.from(new Set([...fromWorkGroups, ...fromTechs])).sort((a, b) => a.localeCompare(b))
  }, [workGroups, technicians])

  return (
    <SetupScreenFrame
      title="Technician setup"
      subtitle="Create and maintain mechanic profiles: codes, contact, specialization, hourly rate, work unit, supervisor, payroll flags, and active status for dispatch and job costing."
      reviewPoints={[
        'Verify employee codes are unique and match payroll or HR identifiers where required.',
        'Supervisor links should form a clear chain for approvals and escalations.',
        'Deactivate instead of deleting when history must stay attached to past job orders.',
      ]}
      relatedLinks={[
        { to: '/setup/work-groups', label: 'Work group setup' },
        { to: '/company-setup', label: 'Company setup' },
        { to: '/setup', label: 'Setup hub' },
      ]}
    >
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-3 flex flex-wrap items-center gap-3 text-sm">
        <button type="button" onClick={resetForm} className="text-gray-700 hover:text-gray-900">New</button>
        <button type="button" onClick={(e) => handleSubmit(e)} className="text-gray-700 hover:text-gray-900">Save</button>
        <button type="button" onClick={() => window.print()} className="text-gray-700 hover:text-gray-900">Print Preview</button>
        <button type="button" onClick={loadTechnicians} className="text-gray-700 hover:text-gray-900">Refresh</button>
        <button type="button" onClick={() => window.alert('Technician audit log is not wired yet.')} className="text-gray-700 hover:text-gray-900">View Log</button>
        <span className="text-blue-700 font-semibold">Ready</span>
      </div>

      <div className="bg-white shadow rounded-lg p-4 space-y-4">
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-12">
            <label className="text-xs font-medium text-gray-500 block mb-1">Technician</label>
            <select
              value={form.employee_id || ''}
              onChange={(e) => {
                const selected = technicians.find((t) => String(t.employee_id) === e.target.value)
                if (selected) handleEdit(selected)
                if (!e.target.value) resetForm()
              }}
              className="border rounded px-2 py-1 w-full text-sm"
            >
              <option value="">Select technician...</option>
              {technicians.map((t) => (
                <option key={t.employee_id} value={t.employee_id}>
                  {t.first_name} {t.last_name}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-medium text-gray-500 block mb-1">Technician Code</label>
            <input
              type="text"
              value={form.employee_code}
              disabled={!!form.employee_id}
              onChange={(e) => setForm({ ...form, employee_code: e.target.value })}
              className="border rounded px-2 py-1 w-full text-sm disabled:bg-gray-100"
              placeholder="TECH001"
            />
          </div>
          <div className="md:col-span-3">
            <label className="text-xs font-medium text-gray-500 block mb-1">First Name</label>
            <input
              type="text"
              value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              className="border rounded px-2 py-1 w-full text-sm"
            />
          </div>
          <div className="md:col-span-3">
            <label className="text-xs font-medium text-gray-500 block mb-1">Last Name</label>
            <input
              type="text"
              value={form.last_name}
              onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              className="border rounded px-2 py-1 w-full text-sm"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-medium text-gray-500 block mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="border rounded px-2 py-1 w-full text-sm"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-medium text-gray-500 block mb-1">Phone</label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="border rounded px-2 py-1 w-full text-sm"
            />
          </div>
          <div className="md:col-span-3">
            <label className="text-xs font-medium text-gray-500 block mb-1">Work Unit / Department</label>
            <select
              value={form.work_unit}
              onChange={(e) => setForm({ ...form, work_unit: e.target.value })}
              className="border rounded px-2 py-1 w-full text-sm"
            >
              <option value="">Select work unit...</option>
              {workUnitOptions.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-3">
            <label className="text-xs font-medium text-gray-500 block mb-1">Supervisor</label>
            <select
              value={form.supervisor_employee_id}
              onChange={(e) => setForm({ ...form, supervisor_employee_id: e.target.value })}
              className="border rounded px-2 py-1 w-full text-sm"
            >
              <option value="">Select supervisor...</option>
              {supervisorOptions.map((s) => (
                <option key={s.employee_id} value={s.employee_id}>
                  {s.first_name} {s.last_name}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-medium text-gray-500 block mb-1">DOE</label>
            <input
              type="date"
              value={form.hire_date}
              onChange={(e) => setForm({ ...form, hire_date: e.target.value })}
              className="border rounded px-2 py-1 w-full text-sm"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-medium text-gray-500 block mb-1">DOT</label>
            <input
              type="date"
              value={form.date_of_termination}
              onChange={(e) => setForm({ ...form, date_of_termination: e.target.value })}
              className="border rounded px-2 py-1 w-full text-sm"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-medium text-gray-500 block mb-1">Payroll No</label>
            <input
              type="text"
              value={form.payroll_no}
              onChange={(e) => setForm({ ...form, payroll_no: e.target.value })}
              className="border rounded px-2 py-1 w-full text-sm"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-medium text-gray-500 block mb-1">Hourly Rate</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.hourly_rate}
              onChange={(e) => setForm({ ...form, hourly_rate: e.target.value })}
              className="border rounded px-2 py-1 w-full text-sm"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-medium text-gray-500 block mb-1">Specialization</label>
            <input
              type="text"
              value={form.specialization}
              onChange={(e) => setForm({ ...form, specialization: e.target.value })}
              className="border rounded px-2 py-1 w-full text-sm"
              placeholder="Engine, Electrical..."
            />
          </div>
          <div className="md:col-span-2 flex items-center gap-4 mt-5">
            <input
              id="tech-dispatch"
              type="checkbox"
              checked={form.can_dispatch_job}
              onChange={(e) => setForm({ ...form, can_dispatch_job: e.target.checked })}
              className="h-4 w-4"
            />
            <label htmlFor="tech-dispatch" className="text-xs font-medium text-gray-700">
              Can Dispatch Job
            </label>
          </div>
          <div className="md:col-span-2 flex items-center gap-4 mt-5">
            <input
              id="tech-payroll"
              type="checkbox"
              checked={form.on_payroll}
              onChange={(e) => setForm({ ...form, on_payroll: e.target.checked })}
              className="h-4 w-4"
            />
            <label htmlFor="tech-payroll" className="text-xs font-medium text-gray-700">
              On Payroll
            </label>
          </div>
          <div className="md:col-span-2 flex items-center gap-4 mt-5">
            <input
              id="tech-active"
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="h-4 w-4"
            />
            <label htmlFor="tech-active" className="text-xs font-medium text-gray-700">
              Is Active
            </label>
          </div>
          <div className="md:col-span-12 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center px-4 py-1.5 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
            >
              {form.employee_id ? 'Update Technician' : 'Create Technician'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-2 border-b flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">
            Technicians ({technicians.length})
          </h2>
          {loading && <span className="text-xs text-gray-500">Loading...</span>}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-gray-500">Code</th>
                <th className="px-3 py-2 text-left font-medium text-gray-500">Technician</th>
                <th className="px-3 py-2 text-left font-medium text-gray-500">Can Disp Job</th>
                <th className="px-3 py-2 text-left font-medium text-gray-500">Supervisor</th>
                <th className="px-3 py-2 text-left font-medium text-gray-500">Work Unit</th>
                <th className="px-3 py-2 text-left font-medium text-gray-500">On Payroll</th>
                <th className="px-3 py-2 text-left font-medium text-gray-500">Payroll No</th>
                <th className="px-3 py-2 text-left font-medium text-gray-500">DOE</th>
                <th className="px-3 py-2 text-left font-medium text-gray-500">DOT</th>
                <th className="px-3 py-2 text-left font-medium text-gray-500">Is Active</th>
                <th className="px-3 py-2 text-right font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {technicians.length === 0 && !loading && (
                <tr>
                  <td colSpan={11} className="px-3 py-4 text-center text-gray-500">
                    No technicians found.
                  </td>
                </tr>
              )}
              {technicians.map((t) => (
                <tr key={t.employee_id} className="border-t">
                  <td className="px-3 py-2 text-xs font-mono">{t.employee_code}</td>
                  <td className="px-3 py-2">
                    {t.first_name} {t.last_name}
                  </td>
                  <td className="px-3 py-2">
                    {t.can_dispatch_job ? 'Yes' : 'No'}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-600">{t.supervisor_name || '-'}</td>
                  <td className="px-3 py-2 text-xs text-gray-600">{t.work_unit || '-'}</td>
                  <td className="px-3 py-2 text-xs text-gray-600">{t.on_payroll ? 'Yes' : 'No'}</td>
                  <td className="px-3 py-2 text-xs text-gray-600">{t.payroll_no || '-'}</td>
                  <td className="px-3 py-2 text-xs text-gray-600">{t.hire_date || '-'}</td>
                  <td className="px-3 py-2 text-xs text-gray-600">{t.date_of_termination || '-'}</td>
                  <td className="px-3 py-2 text-xs text-gray-600">{t.is_active ? 'Yes' : 'No'}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => handleEdit(t)}
                      className="text-indigo-600 hover:text-indigo-800 text-xs mr-2"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleActive(t)}
                      className="text-amber-600 hover:text-amber-800 text-xs mr-2"
                    >
                      {t.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(t)}
                      className="text-red-600 hover:text-red-800 text-xs"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    </SetupScreenFrame>
  )
}

export default Technicians

