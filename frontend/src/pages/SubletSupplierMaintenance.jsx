import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { subletWorkSuppliersApi, systemSettingsApi } from '../services/api'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import SetupScreenFrame from './SetupScreenFrame'

const EXTRA_CATEGORY = 'sublet_supplier_extra'

function coalesceText(...parts) {
  return parts.map((p) => (p || '').trim()).filter(Boolean).join('\n') || null
}

export default function SubletSupplierMaintenance() {
  const queryClient = useQueryClient()
  const [supplierId, setSupplierId] = useState('')
  const [bottomTab, setBottomTab] = useState('account')
  const [allowedUsersText, setAllowedUsersText] = useState('')
  const [extraSettingId, setExtraSettingId] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [form, setForm] = useState({
    supplier_name: '',
    contact_person: '',
    address_line1: '',
    address_line2: '',
    address_line3: '',
    email: '',
    po_box: '',
    phone: '',
    fax_no: '',
    is_active: true,
    supplier_coa_1: '',
    supplier_coa_2: '',
    auto_approve_orders: false,
    account_description: '',
  })

  const suppliersQuery = useQuery({
    queryKey: ['subletWorkSuppliers', { active_only: false }],
    queryFn: () => subletWorkSuppliersApi.list({ active_only: false }),
  })

  const suppliers = useMemo(() => suppliersQuery.data?.data || [], [suppliersQuery.data])

  const selectedSupplier = useMemo(() => {
    const id = Number(supplierId)
    if (!Number.isFinite(id) || id <= 0) return null
    return suppliers.find((s) => s.supplier_id === id) || null
  }, [supplierId, suppliers])

  useEffect(() => {
    if (!selectedSupplier) {
      setForm({
        supplier_name: '',
        contact_person: '',
        address_line1: '',
        address_line2: '',
        address_line3: '',
        email: '',
        po_box: '',
        phone: '',
        fax_no: '',
        is_active: true,
        supplier_coa_1: '',
        supplier_coa_2: '',
        auto_approve_orders: false,
        account_description: '',
      })
      setAllowedUsersText('')
      setExtraSettingId(null)
      return
    }

    setForm({
      supplier_name: selectedSupplier.supplier_name || '',
      contact_person: selectedSupplier.contact_person || '',
      address_line1: selectedSupplier.address_line1 || '',
      address_line2: selectedSupplier.address_line2 || '',
      address_line3: selectedSupplier.address_line3 || '',
      email: selectedSupplier.email || '',
      po_box: selectedSupplier.po_box || '',
      phone: selectedSupplier.phone || '',
      fax_no: selectedSupplier.fax_no || '',
      is_active: selectedSupplier.is_active !== false,
      supplier_coa_1: selectedSupplier.supplier_coa_1 || '',
      supplier_coa_2: selectedSupplier.supplier_coa_2 || '',
      auto_approve_orders: !!selectedSupplier.auto_approve_orders,
      account_description: selectedSupplier.account_description || '',
    })

    let cancelled = false
    ;(async () => {
      try {
        const res = await systemSettingsApi.list({ category: EXTRA_CATEGORY, limit: 500 })
        const rows = res.data || []
        const row = rows.find((r) => String(r.setting_key) === String(selectedSupplier.supplier_id))
        if (cancelled) return
        setExtraSettingId(row?.setting_id || null)
        let users = ''
        if (row?.setting_value) {
          try {
            const parsed = JSON.parse(row.setting_value)
            if (Array.isArray(parsed)) users = parsed.join(', ')
            else if (typeof parsed === 'string') users = parsed
          } catch {
            users = String(row.setting_value || '')
          }
        }
        setAllowedUsersText(users)
      } catch {
        if (!cancelled) {
          setExtraSettingId(null)
          setAllowedUsersText('')
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [selectedSupplier])

  const saveMutation = useMutation({
    mutationFn: async () => {
      const id = Number(supplierId)
      if (!Number.isFinite(id) || id <= 0) throw new Error('Select a supplier first.')

      const addressLegacy = coalesceText(form.address_line1, form.address_line2, form.address_line3)

      const payload = {
        supplier_name: (form.supplier_name || '').trim(),
        contact_person: (form.contact_person || '').trim() || null,
        address_line1: (form.address_line1 || '').trim() || null,
        address_line2: (form.address_line2 || '').trim() || null,
        address_line3: (form.address_line3 || '').trim() || null,
        email: (form.email || '').trim() || null,
        po_box: (form.po_box || '').trim() || null,
        phone: (form.phone || '').trim() || null,
        fax_no: (form.fax_no || '').trim() || null,
        address: addressLegacy,
        supplier_coa_1: (form.supplier_coa_1 || '').trim() || null,
        supplier_coa_2: (form.supplier_coa_2 || '').trim() || null,
        auto_approve_orders: !!form.auto_approve_orders,
        account_description: (form.account_description || '').trim() || null,
        is_active: !!form.is_active,
      }
      if (!payload.supplier_name) throw new Error('Supplier name is required.')

      await subletWorkSuppliersApi.update(id, payload)

      const users = (allowedUsersText || '')
        .split(/[,;\n]/g)
        .map((s) => s.trim())
        .filter(Boolean)

      const json = JSON.stringify(users)
      if (extraSettingId) {
        await systemSettingsApi.update(extraSettingId, {
          setting_key: String(id),
          setting_value: json,
          setting_type: 'json',
          category: EXTRA_CATEGORY,
          description: 'Allowed users for sublet supplier maintenance',
        })
      } else {
        await systemSettingsApi.create({
          setting_key: String(id),
          setting_value: json,
          setting_type: 'json',
          category: EXTRA_CATEGORY,
          description: 'Allowed users for sublet supplier maintenance',
        })
      }
    },
    onMutate: () => {
      setError('')
      setSuccess('')
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['subletWorkSuppliers'] })
      setSuccess('Saved.')
    },
    onError: (e) => {
      setError(e?.response?.data?.detail || e?.message || 'Save failed.')
    },
  })

  const createMutation = useMutation({
    mutationFn: (payload) => subletWorkSuppliersApi.create(payload),
    onMutate: () => {
      setError('')
      setSuccess('')
    },
    onSuccess: async (res) => {
      await queryClient.invalidateQueries({ queryKey: ['subletWorkSuppliers'] })
      const id = res?.data?.supplier_id
      if (id) setSupplierId(String(id))
      setSuccess('Supplier created.')
    },
    onError: (e) => {
      setError(e?.response?.data?.detail || e?.message || 'Create failed.')
    },
  })

  const onNew = () => {
    setSupplierId('')
    setBottomTab('account')
    setForm({
      supplier_name: '',
      contact_person: '',
      address_line1: '',
      address_line2: '',
      address_line3: '',
      email: '',
      po_box: '',
      phone: '',
      fax_no: '',
      is_active: true,
      supplier_coa_1: '',
      supplier_coa_2: '',
      auto_approve_orders: false,
      account_description: '',
    })
    setAllowedUsersText('')
    setExtraSettingId(null)
    setError('')
    setSuccess('')
  }

  const onSave = () => {
    const id = Number(supplierId)
    if (!Number.isFinite(id) || id <= 0) {
      const name = (form.supplier_name || '').trim()
      if (!name) return
      createMutation.mutate({
        supplier_name: name,
        contact_person: (form.contact_person || '').trim() || null,
        phone: (form.phone || '').trim() || null,
        fax_no: (form.fax_no || '').trim() || null,
        email: (form.email || '').trim() || null,
        address: coalesceText(form.address_line1, form.address_line2, form.address_line3),
        address_line1: (form.address_line1 || '').trim() || null,
        address_line2: (form.address_line2 || '').trim() || null,
        address_line3: (form.address_line3 || '').trim() || null,
        po_box: (form.po_box || '').trim() || null,
        supplier_coa_1: (form.supplier_coa_1 || '').trim() || null,
        supplier_coa_2: (form.supplier_coa_2 || '').trim() || null,
        auto_approve_orders: !!form.auto_approve_orders,
        account_description: (form.account_description || '').trim() || null,
      })
      return
    }
    saveMutation.mutate()
  }

  const onDeactivate = () => {
    const id = Number(supplierId)
    if (!Number.isFinite(id) || id <= 0) return
    if (!window.confirm('Mark this supplier as inactive?')) return
    subletWorkSuppliersApi.update(id, { is_active: false }).then(async () => {
      await queryClient.invalidateQueries({ queryKey: ['subletWorkSuppliers'] })
      setForm((f) => ({ ...f, is_active: false }))
    })
  }

  const status = suppliersQuery.isLoading ? 'Loading…' : saveMutation.isPending || createMutation.isPending ? 'Saving…' : 'Ready'

  return (
    <SetupScreenFrame
      hubTo="/maintenance-hub"
      hubLabel="Maintenance"
      title="Sublet work supplier maintenance"
      subtitle="Maintain supplier contact details, chart-of-accounts references, and access notes used for sublet purchasing."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-blue-700">{status}</span>
          <Button type="button" variant="outline" onClick={onNew}>
            New
          </Button>
          <Button type="button" onClick={onSave} disabled={saveMutation.isPending || createMutation.isPending}>
            Save
          </Button>
          <Button type="button" variant="destructive" onClick={onDeactivate} disabled={!supplierId}>
            Delete
          </Button>
          <Button type="button" variant="outline" onClick={() => suppliersQuery.refetch()}>
            Refresh
          </Button>
        </div>
      }
    >
      {error && <div className="rounded border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">{error}</div>}
      {success && <div className="rounded border border-green-200 bg-green-50 text-green-700 px-3 py-2 text-sm">{success}</div>}

      <div className="bg-white border rounded-lg shadow-sm p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="text-sm space-y-1">
            <div className="text-gray-700 font-medium">Supplier</div>
            <select
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
            >
              <option value="">— New supplier —</option>
              {suppliers.map((s) => (
                <option key={s.supplier_id} value={String(s.supplier_id)}>
                  {s.supplier_name}
                  {s.is_active === false ? ' (inactive)' : ''}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm space-y-1">
            <div className="text-gray-700 font-medium">Supplier name</div>
            <Input value={form.supplier_name} onChange={(e) => setForm({ ...form, supplier_name: e.target.value })} />
          </label>
          <label className="text-sm space-y-1">
            <div className="text-gray-700 font-medium">Contact person</div>
            <Input value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} />
          </label>
          <label className="text-sm space-y-1 md:col-span-2">
            <div className="text-gray-700 font-medium">Address line 1</div>
            <Input value={form.address_line1} onChange={(e) => setForm({ ...form, address_line1: e.target.value })} />
          </label>
          <label className="text-sm space-y-1 md:col-span-2">
            <div className="text-gray-700 font-medium">Address line 2</div>
            <Input value={form.address_line2} onChange={(e) => setForm({ ...form, address_line2: e.target.value })} />
          </label>
          <label className="text-sm space-y-1 md:col-span-2">
            <div className="text-gray-700 font-medium">Address line 3</div>
            <Input value={form.address_line3} onChange={(e) => setForm({ ...form, address_line3: e.target.value })} />
          </label>
          <label className="text-sm space-y-1">
            <div className="text-gray-700 font-medium">Email</div>
            <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </label>
          <label className="text-sm space-y-1">
            <div className="text-gray-700 font-medium">P.O. Box</div>
            <Input value={form.po_box} onChange={(e) => setForm({ ...form, po_box: e.target.value })} />
          </label>
          <label className="text-sm space-y-1">
            <div className="text-gray-700 font-medium">Tel. No</div>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </label>
          <label className="text-sm space-y-1">
            <div className="text-gray-700 font-medium">Fax. No</div>
            <Input value={form.fax_no} onChange={(e) => setForm({ ...form, fax_no: e.target.value })} />
          </label>
          <label className="text-sm space-y-1">
            <div className="text-gray-700 font-medium">Status</div>
            <select
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={form.is_active ? 'active' : 'inactive'}
              onChange={(e) => setForm({ ...form, is_active: e.target.value === 'active' })}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
        </div>

        <div className="flex flex-wrap border-b bg-slate-50/80 rounded-t-md">
          {[
            { id: 'account', label: 'Account Info' },
            { id: 'users', label: 'Allowed User' },
            { id: 'list', label: 'Supplier List' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setBottomTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px ${
                bottomTab === t.id ? 'border-indigo-600 text-indigo-700 bg-white' : 'border-transparent text-gray-600'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {bottomTab === 'account' && (
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_2fr] gap-2 items-end">
              <label className="text-sm space-y-1 md:col-span-1">
                <div className="text-gray-700 font-medium">Supplier COA (row 1)</div>
                <Input value={form.supplier_coa_1} onChange={(e) => setForm({ ...form, supplier_coa_1: e.target.value })} />
              </label>
              <Button type="button" variant="outline" className="h-10 px-3">
                …
              </Button>
              <div className="text-xs text-gray-500 flex items-center">
                GL browse can be wired to your chart-of-accounts lookup (placeholder).
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_2fr] gap-2 items-end">
              <label className="text-sm space-y-1">
                <div className="text-gray-700 font-medium">Supplier COA (row 2)</div>
                <Input value={form.supplier_coa_2} onChange={(e) => setForm({ ...form, supplier_coa_2: e.target.value })} />
              </label>
              <Button type="button" variant="outline" className="h-10 px-3">
                …
              </Button>
              <div />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.auto_approve_orders}
                onChange={(e) => setForm({ ...form, auto_approve_orders: e.target.checked })}
              />
              <span>Auto Approve Order from this Supplier</span>
            </label>
            <label className="text-sm space-y-1 block">
              <div className="text-gray-700 font-medium">Description</div>
              <Input value={form.account_description} onChange={(e) => setForm({ ...form, account_description: e.target.value })} />
            </label>
          </div>
        )}

        {bottomTab === 'users' && (
          <div className="space-y-2 pt-2">
            <div className="text-sm text-gray-600">
              Enter usernames allowed to work with this supplier (comma-separated). Stored as JSON in system settings.
            </div>
            <textarea
              className="w-full min-h-[140px] border rounded-md px-3 py-2 text-sm"
              value={allowedUsersText}
              onChange={(e) => setAllowedUsersText(e.target.value)}
            />
          </div>
        )}

        {bottomTab === 'list' && (
          <div className="pt-2 overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 border-b">
                  <th className="py-2 pr-3">Supplier</th>
                  <th className="py-2 pr-3">Tel</th>
                  <th className="py-2 pr-3">Email</th>
                  <th className="py-2 pr-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((s) => (
                  <tr key={s.supplier_id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 pr-3 font-medium">{s.supplier_name}</td>
                    <td className="py-2 pr-3">{s.phone || ''}</td>
                    <td className="py-2 pr-3">{s.email || ''}</td>
                    <td className="py-2 pr-3">{s.is_active === false ? 'Inactive' : 'Active'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </SetupScreenFrame>
  )
}
