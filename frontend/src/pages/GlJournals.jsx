import { useEffect, useState } from 'react'
import { glApi } from '../services/api'

function GlJournals() {
  const [journals, setJournals] = useState([])
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [filterStatus, setFilterStatus] = useState('')

  const [form, setForm] = useState({
    journal_date: new Date().toISOString().slice(0, 10),
    description: '',
    source_type: 'GarageInvoice',
    source_id: '',
    lines: [
      { account_id: '', description: '', debit: '', credit: '' },
      { account_id: '', description: '', debit: '', credit: '' },
    ],
  })

  const loadAccounts = async () => {
    try {
      const res = await glApi.listAccounts({})
      setAccounts(res.data)
    } catch (err) {
      console.error(err)
      setError('Failed to load GL accounts')
    }
  }

  const loadJournals = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = {}
      if (filterStatus) params.status = filterStatus
      const res = await glApi.listJournals(params)
      setJournals(res.data)
    } catch (err) {
      console.error(err)
      setError('Failed to load journals')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAccounts()
    loadJournals()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleLineChange = (index, field, value) => {
    setForm((prev) => {
      const lines = [...prev.lines]
      lines[index] = { ...lines[index], [field]: value }
      return { ...prev, lines }
    })
  }

  const addLine = () => {
    setForm((prev) => ({
      ...prev,
      lines: [...prev.lines, { account_id: '', description: '', debit: '', credit: '' }],
    }))
  }

  const handleCreateJournal = async (e) => {
    e.preventDefault()
    setError(null)
    try {
      const lines = form.lines
        .map((l) => ({
          account_id: l.account_id ? parseInt(l.account_id, 10) : null,
          description: l.description || null,
          debit: l.debit ? parseFloat(l.debit) : 0,
          credit: l.credit ? parseFloat(l.credit) : 0,
        }))
        .filter((l) => l.account_id && (l.debit || l.credit))

      if (lines.length === 0) {
        setError('At least one line with account and amount is required')
        return
      }

      await glApi.createJournal({
        journal_date: form.journal_date,
        description: form.description || null,
        source_type: form.source_type || null,
        source_id: form.source_id ? parseInt(form.source_id, 10) : null,
        lines,
      })

      setForm({
        journal_date: new Date().toISOString().slice(0, 10),
        description: '',
        source_type: 'GarageInvoice',
        source_id: '',
        lines: [
          { account_id: '', description: '', debit: '', credit: '' },
          { account_id: '', description: '', debit: '', credit: '' },
        ],
      })

      await loadJournals()
    } catch (err) {
      console.error(err)
      const msg =
        err.response?.data?.detail ||
        (Array.isArray(err.response?.data) && err.response.data[0]?.msg) ||
        'Failed to create journal'
      setError(msg)
    }
  }

  const handlePost = async (journalId) => {
    setError(null)
    try {
      await glApi.postJournal(journalId)
      await loadJournals()
    } catch (err) {
      console.error(err)
      const msg = err.response?.data?.detail || 'Failed to post journal'
      setError(msg)
    }
  }

  const totalDebit = form.lines.reduce(
    (sum, l) => sum + (l.debit ? parseFloat(l.debit) : 0),
    0
  )
  const totalCredit = form.lines.reduce(
    (sum, l) => sum + (l.credit ? parseFloat(l.credit) : 0),
    0
  )

  const isBalanced =
    Math.round(totalDebit * 100) === Math.round(totalCredit * 100) && totalDebit > 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">GL Journals</h1>
      </div>

      <div className="bg-white shadow rounded-lg p-4 space-y-4">
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
            {error}
          </div>
        )}

        <form onSubmit={handleCreateJournal} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Date
              </label>
              <input
                type="date"
                value={form.journal_date}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, journal_date: e.target.value }))
                }
                className="border rounded px-2 py-1 w-full text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Source type
              </label>
              <input
                type="text"
                value={form.source_type}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, source_type: e.target.value }))
                }
                className="border rounded px-2 py-1 w-full text-sm"
                placeholder="GarageInvoice, JobOrder..."
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Source ID
              </label>
              <input
                type="number"
                value={form.source_id}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, source_id: e.target.value }))
                }
                className="border rounded px-2 py-1 w-full text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Description
              </label>
              <input
                type="text"
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, description: e.target.value }))
                }
                className="border rounded px-2 py-1 w-full text-sm"
              />
            </div>
          </div>

          <div className="border rounded-md overflow-hidden">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/35">
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground">
                    Account
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground">
                    Description
                  </th>
                  <th className="px-2 py-2 text-right text-xs font-medium text-muted-foreground">
                    Debit
                  </th>
                  <th className="px-2 py-2 text-right text-xs font-medium text-muted-foreground">
                    Credit
                  </th>
                </tr>
              </thead>
              <tbody>
                {form.lines.map((line, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="px-2 py-1">
                      <select
                        value={line.account_id}
                        onChange={(e) =>
                          handleLineChange(idx, 'account_id', e.target.value)
                        }
                        className="border rounded px-1 py-1 w-full text-xs"
                      >
                        <option value="">Select account</option>
                        {accounts.map((a) => (
                          <option key={a.account_id} value={a.account_id}>
                            {a.account_code} - {a.account_name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-1">
                      <input
                        type="text"
                        value={line.description}
                        onChange={(e) =>
                          handleLineChange(idx, 'description', e.target.value)
                        }
                        className="border rounded px-1 py-1 w-full text-xs"
                      />
                    </td>
                    <td className="px-2 py-1 text-right">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.debit}
                        onChange={(e) =>
                          handleLineChange(idx, 'debit', e.target.value)
                        }
                        className="border rounded px-1 py-1 w-24 text-xs text-right"
                      />
                    </td>
                    <td className="px-2 py-1 text-right">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.credit}
                        onChange={(e) =>
                          handleLineChange(idx, 'credit', e.target.value)
                        }
                        className="border rounded px-1 py-1 w-24 text-xs text-right"
                      />
                    </td>
                  </tr>
                ))}
                <tr className="border-t bg-muted/35">
                  <td className="px-2 py-1 text-xs text-muted-foreground" colSpan={2}>
                    <button
                      type="button"
                      onClick={addLine}
                      className="text-indigo-600 hover:text-indigo-800 text-xs"
                    >
                      + Add line
                    </button>
                  </td>
                  <td className="px-2 py-1 text-right text-xs font-semibold">
                    {totalDebit.toFixed(2)}
                  </td>
                  <td className="px-2 py-1 text-right text-xs font-semibold">
                    {totalCredit.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-xs">
              <span
                className={
                  isBalanced
                    ? 'text-green-600 font-medium'
                    : 'text-red-600 font-medium'
                }
              >
                {isBalanced ? 'Balanced' : 'Not balanced'}
              </span>{' '}
              <span className="text-muted-foreground">
                (Debit = {totalDebit.toFixed(2)}, Credit ={' '}
                {totalCredit.toFixed(2)})
              </span>
            </div>
            <button
              type="submit"
              className="inline-flex items-center px-4 py-1.5 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
            >
              Create Journal
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-2 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-foreground/90">
              Journals ({journals.length})
            </h2>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value)
                // reload with new filter
                glApi
                  .listJournals(e.target.value ? { status: e.target.value } : {})
                  .then((res) => setJournals(res.data))
                  .catch((err) => {
                    console.error(err)
                    setError('Failed to load journals')
                  })
              }}
              className="border rounded px-2 py-1 text-xs"
            >
              <option value="">All statuses</option>
              <option value="Draft">Draft</option>
              <option value="Posted">Posted</option>
            </select>
          </div>
          {loading && <span className="text-xs text-muted-foreground">Loading...</span>}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/35">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                  Number / Date
                </th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                  Source
                </th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                  Description
                </th>
                <th className="px-3 py-2 text-right font-medium text-muted-foreground">
                  Debit
                </th>
                <th className="px-3 py-2 text-right font-medium text-muted-foreground">
                  Credit
                </th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                  Status
                </th>
                <th className="px-3 py-2 text-right font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {journals.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="px-3 py-4 text-center text-muted-foreground">
                    No journals found.
                  </td>
                </tr>
              )}
              {journals.map((j) => (
                <tr key={j.journal_id} className="border-t align-top">
                  <td className="px-3 py-2 text-xs">
                    <div className="font-mono">{j.journal_number}</div>
                    <div className="text-muted-foreground">
                      {j.journal_date}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {j.source_type || '-'}
                    {j.source_id ? ` #${j.source_id}` : ''}
                  </td>
                  <td className="px-3 py-2 text-xs text-foreground/90">
                    {j.description || ''}
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      {j.lines.map((l) => (
                        <div key={l.journal_line_id}>
                          {l.account_code} {l.debit > 0 ? `Dr ${l.debit}` : ''}
                          {l.credit > 0 ? ` Cr ${l.credit}` : ''}{' '}
                          {l.description ? ` - ${l.description}` : ''}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right text-xs">
                    {j.total_debit.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 text-right text-xs">
                    {j.total_credit.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] ${
                        j.status === 'Posted'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {j.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right text-xs">
                    {j.status !== 'Posted' && (
                      <button
                        type="button"
                        onClick={() => handlePost(j.journal_id)}
                        className="text-indigo-600 hover:text-indigo-800 text-xs"
                      >
                        Post
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default GlJournals

