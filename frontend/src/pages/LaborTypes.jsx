import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { laborPriceListsApi, laborTypesApi, systemSettingsApi } from '../services/api'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import SetupScreenFrame from './SetupScreenFrame'

function blankForm() {
  return {
    labor_code: '',
    labor_type_name: '',
    taxable: true,
    section: '',
    allowed_for: '',
    sub_category: '',
    hourly_rate: '',
    price_list_type: '',
    is_active: true,
  }
}

export default function LaborTypes() {
  const queryClient = useQueryClient()
  const [selectedId, setSelectedId] = useState('')
  const [form, setForm] = useState(blankForm())
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [mgType, setMgType] = useState('')
  const [stdHours, setStdHours] = useState('')
  const [chargeAmt, setChargeAmt] = useState('')
  const [mfcHours, setMfcHours] = useState('')
  const [compHours, setCompHours] = useState('')

  const laborQuery = useQuery({
    queryKey: ['laborTypes', { active_only: false, page: 'laborTypes' }],
    queryFn: () => laborTypesApi.list({ active_only: false }),
  })
  const settingsQuery = useQuery({
    queryKey: ['laborTypeScreenLookups'],
    queryFn: async () => {
      const [sections, jobs, subs, modelGroups, priceLists] = await Promise.all([
        systemSettingsApi.list({ category: 'repair_section', limit: 500 }),
        systemSettingsApi.list({ category: 'job_type', limit: 500 }),
        systemSettingsApi.list({ category: 'maintenance_section', limit: 500 }),
        systemSettingsApi.list({ category: 'vehicle_model_group', limit: 500 }),
        laborPriceListsApi.list({ active_only: true }),
      ])
      return {
        sections: sections.data || [],
        jobs: jobs.data || [],
        subs: subs.data || [],
        modelGroups: modelGroups.data || [],
        priceLists: priceLists.data || [],
      }
    },
  })

  const rows = useMemo(() => laborQuery.data?.data || [], [laborQuery.data])
  const selected = useMemo(() => {
    const id = Number(selectedId)
    if (!Number.isFinite(id) || id <= 0) return null
    return rows.find((r) => r.labor_type_id === id) || null
  }, [selectedId, rows])

  const modelGroupRatesQuery = useQuery({
    queryKey: ['laborTypeModelGroupRates', selected?.labor_type_id || null],
    queryFn: () => laborTypesApi.listModelGroupRates(selected.labor_type_id),
    enabled: !!selected?.labor_type_id,
  })
  const modelRates = useMemo(() => modelGroupRatesQuery.data?.data || [], [modelGroupRatesQuery.data])

  useEffect(() => {
    if (!selected) {
      setForm(blankForm())
      return
    }
    setForm({
      labor_code: selected.labor_code || '',
      labor_type_name: selected.labor_type_name || '',
      taxable: selected.taxable !== false,
      section: selected.section || '',
      allowed_for: selected.allowed_for || '',
      sub_category: selected.sub_category || '',
      hourly_rate: String(selected.hourly_rate ?? ''),
      price_list_type: selected.price_list_type || '',
      is_active: selected.is_active !== false,
    })
  }, [selected])

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        labor_code: (form.labor_code || '').trim() || null,
        labor_type_name: (form.labor_type_name || '').trim(),
        taxable: !!form.taxable,
        section: (form.section || '').trim() || null,
        allowed_for: (form.allowed_for || '').trim() || null,
        sub_category: (form.sub_category || '').trim() || null,
        hourly_rate: Number(form.hourly_rate),
        price_list_type: (form.price_list_type || '').trim() || null,
        is_active: !!form.is_active,
      }
      if (!payload.labor_type_name) throw new Error('Description is required.')
      if (!Number.isFinite(payload.hourly_rate) || payload.hourly_rate < 0) {
        throw new Error('Rate/Hour must be a non-negative number.')
      }
      if (selected?.labor_type_id) return laborTypesApi.update(selected.labor_type_id, payload)
      return laborTypesApi.create(payload)
    },
    onMutate: () => {
      setError('')
      setSuccess('')
    },
    onSuccess: async (res) => {
      await queryClient.invalidateQueries({ queryKey: ['laborTypes'] })
      const newId = res?.data?.labor_type_id
      if (newId) setSelectedId(String(newId))
      setSuccess(selected ? 'Updated.' : 'Saved.')
    },
    onError: (e) => setError(e?.response?.data?.detail || e?.message || 'Save failed.'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => laborTypesApi.update(selected.labor_type_id, { is_active: false }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['laborTypes'] })
      setSuccess('Marked as inactive.')
      setForm((f) => ({ ...f, is_active: false }))
    },
  })

  const addRateMutation = useMutation({
    mutationFn: () => {
      if (!selected?.labor_type_id) throw new Error('Save labor type first.')
      const payload = {
        model_group_type: (mgType || '').trim(),
        std_hours: Number(stdHours || 0),
        charge_amount: Number(chargeAmt || 0),
        mfc_hours: Number(mfcHours || 0),
        job_comp_hours: Number(compHours || 0),
      }
      if (!payload.model_group_type) throw new Error('Model group type is required.')
      for (const [k, v] of Object.entries(payload)) {
        if (k === 'model_group_type') continue
        if (!Number.isFinite(v) || v < 0) throw new Error(`${k} must be non-negative.`)
      }
      return laborTypesApi.createModelGroupRate(selected.labor_type_id, payload)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['laborTypeModelGroupRates', selected?.labor_type_id || null] })
      setMgType('')
      setStdHours('')
      setChargeAmt('')
      setMfcHours('')
      setCompHours('')
      setSuccess('Model group row added.')
    },
    onError: (e) => setError(e?.response?.data?.detail || e?.message || 'Add failed.'),
  })

  const applyAllMutation = useMutation({
    mutationFn: () => {
      if (!selected?.labor_type_id) throw new Error('Save labor type first.')
      return laborTypesApi.applyAllModelGroups(selected.labor_type_id, {
        model_group_type: '__all__',
        std_hours: Number(stdHours || 0),
        charge_amount: Number(chargeAmt || 0),
        mfc_hours: Number(mfcHours || 0),
        job_comp_hours: Number(compHours || 0),
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['laborTypeModelGroupRates', selected?.labor_type_id || null] })
      setSuccess('Applied to all model groups.')
    },
    onError: (e) => setError(e?.response?.data?.detail || e?.message || 'Apply-all failed.'),
  })

  const deleteRate = async (rateId) => {
    if (!selected?.labor_type_id) return
    if (!window.confirm('Delete this model group row?')) return
    setError('')
    try {
      await laborTypesApi.deleteModelGroupRate(selected.labor_type_id, rateId)
      await queryClient.invalidateQueries({ queryKey: ['laborTypeModelGroupRates', selected?.labor_type_id || null] })
      setSuccess('Row deleted.')
    } catch (e) {
      setError(e?.response?.data?.detail || 'Delete failed.')
    }
  }

  const lookups = settingsQuery.data || { sections: [], jobs: [], subs: [], modelGroups: [], priceLists: [] }
  const modelGroupOptions = useMemo(() => {
    const map = new Map()
    for (const x of lookups.modelGroups || []) {
      const v = String(x?.setting_value || x?.setting_key || x?.description || '').trim()
      if (!v) continue
      if (!map.has(v.toLowerCase())) map.set(v.toLowerCase(), v)
    }
    return Array.from(map.values())
  }, [lookups.modelGroups])
  const status = laborQuery.isLoading || settingsQuery.isLoading ? 'Loading…' : 'Ready'

  return (
    <SetupScreenFrame
      hubTo="/maintenance-hub"
      hubLabel="Maintenance"
      title="Labour Rate Maintenance"
      subtitle="Maintain operation codes and assign model-group specific standard/charge/MFC/completion hours."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-blue-700">{status}</span>
          <Button type="button" variant="outline" onClick={() => window.print()}>
            Print Preview
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              laborQuery.refetch()
              settingsQuery.refetch()
              modelGroupRatesQuery.refetch()
            }}
          >
            Refresh
          </Button>
        </div>
      }
    >
      {error && <div className="rounded border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">{error}</div>}
      {success && <div className="rounded border border-green-200 bg-green-50 text-green-700 px-3 py-2 text-sm">{success}</div>}

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        <p className="font-semibold text-slate-900">Labour Rate Maintenance Guidance</p>
        <ul className="mt-2 list-disc pl-5 space-y-1">
          <li><strong>Labor code:</strong> assign a code for the labor type/operation you create.</li>
          <li><strong>Taxable:</strong> tick if this labor type is subject to VAT.</li>
          <li><strong>Section:</strong> select where this labor type applies.</li>
          <li><strong>Description:</strong> enter the labor code description.</li>
          <li><strong>Allowed for:</strong> choose the operation/job type where this labor type can be used.</li>
          <li><strong>Sub category:</strong> choose the related labor sub category.</li>
          <li><strong>Rate/Hour:</strong> specify the per-hour charging rate.</li>
        </ul>
      </div>

      <div className="bg-white border rounded-lg shadow-sm p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className="text-sm space-y-1">
            <div className="font-medium text-gray-800">Labour Code</div>
            <Input value={form.labor_code} onChange={(e) => setForm((f) => ({ ...f, labor_code: e.target.value }))} />
          </label>
          <label className="text-sm space-y-1 md:col-span-2">
            <div className="font-medium text-gray-800">Description</div>
            <Input value={form.labor_type_name} onChange={(e) => setForm((f) => ({ ...f, labor_type_name: e.target.value }))} />
          </label>
          <label className="text-sm space-y-1">
            <div className="font-medium text-gray-800">Allowed For</div>
            <select
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={form.allowed_for}
              onChange={(e) => setForm((f) => ({ ...f, allowed_for: e.target.value }))}
            >
              <option value="">Select...</option>
              {lookups.jobs.map((x) => (
                <option key={x.setting_id} value={x.setting_value || x.setting_key}>
                  {x.setting_value || x.setting_key}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm space-y-1">
            <div className="font-medium text-gray-800">Section</div>
            <select
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={form.section}
              onChange={(e) => setForm((f) => ({ ...f, section: e.target.value }))}
            >
              <option value="">Select...</option>
              {lookups.sections.map((x) => (
                <option key={x.setting_id} value={x.setting_value || x.setting_key}>
                  {x.setting_value || x.setting_key}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm space-y-1">
            <div className="font-medium text-gray-800">Rate/Hour</div>
            <Input value={form.hourly_rate} onChange={(e) => setForm((f) => ({ ...f, hourly_rate: e.target.value }))} />
          </label>
          <label className="text-sm space-y-1">
            <div className="font-medium text-gray-800">Sub Category</div>
            <select
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={form.sub_category}
              onChange={(e) => setForm((f) => ({ ...f, sub_category: e.target.value }))}
            >
              <option value="">Select...</option>
              {lookups.subs.map((x) => (
                <option key={x.setting_id} value={x.setting_value || x.setting_key}>
                  {x.setting_value || x.setting_key}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm space-y-1">
            <div className="font-medium text-gray-800">Price List Type</div>
            <select
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={form.price_list_type}
              onChange={(e) => setForm((f) => ({ ...f, price_list_type: e.target.value }))}
            >
              <option value="">Select...</option>
              {lookups.priceLists.map((x) => (
                <option key={x.labor_price_list_id} value={String(x.pl_id)}>
                  {x.pl_id} - {x.description}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.taxable}
                onChange={(e) => setForm((f) => ({ ...f, taxable: e.target.checked }))}
              />
              <span>Taxable</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.is_active === false}
                onChange={(e) => setForm((f) => ({ ...f, is_active: !e.target.checked }))}
              />
              <span>In Active</span>
            </label>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setSelectedId('')
              setForm(blankForm())
              setError('')
              setSuccess('')
            }}
          >
            New
          </Button>
          <Button type="button" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? 'Saving…' : 'Save'}
          </Button>
          <Button type="button" variant="destructive" disabled={!selected || deleteMutation.isPending} onClick={() => deleteMutation.mutate()}>
            Delete
          </Button>
        </div>

        <div className="border rounded overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-xs text-gray-600 uppercase">
              <tr>
                <th className="px-2 py-2 text-left">No</th>
                <th className="px-2 py-2 text-left">Labour Code</th>
                <th className="px-2 py-2 text-left">Description</th>
                <th className="px-2 py-2 text-left">Section</th>
                <th className="px-2 py-2 text-left">Allowed For</th>
                <th className="px-2 py-2 text-left">Rate/Hr</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => (
                <tr
                  key={r.labor_type_id}
                  className={`border-t cursor-pointer ${selected?.labor_type_id === r.labor_type_id ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}
                  onClick={() => setSelectedId(String(r.labor_type_id))}
                >
                  <td className="px-2 py-2">{idx + 1}</td>
                  <td className="px-2 py-2 font-mono">{r.labor_code || '-'}</td>
                  <td className="px-2 py-2">{r.labor_type_name}</td>
                  <td className="px-2 py-2">{r.section || '-'}</td>
                  <td className="px-2 py-2">{r.allowed_for || '-'}</td>
                  <td className="px-2 py-2">{Number(r.hourly_rate || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-900">
        The second part is where you assign the labor code to different model groups already maintained in the system.
      </div>

      <div className="bg-white border rounded-lg shadow-sm p-4 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="text-base font-semibold text-gray-900">Model Group Assignment</div>
          <div className="text-xs text-gray-500">{selected ? `Selected labor id: ${selected.labor_type_id}` : 'Select/save labor first'}</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
          <Input
            list="labor-model-group-options"
            className="md:col-span-2"
            value={mgType}
            onChange={(e) => setMgType(e.target.value)}
            placeholder={modelGroupOptions.length ? 'Model Group Type' : 'Type model group (no setup values found)'}
          />
          <datalist id="labor-model-group-options">
            {modelGroupOptions.map((v) => (
              <option key={v} value={v} />
            ))}
          </datalist>
          <Input value={stdHours} onChange={(e) => setStdHours(e.target.value)} placeholder="Hours Required" />
          <Input value={chargeAmt} onChange={(e) => setChargeAmt(e.target.value)} placeholder="Charge Amount" />
          <Input value={mfcHours} onChange={(e) => setMfcHours(e.target.value)} placeholder="MFC Hrs" />
          <Input value={compHours} onChange={(e) => setCompHours(e.target.value)} placeholder="Job Comp. Hrs" />
        </div>
        {!modelGroupOptions.length && (
          <div className="text-xs text-amber-700">
            No model groups found in settings category <span className="font-mono">vehicle_model_group</span>. You can still type a
            model group manually and add it.
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => addRateMutation.mutate()} disabled={!selected || addRateMutation.isPending}>
            Add
          </Button>
          <Button type="button" variant="outline" onClick={() => modelGroupRatesQuery.refetch()} disabled={!selected}>
            Refresh
          </Button>
          <Button type="button" variant="outline" onClick={() => applyAllMutation.mutate()} disabled={!selected || applyAllMutation.isPending}>
            Add For All Model Group
          </Button>
        </div>

        <div className="border rounded overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-xs text-gray-600 uppercase">
              <tr>
                <th className="px-2 py-2 text-left">Model Group</th>
                <th className="px-2 py-2 text-left">Std. Hours</th>
                <th className="px-2 py-2 text-left">Charge Amt</th>
                <th className="px-2 py-2 text-left">MFC Hour</th>
                <th className="px-2 py-2 text-left">Comp. Hour</th>
                <th className="px-2 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {!selected ? (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-gray-500">
                    Select a labor type to manage model-group rows.
                  </td>
                </tr>
              ) : modelRates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-gray-500">
                    No model-group rows yet.
                  </td>
                </tr>
              ) : (
                modelRates.map((r) => (
                  <tr key={r.labor_type_model_group_rate_id} className="border-t">
                    <td className="px-2 py-2">{r.model_group_type}</td>
                    <td className="px-2 py-2">{Number(r.std_hours || 0).toFixed(2)}</td>
                    <td className="px-2 py-2">{Number(r.charge_amount || 0).toFixed(2)}</td>
                    <td className="px-2 py-2">{Number(r.mfc_hours || 0).toFixed(2)}</td>
                    <td className="px-2 py-2">{Number(r.job_comp_hours || 0).toFixed(2)}</td>
                    <td className="px-2 py-2 text-right">
                      <Button type="button" size="sm" variant="destructive" onClick={() => deleteRate(r.labor_type_model_group_rate_id)}>
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </SetupScreenFrame>
  )
}
