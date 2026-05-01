import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { garageInvoicesApi } from '../services/api'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'

function fmtAmount(v) {
  const n = Number(v)
  return Number.isFinite(n) ? n.toFixed(2) : '0.00'
}

export default function GarageInvoiceEntryForm({ invoiceType, title, subtitle, itmMode = false }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [jobOrderId, setJobOrderId] = useState('')

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['garageInvoiceEligibleJobs', { invoiceType }],
    queryFn: () => garageInvoicesApi.listEligibleJobs(invoiceType),
  })
  const jobs = useMemo(() => data?.data || [], [data])
  const selected = useMemo(() => jobs.find((j) => String(j.job_order_id) === String(jobOrderId)), [jobs, jobOrderId])

  const {
    data: previewData,
    isFetching: previewLoading,
    error: previewError,
  } = useQuery({
    queryKey: ['garageInvoicePreview', { jobOrderId, invoiceType }],
    queryFn: () => garageInvoicesApi.proformaPreview(jobOrderId, invoiceType),
    enabled: !!jobOrderId,
  })

  const preview = previewData?.data

  const createMutation = useMutation({
    mutationFn: () => garageInvoicesApi.create({ job_order_id: Number(jobOrderId), invoice_type: invoiceType }),
    onSuccess: async (res) => {
      const invoiceId = res?.data?.invoice_id
      await queryClient.invalidateQueries({ queryKey: ['garageInvoiceEligibleJobs'] })
      if (invoiceId) navigate(`/garage-invoices/${invoiceId}/print`)
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        <p className="text-muted-foreground">{subtitle}</p>
      </div>

      <Card className="p-4 space-y-4">
        <div className="flex flex-wrap gap-3 items-center">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setJobOrderId('')
              refetch()
            }}
          >
            Refresh
          </Button>
          <Button type="button" onClick={() => createMutation.mutate()} disabled={!jobOrderId || createMutation.isPending}>
            {createMutation.isPending ? 'Preparing...' : itmMode ? 'Print Preview' : 'Print Invoice'}
          </Button>
          <span className="text-sm text-blue-700 font-semibold">Ready</span>
        </div>

        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading eligible jobs...</div>
        ) : error ? (
          <div className="text-sm text-red-600">Failed to load eligible jobs.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="text-sm">
              <div className="text-foreground/90">JobCard No:</div>
              <select className="w-full mt-1 border rounded px-2 py-1.5" value={jobOrderId} onChange={(e) => setJobOrderId(e.target.value)}>
                <option value="">Select job...</option>
                {jobs.map((j) => (
                  <option key={j.job_order_id} value={j.job_order_id}>
                    {j.job_order_number}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <div className="text-foreground/90">Plate No:</div>
              <input className="w-full mt-1 border rounded px-2 py-1.5 bg-muted/35" value={selected?.plate_number || preview?.vehicle_plate || ''} readOnly />
            </label>
          </div>
        )}

        {previewLoading && <div className="text-sm text-muted-foreground">Loading invoice details...</div>}
        {previewError && <div className="text-sm text-red-600">{previewError?.response?.data?.detail || 'Failed to load invoice details.'}</div>}
        {createMutation.error && <div className="text-sm text-red-600">{createMutation.error?.response?.data?.detail || 'Failed to create invoice.'}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="text-sm">
            <div className="text-foreground/90">Customer Name:</div>
            <input className="w-full mt-1 border rounded px-2 py-1.5 bg-muted/35" value={preview?.customer_name || selected?.customer_name || ''} readOnly />
          </label>
          <label className="text-sm">
            <div className="text-foreground/90">Address:</div>
            <input className="w-full mt-1 border rounded px-2 py-1.5 bg-muted/35" value={preview?.customer_address || ''} readOnly />
          </label>
          <label className="text-sm">
            <div className="text-foreground/90">{itmMode ? 'ITM No:' : 'Invoice Date:'}</div>
            <input className="w-full mt-1 border rounded px-2 py-1.5 bg-muted/35" value={itmMode ? (preview?.proforma_number || '') : (preview?.invoice_date || '')} readOnly />
          </label>
          <label className="text-sm">
            <div className="text-foreground/90">Total Amount:</div>
            <input className="w-full mt-1 border rounded px-2 py-1.5 bg-muted/35" value={fmtAmount(preview?.total_amount)} readOnly />
          </label>
          <label className="text-sm">
            <div className="text-foreground/90">Type of Job:</div>
            <input className="w-full mt-1 border rounded px-2 py-1.5 bg-muted/35" value={preview?.repair_type || invoiceType} readOnly />
          </label>
          <label className="text-sm">
            <div className="text-foreground/90">Invoice Type:</div>
            <input className="w-full mt-1 border rounded px-2 py-1.5 bg-muted/35" value={invoiceType} readOnly />
          </label>
        </div>

        <div className="border rounded p-3 bg-muted/35">
          <div className="font-semibold text-foreground/90 mb-2">Customer Details</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div>TIN: {preview?.customer_tin || '-'}</div>
            <div>Kebele: -</div>
            <div>Sub City: {preview?.customer_city || '-'}</div>
            <div>Tel No: {preview?.customer_phone || '-'}</div>
          </div>
        </div>
      </Card>
    </div>
  )
}

