import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { customersApi } from '../services/api'
import {
  ArrowLeft,
  FileText,
  RefreshCw,
  Save,
  Trash2,
  UserRoundPlus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { PageHeader } from '@/components/PageChrome'
import { cn } from '@/lib/utils'

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
    <Card className="border-border/55 shadow-none hover:translate-y-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">General information</CardTitle>
        <CardDescription>Name, contact, billing defaults, and portal access.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="cust-sub-ledger">Sub ledger</Label>
          <Input
            id="cust-sub-ledger"
            value={form.sub_ledger}
            onChange={(e) => setField('sub_ledger', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cust-system-id">System ID</Label>
          <Input id="cust-system-id" className="bg-muted/50" value={form.customer_id || '(new)'} disabled />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cust-tin">TIN</Label>
          <Input id="cust-tin" value={form.tin} onChange={(e) => setField('tin', e.target.value)} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="cust-display-name">
            Customer name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="cust-display-name"
            value={form.display_name}
            onChange={(e) => setField('display_name', e.target.value)}
            placeholder="Company or full name (last word becomes last name if split)"
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="cust-contact">Contact</Label>
          <Input
            id="cust-contact"
            value={form.contact_name}
            onChange={(e) => setField('contact_name', e.target.value)}
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="cust-address">Address</Label>
          <Input id="cust-address" value={form.address} onChange={(e) => setField('address', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cust-phone">
            Telephone <span className="text-destructive">*</span>
          </Label>
          <Input id="cust-phone" value={form.phone} onChange={(e) => setField('phone', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cust-alt-phone">Alt. telephone</Label>
          <Input id="cust-alt-phone" value={form.alt_phone} onChange={(e) => setField('alt_phone', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cust-fax">Fax</Label>
          <Input id="cust-fax" value={form.fax_no} onChange={(e) => setField('fax_no', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cust-pobox">PO box</Label>
          <Input id="cust-pobox" value={form.po_box} onChange={(e) => setField('po_box', e.target.value)} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="cust-email">
            Email <span className="text-destructive">*</span>
          </Label>
          <Input
            id="cust-email"
            type="email"
            value={form.email}
            onChange={(e) => setField('email', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cust-tax-rate">Tax rate</Label>
          <Input
            id="cust-tax-rate"
            value={form.tax_rate}
            onChange={(e) => setField('tax_rate', e.target.value)}
            placeholder="Code or label"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cust-credit-limit">Credit limit</Label>
          <Input
            id="cust-credit-limit"
            value={form.credit_limit}
            onChange={(e) => setField('credit_limit', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cust-due-days">Invoice due (days)</Label>
          <Input
            id="cust-due-days"
            value={form.invoice_due_days}
            onChange={(e) => setField('invoice_due_days', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cust-price-list">Price list</Label>
          <Input
            id="cust-price-list"
            value={form.price_list_code}
            onChange={(e) => setField('price_list_code', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cust-status">Status</Label>
          <Select id="cust-status" value={form.status_label} onChange={(e) => setField('status_label', e.target.value)}>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="cust-city">City</Label>
          <Input id="cust-city" value={form.city} onChange={(e) => setField('city', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cust-national-id">National ID (optional)</Label>
          <Input
            id="cust-national-id"
            value={form.national_id}
            onChange={(e) => setField('national_id', e.target.value)}
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="cust-portal-pw">Portal password (optional)</Label>
          <Input
            id="cust-portal-pw"
            type="password"
            value={form.portal_password}
            onChange={(e) => setField('portal_password', e.target.value)}
            placeholder="Leave blank if customer does not log in"
          />
        </div>
      </CardContent>
    </Card>
  )

  const renderGl = () => (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="cust-gl-coa">COA (chart of accounts)</Label>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            id="cust-gl-coa"
            className="sm:flex-1"
            value={form.gl_coa_code}
            onChange={(e) => setField('gl_coa_code', e.target.value)}
          />
          <Button type="button" variant="outline" className="shrink-0" onClick={handleGetFromGl}>
            Get from GL
          </Button>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="cust-gl-name">COA name</Label>
        <Textarea
          id="cust-gl-name"
          className="min-h-[88px]"
          value={form.gl_coa_name}
          onChange={(e) => setField('gl_coa_name', e.target.value)}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="cust-gl-cat">Category</Label>
          <Input id="cust-gl-cat" value={form.gl_category} onChange={(e) => setField('gl_category', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cust-gl-type">Customer type</Label>
          <Input
            id="cust-gl-type"
            value={form.gl_customer_type}
            onChange={(e) => setField('gl_customer_type', e.target.value)}
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        {[
          { key: 'allow_credit', label: 'Allow credit', checked: form.allow_credit },
          { key: 'on_hold', label: 'On hold', checked: form.on_hold },
          { key: 'is_dealer', label: 'Dealer', checked: form.is_dealer },
        ].map(({ key, label, checked }) => (
          <label
            key={key}
            className="flex cursor-pointer items-center gap-3 rounded-xl border border-border/55 bg-muted/25 px-4 py-3 text-sm font-medium shadow-sm transition hover:bg-muted/40"
          >
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-input text-primary focus:ring-teal-500/35"
              checked={checked}
              onChange={(e) => setField(key, e.target.checked)}
            />
            {label}
          </label>
        ))}
      </div>
    </div>
  )

  const renderTab = () => {
    if (activeTab === 'GL') return renderGl()
    if (activeTab === 'Other') {
      return (
        <div className="space-y-2">
          <Label htmlFor="cust-notes">Notes</Label>
          <Textarea
            id="cust-notes"
            className="min-h-[160px]"
            value={form.notes_other}
            onChange={(e) => setField('notes_other', e.target.value)}
          />
        </div>
      )
    }
    if (activeTab === 'Local address') {
      return (
        <div className="space-y-2">
          <Label htmlFor="cust-addr-local">Local address</Label>
          <Textarea
            id="cust-addr-local"
            className="min-h-[120px]"
            value={form.address_local}
            onChange={(e) => setField('address_local', e.target.value)}
          />
        </div>
      )
    }
    return (
      <div className="space-y-2">
        <Label htmlFor="cust-addr-foreign">Foreign address</Label>
        <Textarea
          id="cust-addr-foreign"
          className="min-h-[120px]"
          value={form.address_foreign}
          onChange={(e) => setField('address_foreign', e.target.value)}
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <PageHeader
        eyebrow="Maintenance"
        title="Customer maintenance"
        description="Full HillMaster-style profile: general data, GL link, notes, and alternate addresses. Save loads the server-side record and refreshes the picker."
        actions={
          <>
            <Button type="button" variant="outline" className="gap-2" asChild>
              <Link to="/customers">
                <ArrowLeft className="h-4 w-4" />
                Customer list
              </Link>
            </Button>
            <Button type="button" variant="outline" className="gap-2" onClick={handleNew}>
              <UserRoundPlus className="h-4 w-4" />
              New
            </Button>
            <Button type="button" variant="outline" className="gap-2" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button type="button" variant="outline" className="gap-2" onClick={openLog}>
              <FileText className="h-4 w-4" />
              View log
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="gap-2"
              onClick={handleDelete}
              disabled={!form.customer_id || saving}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
            <Button type="button" className="gap-2 shadow-md shadow-primary/20" onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4" />
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </>
        }
      />

      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-destructive/35 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      ) : null}
      {success ? (
        <div
          role="status"
          className="rounded-xl border border-emerald-300/50 bg-emerald-50/90 px-4 py-3 text-sm text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100"
        >
          {success}
        </div>
      ) : null}

      <Card>
        <CardHeader className="border-b border-border/50 pb-6">
          <CardTitle className="font-display text-lg">Customer record</CardTitle>
          <CardDescription>Select an existing customer or leave “New customer” to create.</CardDescription>
          <div className="max-w-xl pt-4">
            <Label htmlFor="cust-picker" className="mb-2 block">
              Customer
            </Label>
            <Select
              id="cust-picker"
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
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-8">
          {renderGeneral()}

          <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-none">
            <div className="flex flex-wrap gap-1 border-b border-border/55 bg-muted/35 p-1.5">
              {TABS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setActiveTab(t)}
                  className={cn(
                    'rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200',
                    activeTab === t
                      ? 'bg-card text-primary shadow-sm ring-1 ring-primary/25'
                      : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="p-5 sm:p-6">{renderTab()}</div>
          </div>

          <p className="text-xs leading-relaxed text-muted-foreground">
            Delete marks the customer <strong className="text-foreground">inactive</strong> (soft delete) so vehicles and
            history stay linked. For a compact grid view use{' '}
            <button type="button" className="font-semibold text-primary underline-offset-4 hover:underline" onClick={() => navigate('/customers')}>
              Customers
            </button>
            .
          </p>
        </CardContent>
      </Card>

      <Dialog open={logOpen} onOpenChange={(open) => !open && setLogOpen(false)}>
        <DialogContent className="flex max-h-[min(85vh,640px)] max-w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
          <DialogHeader className="shrink-0 border-b border-border/60 px-6 py-5 pr-14">
            <DialogTitle className="font-display text-lg">Customer audit log</DialogTitle>
            <DialogDescription>Change history for this customer record.</DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
            {logLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : logRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">No log entries yet.</p>
            ) : (
              <ul className="space-y-3">
                {logRows.map((row) => (
                  <li
                    key={row.log_id}
                    className="rounded-xl border border-border/55 bg-muted/25 p-4 text-sm shadow-sm"
                  >
                    <div className="text-xs font-medium text-muted-foreground">
                      {row.action_type} · {row.created_at}
                    </div>
                    <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-background/80 p-3 font-mono text-[11px] leading-relaxed text-foreground/90 ring-1 ring-border/40">
                      {JSON.stringify({ old: row.old_values, new: row.new_values }, null, 2)}
                    </pre>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
