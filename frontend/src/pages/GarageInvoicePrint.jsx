import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { garageInvoicesApi } from '../services/api'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'

function money(v) {
  const n = Number(v)
  if (!Number.isFinite(n)) return '0.00'
  return n.toFixed(2)
}

export default function GarageInvoicePrint() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data, isLoading, error } = useQuery({
    queryKey: ['garageInvoicePrint', id],
    queryFn: () => garageInvoicesApi.print(id),
  })

  const payload = data?.data
  const invoice = payload?.invoice

  const hasLines = useMemo(() => {
    return (payload?.labor_lines?.length || 0) + (payload?.part_lines?.length || 0) + (payload?.charge_lines?.length || 0) > 0
  }, [payload])

  if (isLoading) return <div className="flex justify-center items-center h-64">Loading...</div>
  if (error) return <div className="text-red-600">Failed to load invoice</div>
  if (!payload || !invoice) return <div className="text-center py-8">Invoice not found</div>

  return (
    <div className="space-y-4">
      <div className="flex gap-2 no-print">
        <Button variant="outline" type="button" onClick={() => navigate(-1)}>Back</Button>
        <Button type="button" onClick={() => window.print()}>Print</Button>
      </div>

      <Card className="p-6 bg-white">
        <div className="border-b pb-4 mb-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xl font-bold text-foreground">GARAGE INVOICE</div>
              <div className="text-sm text-muted-foreground">Invoice Type: <span className="font-medium">{invoice.invoice_type}</span></div>
              <div className="text-sm text-muted-foreground">Status: <span className="font-medium">{invoice.status}</span></div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Invoice No</div>
              <div className="text-lg font-mono font-semibold">{invoice.invoice_number}</div>
              <div className="text-xs text-muted-foreground">Created: {invoice.created_at ? new Date(invoice.created_at).toLocaleString() : '-'}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="text-sm">
            <div className="font-semibold text-foreground mb-1">Job</div>
            <div>Job No: <span className="font-mono">{payload.job_order_number}</span></div>
            <div>Status: {payload.job_order_status}</div>
            <div>Closed At: {payload.closed_at ? new Date(payload.closed_at).toLocaleString() : '-'}</div>
          </div>
          <div className="text-sm">
            <div className="font-semibold text-foreground mb-1">Customer / Vehicle</div>
            <div>Customer: {payload.customer_name || '-'}</div>
            <div>Phone: {payload.customer_phone || '-'}</div>
            <div>Vehicle: {payload.vehicle_plate || '-'} {payload.vehicle_make ? `(${payload.vehicle_make} ${payload.vehicle_model || ''})` : ''}</div>
          </div>
        </div>

        <div className="space-y-6">
          {payload.labor_lines?.length > 0 && (
            <div>
              <div className="font-semibold text-foreground mb-2">Labor</div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-2">Type</th>
                      <th className="text-left py-2 px-2">Technician</th>
                      <th className="text-right py-2 px-2">Hours</th>
                      <th className="text-right py-2 px-2">Rate</th>
                      <th className="text-right py-2 px-2">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payload.labor_lines.map((l, idx) => (
                      <tr key={idx} className="border-b last:border-0">
                        <td className="py-2 px-2">{l.labor_type_name}</td>
                        <td className="py-2 px-2">{l.technician_name || '-'}</td>
                        <td className="py-2 px-2 text-right">{money(l.hours_worked)}</td>
                        <td className="py-2 px-2 text-right">{money(l.hourly_rate)}</td>
                        <td className="py-2 px-2 text-right">{money(l.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {payload.part_lines?.length > 0 && (
            <div>
              <div className="font-semibold text-foreground mb-2">Parts</div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-2">Part</th>
                      <th className="text-right py-2 px-2">Qty</th>
                      <th className="text-right py-2 px-2">Unit</th>
                      <th className="text-right py-2 px-2">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payload.part_lines.map((p) => (
                      <tr key={p.part_id} className="border-b last:border-0">
                        <td className="py-2 px-2">{p.part_name}</td>
                        <td className="py-2 px-2 text-right">{p.quantity}</td>
                        <td className="py-2 px-2 text-right">{money(p.unit_price)}</td>
                        <td className="py-2 px-2 text-right">{money(p.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {payload.charge_lines?.length > 0 && (
            <div>
              <div className="font-semibold text-foreground mb-2">Additional Charges</div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-2">Category</th>
                      <th className="text-left py-2 px-2">Code</th>
                      <th className="text-left py-2 px-2">Description</th>
                      <th className="text-right py-2 px-2">Qty</th>
                      <th className="text-right py-2 px-2">Unit</th>
                      <th className="text-right py-2 px-2">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payload.charge_lines.map((c, idx) => (
                      <tr key={idx} className="border-b last:border-0">
                        <td className="py-2 px-2">{c.category}</td>
                        <td className="py-2 px-2 font-mono">{c.code}</td>
                        <td className="py-2 px-2">{c.description}</td>
                        <td className="py-2 px-2 text-right">{money(c.quantity)}</td>
                        <td className="py-2 px-2 text-right">{money(c.unit_price)}</td>
                        <td className="py-2 px-2 text-right">{money(c.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!hasLines && <div className="text-sm text-muted-foreground">No billable lines found.</div>}

          <div className="border-t pt-4">
            <div className="max-w-md ml-auto text-sm">
              <div className="flex justify-between py-1"><span>Labor Total</span><span>{money(invoice.labor_total)}</span></div>
              <div className="flex justify-between py-1"><span>Parts Total</span><span>{money(invoice.parts_total)}</span></div>
              <div className="flex justify-between py-1"><span>Charges Total</span><span>{money(invoice.charges_total)}</span></div>
              <div className="flex justify-between py-1 font-semibold"><span>Subtotal</span><span>{money(invoice.subtotal)}</span></div>
              <div className="flex justify-between py-1"><span>Discount ({money(invoice.discount_rate)}%)</span><span>-{money(invoice.discount_amount)}</span></div>
              <div className="flex justify-between py-1 text-base font-bold"><span>Total</span><span>{money(invoice.total_amount)}</span></div>
            </div>
          </div>
        </div>
      </Card>

      <style>{`@media print { .no-print { display: none; } }`}</style>
    </div>
  )
}
