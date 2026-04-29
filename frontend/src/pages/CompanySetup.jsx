import { useCallback, useEffect, useState } from 'react'
import { companySetupApi } from '../services/api'
import { Button } from '@/components/ui/button'

const TABS = [
  { id: 'company', label: 'Company' },
  { id: 'application', label: 'Application' },
  { id: 'address', label: 'Address' },
  { id: 'email', label: 'Email Setting' },
  { id: 'sms', label: 'SMS Setting' },
  { id: 'default', label: 'Default' },
]

const BOOL_FIELDS = new Set([
  'taken_done',
  'is_branch',
  'update_customer_from_gl',
  'allow_sell_over_branch_stock',
  'allow_sell_over_company_stock',
  'overwrite',
  'use_login_credentials',
  'enable_ssl',
  'cash_sales_order_inc_year',
  'cash_sales_order_inc_month',
  'credit_sales_order_inc_year',
  'credit_sales_order_inc_month',
  'proforma_invoice_inc_year',
  'proforma_invoice_inc_month',
  'refund_credit_note_inc_year',
  'refund_credit_note_inc_month',
])

const LABELS = {
  company: {
    current_period: 'Current period',
    budget_year: 'Budget year',
    taken_done: 'Conversion taken done',
    is_branch: 'Is branch site',
    update_customer_from_gl: 'Update customer from GL only',
    shop_branch: 'Shop / branch',
    default_product_group: 'Default product group',
    allow_sell_over_branch_stock: 'Allow sell over branch stock',
    allow_sell_over_company_stock: 'Allow sell over company stock',
    update_aging_credit_sales: 'Update aging on credit sales',
    lead_time_safety_stock_months: 'Lead time + safety stock (months)',
    pricing_method: 'Pricing method',
    vat_percent: 'VAT %',
    customer_supplier_start_number: 'Customer / supplier start number',
    adjustment_start_number: 'Adjustment starting number',
    adjustment_transaction_prefix: 'Adjustment transaction prefix',
    sales_return_invoice_start: 'Sales return invoice start',
    sales_return_transaction_prefix: 'Sales return transaction prefix',
    cash_walkin_customer_start: 'Cash walk-in customer start',
    transfer_start_number: 'Transfer start number',
  },
  application: {
    app_id: 'App Id',
    app_name: 'App Name',
    description: 'Description',
    application_path: 'Application Path',
    data_path: 'Data Path',
    report_path: 'Report Path',
    assembly_file_name: 'Assembly File Name',
    name_space: 'Name Space',
    start_up_class: 'Start Up Class',
    method_name: 'Method Name',
    app_path_local: 'App Path (Local)',
    rep_path_local: 'Rep Path (Local)',
    current_period: 'Current Period',
    overwrite: 'Overwrite',
    report_header_logo_path: 'Report Header Logo Image',
  },
  address: {
    line_1: 'Address line 1',
    line_2: 'Address line 2',
    line_3: 'Address line 3',
  },
  email: {
    smtp_server_name: 'SMTP Server Name',
    smtp_port: 'SMTP Port',
    smtp_time_out: 'SMTP Time Out',
    send_from_email_address: 'Send From (Email Address)',
    login_name: 'Login Name',
    password: 'Password',
    use_login_credentials: 'Use Login Credentials',
    enable_ssl: 'Enable SSL',
    email_footer_line_1: 'Email Footer Line 1',
    email_footer_line_2: 'Email Footer Line 2',
  },
  sms: {
    message_server_type: 'Message Server Type',
    ms_sql_server_name: 'MS SQL Server Name',
    sql_server_user_id: 'SQL Server User Id',
    password: 'Password',
    database_name: 'Database Name',
    sender_number: 'Sender Number',
    footer_line_1: 'Footer Line 1',
    footer_line_2: 'Footer Line 2',
    footer_line_3: 'Footer Line 3',
    footer_line_4: 'Footer Line 4',
    footer_line_5: 'Footer Line 5',
  },
  default: {
    cash_sales_order_prefix: 'Cash Sales Order No.',
    cash_sales_order_next: 'Next No',
    cash_sales_order_max_length: 'Max Length',
    cash_sales_order_inc_year: 'Inc Yr',
    cash_sales_order_inc_month: 'Inc Mth',
    credit_sales_order_prefix: 'Credit Sales Order No.',
    credit_sales_order_next: 'Next No',
    credit_sales_order_max_length: 'Max Length',
    credit_sales_order_inc_year: 'Inc Yr',
    credit_sales_order_inc_month: 'Inc Mth',
    proforma_invoice_prefix: 'Proforma Invoice No.',
    proforma_invoice_next: 'Next No',
    proforma_invoice_max_length: 'Max Length',
    proforma_invoice_inc_year: 'Inc Yr',
    proforma_invoice_inc_month: 'Inc Mth',
    refund_credit_note_prefix: 'Refund/Credit Note No.',
    refund_credit_note_next: 'Next No',
    refund_credit_note_max_length: 'Max Length',
    refund_credit_note_inc_year: 'Inc Yr',
    refund_credit_note_inc_month: 'Inc Mth',
  },
}

function emptyState() {
  const base = {}
  for (const t of TABS) {
    base[t.id] = {}
    for (const key of Object.keys(LABELS[t.id] || {})) {
      base[t.id][key] = ''
    }
  }
  return base
}

function normalizeLoaded(data) {
  const next = emptyState()
  for (const tab of TABS) {
    const src = data[tab.id] || {}
    for (const key of Object.keys(LABELS[tab.id] || {})) {
      const v = src[key]
      next[tab.id][key] = v == null ? '' : String(v)
    }
  }
  return next
}

function toPayload(form) {
  const out = {}
  for (const tab of TABS) {
    out[tab.id] = { ...form[tab.id] }
    for (const key of Object.keys(out[tab.id])) {
      const v = out[tab.id][key]
      if (BOOL_FIELDS.has(key)) {
        out[tab.id][key] = v === true || v === 'true' ? 'true' : 'false'
      } else if (v === '') {
        out[tab.id][key] = null
      }
    }
  }
  return out
}

export default function CompanySetup() {
  const [tab, setTab] = useState('company')
  const [form, setForm] = useState(emptyState)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [savedMsg, setSavedMsg] = useState(null)
  const [logOpen, setLogOpen] = useState(false)
  const [logRows, setLogRows] = useState([])
  const [logLoading, setLogLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await companySetupApi.get()
      setForm(normalizeLoaded(res.data))
    } catch (e) {
      console.error(e)
      setError('Failed to load company setup')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const setField = (section, key, value) => {
    setForm((prev) => ({
      ...prev,
      [section]: { ...prev[section], [key]: value },
    }))
    setSavedMsg(null)
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSavedMsg(null)
    try {
      const res = await companySetupApi.update(toPayload(form))
      setForm(normalizeLoaded(res.data))
      setSavedMsg('Saved.')
    } catch (e) {
      console.error(e)
      const d = e.response?.data?.detail
      setError(typeof d === 'string' ? d : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const openLog = async () => {
    setLogOpen(true)
    setLogLoading(true)
    try {
      const res = await companySetupApi.auditLog()
      setLogRows(res.data || [])
    } catch (e) {
      console.error(e)
      setLogRows([])
    } finally {
      setLogLoading(false)
    }
  }

  const keysForTab = Object.keys(LABELS[tab] || {})
  const inputClass =
    'w-full rounded-sm border border-gray-400 bg-white px-2 py-1 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
  const labelClass = 'block text-xs font-medium text-gray-700 mb-1'

  const renderTextField = (section, key, options = {}) => {
    const label = LABELS[section][key]
    const value = form[section]?.[key] ?? ''
    const type = options.type || (key === 'password' ? 'password' : 'text')
    const wide = options.wide ? 'md:col-span-2' : ''
    const textArea = options.textArea

    return (
      <div key={key} className={wide}>
        <label className={labelClass}>{label}:</label>
        {textArea ? (
          <textarea
            className={`${inputClass} min-h-[74px]`}
            value={value}
            onChange={(e) => setField(section, key, e.target.value)}
          />
        ) : (
          <input
            type={type}
            className={inputClass}
            value={value}
            onChange={(e) => setField(section, key, e.target.value)}
          />
        )}
      </div>
    )
  }

  const renderBooleanField = (section, key, className = '') => {
    const checked = form[section]?.[key] === 'true' || form[section]?.[key] === true
    return (
      <label key={key} className={`inline-flex items-center gap-2 text-sm font-medium text-gray-800 ${className}`}>
        <span>{LABELS[section][key]}</span>
        <input
          type="checkbox"
          className="rounded border-gray-400 text-indigo-600 focus:ring-indigo-500"
          checked={checked}
          onChange={(e) => setField(section, key, e.target.checked ? 'true' : 'false')}
        />
      </label>
    )
  }

  const renderGenericTab = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
      {keysForTab.map((key) => {
        if (BOOL_FIELDS.has(key)) return renderBooleanField(tab, key, 'md:col-span-2')
        return renderTextField(tab, key, {
          wide: ['line_1', 'line_2', 'line_3'].includes(key),
          textArea: key.includes('footer') || key.startsWith('line_'),
        })
      })}
    </div>
  )

  const renderApplicationTab = () => (
    <div className="space-y-4">
      <div className="flex justify-end">{renderBooleanField('application', 'overwrite')}</div>
      <div className="grid grid-cols-1 md:grid-cols-[180px_minmax(0,1fr)] gap-x-4 gap-y-2 max-w-3xl">
        {[
          'app_id',
          'app_name',
          'description',
          'application_path',
          'data_path',
          'report_path',
          'assembly_file_name',
          'name_space',
          'start_up_class',
          'method_name',
          'app_path_local',
          'rep_path_local',
          'current_period',
        ].map((key) => (
          <div key={key} className="contents">
            <label className="text-sm text-right md:pt-1.5 text-gray-700">{LABELS.application[key]}:</label>
            <input
              className={`${inputClass} ${key === 'app_id' || key === 'current_period' ? 'max-w-[180px]' : ''}`}
              value={form.application?.[key] ?? ''}
              onChange={(e) => setField('application', key, e.target.value)}
            />
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={() => window.alert('Image preview is not wired yet.')}>
          Show Image
        </Button>
        <Button type="button" variant="outline" onClick={() => window.alert('Image upload is not wired yet.')}>
          Load Image
        </Button>
        <Button type="button" variant="outline" onClick={handleSave} disabled={saving || loading}>
          Save Image
        </Button>
        <Button type="button" variant="outline" onClick={() => setField('application', 'report_header_logo_path', '')}>
          Delete Image
        </Button>
      </div>
      {renderTextField('application', 'report_header_logo_path', { wide: true })}
    </div>
  )

  const renderEmailTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_260px] gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        {renderTextField('email', 'smtp_server_name')}
        {renderTextField('email', 'smtp_port')}
        {renderTextField('email', 'smtp_time_out')}
        {renderTextField('email', 'send_from_email_address', { wide: true })}
        {renderTextField('email', 'login_name', { wide: true })}
        {renderTextField('email', 'password', { wide: true })}
        {renderTextField('email', 'email_footer_line_1', { wide: true, textArea: true })}
        {renderTextField('email', 'email_footer_line_2', { wide: true, textArea: true })}
      </div>
      <div className="space-y-4 pt-1">
        {renderBooleanField('email', 'use_login_credentials')}
        {renderBooleanField('email', 'enable_ssl')}
      </div>
    </div>
  )

  const renderSmsTab = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
      {renderTextField('sms', 'message_server_type')}
      {renderTextField('sms', 'ms_sql_server_name')}
      {renderTextField('sms', 'sql_server_user_id')}
      {renderTextField('sms', 'password')}
      {renderTextField('sms', 'database_name')}
      {renderTextField('sms', 'sender_number')}
      {['footer_line_1', 'footer_line_2', 'footer_line_3', 'footer_line_4', 'footer_line_5'].map((key) =>
        renderTextField('sms', key, { wide: true, textArea: true })
      )}
    </div>
  )

  const defaultRows = [
    ['Cash Sales Order No.', 'cash_sales_order'],
    ['Credit Sales Order No.', 'credit_sales_order'],
    ['Proforma Invoice No.', 'proforma_invoice'],
    ['Refund/Credit Note No.', 'refund_credit_note'],
  ]

  const renderDefaultTab = () => (
    <fieldset className="border rounded-md px-4 pb-4 pt-2 max-w-4xl">
      <legend className="px-2 text-sm font-medium text-gray-800">Current Reference No Setup</legend>
      <div className="overflow-x-auto">
        <table className="min-w-[720px] text-sm">
          <thead>
            <tr>
              <th className="w-48" />
              <th className="px-2 py-2 text-left font-semibold">Prefix</th>
              <th className="px-2 py-2 text-left font-semibold">Next No</th>
              <th className="px-2 py-2 text-left font-semibold">Max Length</th>
              <th className="px-2 py-2 text-center font-semibold">Inc Yr</th>
              <th className="px-2 py-2 text-center font-semibold">Inc Mth</th>
            </tr>
          </thead>
          <tbody>
            {defaultRows.map(([label, base]) => (
              <tr key={base}>
                <td className="py-1 pr-3 text-right text-gray-700">{label}:</td>
                <td className="px-2 py-1">
                  <input
                    className={inputClass}
                    value={form.default?.[`${base}_prefix`] ?? ''}
                    onChange={(e) => setField('default', `${base}_prefix`, e.target.value)}
                  />
                </td>
                <td className="px-2 py-1">
                  <input
                    className={inputClass}
                    value={form.default?.[`${base}_next`] ?? ''}
                    onChange={(e) => setField('default', `${base}_next`, e.target.value)}
                  />
                </td>
                <td className="px-2 py-1">
                  <input
                    className={inputClass}
                    value={form.default?.[`${base}_max_length`] ?? ''}
                    onChange={(e) => setField('default', `${base}_max_length`, e.target.value)}
                  />
                </td>
                <td className="px-2 py-1 text-center">
                  <input
                    type="checkbox"
                    checked={form.default?.[`${base}_inc_year`] === 'true' || form.default?.[`${base}_inc_year`] === true}
                    onChange={(e) => setField('default', `${base}_inc_year`, e.target.checked ? 'true' : 'false')}
                  />
                </td>
                <td className="px-2 py-1 text-center">
                  <input
                    type="checkbox"
                    checked={
                      form.default?.[`${base}_inc_month`] === 'true' || form.default?.[`${base}_inc_month`] === true
                    }
                    onChange={(e) => setField('default', `${base}_inc_month`, e.target.checked ? 'true' : 'false')}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </fieldset>
  )

  const renderCurrentTab = () => {
    if (tab === 'application') return renderApplicationTab()
    if (tab === 'email') return renderEmailTab()
    if (tab === 'sms') return renderSmsTab()
    if (tab === 'default') return renderDefaultTab()
    return renderGenericTab()
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Company Setup</h1>
          <p className="text-sm text-gray-600 mt-1">
            HillMaster-style company, application, messaging, and default numbering (stored in system settings).
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={openLog}>
            View Log
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving || loading}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 text-red-800 text-sm px-4 py-2 border border-red-200">{error}</div>
      )}
      {savedMsg && (
        <div className="rounded-md bg-emerald-50 text-emerald-800 text-sm px-4 py-2 border border-emerald-200">
          {savedMsg}
        </div>
      )}

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="flex flex-wrap border-b bg-slate-50/80">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t.id
                  ? 'border-indigo-600 text-indigo-700 bg-white'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-white/60'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-4 sm:p-6">
          {loading ? (
            <p className="text-gray-500 text-sm">Loading…</p>
          ) : renderCurrentTab()}
        </div>
      </div>

      {logOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" role="dialog">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h2 className="font-semibold text-gray-900">Company setup change log</h2>
              <button
                type="button"
                className="text-gray-500 hover:text-gray-800 text-sm"
                onClick={() => setLogOpen(false)}
              >
                Close
              </button>
            </div>
            <div className="p-4 overflow-y-auto text-sm flex-1">
              {logLoading ? (
                <p className="text-gray-500">Loading…</p>
              ) : logRows.length === 0 ? (
                <p className="text-gray-500">No saves recorded yet.</p>
              ) : (
                <ul className="space-y-4">
                  {logRows.map((row) => (
                    <li key={row.log_id} className="border rounded-md p-3 bg-slate-50/80">
                      <div className="text-xs text-gray-500 mb-2">
                        #{row.log_id} · user {row.user_id ?? '—'} · {row.created_at ?? ''}
                      </div>
                      <pre className="text-xs overflow-x-auto whitespace-pre-wrap break-words bg-white border rounded p-2">
                        {JSON.stringify({ before: row.old_values, after: row.new_values }, null, 2)}
                      </pre>
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
