import { useEffect, useMemo, useState } from 'react'
import { systemSettingsApi } from '../services/api'
import { Button } from '@/components/ui/button'
import SetupScreenFrame from './SetupScreenFrame'

const SEEDED_TYPES = [
  { value: 'repair_service_type', label: 'Repair / Service type' },
  { value: 'garage_invoice_type', label: 'Garage invoice types' },
  { value: 'vehicle_make_in', label: 'Vehicle Make-in' },
  { value: 'car_make', label: 'Car Make' },
  { value: 'model_type', label: 'Model types' },
  { value: 'car_model', label: 'Car Model' },
  { value: 'clock_out_reason', label: 'Clock Out Reason' },
  { value: 'company_vehicle_setup', label: 'Company Vehicle Setup' },
  { value: 'country_of_origin', label: 'Country Of Origin' },
  { value: 'garage_location', label: 'Garage Location' },
  { value: 'types_of_jobs', label: 'Types of Jobs' },
  { value: 'repair_section', label: 'Repair Section' },
  { value: 'job_type', label: 'Job Type' },
  { value: 'vehicle_class', label: 'Vehicle Class' },
  { value: 'job_card_receiver', label: 'Job card receiver' },
]

const TYPE_FORM_CONFIG = {
  repair_service_type: {
    keyLabel: 'Service type id/code',
    keyPlaceholder: 'e.g. SRV-01',
    valueLabel: 'Service type description',
    valuePlaceholder: 'e.g. Auto Service',
    descriptionLabel: 'Company/other supply rates and notes',
  },
  garage_invoice_type: {
    keyLabel: 'Invoice type code',
    keyPlaceholder: 'e.g. CASH',
    valueLabel: 'Invoice type',
    valuePlaceholder: 'e.g. Cash / Credit / Internal',
    descriptionLabel: 'Notes',
  },
  vehicle_make_in: {
    keyLabel: 'Make code',
    keyPlaceholder: 'e.g. TOY',
    valueLabel: 'Vehicle make',
    valuePlaceholder: 'e.g. Toyota',
    descriptionLabel: 'Notes',
  },
  car_make: {
    keyLabel: 'Make code',
    keyPlaceholder: 'e.g. TOY',
    valueLabel: 'Make name',
    valuePlaceholder: 'e.g. Toyota',
    descriptionLabel: 'Notes',
  },
  car_model: {
    keyLabel: 'Model code',
    keyPlaceholder: 'e.g. COROLLA',
    valueLabel: 'Model name',
    valuePlaceholder: 'e.g. Corolla',
    descriptionLabel: 'Make / notes',
  },
  model_type: {
    keyLabel: 'Model type code',
    keyPlaceholder: 'e.g. AT380T38H',
    valueLabel: 'Model description',
    valuePlaceholder: 'e.g. TRAKKER',
    descriptionLabel: 'Model group / applicable job types',
  },
  clock_out_reason: {
    keyLabel: 'Reason code',
    keyPlaceholder: 'e.g. BRK',
    valueLabel: 'Reason',
    valuePlaceholder: 'e.g. Lunch Break',
    descriptionLabel: 'Notes',
  },
  company_vehicle_setup: {
    keyLabel: 'Vehicle tag',
    keyPlaceholder: 'e.g. CMV-001',
    valueLabel: 'Description',
    valuePlaceholder: 'e.g. Internal Service Car',
    descriptionLabel: 'Owner department / notes',
  },
  country_of_origin: {
    keyLabel: 'Country code',
    keyPlaceholder: 'e.g. ET',
    valueLabel: 'Country name',
    valuePlaceholder: 'e.g. Ethiopia',
    descriptionLabel: 'Notes',
  },
  garage_location: {
    keyLabel: 'Location code',
    keyPlaceholder: 'e.g. BOL01',
    valueLabel: 'Location name',
    valuePlaceholder: 'e.g. Bole Main Garage',
    descriptionLabel: 'Address / notes',
  },
  types_of_jobs: {
    keyLabel: 'Job type code',
    keyPlaceholder: 'e.g. 1',
    valueLabel: 'Job type name',
    valuePlaceholder: 'e.g. Auto Service',
    descriptionLabel: 'Productivity group / notes',
  },
  repair_section: {
    keyLabel: 'Section code',
    keyPlaceholder: 'e.g. ENG',
    valueLabel: 'Section name',
    valuePlaceholder: 'e.g. Engine Section',
    descriptionLabel: 'Work unit / notes',
  },
  job_type: {
    keyLabel: 'Job type code',
    keyPlaceholder: 'e.g. 9',
    valueLabel: 'Job type name',
    valuePlaceholder: 'e.g. Assembly',
    descriptionLabel: 'Productivity group / notes',
  },
  vehicle_class: {
    keyLabel: 'Class code',
    keyPlaceholder: 'e.g. SUV',
    valueLabel: 'Class name',
    valuePlaceholder: 'e.g. Sport Utility Vehicle',
    descriptionLabel: 'Notes',
  },
  job_card_receiver: {
    keyLabel: 'Receiver id/code',
    keyPlaceholder: 'e.g. 1',
    valueLabel: 'Receiver full name',
    valuePlaceholder: 'e.g. Shimelis',
    descriptionLabel: 'Notes',
  },
}

const TYPE_KEY_PREFIX = {
  repair_service_type: 'RST',
  garage_invoice_type: 'GIT',
  vehicle_make_in: 'VMI',
  car_make: 'MK',
  model_type: 'MT',
  car_model: 'MD',
  clock_out_reason: 'CR',
  company_vehicle_setup: 'CV',
  country_of_origin: 'CO',
  garage_location: 'GL',
  types_of_jobs: 'TOJ',
  repair_section: 'RS',
  job_type: 'JT',
  vehicle_class: 'VC',
  job_card_receiver: 'JCR',
}

const ESTIMATION_PARAM_CATEGORY = 'estimation_application_parameters'
const ESTIMATION_PARAM_KEY = 'default'
const DEFAULT_ESTIMATION_PARAMS = {
  advance_payment_percentage: '50',
  advance_payment_if_exceeds: '2000',
  advance_required_within_days: '5',
  parking_fee_per_day: '50',
  parking_fee_will_start_from: 'CompletionNotice',
}

export default function GlobalParameters() {
  const [allSettings, setAllSettings] = useState([])
  const [selectedType, setSelectedType] = useState('car_model')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({
    setting_id: null,
    setting_key: '',
    setting_value: '',
    description: '',
    setting_type: 'string',
  })
  const [estimationSettingId, setEstimationSettingId] = useState(null)
  const [estimationForm, setEstimationForm] = useState(() => ({ ...DEFAULT_ESTIMATION_PARAMS }))
  const [estimationSaving, setEstimationSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await systemSettingsApi.list({ limit: 1000 })
      const rows = res.data || []
      setAllSettings(rows)
      const est = rows.find((r) => r.category === ESTIMATION_PARAM_CATEGORY && r.setting_key === ESTIMATION_PARAM_KEY)
      setEstimationSettingId(est?.setting_id || null)
      if (est?.setting_value) {
        try {
          const parsed = JSON.parse(est.setting_value)
          setEstimationForm({ ...DEFAULT_ESTIMATION_PARAMS, ...(parsed || {}) })
        } catch {
          setEstimationForm({ ...DEFAULT_ESTIMATION_PARAMS })
        }
      } else {
        setEstimationForm({ ...DEFAULT_ESTIMATION_PARAMS })
      }
    } catch (e) {
      console.error(e)
      setError('Failed to load global parameters.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const dynamicTypes = useMemo(() => {
    const set = new Set()
    for (const s of allSettings) {
      if (s?.category) set.add(s.category)
    }
    return Array.from(set).sort().map((v) => ({ value: v, label: v.replaceAll('_', ' ') }))
  }, [allSettings])

  const parameterTypes = useMemo(() => {
    const map = new Map()
    for (const t of SEEDED_TYPES) map.set(t.value, t)
    for (const t of dynamicTypes) if (!map.has(t.value)) map.set(t.value, t)
    return Array.from(map.values())
  }, [dynamicTypes])

  useEffect(() => {
    if (!parameterTypes.find((t) => t.value === selectedType) && parameterTypes[0]) {
      setSelectedType(parameterTypes[0].value)
    }
  }, [parameterTypes, selectedType])

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (allSettings || [])
      .filter((s) => (selectedType ? s.category === selectedType : true))
      .filter((s) => {
        if (!q) return true
        return (
          String(s.setting_key || '').toLowerCase().includes(q) ||
          String(s.setting_value || '').toLowerCase().includes(q) ||
          String(s.description || '').toLowerCase().includes(q)
        )
      })
      .sort((a, b) => String(a.setting_key || '').localeCompare(String(b.setting_key || '')))
  }, [allSettings, selectedType, search])

  const formConfig = useMemo(() => {
    const fallbackName = (selectedType || 'parameter').replaceAll('_', ' ')
    return (
      TYPE_FORM_CONFIG[selectedType] || {
        keyLabel: `${fallbackName} key`,
        keyPlaceholder: 'e.g. CODE01',
        valueLabel: `${fallbackName} value`,
        valuePlaceholder: 'e.g. Display value',
        descriptionLabel: 'Description',
      }
    )
  }, [selectedType])

  const generateSettingKey = () => {
    const prefix = TYPE_KEY_PREFIX[selectedType] || 'PRM'
    const used = new Set(
      (allSettings || [])
        .filter((s) => s.category === selectedType)
        .map((s) => String(s.setting_key || '').toUpperCase())
    )
    let seq = 1
    while (used.has(`${prefix}-${String(seq).padStart(3, '0')}`)) seq += 1
    return `${prefix}-${String(seq).padStart(3, '0')}`
  }

  const resetForm = () => {
    setForm({
      setting_id: null,
      setting_key: generateSettingKey(),
      setting_value: '',
      description: '',
      setting_type: 'string',
    })
  }

  const onEdit = (row) => {
    setForm({
      setting_id: row.setting_id,
      setting_key: row.setting_key || '',
      setting_value: row.setting_value || '',
      description: row.description || '',
      setting_type: row.setting_type || 'string',
    })
    setSuccess('')
    setError('')
  }

  const onSave = async (e) => {
    e.preventDefault()
    if (!selectedType) {
      setError('Select a parameter type first.')
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
          description: form.description || null,
          category: selectedType,
        })
      } else {
        await systemSettingsApi.create({
          setting_key: form.setting_key.trim(),
          setting_value: form.setting_value || null,
          setting_type: form.setting_type || 'string',
          description: form.description || null,
          category: selectedType,
        })
      }
      await load()
      resetForm()
      setSuccess('Saved.')
    } catch (e) {
      console.error(e)
      setError(e?.response?.data?.detail || 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  const onDelete = async (id) => {
    if (!window.confirm('Delete this parameter value?')) return
    setError('')
    setSuccess('')
    try {
      await systemSettingsApi.remove(id)
      await load()
      setSuccess('Deleted.')
    } catch (e) {
      console.error(e)
      setError('Delete failed.')
    }
  }

  const onEstimationNew = () => {
    setEstimationForm({ ...DEFAULT_ESTIMATION_PARAMS })
    setSuccess('')
    setError('')
  }

  const onSaveEstimationParams = async () => {
    setEstimationSaving(true)
    setError('')
    setSuccess('')
    try {
      const payload = {
        setting_key: ESTIMATION_PARAM_KEY,
        setting_value: JSON.stringify({
          advance_payment_percentage: String(estimationForm.advance_payment_percentage || '').trim(),
          advance_payment_if_exceeds: String(estimationForm.advance_payment_if_exceeds || '').trim(),
          advance_required_within_days: String(estimationForm.advance_required_within_days || '').trim(),
          parking_fee_per_day: String(estimationForm.parking_fee_per_day || '').trim(),
          parking_fee_will_start_from: String(estimationForm.parking_fee_will_start_from || '').trim(),
        }),
        setting_type: 'json',
        description: 'Global parameters for estimations',
        category: ESTIMATION_PARAM_CATEGORY,
      }
      if (estimationSettingId) await systemSettingsApi.update(estimationSettingId, payload)
      else await systemSettingsApi.create(payload)
      await load()
      setSuccess('Estimation application parameters saved.')
    } catch (e) {
      console.error(e)
      setError(e?.response?.data?.detail || 'Failed to save estimation application parameters.')
    } finally {
      setEstimationSaving(false)
    }
  }

  useEffect(() => {
    if (form.setting_id) return
    setForm((prev) => ({
      ...prev,
      setting_key: generateSettingKey(),
    }))
    // intentionally tracks selectedType/allSettings so key refreshes by category state
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedType, allSettings])

  return (
    <SetupScreenFrame
      title="Global Parameters"
      subtitle="HillMaster-style global parameters: maintain lookup values (makes, models, job types, garage locations, repair sections, and more) used by dropdowns and validation across the system."
      reviewPoints={[
        'Add or rename job types here before assigning them under Job type allowed by user.',
        'Garage locations and repair sections should match how bays are labeled on the shop floor.',
        'After bulk imports, search each category once to catch duplicates or blank display values.',
      ]}
      relatedLinks={[
        { to: '/job-type-allowed-by-user', label: 'Job type allowed by user' },
        { to: '/system-settings', label: 'System settings' },
        { to: '/setup', label: 'Setup hub' },
      ]}
      actions={
        <>
          <span className="text-sm text-blue-700 hidden sm:inline self-center">Ready</span>
          <Button type="button" variant="outline" onClick={resetForm}>
            New
          </Button>
          <Button type="button" variant="outline" onClick={load}>
            Refresh
          </Button>
        </>
      }
    >
      <div className="space-y-4">
      {error && <div className="rounded border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">{error}</div>}
      {success && <div className="rounded border border-green-200 bg-green-50 text-green-700 px-3 py-2 text-sm">{success}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white border rounded-lg shadow-sm p-3">
          <div className="text-xs font-semibold text-gray-500 mb-2">Parameter type</div>
          <div className="max-h-[520px] overflow-y-auto space-y-1">
            {parameterTypes.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setSelectedType(t.value)}
                className={`w-full text-left px-2 py-1.5 rounded text-sm ${
                  selectedType === t.value ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'hover:bg-gray-50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white border rounded-lg shadow-sm p-3 lg:col-span-2 space-y-3">
          <div className="flex flex-wrap gap-2 items-end">
            <div className="text-sm font-medium text-gray-700">
              {selectedType ? `Values for: ${selectedType}` : 'Values'}
            </div>
            <input
              type="text"
              className="border rounded px-2 py-1 text-sm ml-auto"
              placeholder="Search values..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <form onSubmit={onSave} className="grid grid-cols-1 md:grid-cols-2 gap-3 border rounded p-3 bg-slate-50/60">
            <label className="text-xs">
              <span className="text-gray-600">{formConfig.keyLabel}</span>
              <input
                className="w-full mt-1 border rounded px-2 py-1.5 text-sm disabled:bg-gray-100"
                value={form.setting_key}
                disabled={!!form.setting_id}
                onChange={(e) => setForm((p) => ({ ...p, setting_key: e.target.value }))}
                placeholder={formConfig.keyPlaceholder}
              />
              {!form.setting_id && (
                <button
                  type="button"
                  className="mt-1 text-[11px] text-indigo-600 hover:text-indigo-800"
                  onClick={() => setForm((p) => ({ ...p, setting_key: generateSettingKey() }))}
                >
                  Generate code
                </button>
              )}
            </label>
            <label className="text-xs">
              <span className="text-gray-600">{formConfig.valueLabel}</span>
              <input
                className="w-full mt-1 border rounded px-2 py-1.5 text-sm"
                value={form.setting_value}
                onChange={(e) => setForm((p) => ({ ...p, setting_value: e.target.value }))}
                placeholder={formConfig.valuePlaceholder}
              />
            </label>
            <label className="text-xs">
              <span className="text-gray-600">Type</span>
              <input
                className="w-full mt-1 border rounded px-2 py-1.5 text-sm"
                value={form.setting_type}
                onChange={(e) => setForm((p) => ({ ...p, setting_type: e.target.value }))}
                placeholder="string"
              />
            </label>
            <label className="text-xs">
              <span className="text-gray-600">{formConfig.descriptionLabel}</span>
              <input
                className="w-full mt-1 border rounded px-2 py-1.5 text-sm"
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              />
            </label>
            <div className="md:col-span-2 flex gap-2">
              <Button type="submit" disabled={saving}>{saving ? 'Saving…' : (form.setting_id ? 'Update' : 'Add new record')}</Button>
              <Button type="button" variant="outline" onClick={resetForm}>Clear</Button>
            </div>
          </form>

          <div className="overflow-x-auto border rounded">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 text-xs text-gray-600 uppercase">
                <tr>
                  <th className="px-2 py-2 text-left">Parameter key</th>
                  <th className="px-2 py-2 text-left">Description</th>
                  <th className="px-2 py-2 text-left">Parameter value</th>
                  <th className="px-2 py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-6 text-center text-gray-500">
                      {loading ? 'Loading…' : 'No values in this parameter type.'}
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.setting_id} className="border-t">
                      <td className="px-2 py-2 font-mono text-xs">{r.setting_key}</td>
                      <td className="px-2 py-2">{r.description || '-'}</td>
                      <td className="px-2 py-2">{r.setting_value || '-'}</td>
                      <td className="px-2 py-2 text-right">
                        <div className="inline-flex gap-2">
                          <Button type="button" size="sm" variant="outline" onClick={() => onEdit(r)}>Edit</Button>
                          <Button type="button" size="sm" variant="destructive" onClick={() => onDelete(r.setting_id)}>Delete</Button>
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
      </div>
    </SetupScreenFrame>
  )
}

