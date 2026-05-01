import { useEffect, useMemo, useState } from 'react'
import { glAccountSetupApi, glApi } from '../services/api'
import { Button } from '@/components/ui/button'

const TAB_ITEMS = [
  { id: 'PARTS', label: 'Parts' },
  { id: 'FUEL_LUB', label: 'Fuel & Lub' },
  { id: 'LABOUR', label: 'Labour' },
  { id: 'MISCELLANEOUS', label: 'Miscellaneous' },
  { id: 'OTHER_CHARGE', label: 'Other Charge' },
  { id: 'SUB_LET', label: 'Sub Let' },
]

const emptyForm = (materialType = 'PARTS') => ({
  setup_id: null,
  material_type: materialType,
  parts_group_code: '',
  service_type_id: '',
  maintenance_section: '',
  job_type: '',
  garage_location: '',
  stock_account_id: '',
  wip_account_id: '',
  cgs_account_id: '',
  sales_account_id: '',
  discount_account_id: '',
  vat_account_id: '',
})

export default function GlAccountSetup() {
  const [tab, setTab] = useState('PARTS')
  const [form, setForm] = useState(emptyForm('PARTS'))
  const [rows, setRows] = useState([])
  const [accounts, setAccounts] = useState([])
  const [options, setOptions] = useState({
    part_groups: [],
    fuel_lub_types: [],
    labour_types: [],
    miscellaneous_types: [],
    other_charge_types: [],
    sub_let_types: [],
    service_types: [],
    maintenance_sections: [],
    job_types: [],
    locations: [],
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const accountNameById = useMemo(() => {
    const m = new Map()
    for (const a of accounts || []) m.set(Number(a.account_id), `${a.account_code} - ${a.account_name}`)
    return m
  }, [accounts])

  const load = async (materialType = tab) => {
    setLoading(true)
    setError('')
    try {
      const [o, a, r] = await Promise.all([
        glAccountSetupApi.options(),
        glApi.listAccounts({ include_inactive: false }),
        glAccountSetupApi.list({ material_type: materialType }),
      ])
      setOptions(o.data || {})
      setAccounts(a.data || [])
      setRows(r.data || [])
    } catch (e) {
      console.error(e)
      setError('Failed to load GL account setup data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(tab)
    setForm(emptyForm(tab))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  const setField = (key, value) => {
    setForm((p) => ({ ...p, [key]: value }))
    setSuccess('')
    setError('')
  }

  const parseId = (v) => {
    if (v === '' || v == null) return null
    return Number(v)
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const payload = {
        material_type: tab,
        parts_group_code: form.parts_group_code || null,
        service_type_id: parseId(form.service_type_id),
        maintenance_section: form.maintenance_section || null,
        job_type: form.job_type || null,
        garage_location: form.garage_location || null,
        stock_account_id: parseId(form.stock_account_id),
        wip_account_id: parseId(form.wip_account_id),
        cgs_account_id: parseId(form.cgs_account_id),
        sales_account_id: parseId(form.sales_account_id),
        discount_account_id: parseId(form.discount_account_id),
        vat_account_id: parseId(form.vat_account_id),
      }
      if (form.setup_id) {
        await glAccountSetupApi.update(form.setup_id, payload)
      } else {
        await glAccountSetupApi.create(payload)
      }
      await load(tab)
      setForm(emptyForm(tab))
      setSuccess('Saved.')
    } catch (e) {
      console.error(e)
      setError(e?.response?.data?.detail || 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  const editRow = (row) => {
    setForm({
      setup_id: row.setup_id,
      material_type: row.material_type,
      parts_group_code: row.parts_group_code || '',
      service_type_id: row.service_type_id != null ? String(row.service_type_id) : '',
      maintenance_section: row.maintenance_section || '',
      job_type: row.job_type || '',
      garage_location: row.garage_location || '',
      stock_account_id: row.stock_account_id != null ? String(row.stock_account_id) : '',
      wip_account_id: row.wip_account_id != null ? String(row.wip_account_id) : '',
      cgs_account_id: row.cgs_account_id != null ? String(row.cgs_account_id) : '',
      sales_account_id: row.sales_account_id != null ? String(row.sales_account_id) : '',
      discount_account_id: row.discount_account_id != null ? String(row.discount_account_id) : '',
      vat_account_id: row.vat_account_id != null ? String(row.vat_account_id) : '',
    })
    setSuccess('Loaded row for editing.')
  }

  const serviceTypeLabel = (id) => {
    const hit = (options.service_types || []).find((x) => Number(x.value) === Number(id))
    return hit?.label || (id ? `#${id}` : '-')
  }

  const scopeLabelByTab = {
    PARTS: 'Parts category',
    FUEL_LUB: 'Fuel & Lub type',
    LABOUR: 'Labour type',
    MISCELLANEOUS: 'Miscellaneous charge type',
    OTHER_CHARGE: 'Other charge type',
    SUB_LET: 'Sublet work type',
  }

  const scopeOptionsByTab = {
    PARTS: options.part_groups || [],
    FUEL_LUB: options.fuel_lub_types || [],
    LABOUR: options.labour_types || [],
    MISCELLANEOUS: options.miscellaneous_types || [],
    OTHER_CHARGE: options.other_charge_types || [],
    SUB_LET: options.sub_let_types || [],
  }

  const tabGuidanceByTab = {
    PARTS: 'Select a parts main/sub group and map Stock, WIP, CGS, Sales, Discount and VAT accounts.',
    FUEL_LUB: 'Select a Fuel & Lub maintenance type and assign the related finance accounts for garage usage.',
    LABOUR: 'Select a Labour type (from Maintenance) and assign the related finance accounts for labor services.',
    MISCELLANEOUS: 'Select a Miscellaneous charge type and configure the related Stock/WIP/CGS/Sales/Discount/VAT accounts.',
    OTHER_CHARGE: 'Select an Other charge type and configure the related Stock/WIP/CGS/Sales/Discount/VAT accounts.',
    SUB_LET: 'Select a Sublet work type and configure the related Stock/WIP/CGS/Sales/Discount/VAT accounts.',
  }

  const accountSelect = (label, key) => (
    <label className="text-xs">
      <span className="text-muted-foreground">{label}</span>
      <select className="w-full mt-1 border rounded px-2 py-1.5 text-sm" value={form[key]} onChange={(e) => setField(key, e.target.value)}>
        <option value="">— Select account —</option>
        {accounts.map((a) => (
          <option key={a.account_id} value={a.account_id}>
            {a.account_code} - {a.account_name}
          </option>
        ))}
      </select>
    </label>
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">GL Account Setup By Section and Repair Type</h1>
          <p className="text-sm text-muted-foreground">
            Configure Stock, WIP, CGS, Sales, Discount and VAT accounts by part/service/job dimensions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-blue-700 hidden sm:inline">Ready</span>
          <Button type="button" variant="outline" onClick={() => setForm(emptyForm(tab))}>New</Button>
          <Button type="button" variant="outline" onClick={() => load(tab)}>Refresh</Button>
          <Button type="button" onClick={handleSave} disabled={saving || loading}>{saving ? 'Saving…' : 'Save'}</Button>
        </div>
      </div>

      {error && <div className="rounded border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">{error}</div>}
      {success && <div className="rounded border border-green-200 bg-green-50 text-green-700 px-3 py-2 text-sm">{success}</div>}

      <div className="bg-white border rounded-lg shadow-sm">
        <div className="flex flex-wrap border-b bg-slate-50/80">
          {TAB_ITEMS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px ${
                tab === t.id ? 'border-indigo-600 text-indigo-700 bg-white' : 'border-transparent text-muted-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-4 space-y-4">
          <p className="text-sm text-muted-foreground">{tabGuidanceByTab[tab]}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="text-xs">
              <span className="text-muted-foreground">{scopeLabelByTab[tab]}</span>
              <select className="w-full mt-1 border rounded px-2 py-1.5 text-sm" value={form.parts_group_code} onChange={(e) => setField('parts_group_code', e.target.value)}>
                <option value="">All - 0</option>
                {(scopeOptionsByTab[tab] || []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </label>
            <label className="text-xs">
              <span className="text-muted-foreground">Type of job</span>
              <select className="w-full mt-1 border rounded px-2 py-1.5 text-sm" value={form.job_type} onChange={(e) => setField('job_type', e.target.value)}>
                <option value="">All - 0</option>
                {(options.job_types || []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </label>
            <label className="text-xs">
              <span className="text-muted-foreground">Repair / service type</span>
              <select className="w-full mt-1 border rounded px-2 py-1.5 text-sm" value={form.service_type_id} onChange={(e) => setField('service_type_id', e.target.value)}>
                <option value="">All - 0</option>
                {(options.service_types || []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </label>
            <label className="text-xs">
              <span className="text-muted-foreground">Location</span>
              <select className="w-full mt-1 border rounded px-2 py-1.5 text-sm" value={form.garage_location} onChange={(e) => setField('garage_location', e.target.value)}>
                <option value="">All - 0</option>
                {(options.locations || []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </label>
            <label className="text-xs md:col-span-2">
              <span className="text-muted-foreground">Maintenance section</span>
              <select className="w-full mt-1 border rounded px-2 py-1.5 text-sm" value={form.maintenance_section} onChange={(e) => setField('maintenance_section', e.target.value)}>
                <option value="">All - 0</option>
                {(options.maintenance_sections || []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {accountSelect('Stock account', 'stock_account_id')}
            {accountSelect('WIP account', 'wip_account_id')}
            {accountSelect('CGS account', 'cgs_account_id')}
            {accountSelect('Sales account', 'sales_account_id')}
            {accountSelect('Discount account', 'discount_account_id')}
            {accountSelect('VAT account', 'vat_account_id')}
          </div>

          <div className="overflow-x-auto border rounded">
            <table className="min-w-full text-sm">
              <thead className="bg-muted text-xs text-muted-foreground uppercase">
                <tr>
                  <th className="px-2 py-2 text-left">{scopeLabelByTab[tab]}</th>
                  <th className="px-2 py-2 text-left">Location</th>
                  <th className="px-2 py-2 text-left">Job type</th>
                  <th className="px-2 py-2 text-left">Repair type</th>
                  <th className="px-2 py-2 text-left">Maintenance section</th>
                  <th className="px-2 py-2 text-left">Stock COA</th>
                  <th className="px-2 py-2 text-left">WIP COA</th>
                  <th className="px-2 py-2 text-left">CGS COA</th>
                  <th className="px-2 py-2 text-left">Sales COA</th>
                  <th className="px-2 py-2 text-left">Discount COA</th>
                  <th className="px-2 py-2 text-left">VAT COA</th>
                  <th className="px-2 py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="px-3 py-6 text-center text-muted-foreground">
                      {loading ? 'Loading…' : 'No setup rows for this tab.'}
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.setup_id} className="border-t">
                      <td className="px-2 py-2">{r.parts_group_code || 'All - 0'}</td>
                      <td className="px-2 py-2">{r.garage_location || 'All - 0'}</td>
                      <td className="px-2 py-2">{r.job_type || 'All - 0'}</td>
                      <td className="px-2 py-2">{serviceTypeLabel(r.service_type_id)}</td>
                      <td className="px-2 py-2">{r.maintenance_section || 'All - 0'}</td>
                      <td className="px-2 py-2">{r.stock_account_id ? accountNameById.get(Number(r.stock_account_id)) : '-'}</td>
                      <td className="px-2 py-2">{r.wip_account_id ? accountNameById.get(Number(r.wip_account_id)) : '-'}</td>
                      <td className="px-2 py-2">{r.cgs_account_id ? accountNameById.get(Number(r.cgs_account_id)) : '-'}</td>
                      <td className="px-2 py-2">{r.sales_account_id ? accountNameById.get(Number(r.sales_account_id)) : '-'}</td>
                      <td className="px-2 py-2">{r.discount_account_id ? accountNameById.get(Number(r.discount_account_id)) : '-'}</td>
                      <td className="px-2 py-2">{r.vat_account_id ? accountNameById.get(Number(r.vat_account_id)) : '-'}</td>
                      <td className="px-2 py-2 text-right">
                        <Button type="button" variant="outline" size="sm" onClick={() => editRow(r)}>Edit</Button>
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
  )
}

