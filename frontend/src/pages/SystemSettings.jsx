import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { systemSettingsApi } from '../services/api'

const CATEGORY_OPTIONS = [
  { value: '', label: 'All categories' },
  { value: 'garage_location', label: 'Garage locations' },
  { value: 'vehicle_class', label: 'Vehicle classes' },
  { value: 'job_card_receiver', label: 'Job card receivers' },
  { value: 'job_type', label: 'Job types' },
  { value: 'repair_section', label: 'Repair sections' },
  { value: 'working_hour', label: 'Working hours' },
  { value: 'working_calendar', label: 'Working calendar' },
  { value: 'workgroup', label: 'Workgroups' },
]

function SystemSettings() {
  const [searchParams] = useSearchParams()
  const categoryFromUrl = searchParams.get('category') || ''
  const [settings, setSettings] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [category, setCategory] = useState(categoryFromUrl)
  const [search, setSearch] = useState('')

  const [form, setForm] = useState({
    setting_id: null,
    setting_key: '',
    setting_value: '',
    setting_type: '',
    category: '',
    description: '',
  })

  const loadSettings = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = {}
      if (category) params.category = category
      if (search) params.search = search
      const res = await systemSettingsApi.list(params)
      setSettings(res.data)
    } catch (err) {
      console.error(err)
      setError('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSettings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category])

  useEffect(() => {
    setCategory(categoryFromUrl)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryFromUrl])

  const handleEdit = (setting) => {
    setForm({
      setting_id: setting.setting_id,
      setting_key: setting.setting_key,
      setting_value: setting.setting_value ?? '',
      setting_type: setting.setting_type ?? '',
      category: setting.category ?? '',
      description: setting.description ?? '',
    })
  }

  const resetForm = () => {
    setForm({
      setting_id: null,
      setting_key: '',
      setting_value: '',
      setting_type: '',
      category: category || '',
      description: '',
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    try {
      if (!form.setting_key) {
        setError('Key is required')
        return
      }

      if (form.setting_id) {
        await systemSettingsApi.update(form.setting_id, {
          setting_value: form.setting_value || null,
          setting_type: form.setting_type || null,
          category: form.category || null,
          description: form.description || null,
        })
      } else {
        await systemSettingsApi.create({
          setting_key: form.setting_key,
          setting_value: form.setting_value || null,
          setting_type: form.setting_type || null,
          category: form.category || null,
          description: form.description || null,
        })
      }

      resetForm()
      await loadSettings()
    } catch (err) {
      console.error(err)
      const msg =
        err.response?.data?.detail ||
        (Array.isArray(err.response?.data) && err.response.data[0]?.msg) ||
        'Failed to save setting'
      setError(msg)
    }
  }

  const handleDelete = async (settingId) => {
    if (!window.confirm('Delete this setting?')) return
    setError(null)
    try {
      await systemSettingsApi.remove(settingId)
      await loadSettings()
    } catch (err) {
      console.error(err)
      setError('Failed to delete setting')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">System Settings</h1>
      </div>

      <div className="bg-white shadow rounded-lg p-4 space-y-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">
              Search
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
              placeholder="Key or description"
            />
          </div>

          <button
            type="button"
            onClick={loadSettings}
            className="inline-flex items-center px-3 py-1.5 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
          >
            Refresh
          </button>

          <button
            type="button"
            onClick={resetForm}
            className="inline-flex items-center px-3 py-1.5 text-sm border rounded text-gray-700 hover:bg-gray-50"
          >
            New
          </button>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4 mt-2">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">
              Key
            </label>
            <input
              type="text"
              value={form.setting_key}
              disabled={!!form.setting_id}
              onChange={(e) => setForm({ ...form, setting_key: e.target.value })}
              className="border rounded px-2 py-1 w-full text-sm disabled:bg-gray-100"
              placeholder="e.g. ADDIS_MAIN_WORKSHOP"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">
              Category
            </label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="border rounded px-2 py-1 w-full text-sm"
            >
              <option value="">Select category</option>
              {CATEGORY_OPTIONS.filter((c) => c.value).map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">
              Type
            </label>
            <input
              type="text"
              value={form.setting_type}
              onChange={(e) => setForm({ ...form, setting_type: e.target.value })}
              className="border rounded px-2 py-1 w-full text-sm"
              placeholder="string, int, json..."
            />
          </div>
          <div className="md:col-span-1">
            <label className="text-xs font-medium text-gray-500 block mb-1">
              Value
            </label>
            <input
              type="text"
              value={form.setting_value}
              onChange={(e) => setForm({ ...form, setting_value: e.target.value })}
              className="border rounded px-2 py-1 w-full text-sm"
              placeholder="Display label or config value"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-medium text-gray-500 block mb-1">
              Description
            </label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="border rounded px-2 py-1 w-full text-sm"
              placeholder="Optional description"
            />
          </div>
          <div className="md:col-span-3 flex justify-end gap-2">
            <button
              type="submit"
              className="inline-flex items-center px-4 py-1.5 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
            >
              {form.setting_id ? 'Update setting' : 'Create setting'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-2 border-b flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">
            Settings ({settings.length})
          </h2>
          {loading && (
            <span className="text-xs text-gray-500">Loading...</span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-gray-500">
                  Key
                </th>
                <th className="px-3 py-2 text-left font-medium text-gray-500">
                  Category
                </th>
                <th className="px-3 py-2 text-left font-medium text-gray-500">
                  Type
                </th>
                <th className="px-3 py-2 text-left font-medium text-gray-500">
                  Value
                </th>
                <th className="px-3 py-2 text-left font-medium text-gray-500">
                  Description
                </th>
                <th className="px-3 py-2 text-right font-medium text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {settings.length === 0 && !loading && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-4 text-center text-gray-500"
                  >
                    No settings found.
                  </td>
                </tr>
              )}
              {settings.map((s) => (
                <tr key={s.setting_id} className="border-t">
                  <td className="px-3 py-2 font-mono text-xs">
                    {s.setting_key}
                  </td>
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">
                      {s.category || '-'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-600">
                    {s.setting_type || '-'}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-800">
                    {s.setting_value || ''}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-600">
                    {s.description || ''}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => handleEdit(s)}
                      className="text-indigo-600 hover:text-indigo-800 text-xs mr-2"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(s.setting_id)}
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

export default SystemSettings

