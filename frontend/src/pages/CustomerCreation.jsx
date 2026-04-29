import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { customersApi } from '../services/api'
import { Button } from '@/components/ui/button'

const TABS = ['GL', 'Other', 'Local address', 'Foreign address']

function splitCustomerName(full) {
  const t = (full || '').trim()
  if (!t) return ['', '']
  const i = t.lastIndexOf(' ')
  if (i <= 0) return [t, '-']
  return [t.slice(0, i).trim() || t, t.slice(i + 1).trim() || '-']
}

function joinCustomerName(first, last) {
  const f = (first || '').trim()
  const l = (last || '').trim()
  if (l === '-' || !l) return f
  return `${f} ${l}`.trim()
}

const emptyForm = () => ({
  customer_id: null,
  display_name: '',
  sub_ledger: '',
  tin: '',
  contact_name: '',
  address: '',
  phone: '',
  alt_phone: '',
  fax_no: '',
  po_box: '',
  email: '',
  tax_rate: '',
  credit_limit: '0',
  invoice_due_days: '0',
  price_list_code: '',
  status_label: 'Active',
  city: '',
  national_id: '',
  gl_coa_code: '',
  gl_coa_name: '',
  gl_category: '',
  gl_customer_type: '',
  allow_credit: true,
  on_hold: false,
  is_dealer: false,
  notes_other: '',
  address_local: '',
  address_foreign: '',
  portal_password: '',
})

export default function CustomerCreation() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('GL')
  const [loadingList, setLoadingList] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [customerList, setCustomerList] = useState([])
  const [selectedListId, setSelectedListId] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [logOpen, setLogOpen] = useState(false)
  const [logRows, setLogRows] = useState([])
  const [logLoading, setLogLoading] = useState(false)

  const loadCustomers = useCallback(async () => {
    setLoadingList(true)
    try {
      const res = await customersApi.getAll({ limit: 100 })
      setCustomerList(res.data || [])
    } catch (e) {
      console.error(e)
      setError('Could not load customer list.')
    } finally {
      setLoadingList(false)
    }
  }, [])

  useEffect(() => {
    loadCustomers()
  }, [loadCustomers])

  const setField = (name, value) => {
    setForm((p) => ({ ...p, [name]: value }))
    setSuccess('')
    setError('')
  }

  const applyCustomer = (c) => {
    if (!c) {
      setForm(emptyForm())
      return
    }
    setForm({
      customer_id: c.customer_id,
      display_name: joinCustomerName(c.first_name, c.last_name),
      sub_ledger: c.sub_ledger || '',
      tin: c.tin || '',
      contact_name: c.contact_name || '',
      address: c.address || '',
      phone: c.phone || '',
      alt_phone: c.alt_phone || '',
      fax_no: c.fax_no || '',
      po_box: c.po_box || '',
      email: c.email || '',
      tax_rate: c.tax_rate || '',
      credit_limit: c.credit_limit != null ? String(c.credit_limit) : '0',
      invoice_due_days: c.invoice_due_days != null ? String(c.invoice_due_days) : '0',
      price_list_code: c.price_list_code || '',
      status_label: c.status_label || (c.is_active ? 'Active' : 'Inactive'),
      city: c.city || '',
      national_id: c.national_id || '',
      gl_coa_code: c.gl_coa_code || '',
      gl_coa_name: c.gl_coa_name || '',
      gl_category: c.gl_category || '',
      gl_customer_type: c.gl_customer_type || '',
      allow_credit: c.allow_credit !== false,
      on_hold: Boolean(c.on_hold),
      is_dealer: Boolean(c.is_dealer),
      notes_other: c.notes_other || '',
      address_local: c.address_local || '',
      address_foreign: c.address_foreign || '',
      portal_password: '',
    })
  }

  const handleSelectExisting = async (idStr) => {
    setSelectedListId(idStr)
    setError('')
    if (!idStr) {
      applyCustomer(null)
      return
    }
    try {
      const res = await customersApi.getById(Number(idStr))
      applyCustomer(res.data)
    } catch (e) {
      console.error(e)
      setError('Failed to load customer.')
    }
  }

  const handleNew = () => {
    setSelectedListId('')
    applyCustomer(null)
    setError('')
    setSuccess('')
  }

  const handleRefresh = async () => {
    await loadCustomers()
    if (form.customer_id) {
      try {
        const res = await customersApi.getById(form.customer_id)
        applyCustomer(res.data)
        setSuccess('Reloaded.')
      } catch (e) {
        console.error(e)
        setError('Failed to refresh.')
      }
    } else {
      setSuccess('List refreshed.')
    }
  }

  const buildCorePayload = () => {
    const [first_name, last_name] = splitCustomerName(form.display_name)
    if (!first_name.trim()) throw new Error('Customer name is required.')
    if (!form.email?.trim()) throw new Error('Email is required.')
    if (!form.phone?.trim()) throw new Error('Telephone is required.')

    const isActive = !String(form.status_label || '').toLowerCase().includes('inactive')

    return {
      first_name: first_name.trim(),
      last_name: (last_name || '-').trim() || '-',
      email: form.email.trim(),
      phone: form.phone.trim(),
      address: form.address || null,
      city: form.city || null,
      national_id: form.national_id || null,
      sub_ledger: form.sub_ledger || null,
      tin: form.tin || null,
      contact_name: form.contact_name || null,
      alt_phone: form.alt_phone || null,
      fax_no: form.fax_no || null,
      po_box: form.po_box || null,
      tax_rate: form.tax_rate || null,
      credit_limit: form.credit_limit === '' ? null : Number(form.credit_limit),
      invoice_due_days: form.invoice_due_days === '' ? null : Number(form.invoice_due_days),
      price_list_code: form.price_list_code || null,
      status_label: form.status_label || null,
      gl_coa_code: form.gl_coa_code || null,
      gl_coa_name: form.gl_coa_name || null,
      gl_category: form.gl_category || null,
      gl_customer_type: form.gl_customer_type || null,
      allow_credit: form.allow_credit,
      on_hold: form.on_hold,
      is_dealer: form.is_dealer,
      notes_other: form.notes_other || null,
      address_local: form.address_local || null,
      address_foreign: form.address_foreign || null,
      is_active: isActive,
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const core = buildCorePayload()
      if (form.customer_id) {
        const body = { ...core }
        if (form.portal_password?.trim()) body.password = form.portal_password.trim()
        const res = await customersApi.update(form.customer_id, body)
        applyCustomer(res.data)
        setSuccess('Customer updated.')
      } else {
        const body = { ...core }
        if (form.portal_password?.trim()) body.password = form.portal_password.trim()
        const res = await customersApi.create(body)
        applyCustomer(res.data)
        setSelectedListId(String(res.data.customer_id))
        await loadCustomers()
        setSuccess('Customer created.')
      }
    } catch (e) {
      console.error(e)
      const d = e?.response?.data?.detail
      setError(typeof d === 'string' ? d : e.message || 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!form.customer_id) return
    if (!window.confirm('Deactivate this customer? They will be marked inactive.')) return
    setSaving(true)
    setError('')
    try {
      await customersApi.delete(form.customer_id)
      handleNew()
      await loadCustomers()
      setSuccess('Customer deactivated.')
    } catch (e) {
      console.error(e)
      setError(e?.response?.data?.detail || 'Delete failed.')
    } finally {
      setSaving(false)
    }
  }

  const handleGetFromGl = async () => {
    setError('')
    try {
      const code = (form.gl_coa_code || '').trim()
      if (code.length < 2) {
        setError('Enter at least 2 characters of the COA code to look up.')
        return
      }
      const res = await customersApi.glAccountLookup({ code })
      const m = (res.data?.matches || [])[0]
      if (m) {
        setField('gl_coa_code', m.account_code)
        setField('gl_coa_name', m.account_name)
        setSuccess('Filled from GL account list.')
      } else {
        setError('No GL account match. Enter a COA code fragment and try again.')
      }
    } catch (e) {
      console.error(e)
      setError('GL lookup failed.')
    }
  }

  const openLog = async () => {
    if (!form.customer_id) {
      setError('Save or select a customer first to view the log.')
      return
    }
    setLogOpen(true)
    setLogLoading(true)
    try {
      const res = await customersApi.auditLog(form.customer_id)
      setLogRows(res.data || [])
    } catch (e) {
      console.error(e)
      setLogRows([])
    } finally {
      setLogLoading(false)
    }
  }

  const renderGeneral = () => (
    <div className="border rounded-lg p-4 space-y-3 bg-slate-50/50">
      <h2 className="text-sm font-semibold text-gray-800">General information</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="text-xs">
          <span className="text-gray-600">Sub ledger</span>
          <input className="w-full mt-1 border rounded px-2 py-1.5 text-sm" value={form.sub_ledger} onChange={(e) => setField('sub_ledger', e.target.value)} />
        </label>
        <label className="text-xs">
          <span className="text-gray-600">System Id</span>
          <input className="w-full mt-1 border rounded px-2 py-1.5 text-sm bg-gray-100" value={form.customer_id || '(new)'} disabled />
        </label>
        <label className="text-xs">
          <span className="text-gray-600">TIN</span>
          <input className="w-full mt-1 border rounded px-2 py-1.5 text-sm" value={form.tin} onChange={(e) => setField('tin', e.target.value)} />
        </label>
        <label className="text-xs md:col-span-2">
          <span className="text-gray-600">Customer name</span>
          <input className="w-full mt-1 border rounded px-2 py-1.5 text-sm" value={form.display_name} onChange={(e) => setField('display_name', e.target.value)} placeholder="Company or full name (last word becomes last name if split)" />
        </label>
        <label className="text-xs md:col-span-2">
          <span className="text-gray-600">Contact</span>
          <input className="w-full mt-1 border rounded px-2 py-1.5 text-sm" value={form.contact_name} onChange={(e) => setField('contact_name', e.target.value)} />
        </label>
        <label className="text-xs md:col-span-2">
          <span className="text-gray-600">Address</span>
          <input className="w-full mt-1 border rounded px-2 py-1.5 text-sm" value={form.address} onChange={(e) => setField('address', e.target.value)} />
        </label>
        <label className="text-xs">
          <span className="text-gray-600">Telephone no.</span>
          <input className="w-full mt-1 border rounded px-2 py-1.5 text-sm" value={form.phone} onChange={(e) => setField('phone', e.target.value)} />
        </label>
        <label className="text-xs">
          <span className="text-gray-600">Alt. telephone no.</span>
          <input className="w-full mt-1 border rounded px-2 py-1.5 text-sm" value={form.alt_phone} onChange={(e) => setField('alt_phone', e.target.value)} />
        </label>
        <label className="text-xs">
          <span className="text-gray-600">Fax no.</span>
          <input className="w-full mt-1 border rounded px-2 py-1.5 text-sm" value={form.fax_no} onChange={(e) => setField('fax_no', e.target.value)} />
        </label>
        <label className="text-xs">
          <span className="text-gray-600">PO box</span>
          <input className="w-full mt-1 border rounded px-2 py-1.5 text-sm" value={form.po_box} onChange={(e) => setField('po_box', e.target.value)} />
        </label>
        <label className="text-xs md:col-span-2">
          <span className="text-gray-600">Email address</span>
          <input type="email" className="w-full mt-1 border rounded px-2 py-1.5 text-sm" value={form.email} onChange={(e) => setField('email', e.target.value)} />
        </label>
        <label className="text-xs">
          <span className="text-gray-600">Tax rate</span>
          <input className="w-full mt-1 border rounded px-2 py-1.5 text-sm" value={form.tax_rate} onChange={(e) => setField('tax_rate', e.target.value)} placeholder="Code or label" />
        </label>
        <label className="text-xs">
          <span className="text-gray-600">Credit limit</span>
          <input className="w-full mt-1 border rounded px-2 py-1.5 text-sm" value={form.credit_limit} onChange={(e) => setField('credit_limit', e.target.value)} />
        </label>
        <label className="text-xs">
          <span className="text-gray-600">Invoice due in days</span>
          <input className="w-full mt-1 border rounded px-2 py-1.5 text-sm" value={form.invoice_due_days} onChange={(e) => setField('invoice_due_days', e.target.value)} />
        </label>
        <label className="text-xs">
          <span className="text-gray-600">Price list</span>
          <input className="w-full mt-1 border rounded px-2 py-1.5 text-sm" value={form.price_list_code} onChange={(e) => setField('price_list_code', e.target.value)} />
        </label>
        <label className="text-xs">
          <span className="text-gray-600">Status</span>
          <select className="w-full mt-1 border rounded px-2 py-1.5 text-sm" value={form.status_label} onChange={(e) => setField('status_label', e.target.value)}>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </label>
        <label className="text-xs">
          <span className="text-gray-600">City</span>
          <input className="w-full mt-1 border rounded px-2 py-1.5 text-sm" value={form.city} onChange={(e) => setField('city', e.target.value)} />
        </label>
        <label className="text-xs">
          <span className="text-gray-600">National ID (optional)</span>
          <input className="w-full mt-1 border rounded px-2 py-1.5 text-sm" value={form.national_id} onChange={(e) => setField('national_id', e.target.value)} />
        </label>
        <label className="text-xs md:col-span-2">
          <span className="text-gray-600">Portal password (optional)</span>
          <input type="password" className="w-full mt-1 border rounded px-2 py-1.5 text-sm" value={form.portal_password} onChange={(e) => setField('portal_password', e.target.value)} placeholder="Leave blank if customer does not log in" />
        </label>
      </div>
    </div>
  )

  const renderGl = () => (
    <div className="space-y-3">
      <label className="text-xs block">
        <span className="text-gray-600">COA (chart of accounts)</span>
        <div className="flex gap-2 mt-1">
          <input className="flex-1 border rounded px-2 py-1.5 text-sm" value={form.gl_coa_code} onChange={(e) => setField('gl_coa_code', e.target.value)} />
          <Button type="button" variant="outline" size="sm" onClick={handleGetFromGl}>
            Get from GL
          </Button>
        </div>
      </label>
      <label className="text-xs block">
        <span className="text-gray-600">COA name</span>
        <textarea className="w-full mt-1 border rounded px-2 py-1.5 text-sm min-h-[72px]" value={form.gl_coa_name} onChange={(e) => setField('gl_coa_name', e.target.value)} />
      </label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="text-xs">
          <span className="text-gray-600">Category</span>
          <input className="w-full mt-1 border rounded px-2 py-1.5 text-sm" value={form.gl_category} onChange={(e) => setField('gl_category', e.target.value)} />
        </label>
        <label className="text-xs">
          <span className="text-gray-600">Customer type</span>
          <input className="w-full mt-1 border rounded px-2 py-1.5 text-sm" value={form.gl_customer_type} onChange={(e) => setField('gl_customer_type', e.target.value)} />
        </label>
      </div>
      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={form.allow_credit} onChange={(e) => setField('allow_credit', e.target.checked)} />
          Allow credit
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={form.on_hold} onChange={(e) => setField('on_hold', e.target.checked)} />
          On hold
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={form.is_dealer} onChange={(e) => setField('is_dealer', e.target.checked)} />
          Dealer
        </label>
      </div>
    </div>
  )

  const renderTab = () => {
    if (activeTab === 'GL') return renderGl()
    if (activeTab === 'Other') {
      return (
        <label className="text-xs block">
          <span className="text-gray-600">Notes</span>
          <textarea className="w-full mt-1 border rounded px-2 py-1.5 text-sm min-h-[160px]" value={form.notes_other} onChange={(e) => setField('notes_other', e.target.value)} />
        </label>
      )
    }
    if (activeTab === 'Local address') {
      return (
        <label className="text-xs block">
          <span className="text-gray-600">Local address</span>
          <textarea className="w-full mt-1 border rounded px-2 py-1.5 text-sm min-h-[120px]" value={form.address_local} onChange={(e) => setField('address_local', e.target.value)} />
        </label>
      )
    }
    return (
      <label className="text-xs block">
        <span className="text-gray-600">Foreign address</span>
        <textarea className="w-full mt-1 border rounded px-2 py-1.5 text-sm min-h-[120px]" value={form.address_foreign} onChange={(e) => setField('address_foreign', e.target.value)} />
      </label>
    )
  }

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">New customer creation</h1>
          <p className="text-sm text-gray-600">General profile, GL link, and extended addresses (HillMaster-style).</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-blue-700 hidden sm:inline">Ready</span>
          <Button type="button" variant="outline" onClick={handleNew}>New</Button>
          <Button type="button" variant="outline" onClick={handleRefresh}>Refresh</Button>
          <Button type="button" variant="outline" onClick={openLog}>View log</Button>
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={!form.customer_id || saving}>Delete</Button>
          <Button type="button" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
        </div>
      </div>

      {error && <div className="rounded border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">{error}</div>}
      {success && <div className="rounded border border-green-200 bg-green-50 text-green-700 px-3 py-2 text-sm">{success}</div>}

      <div className="bg-white border rounded-lg shadow-sm p-4 space-y-4">
        <label className="text-sm block max-w-xl">
          <span className="text-gray-600">Customer</span>
          <select
            className="w-full mt-1 border rounded px-3 py-2 text-sm"
            value={selectedListId}
            onChange={(e) => handleSelectExisting(e.target.value)}
            disabled={loadingList}
          >
            <option value="">— New customer —</option>
            {customerList.map((c) => (
              <option key={c.customer_id} value={c.customer_id}>
                #{c.customer_id} {c.first_name} {c.last_name}
              </option>
            ))}
          </select>
        </label>

        {renderGeneral()}

        <div className="border rounded-lg overflow-hidden">
          <div className="flex flex-wrap border-b bg-slate-50">
            {TABS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setActiveTab(t)}
                className={`px-4 py-2 text-sm border-b-2 -mb-px ${activeTab === t ? 'border-indigo-600 text-indigo-800 bg-white' : 'border-transparent text-gray-600'}`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="p-4">{renderTab()}</div>
        </div>

        <p className="text-xs text-gray-500">
          Delete marks the customer <strong>inactive</strong> (soft delete) so vehicles and history stay linked.
          Use <button type="button" className="text-indigo-700 underline" onClick={() => navigate('/customers')}>Customers</button> for the compact list view.
        </p>
      </div>

      {logOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" role="dialog">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center px-4 py-3 border-b">
              <h2 className="font-semibold">Customer audit log</h2>
              <button type="button" className="text-gray-500 text-sm" onClick={() => setLogOpen(false)}>Close</button>
            </div>
            <div className="p-4 overflow-y-auto text-sm flex-1">
              {logLoading ? (
                <p className="text-gray-500">Loading…</p>
              ) : logRows.length === 0 ? (
                <p className="text-gray-500">No log entries yet.</p>
              ) : (
                <ul className="space-y-3">
                  {logRows.map((row) => (
                    <li key={row.log_id} className="border rounded p-2 bg-slate-50">
                      <div className="text-xs text-gray-500">{row.action_type} · {row.created_at}</div>
                      <pre className="text-xs whitespace-pre-wrap mt-1">{JSON.stringify({ old: row.old_values, new: row.new_values }, null, 2)}</pre>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
