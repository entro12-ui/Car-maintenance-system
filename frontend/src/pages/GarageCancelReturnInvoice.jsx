import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { garageInvoicesApi } from '../services/api'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'

export default function GarageCancelReturnInvoice() {
  const queryClient = useQueryClient()

  const [invoiceId, setInvoiceId] = useState('')
  const [action, setAction] = useState('cancel')
  const [reason, setReason] = useState('')
  const [letterRef, setLetterRef] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['garageInvoices', { status: 'Issued' }],
    queryFn: () => garageInvoicesApi.list({ status: 'Issued' }),
  })

  const invoices = useMemo(() => data?.data || [], [data])

  const mutation = useMutation({
    mutationFn: ({ id, payload, act }) => {
      if (act === 'cancel') return garageInvoicesApi.cancel(id, payload)
      return garageInvoicesApi.returnInvoice(id, payload)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['garageInvoices'] })
      setReason('')
      setLetterRef('')
    },
  })

  const submit = () => {
    const id = Number(invoiceId)
    if (!Number.isFinite(id) || id <= 0) return
    const payload = { reason: (reason || '').trim(), letter_reference: (letterRef || '').trim() || null }
    mutation.mutate({ id, payload, act: action })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Cancel / Return Invoice</h1>
        <p className="text-muted-foreground">Cancel or return an issued invoice with a reason and letter reference.</p>
      </div>

      <Card className="p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground/90">Invoice ID</label>
            <Input className="mt-1" value={invoiceId} onChange={(e) => setInvoiceId(e.target.value)} placeholder="e.g. 10" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground/90">Action</label>
            <select className="mt-1 w-full border rounded-md px-3 py-2" value={action} onChange={(e) => setAction(e.target.value)}>
              <option value="cancel">Cancel</option>
              <option value="return">Return</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-foreground/90">Reason</label>
            <Input className="mt-1" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason" />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-foreground/90">Letter Reference (optional)</label>
            <Input className="mt-1" value={letterRef} onChange={(e) => setLetterRef(e.target.value)} placeholder="Letter reference" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button type="button" onClick={submit} disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving...' : 'Submit'}
          </Button>
          {mutation.error && (
            <div className="text-sm text-red-600">
              {mutation.error?.response?.data?.detail || 'Operation failed'}
            </div>
          )}
          {mutation.isSuccess && <div className="text-sm text-green-700">Done.</div>}
        </div>
      </Card>

      <Card className="p-4">
        <div className="text-sm font-semibold text-foreground mb-3">Issued Invoices</div>
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : invoices.length === 0 ? (
          <div className="text-sm text-muted-foreground">No issued invoices.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">ID</th>
                  <th className="text-left py-2 px-2">No</th>
                  <th className="text-left py-2 px-2">Type</th>
                  <th className="text-left py-2 px-2">Job</th>
                  <th className="text-right py-2 px-2">Total</th>
                  <th className="text-left py-2 px-2">Collected</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((i) => (
                  <tr key={i.invoice_id} className="border-b last:border-0">
                    <td className="py-2 px-2 font-mono">{i.invoice_id}</td>
                    <td className="py-2 px-2 font-mono">{i.invoice_number}</td>
                    <td className="py-2 px-2">{i.invoice_type}</td>
                    <td className="py-2 px-2">#{i.job_order_id}</td>
                    <td className="py-2 px-2 text-right">{Number(i.total_amount || 0).toFixed(2)}</td>
                    <td className="py-2 px-2">{i.is_collected ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
