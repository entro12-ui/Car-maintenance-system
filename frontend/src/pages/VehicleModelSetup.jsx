import { useEffect, useMemo, useState } from 'react'
import { systemSettingsApi } from '../services/api'
import { Button } from '@/components/ui/button'

const TABS = [
  { id: 'vehicle_model_group', label: 'Model Group', showJobType: true },
  { id: 'car_model', label: 'Model', showJobType: false, showModelGroupAndJobType: true },
  { id: 'repair_section', label: 'Repair Section', showJobType: false },
  { id: 'maintenance_section', label: 'Maintenance Section', showJobType: false },
]

function initialForm(category) {
  return {
    setting_id: null,
    category,
    code: '',
    description: '',
    job_type: '',
    model_group: '',
    setting_type: 'string',
  }
}

function parseModelMeta(rawDescription) {
  if (!rawDescription) return { model_group: '', job_type: '' }
  try {
    const parsed = JSON.parse(rawDescription)
    return {
      model_group: (parsed?.model_group || '').toString(),
      job_type: (parsed?.job_type || '').toString(),
    }
  } catch {
    return { model_group: '', job_type: '' }
  }
}

export default function VehicleModelSetup() {
  const [tab, setTab] = useState(TABS[0].id)
  const [rows, setRows] = useState([])
  const [jobTypes, setJobTypes] = useState([])
  const [modelGroups, setModelGroups] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState(initialForm(TABS[0].id))

  const tabMeta = useMemo(() => TABS.find((t) => t.id === tab) || TABS[0], [tab])

  const load = async (category = tab) => {
    setLoading(true)
    setError('')
    try {
      const [r, jt, mg] = await Promise.all([
        systemSettingsApi.list({ category, limit: 500 }),
        systemSettingsApi.list({ category: 'job_type', limit: 500 }),
        systemSettingsApi.list({ category: 'vehicle_model_group', limit: 500 }),
      ])
      setRows(r.data || [])
      setJobTypes(jt.data || [])
      setModelGroups(mg.data || [])
    } catch (e) {
      console.error(e)
      setError('Failed to load vehicle model setup values.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setForm(initialForm(tab))
    load(tab)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  const onEdit = (row) => {
    const modelMeta = tabMeta.showModelGroupAndJobType ? parseModelMeta(row.description) : { model_group: '', job_type: '' }
    setForm({
      setting_id: row.setting_id,
      category: row.category || tab,
      code: row.setting_key || '',
      description: row.setting_value || '',
      job_type: tabMeta.showJobType ? (row.description || '') : modelMeta.job_type,
      model_group: tabMeta.showModelGroupAndJobType ? modelMeta.model_group : '',
      setting_type: row.setting_type || 'string',
    })
    setError('')
    setSuccess('')
  }

  const onDelete = async (settingId) => {
    if (!window.confirm('Delete this record?')) return
    setError('')
    setSuccess('')
    try {
      await systemSettingsApi.remove(settingId)
      await load(tab)
      setSuccess('Record deleted.')
    } catch (e) {
      console.error(e)
      setError('Delete failed.')
    }
  }

  const onSave = async () => {
    if (!form.code.trim()) {
      setError('Code is required.')
      return
    }
    if (!form.description.trim()) {
      setError('Description is required.')
      return
    }
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const modelMetaJson = tabMeta.showModelGroupAndJobType
        ? JSON.stringify({
            model_group: (form.model_group || '').trim(),
            job_type: (form.job_type || '').trim(),
          })
        : null
      const payload = {
        setting_key: form.code.trim(),
        setting_value: form.description.trim(),
        setting_type: form.setting_type || 'string',
        category: tab,
        description: tabMeta.showJobType ? (form.job_type || null) : (tabMeta.showModelGroupAndJobType ? modelMetaJson : null),
      }
      if (form.setting_id) {
        await systemSettingsApi.update(form.setting_id, payload)
      } else {
        await systemSettingsApi.create(payload)
      }
      await load(tab)
      setForm(initialForm(tab))
      setSuccess('Saved.')
    } catch (e) {
      console.error(e)
      setError(e?.response?.data?.detail || 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Vehicle Model Setup</h1>
          <p className="text-sm text-gray-600">
            Setup model groups, models, repair sections and maintenance sections used by garage operations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-blue-700 hidden sm:inline">Ready</span>
          <Button type="button" variant="outline" onClick={() => setForm(initialForm(tab))}>Add New Record</Button>
          <Button type="button" variant="outline" onClick={() => window.print()}>Print Preview</Button>
          <Button type="button" variant="outline" onClick={() => load(tab)}>Refresh</Button>
        </div>
      </div>

      {error && <div className="rounded border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">{error}</div>}
      {success && <div className="rounded border border-green-200 bg-green-50 text-green-700 px-3 py-2 text-sm">{success}</div>}

      {tab === 'car_model' && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <p className="font-semibold text-slate-900">Model Setup Guidance</p>
          <p className="mt-1">
            Use this tab to maintain model codes and descriptions, then map each model to a model group and job type.
          </p>
        </div>
      )}
      {tab === 'repair_section' && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <p className="font-semibold text-slate-900">Repair Section Setup Guidance</p>
          <p className="mt-1">
            Use this tab to maintain repair section definitions used during job order processing and related pricing logic.
          </p>
        </div>
      )}

      <div className="bg-white border rounded-lg shadow-sm">
        <div className="flex flex-wrap border-b bg-slate-50/80">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px ${
                tab === t.id ? 'border-indigo-600 text-indigo-700 bg-white' : 'border-transparent text-gray-600'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 border rounded p-3 bg-slate-50/60">
            <label className="text-xs">
              <span className="text-gray-600">Code</span>
              <input
                className="w-full mt-1 border rounded px-2 py-1.5 text-sm disabled:bg-gray-100"
                value={form.code}
                disabled={!!form.setting_id}
                onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
                placeholder="e.g. SZ01"
              />
            </label>
            <label className="text-xs">
              <span className="text-gray-600">Description</span>
              <input
                className="w-full mt-1 border rounded px-2 py-1.5 text-sm"
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="e.g. Suzuki Alto"
              />
            </label>
            {tabMeta.showJobType ? (
              <label className="text-xs">
                <span className="text-gray-600">Job Type</span>
                <select
                  className="w-full mt-1 border rounded px-2 py-1.5 text-sm"
                  value={form.job_type}
                  onChange={(e) => setForm((p) => ({ ...p, job_type: e.target.value }))}
                >
                  <option value="">Select job type</option>
                  {jobTypes.map((j) => (
                    <option key={j.setting_id} value={j.setting_value || j.setting_key}>
                      {j.setting_value || j.setting_key}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <div />
            )}
            {tabMeta.showModelGroupAndJobType ? (
              <>
                <label className="text-xs">
                  <span className="text-gray-600">Model Group</span>
                  <select
                    className="w-full mt-1 border rounded px-2 py-1.5 text-sm"
                    value={form.model_group}
                    onChange={(e) => setForm((p) => ({ ...p, model_group: e.target.value }))}
                  >
                    <option value="">Select model group</option>
                    {modelGroups.map((m) => (
                      <option key={m.setting_id} value={m.setting_value || m.setting_key}>
                        {m.setting_value || m.setting_key}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs">
                  <span className="text-gray-600">Job Type</span>
                  <select
                    className="w-full mt-1 border rounded px-2 py-1.5 text-sm"
                    value={form.job_type}
                    onChange={(e) => setForm((p) => ({ ...p, job_type: e.target.value }))}
                  >
                    <option value="">Select job type</option>
                    {jobTypes.map((j) => (
                      <option key={j.setting_id} value={j.setting_value || j.setting_key}>
                        {j.setting_value || j.setting_key}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            ) : null}
            <div className="flex items-end gap-2">
              <Button type="button" onClick={onSave} disabled={saving || loading}>
                {saving ? 'Saving…' : (form.setting_id ? 'Update' : 'Save')}
              </Button>
              {form.setting_id && (
                <Button type="button" variant="outline" onClick={() => setForm(initialForm(tab))}>
                  Clear
                </Button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto border rounded">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 text-xs text-gray-600 uppercase">
                <tr>
                  <th className="px-2 py-2 text-left">No</th>
                  <th className="px-2 py-2 text-left">{tabMeta.label}</th>
                  <th className="px-2 py-2 text-left">Description</th>
                  {tabMeta.showJobType && <th className="px-2 py-2 text-left">Job Type</th>}
                  {tabMeta.showModelGroupAndJobType && (
                    <>
                      <th className="px-2 py-2 text-left">Model Group</th>
                      <th className="px-2 py-2 text-left">Job Type</th>
                    </>
                  )}
                  <th className="px-2 py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={tabMeta.showJobType ? 5 : (tabMeta.showModelGroupAndJobType ? 7 : 4)}
                      className="px-3 py-6 text-center text-gray-500"
                    >
                      {loading ? 'Loading…' : 'No records yet.'}
                    </td>
                  </tr>
                ) : (
                  rows.map((r, idx) => (
                    <tr key={r.setting_id} className="border-t">
                      {(() => {
                        const modelMeta = tabMeta.showModelGroupAndJobType ? parseModelMeta(r.description) : null
                        return (
                          <>
                      <td className="px-2 py-2">{idx + 1}</td>
                      <td className="px-2 py-2 font-mono">{r.setting_key}</td>
                      <td className="px-2 py-2">{r.setting_value || '-'}</td>
                      {tabMeta.showJobType && <td className="px-2 py-2">{r.description || '-'}</td>}
                      {tabMeta.showModelGroupAndJobType && (
                        <>
                          <td className="px-2 py-2">{modelMeta?.model_group || '-'}</td>
                          <td className="px-2 py-2">{modelMeta?.job_type || '-'}</td>
                        </>
                      )}
                      <td className="px-2 py-2 text-right">
                        <div className="inline-flex gap-2">
                          <Button type="button" size="sm" variant="outline" onClick={() => onEdit(r)}>Edit</Button>
                          <Button type="button" size="sm" variant="destructive" onClick={() => onDelete(r.setting_id)}>Delete</Button>
                        </div>
                      </td>
                          </>
                        )
                      })()}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

