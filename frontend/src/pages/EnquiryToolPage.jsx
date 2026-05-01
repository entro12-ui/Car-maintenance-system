import { useMemo, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Input } from '../components/ui/input'
import SetupScreenFrame from './SetupScreenFrame'
import { ENQUIRY_MENU } from './EnquirySidebarMenu'
import {
  appointmentsApi,
  garageInvoicesApi,
  glApi,
  jobOrderSubletOrdersApi,
  jobOrdersApi,
  partsApi,
} from '../services/api'

const ENQUIRY_SOURCE = {
  'job-order': {
    queryKey: ['enquiry', 'job-order'],
    queryFn: () => jobOrdersApi.list({ limit: 300 }),
    normalize: (rows) =>
      (rows || []).map((r) => ({
        locator: r.job_order_number || String(r.job_order_id || ''),
        primary: r.job_order_number || `#${r.job_order_id}`,
        secondary: r.status || '-',
        detail1: r.invoice_type || '-',
        detail2: r.opened_date || '-',
      })),
    columns: ['Job Order', 'Status', 'Invoice Type', 'Opened Date'],
  },
  'products-or-parts': {
    queryKey: ['enquiry', 'parts'],
    queryFn: () => partsApi.getAll({ limit: 300 }),
    normalize: (rows) =>
      (rows || []).map((r) => ({
        locator: r.part_number || r.part_name || String(r.part_id || ''),
        primary: r.part_number || `#${r.part_id || '-'}`,
        secondary: r.part_name || '-',
        detail1: r.unit_price != null ? String(r.unit_price) : '-',
        detail2: r.stock_quantity != null ? String(r.stock_quantity) : '-',
      })),
    columns: ['Part No', 'Description', 'Unit Price', 'Stock Qty'],
  },
  'garage-invoice-enquiry': {
    queryKey: ['enquiry', 'garage-invoice'],
    queryFn: () => garageInvoicesApi.list({ limit: 300 }),
    normalize: (rows) =>
      (rows || []).map((r) => ({
        locator: r.invoice_number || String(r.garage_invoice_id || ''),
        primary: r.invoice_number || `#${r.garage_invoice_id}`,
        secondary: r.invoice_type || '-',
        detail1: r.job_order_number || (r.job_order_id ? `#${r.job_order_id}` : '-'),
        detail2: r.total_amount != null ? String(r.total_amount) : '-',
      })),
    columns: ['Invoice No', 'Type', 'Job Order', 'Total'],
  },
  'journal-enquiry': {
    queryKey: ['enquiry', 'journal'],
    queryFn: () => glApi.listJournals({ limit: 300 }),
    normalize: (rows) =>
      (rows || []).map((r) => ({
        locator: r.journal_no || String(r.journal_id || ''),
        primary: r.journal_no || `#${r.journal_id}`,
        secondary: r.reference || '-',
        detail1: r.status || '-',
        detail2: r.total_debit != null ? String(r.total_debit) : '-',
      })),
    columns: ['Journal No', 'Reference', 'Status', 'Total Debit'],
  },
  appointment: {
    queryKey: ['enquiry', 'appointment'],
    queryFn: () => appointmentsApi.getAll({ limit: 300 }),
    normalize: (rows) =>
      (rows || []).map((r) => ({
        locator: r.appointment_no || String(r.appointment_id || ''),
        primary: r.appointment_no || `#${r.appointment_id}`,
        secondary: r.status || '-',
        detail1: r.appointment_date || '-',
        detail2: r.vehicle_id != null ? `Vehicle #${r.vehicle_id}` : '-',
      })),
    columns: ['Appointment', 'Status', 'Date', 'Vehicle'],
  },
  'sublet-order': {
    queryKey: ['enquiry', 'sublet-order'],
    queryFn: () => jobOrderSubletOrdersApi.list({ limit: 300 }),
    normalize: (rows) =>
      (rows || []).map((r) => ({
        locator: r.sublet_order_no || String(r.sublet_order_id || ''),
        primary: r.sublet_order_no || `#${r.sublet_order_id}`,
        secondary: r.status || '-',
        detail1: r.job_order_number || (r.job_order_id ? `#${r.job_order_id}` : '-'),
        detail2: r.supplier_name || '-',
      })),
    columns: ['Sublet Order', 'Status', 'Job Order', 'Supplier'],
  },
}

export default function EnquiryToolPage() {
  const { slug } = useParams()
  const [locator, setLocator] = useState('')
  const [criteria, setCriteria] = useState('')
  const entry = useMemo(() => ENQUIRY_MENU.find((item) => item.slug === slug), [slug])
  const source = slug ? ENQUIRY_SOURCE[slug] : null

  const dataQuery = useQuery({
    queryKey: source?.queryKey || ['enquiry', 'none'],
    queryFn: async () => {
      const res = await source.queryFn()
      return source.normalize(res?.data || [])
    },
    enabled: !!source,
  })

  const rows = dataQuery.data || []
  const filtered = useMemo(() => {
    const l = locator.trim().toLowerCase()
    const c = criteria.trim().toLowerCase()
    return rows.filter((r) => {
      const blob = `${r.locator} ${r.primary} ${r.secondary} ${r.detail1} ${r.detail2}`.toLowerCase()
      if (l && !blob.includes(l)) return false
      if (c && !blob.includes(c)) return false
      return true
    })
  }, [rows, locator, criteria])

  if (!slug || !entry) {
    return <Navigate to="/enquiries-hub" replace />
  }

  return (
    <SetupScreenFrame
      hubTo="/enquiries-hub"
      hubLabel="Enquiry"
      title={entry.label}
      subtitle={`Read-only enquiry for ${entry.label}. Search by locator or criteria to retrieve summary/detail records.`}
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          This page retrieves summary/detail information using a locator value (number/code) or criteria text, based on
          your access privilege.
        </div>

        <div className="bg-white border rounded-lg shadow-sm p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="text-sm space-y-1">
              <div className="font-medium text-gray-800">Locator</div>
              <Input value={locator} onChange={(e) => setLocator(e.target.value)} placeholder="Enter job no, invoice no, part no..." />
            </label>
            <label className="text-sm space-y-1 md:col-span-2">
              <div className="font-medium text-gray-800">Criteria</div>
              <Input value={criteria} onChange={(e) => setCriteria(e.target.value)} placeholder="Filter by status, customer, supplier, reference..." />
            </label>
          </div>

          {!source ? (
            <div className="text-sm text-amber-700">
              This submenu will use dedicated API wiring. The enquiry shell is ready and can be bound to specific data fields.
            </div>
          ) : (
            <div className="overflow-auto border rounded">
              <table className="min-w-[900px] w-full text-sm">
                <thead className="bg-gray-100 text-xs text-gray-600 uppercase">
                  <tr>
                    <th className="py-2 px-2 text-left">{source.columns[0]}</th>
                    <th className="py-2 px-2 text-left">{source.columns[1]}</th>
                    <th className="py-2 px-2 text-left">{source.columns[2]}</th>
                    <th className="py-2 px-2 text-left">{source.columns[3]}</th>
                  </tr>
                </thead>
                <tbody>
                  {dataQuery.isLoading ? (
                    <tr>
                      <td colSpan={4} className="py-5 px-2 text-center text-gray-500">Loading...</td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-5 px-2 text-center text-gray-500">No matching records.</td>
                    </tr>
                  ) : (
                    filtered.map((r, idx) => (
                      <tr key={`${r.locator}-${idx}`} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="py-2 px-2 font-medium">{r.primary}</td>
                        <td className="py-2 px-2">{r.secondary}</td>
                        <td className="py-2 px-2">{r.detail1}</td>
                        <td className="py-2 px-2">{r.detail2}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </SetupScreenFrame>
  )
}
