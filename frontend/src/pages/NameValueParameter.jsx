import { useEffect, useMemo, useState } from 'react'
import { systemSettingsApi } from '../services/api'
import SetupScreenFrame from './SetupScreenFrame'
import { Button } from '@/components/ui/button'

const DEFAULT_FORM = {
  setting_id: null,
  setting_key: '',
  setting_value: '',
  setting_type: 'string',
  category: 'name_value_parameter',
  description: '',
}

export default function NameValueParameter() {
  const [settings, setSettings] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [search, setSearch] = useState('')
  const [form, setForm] = useState(DEFAULT_FORM)
  const [implementerConsent, setImplementerConsent] = useState(false)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await systemSettingsApi.list({ limit: 1000 })
      setSettings(res.data || [])
    } catch (err) {
      console.error(err)
      setError('Failed to load name value parameters.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (settings || [])
      .filter((s) => {
        if (!q) return true
        return (
          String(s.setting_key || '').toLowerCase().includes(q) ||
          String(s.setting_value || '').toLowerCase().includes(q) ||
          String(s.description || '').toLowerCase().includes(q) ||
          String(s.category || '').toLowerCase().includes(q)
        )
      })
      .sort((a, b) => String(a.setting_key || '').localeCompare(String(b.setting_key || '')))
  }, [settings, search])

  const resetForm = () => {
    setForm(DEFAULT_FORM)
    setImplementerConsent(false)
    setError('')
    setSuccess('')
  }

  const editRow = (row) => {
    setForm({
      setting_id: row.setting_id,
      setting_key: row.setting_key || '',
      setting_value: row.setting_value || '',
      setting_type: row.setting_type || 'string',
      category: row.category || 'name_value_parameter',
      description: row.description || '',
    })
    setError('')
    setSuccess('')
  }

  const save = async (e) => {
    e.preventDefault()
    if (!implementerConsent) {
      setError('Implementer consent is required before changing name value parameters.')
      return
    }
    if (!form.setting_key.trim()) {
      setError('Parameter key is required.')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')
    try {
      if (form.setting_id) {
        await systemSettingsApi.update(form.setting_id, {
          setting_value: form.setting_value || null,
          setting_type: form.setting_type || 'string',
          category: form.category || null,
          description: form.description || null,
        })
      } else {
        await systemSettingsApi.create({
          setting_key: form.setting_key.trim(),
          setting_value: form.setting_value || null,
          setting_type: form.setting_type || 'string',
          category: form.category || null,
          description: form.description || null,
        })
      }
      await load()
      resetForm()
      setSuccess('Saved.')
    } catch (err) {
      console.error(err)
      setError(err?.response?.data?.detail || 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (row) => {
    if (!implementerConsent) {
      setError('Implementer consent is required before deleting name value parameters.')
      return
    }
    if (!window.confirm('Delete this name value parameter?')) return
    setError('')
    setSuccess('')
    try {
      await systemSettingsApi.remove(row.setting_id)
      await load()
      setSuccess('Deleted.')
    } catch (err) {
      console.error(err)
      setError('Delete failed.')
    }
  }

  return (
    <SetupScreenFrame
      hubTo="/maintenance-hub"
      hubLabel="Maintenance"
      title="Name Value Parameter"
      subtitle="Define parameter keys and values used as configurable application switches. Change established values carefully because they may affect system behaviour."
      reviewPoints={[
        'Avoid changing live parameter values without confirming the downstream screen or report that reads them.',
        'Use clear keys and descriptions so implementers can identify each parameter later.',
        'Prefer deactivation conventions or value changes over deleting parameters referenced by code.',
      ]}
      relatedLinks={[
        { to: '/global-parameters', label: 'Global Parameters' },
        { to: '/system-settings', label: 'System Settings' },
        { to: '/maintenance-hub', label: 'Maintenance hub' },
      ]}
      actions={
        <>
          <span className="text-sm text-blue-700 hidden sm:inline self-center">Ready</span>
          <Button type="button" variant="outline" onClick={resetForm}>
            Add New Record
          </Button>
          <Button type="button" variant="outline" onClick={load}>
            Refresh
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          A user should not change established Name Value Parameter entries without consent from the system implementer.
        </div>
        {error && <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        {success && (
          <div className="rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{success}</div>
        )}

        <div className="bg-white border rounded-lg shadow-sm p-4 space-y-4">
          <div className="flex flex-wrap gap-3 items-end">
            <label className="text-xs">
              <span className="block text-muted-foreground mb-1">Search</span>
              <input
                className="border rounded px-2 py-1.5 text-sm min-w-[260px]"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Enter text to search..."
              />
            </label>
            <Button type="button" variant="outline" onClick={() => setSearch('')}>
              Clear
            </Button>
          </div>

          <form onSubmit={save} className="grid grid-cols-1 md:grid-cols-2 gap-3 border rounded p-3 bg-slate-50/60">
            <label className="text-xs">
              <span className="text-muted-foreground">Parameter Key</span>
              <input
                className="w-full mt-1 border rounded px-2 py-1.5 text-sm disabled:bg-muted"
                value={form.setting_key}
                disabled={!!form.setting_id}
                onChange={(e) => setForm((p) => ({ ...p, setting_key: e.target.value }))}
                placeholder="e.g. AdditionalCustomerIdForReserve"
              />
            </label>
            <label className="text-xs">
              <span className="text-muted-foreground">Parameter Value</span>
              <input
                className="w-full mt-1 border rounded px-2 py-1.5 text-sm"
                value={form.setting_value}
                onChange={(e) => setForm((p) => ({ ...p, setting_value: e.target.value }))}
                placeholder="e.g. Yes"
              />
            </label>
            <label className="text-xs">
              <span className="text-muted-foreground">Category</span>
              <input
                className="w-full mt-1 border rounded px-2 py-1.5 text-sm"
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                placeholder="name_value_parameter"
              />
            </label>
            <label className="text-xs">
              <span className="text-muted-foreground">Type</span>
              <input
                className="w-full mt-1 border rounded px-2 py-1.5 text-sm"
                value={form.setting_type}
                onChange={(e) => setForm((p) => ({ ...p, setting_type: e.target.value }))}
                placeholder="string"
              />
            </label>
            <label className="text-xs md:col-span-2">
              <span className="text-muted-foreground">Description</span>
              <input
                className="w-full mt-1 border rounded px-2 py-1.5 text-sm"
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Description"
              />
            </label>
            <div className="md:col-span-2 flex gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : form.setting_id ? 'Update' : 'Add New Record'}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                Clear
              </Button>
            </div>
            <label className="md:col-span-2 inline-flex items-center gap-2 text-xs text-foreground/90">
              <input
                type="checkbox"
                checked={implementerConsent}
                onChange={(e) => setImplementerConsent(e.target.checked)}
              />
              I have system implementer consent to change these parameter values.
            </label>
          </form>
        </div>

        <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
          <div className="border-b px-4 py-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground/90">Name value parameters ({rows.length})</h2>
            {loading && <span className="text-xs text-muted-foreground">Loading...</span>}
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/35 text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">Parameter Key</th>
                  <th className="px-3 py-2 text-left">Description</th>
                  <th className="px-3 py-2 text-left">Parameter Value</th>
                  <th className="px-3 py-2 text-left">Created By</th>
                  <th className="px-3 py-2 text-left">Created On</th>
                  <th className="px-3 py-2 text-left">Created Ws</th>
                  <th className="px-3 py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">
                      {loading ? 'Loading...' : 'No name value parameters found.'}
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.setting_id} className="border-t">
                      <td className="px-3 py-2 font-mono text-xs">{row.setting_key}</td>
                      <td className="px-3 py-2">{row.description || '-'}</td>
                      <td className="px-3 py-2">{row.setting_value || '-'}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{row.created_by || row.created_by_name || '-'}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{row.created_at || row.created_on || '-'}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{row.created_ws || '-'}</td>
                      <td className="px-3 py-2 text-right">
                        <div className="inline-flex gap-2">
                          <Button type="button" size="sm" variant="outline" onClick={() => editRow(row)}>
                            Edit
                          </Button>
                          <Button type="button" size="sm" variant="destructive" onClick={() => remove(row)}>
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </SetupScreenFrame>
  )
}
