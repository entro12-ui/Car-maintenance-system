import { useEffect, useState } from 'react'
import { garageInvoicesApi } from '../services/api'

export default function CreditNoteEntry() {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [reason, setReason] = useState('')

  const loadInvoices = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await garageInvoicesApi.list({})
      setInvoices(res.data || [])
    } catch (err) {
      console.error(err)
      setError('Failed to load invoices')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInvoices()
  }, [])

  const handleCreditNote = async (invoiceId) => {
    if (!reason.trim()) {
      setError('Reason is required')
      return
    }
    setError(null)
    try {
      await garageInvoicesApi.returnInvoice(invoiceId, { reason })
      setReason('')
      await loadInvoices()
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.detail || 'Failed to create credit note')
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Credit Note Entry</h1>
      <p className="text-sm text-muted-foreground">
        Uses the existing cancel/return invoice flow to issue a credit note-like reversal.
      </p>
      <input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Reason for credit note / return"
        className="border rounded px-3 py-2 w-full md:w-1/2 text-sm"
      />
      {error && <div className="text-sm text-red-600">{error}</div>}
      <div className="bg-white shadow rounded-lg overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/35">
            <tr>
              <th className="px-3 py-2 text-left">Invoice</th>
              <th className="px-3 py-2 text-left">Type</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(invoices || []).map((inv) => (
              <tr key={inv.garage_invoice_id} className="border-t">
                <td className="px-3 py-2">{inv.invoice_number || inv.garage_invoice_id}</td>
                <td className="px-3 py-2">{inv.invoice_type}</td>
                <td className="px-3 py-2">{inv.status || '-'}</td>
                <td className="px-3 py-2 text-right">
                  <button
                    onClick={() => handleCreditNote(inv.garage_invoice_id)}
                    className="text-xs px-2 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700"
                  >
                    Create Credit Note
                  </button>
                </td>
              </tr>
            ))}
            {!loading && invoices.length === 0 && (
              <tr>
                <td className="px-3 py-4 text-center text-muted-foreground" colSpan={4}>No invoices found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

