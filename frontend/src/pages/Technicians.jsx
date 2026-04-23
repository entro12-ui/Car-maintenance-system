import { useEffect, useState } from 'react'
import { employeesApi } from '../services/api'

function Technicians() {
  const [technicians, setTechnicians] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

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
    is_active: true,
  })

  const loadTechnicians = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await employeesApi.list({ role: 'Mechanic', include_inactive: true })
      setTechnicians(res.data)
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">Technician Setup</h1>
        <button
          type="button"
          onClick={resetForm}
          className="inline-flex items-center px-3 py-1.5 text-sm border rounded text-gray-700 hover:bg-gray-50"
        >
          New Technician
        </button>
      </div>

      <div className="bg-white shadow rounded-lg p-4 space-y-4">
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Code</label>
            <input
              type="text"
              value={form.employee_code}
              disabled={!!form.employee_id}
              onChange={(e) => setForm({ ...form, employee_code: e.target.value })}
              className="border rounded px-2 py-1 w-full text-sm disabled:bg-gray-100"
              placeholder="TECH001"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">First name</label>
            <input
              type="text"
              value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              className="border rounded px-2 py-1 w-full text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Last name</label>
            <input
              type="text"
              value={form.last_name}
              onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              className="border rounded px-2 py-1 w-full text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="border rounded px-2 py-1 w-full text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Phone</label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="border rounded px-2 py-1 w-full text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Specialization</label>
            <input
              type="text"
              value={form.specialization}
              onChange={(e) => setForm({ ...form, specialization: e.target.value })}
              className="border rounded px-2 py-1 w-full text-sm"
              placeholder="Engine, Electrical..."
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Hourly rate</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.hourly_rate}
              onChange={(e) => setForm({ ...form, hourly_rate: e.target.value })}
              className="border rounded px-2 py-1 w-full text-sm"
            />
          </div>
          <div className="flex items-center gap-2 mt-5">
            <input
              id="tech-active"
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="h-4 w-4"
            />
            <label htmlFor="tech-active" className="text-xs font-medium text-gray-700">
              Active
            </label>
          </div>
          <div className="md:col-span-4 flex justify-end">
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
                <th className="px-3 py-2 text-left font-medium text-gray-500">Name</th>
                <th className="px-3 py-2 text-left font-medium text-gray-500">Email</th>
                <th className="px-3 py-2 text-left font-medium text-gray-500">Phone</th>
                <th className="px-3 py-2 text-left font-medium text-gray-500">Specialization</th>
                <th className="px-3 py-2 text-left font-medium text-gray-500">Hourly rate</th>
                <th className="px-3 py-2 text-left font-medium text-gray-500">Status</th>
                <th className="px-3 py-2 text-right font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {technicians.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} className="px-3 py-4 text-center text-gray-500">
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
                  <td className="px-3 py-2 text-xs text-gray-600">{t.email}</td>
                  <td className="px-3 py-2 text-xs text-gray-600">{t.phone}</td>
                  <td className="px-3 py-2 text-xs text-gray-600">
                    {t.specialization || '-'}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-600">
                    {t.hourly_rate ? `ETB ${t.hourly_rate}` : '-'}
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(t)}
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
                        t.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {t.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
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
  )
}

export default Technicians

