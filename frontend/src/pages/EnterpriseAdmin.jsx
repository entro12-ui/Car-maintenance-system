import { useEffect, useState } from 'react'
import { enterpriseAdminApi, glApi } from '../services/api'

export default function EnterpriseAdmin() {
  const [templates, setTemplates] = useState([])
  const [reports, setReports] = useState([])
  const [rules, setRules] = useState([])
  const [accounts, setAccounts] = useState([])
  const [error, setError] = useState(null)

  const [templateForm, setTemplateForm] = useState({ template_code: '', title: '', category: 'Memo', body: '' })
  const [reportForm, setReportForm] = useState({ report_code: '', report_name: '', report_group: 'UserDefined', description: '', query_definition: '' })
  const [ruleForm, setRuleForm] = useState({ event_code: 'GARAGE_INVOICE_ISSUED', description: '', debit_account_id: '', credit_account_id: '', amount_source: 'TOTAL_AMOUNT' })

  const loadAll = async () => {
    setError(null)
    try {
      const [t, r, rl, a] = await Promise.all([
        enterpriseAdminApi.listMemoTemplates({}),
        enterpriseAdminApi.listUserDefinedReports({}),
        enterpriseAdminApi.listGlPostingRules({}),
        glApi.listAccounts({ include_inactive: false }),
      ])
      setTemplates(t.data || [])
      setReports(r.data || [])
      setRules(rl.data || [])
      setAccounts(a.data || [])
    } catch (err) {
      console.error(err)
      setError('Failed to load enterprise admin data')
    }
  }

  useEffect(() => { loadAll() }, [])

  const createTemplate = async (e) => {
    e.preventDefault()
    try {
      await enterpriseAdminApi.createMemoTemplate(templateForm)
      setTemplateForm({ template_code: '', title: '', category: 'Memo', body: '' })
      await loadAll()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create template')
    }
  }

  const createReport = async (e) => {
    e.preventDefault()
    try {
      await enterpriseAdminApi.createUserDefinedReport(reportForm)
      setReportForm({ report_code: '', report_name: '', report_group: 'UserDefined', description: '', query_definition: '' })
      await loadAll()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create report')
    }
  }

  const createRule = async (e) => {
    e.preventDefault()
    try {
      await enterpriseAdminApi.createGlPostingRule({
        ...ruleForm,
        debit_account_id: parseInt(ruleForm.debit_account_id, 10),
        credit_account_id: parseInt(ruleForm.credit_account_id, 10),
      })
      setRuleForm({ event_code: 'GARAGE_INVOICE_ISSUED', description: '', debit_account_id: '', credit_account_id: '', amount_source: 'TOTAL_AMOUNT' })
      await loadAll()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create GL posting rule')
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">Enterprise Admin</h1>
      <p className="text-sm text-muted-foreground">
        Remaining manual parity features: memo templates, user-defined reports, and GL auto-posting rules.
      </p>
      {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">{error}</div>}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <form onSubmit={createTemplate} className="bg-white shadow rounded-lg p-4 space-y-2">
          <h2 className="font-semibold">Letter / Memo Template</h2>
          <input className="border rounded px-2 py-1 w-full text-sm" placeholder="Template code" value={templateForm.template_code} onChange={(e) => setTemplateForm({ ...templateForm, template_code: e.target.value })} />
          <input className="border rounded px-2 py-1 w-full text-sm" placeholder="Title" value={templateForm.title} onChange={(e) => setTemplateForm({ ...templateForm, title: e.target.value })} />
          <input className="border rounded px-2 py-1 w-full text-sm" placeholder="Category" value={templateForm.category} onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value })} />
          <textarea className="border rounded px-2 py-1 w-full text-sm min-h-[90px]" placeholder="Body template" value={templateForm.body} onChange={(e) => setTemplateForm({ ...templateForm, body: e.target.value })} />
          <button className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700">Add Template</button>
          <div className="text-xs text-muted-foreground">Existing: {templates.length}</div>
        </form>

        <form onSubmit={createReport} className="bg-white shadow rounded-lg p-4 space-y-2">
          <h2 className="font-semibold">User Defined Report</h2>
          <input className="border rounded px-2 py-1 w-full text-sm" placeholder="Report code" value={reportForm.report_code} onChange={(e) => setReportForm({ ...reportForm, report_code: e.target.value })} />
          <input className="border rounded px-2 py-1 w-full text-sm" placeholder="Report name" value={reportForm.report_name} onChange={(e) => setReportForm({ ...reportForm, report_name: e.target.value })} />
          <input className="border rounded px-2 py-1 w-full text-sm" placeholder="Group (e.g. Custom)" value={reportForm.report_group} onChange={(e) => setReportForm({ ...reportForm, report_group: e.target.value })} />
          <input className="border rounded px-2 py-1 w-full text-sm" placeholder="Description" value={reportForm.description} onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })} />
          <textarea className="border rounded px-2 py-1 w-full text-sm min-h-[70px]" placeholder="Query definition / logic" value={reportForm.query_definition} onChange={(e) => setReportForm({ ...reportForm, query_definition: e.target.value })} />
          <button className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700">Add Report</button>
          <div className="text-xs text-muted-foreground">Existing: {reports.length}</div>
        </form>

        <form onSubmit={createRule} className="bg-white shadow rounded-lg p-4 space-y-2">
          <h2 className="font-semibold">GL Auto-Posting Rule</h2>
          <select className="border rounded px-2 py-1 w-full text-sm" value={ruleForm.event_code} onChange={(e) => setRuleForm({ ...ruleForm, event_code: e.target.value })}>
            <option value="GARAGE_INVOICE_ISSUED">GARAGE_INVOICE_ISSUED</option>
            <option value="GARAGE_INVOICE_CANCELLED">GARAGE_INVOICE_CANCELLED</option>
            <option value="GARAGE_INVOICE_RETURNED">GARAGE_INVOICE_RETURNED</option>
          </select>
          <input className="border rounded px-2 py-1 w-full text-sm" placeholder="Description" value={ruleForm.description} onChange={(e) => setRuleForm({ ...ruleForm, description: e.target.value })} />
          <select className="border rounded px-2 py-1 w-full text-sm" value={ruleForm.debit_account_id} onChange={(e) => setRuleForm({ ...ruleForm, debit_account_id: e.target.value })}>
            <option value="">Debit account</option>
            {accounts.map((a) => <option key={a.account_id} value={a.account_id}>{a.account_code} - {a.account_name}</option>)}
          </select>
          <select className="border rounded px-2 py-1 w-full text-sm" value={ruleForm.credit_account_id} onChange={(e) => setRuleForm({ ...ruleForm, credit_account_id: e.target.value })}>
            <option value="">Credit account</option>
            {accounts.map((a) => <option key={a.account_id} value={a.account_id}>{a.account_code} - {a.account_name}</option>)}
          </select>
          <select className="border rounded px-2 py-1 w-full text-sm" value={ruleForm.amount_source} onChange={(e) => setRuleForm({ ...ruleForm, amount_source: e.target.value })}>
            <option value="TOTAL_AMOUNT">TOTAL_AMOUNT</option>
            <option value="SUBTOTAL">SUBTOTAL</option>
            <option value="DISCOUNT_AMOUNT">DISCOUNT_AMOUNT</option>
          </select>
          <button className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700">Add Rule</button>
          <div className="text-xs text-muted-foreground">Existing: {rules.length}</div>
        </form>
      </div>
    </div>
  )
}

