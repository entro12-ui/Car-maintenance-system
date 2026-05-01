import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { garageInvoicesApi } from '../services/api'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'

export default function GarageProformaInvoice() {
  const navigate = useNavigate()
  const [invoiceMode, setInvoiceMode] = useState('Proforma')
  const [salesType, setSalesType] = useState('Cash')
  const [jobOrderId, setJobOrderId] = useState('')

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['garageInvoiceEligibleJobs', { invoiceType: salesType }],
    queryFn: () => garageInvoicesApi.listEligibleJobs(salesType),
  })

  const jobs = useMemo(() => data?.data || [], [data])

  const {
    data: previewData,
    isFetching: previewLoading,
    error: previewError,
  } = useQuery({
    queryKey: ['garageProformaPreview', { jobOrderId, salesType }],
    queryFn: () => garageInvoicesApi.proformaPreview(jobOrderId, salesType),
    enabled: !!jobOrderId,
  })

  const p = previewData?.data

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Proforma / Invoice Printing</h1>
        <p className="text-muted-foreground">
          Print Proforma for a closed, uninvoiced job. Select sales type then choose a closed job number.
        </p>
      </div>

      <Card className="p-4 space-y-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="text-sm font-medium">Invoice Type:</div>
          <label className="text-sm flex items-center gap-2">
            <input
              type="radio"
              checked={invoiceMode === 'Proforma'}
              onChange={() => setInvoiceMode('Proforma')}
            />
            Proforma
          </label>
          <label className="text-sm flex items-center gap-2">
            <input
              type="radio"
              checked={invoiceMode === 'Sales Invoice'}
              onChange={() => {
                setInvoiceMode('Sales Invoice')
                if (salesType === 'Cash') navigate('/garage-invoices/cash')
                else if (salesType === 'Credit') navigate('/garage-invoices/credit')
                else navigate('/garage-invoices/itm')
              }}
            />
            Sales Invoice
          </label>
          <div className="mx-3 h-5 w-px bg-border" />
          <div className="text-sm font-medium">Sales Type:</div>
          {['Cash', 'Credit', 'ITM'].map((t) => (
            <label key={t} className="text-sm flex items-center gap-2">
              <input
                type="radio"
                checked={salesType === t}
                onChange={() => {
                  setSalesType(t)
                  setJobOrderId('')
                  if (invoiceMode === 'Sales Invoice') {
                    if (t === 'Cash') navigate('/garage-invoices/cash')
                    else if (t === 'Credit') navigate('/garage-invoices/credit')
                    else navigate('/garage-invoices/itm')
                  }
                }}
              />
              {t}
            </label>
          ))}
          <Button type="button" variant="outline" onClick={() => { setJobOrderId(''); refetch() }}>
            Refresh
          </Button>
          <Button type="button" onClick={() => window.print()} disabled={!p}>
            Print Invoice
          </Button>
        </div>

        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading eligible jobs...</div>
        ) : error ? (
          <div className="text-sm text-red-600">Failed to load eligible jobs.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="text-sm">
              <span className="text-muted-foreground">JobCard No.</span>
              <select
                className="w-full mt-1 border rounded px-2 py-1.5"
                value={jobOrderId}
                onChange={(e) => setJobOrderId(e.target.value)}
              >
                <option value="">Select closed job...</option>
                {jobs.map((j) => (
                  <option key={j.job_order_id} value={j.job_order_id}>
                    {j.job_order_number} - {j.customer_name || (j.customer_id ? `#${j.customer_id}` : '-')}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="text-muted-foreground">Plate No.</span>
              <input className="w-full mt-1 border rounded px-2 py-1.5 bg-muted/35" value={p?.vehicle_plate || ''} readOnly />
            </label>
          </div>
        )}

        {previewLoading && <div className="text-sm text-muted-foreground">Loading proforma preview...</div>}
        {previewError && <div className="text-sm text-red-600">{previewError?.response?.data?.detail || 'Failed to build preview'}</div>}

        {p && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
            <label className="text-sm">
              <span className="text-muted-foreground">Customer Name</span>
              <input className="w-full mt-1 border rounded px-2 py-1.5 bg-muted/35" value={p.customer_name || ''} readOnly />
            </label>
            <label className="text-sm">
              <span className="text-muted-foreground">Address</span>
              <input className="w-full mt-1 border rounded px-2 py-1.5 bg-muted/35" value={p.customer_address || ''} readOnly />
            </label>
            <label className="text-sm">
              <span className="text-muted-foreground">Prof Invoice No.</span>
              <input className="w-full mt-1 border rounded px-2 py-1.5 bg-muted/35" value={p.proforma_number || ''} readOnly />
            </label>
            <label className="text-sm">
              <span className="text-muted-foreground">Proforma Date</span>
              <input className="w-full mt-1 border rounded px-2 py-1.5 bg-muted/35" value={p.proforma_date || ''} readOnly />
            </label>
            <label className="text-sm">
              <span className="text-muted-foreground">Repair Type</span>
              <input className="w-full mt-1 border rounded px-2 py-1.5 bg-muted/35" value={p.repair_type || ''} readOnly />
            </label>
            <label className="text-sm">
              <span className="text-muted-foreground">Total Amount</span>
              <input className="w-full mt-1 border rounded px-2 py-1.5 bg-muted/35" value={Number(p.total_amount || 0).toFixed(2)} readOnly />
            </label>
            <div className="md:col-span-2 text-red-600 font-semibold">
              Total Number of Line Items to be Printed is{' '}
              {p.line_items_count ?? (
                (p?.totals ? ['labor_total', 'parts_total', 'charges_total'].filter((k) => Number(p.totals[k] || 0) > 0).length : 0)
              )}
            </div>
            <div className="md:col-span-2 border rounded p-3 bg-muted/35">
              <div className="font-semibold text-foreground/90 mb-2">Customer Details</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div>TIN: {p.customer_tin || '-'}</div>
                <div>Tel No: {p.customer_phone || '-'}</div>
                <div>Sub City: {p.customer_city || '-'}</div>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

