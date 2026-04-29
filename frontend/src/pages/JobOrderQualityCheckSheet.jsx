import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Printer, RefreshCw, Search, FilePlus2 } from 'lucide-react'
import { customersApi, employeesApi, jobOrdersApi, serviceTypesApi, vehiclesApi } from '../services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

function fmtDateInput(v) {
  if (!v) return ''
  return String(v).slice(0, 10)
}

function fmtDateTimeLocal(v) {
  if (!v) return ''
  const s = String(v)
  if (s.length >= 16) return s.slice(0, 16)
  return `${s.slice(0, 10)}T12:00`
}

function customerLabel(c) {
  if (!c) return ''
  const n = `${c.first_name || ''} ${c.last_name || ''}`.trim()
  return n || c.email || `#${c.customer_id}`
}

/** HillMaster §8.2 default lines (mandatory flags per manual screenshot). */
export const DEFAULT_QC_CHECKLIST = [
  { item_name: 'VEHICLE PROGRAMMED', is_mandatory: true },
  { item_name: 'AIRCOND. FILLED & WORKING', is_mandatory: true },
  { item_name: 'BRAKE TEST', is_mandatory: true },
  { item_name: 'WHEEL ALIGNMENT HEADLIGHTS', is_mandatory: true },
  { item_name: 'FUNCTIONAL TESTING DYNAMIC ROAD TEST', is_mandatory: false },
  { item_name: 'FUNCTIONAL TESTING STATIC', is_mandatory: true },
  { item_name: 'WATER TEST', is_mandatory: true },
  { item_name: 'PDI AUDIT', is_mandatory: true },
  { item_name: 'VEHICLE REWORK', is_mandatory: false },
  { item_name: 'VERIFICATION OF VEHICLE REWORK & COMPLETION', is_mandatory: false },
  { item_name: 'O.K.T.S COMPOUND', is_mandatory: false },
  { item_name: 'VALET SERVICED O.K.T.S TO CUSTOMER', is_mandatory: false },
  { item_name: 'PAINTING', is_mandatory: false },
]

function mapSheetItems(sheet) {
  return (sheet?.items || []).map((it, idx) => ({
    qc_item_id: it.qc_item_id,
    item_name: it.item_name,
    passed: it.passed === true ? true : it.passed === false ? false : null,
    remark: it.remark || '',
    sort_order: it.sort_order ?? idx,
    is_mandatory: it.is_mandatory !== false,
  }))
}

export default function JobOrderQualityCheckSheet() {
  const queryClient = useQueryClient()
  const [jobNoInput, setJobNoInput] = useState('')
  const [jobOrderId, setJobOrderId] = useState(null)
  const [lookupOpen, setLookupOpen] = useState(false)
  const [lookupFilter, setLookupFilter] = useState('')
  const [saFlag, setSaFlag] = useState(false)
  const [sheetDate, setSheetDate] = useState(() => fmtDateInput(new Date()))
  const [testedById, setTestedById] = useState('')
  const [qcItems, setQcItems] = useState([])
  const [qcRemarks, setQcRemarks] = useState('')
  const [pendingReplaceAll, setPendingReplaceAll] = useState(false)

  const { data: mechanicsData } = useQuery({
    queryKey: ['mechanics'],
    queryFn: () => employeesApi.getMechanics(),
  })
  const mechanics = mechanicsData?.data || []

  const { data: jobRes, isLoading: jobLoading, refetch: refetchJob } = useQuery({
    queryKey: ['jobOrder', jobOrderId],
    queryFn: () => jobOrdersApi.getById(jobOrderId),
    enabled: Number.isFinite(jobOrderId) && jobOrderId > 0,
  })
  const job = jobRes?.data

  const { data: vehicleRes } = useQuery({
    queryKey: ['vehicle', job?.vehicle_id],
    queryFn: () => vehiclesApi.getById(job.vehicle_id),
    enabled: Boolean(job?.vehicle_id),
  })
  const vehicle = vehicleRes?.data

  const { data: customerRes } = useQuery({
    queryKey: ['customer', job?.customer_id],
    queryFn: () => customersApi.getById(job.customer_id),
    enabled: Boolean(job?.customer_id),
  })
  const customer = customerRes?.data

  const { data: serviceTypeRes } = useQuery({
    queryKey: ['serviceType', job?.service_type_id],
    queryFn: () => serviceTypesApi.getById(job.service_type_id),
    enabled: Boolean(job?.service_type_id),
  })
  const serviceType = serviceTypeRes?.data

  const { data: qcRes, refetch: refetchQc } = useQuery({
    queryKey: ['jobOrderQc', jobOrderId],
    queryFn: () => jobOrdersApi.getQc(jobOrderId),
    enabled: Number.isFinite(jobOrderId) && jobOrderId > 0,
  })
  const qcSheet = qcRes?.data

  useEffect(() => {
    if (!qcSheet) return
    setQcRemarks(qcSheet.remarks || '')
    setQcItems(mapSheetItems(qcSheet))
    if (qcSheet.checked_by_employee_id) setTestedById(String(qcSheet.checked_by_employee_id))
  }, [qcSheet?.qc_sheet_id, qcSheet?.updated_at])

  const { data: listRes } = useQuery({
    queryKey: ['jobOrdersLookupQc', lookupOpen],
    queryFn: () => jobOrdersApi.list({ limit: 200 }),
    enabled: lookupOpen,
  })
  const listJobs = listRes?.data || []
  const filteredLookup = useMemo(() => {
    const q = lookupFilter.trim().toLowerCase()
    if (!q) return listJobs.slice(0, 80)
    return listJobs.filter((j) => j.job_order_number?.toLowerCase().includes(q)).slice(0, 80)
  }, [listJobs, lookupFilter])

  const loadByNumber = async () => {
    const n = jobNoInput.trim()
    if (!n) return
    const res = await jobOrdersApi.list({ job_order_number: n, limit: 5 })
    const rows = res.data || []
    if (!rows.length) {
      setJobOrderId(null)
      return
    }
    setJobOrderId(rows[0].job_order_id)
  }

  const mandatoryIncomplete = useMemo(
    () => qcItems.some((it) => it.is_mandatory && it.passed !== true),
    [qcItems]
  )

  const saveMutation = useMutation({
    mutationFn: (body) => jobOrdersApi.updateQc(jobOrderId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobOrderQc', jobOrderId] })
      setPendingReplaceAll(false)
    },
  })

  const onSave = () => {
    if (!jobOrderId) return
    if (!testedById) {
      window.alert('Select Tested by before saving.')
      return
    }
    if (mandatoryIncomplete) {
      const ok = window.confirm(
        'Some mandatory checks are not marked as passed. Save anyway? Delivery will be blocked until all mandatory lines are passed.'
      )
      if (!ok) return
    }
    saveMutation.mutate({
      remarks: (qcRemarks || '').trim() || null,
      checked_by_employee_id: Number(testedById),
      replace_all: pendingReplaceAll,
      items: qcItems.map((it, idx) => ({
        item_name: it.item_name,
        passed: it.passed === true ? true : it.passed === false ? false : null,
        remark: (it.remark || '').trim() || null,
        sort_order: Number.isFinite(Number(it.sort_order)) ? Number(it.sort_order) : idx,
        is_mandatory: Boolean(it.is_mandatory),
      })),
    })
  }

  const onAddNewTemplate = () => {
    if (!jobOrderId) return
    if (qcItems.length) {
      if (!window.confirm('Replace the current checklist with the standard §8.2 template?')) return
    }
    const next = DEFAULT_QC_CHECKLIST.map((row, idx) => ({
      qc_item_id: `tpl-${idx}`,
      item_name: row.item_name,
      passed: null,
      remark: '',
      sort_order: idx,
      is_mandatory: row.is_mandatory,
    }))
    setQcItems(next)
    setPendingReplaceAll(true)
  }

  const isBlocked = job?.is_blocked
  const statusLabel = useMemo(() => {
    if (!jobOrderId) return 'Ready'
    if (isBlocked) return 'Blocked'
    if (qcSheet?.overall_status === 'Passed') return 'Ready'
    if (qcSheet?.overall_status === 'Failed') return 'Failed'
    return 'Ready'
  }, [jobOrderId, isBlocked, qcSheet?.overall_status])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2 print:hidden">
        <div>
          <div className="text-sm text-muted-foreground">
            <Link to="/utilities" className="text-primary hover:underline">
              Utilities
            </Link>
            <span className="mx-1">/</span>
            <span className="text-foreground font-medium">Job Order Quality Check Sheet</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight mt-1">Job order quality check sheet</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
            Record QC checks before release. All <strong>mandatory</strong> rows must be marked passed before delivery
            (see Deliver Job Order). Optional rows can stay unchecked.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-red-600 font-medium">QC Check Sheet</span>
          <span className="text-blue-600 font-medium">{statusLabel}</span>
          {qcSheet?.overall_status ? (
            <span className="rounded-md border px-2 py-0.5 text-xs">Overall: {qcSheet.overall_status}</span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 print:hidden">
        <Button type="button" variant="secondary" onClick={onAddNewTemplate} disabled={!jobOrderId || isBlocked}>
          <FilePlus2 className="h-4 w-4 mr-2" />
          Add new
        </Button>
        <Button type="button" onClick={onSave} disabled={!jobOrderId || isBlocked || saveMutation.isPending}>
          {saveMutation.isPending ? 'Saving…' : 'Save'}
        </Button>
        <Button type="button" variant="outline" onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-2" />
          Print preview
        </Button>
        <Button type="button" variant="outline" onClick={() => window.alert('View log is not implemented in this web module.')}>
          View log
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            refetchJob()
            refetchQc()
          }}
          disabled={!jobOrderId}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
        {jobOrderId ? (
          <Button type="button" variant="ghost" asChild>
            <Link to={`/job-orders/${jobOrderId}`}>Job detail</Link>
          </Button>
        ) : null}
      </div>

      {saveMutation.isError ? (
        <p className="text-sm text-destructive">{saveMutation.error?.response?.data?.detail || 'Save failed'}</p>
      ) : null}

      <Card className="p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="lg:col-span-2 flex gap-2 items-end">
            <div className="flex-1 space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Job order no.</label>
              <Input value={jobNoInput} onChange={(e) => setJobNoInput(e.target.value)} placeholder="Job order number" />
            </div>
            <Button type="button" variant="secondary" onClick={() => void loadByNumber()} disabled={!jobNoInput.trim()}>
              Load
            </Button>
            <Button type="button" variant="outline" size="icon" title="Lookup" onClick={() => setLookupOpen(true)}>
              <Search className="h-4 w-4" />
            </Button>
            <label className="flex items-end gap-2 pb-2 text-sm whitespace-nowrap">
              <input type="checkbox" checked={saFlag} onChange={(e) => setSaFlag(e.target.checked)} />
              SA
            </label>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Plate no.</label>
            <Input readOnly className="bg-muted/40" value={vehicle?.license_plate || ''} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Date</label>
            <Input type="date" value={sheetDate} onChange={(e) => setSheetDate(e.target.value)} />
          </div>
          <div className="lg:col-span-2 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Customer name</label>
            <Input readOnly className="bg-muted/40" value={customerLabel(customer)} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Date opened</label>
            <Input
              readOnly
              className="bg-muted/40"
              type="datetime-local"
              value={job?.created_at ? fmtDateTimeLocal(job.created_at) : ''}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Job type</label>
            <Input readOnly className="bg-muted/40" value={serviceType?.type_name || ''} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Model</label>
            <Input readOnly className="bg-muted/40" value={vehicle ? `${vehicle.model || ''}`.trim() : ''} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">VIN no.</label>
            <Input readOnly className="bg-muted/40" value={vehicle?.vin || ''} />
          </div>
          <div className="lg:col-span-2 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Tested by</label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={testedById}
              onChange={(e) => setTestedById(e.target.value)}
              disabled={!jobOrderId || isBlocked}
            >
              <option value="">Select…</option>
              {mechanics.map((m) => (
                <option key={m.employee_id} value={m.employee_id}>
                  {m.name || `${m.first_name || ''} ${m.last_name || ''}`.trim()}
                </option>
              ))}
            </select>
          </div>
        </div>
        {jobLoading && jobOrderId ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
      </Card>

      <Card className="p-0 overflow-hidden border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 border-b">
              <tr>
                <th className="text-left p-2 w-10">No</th>
                <th className="text-left p-2">Description</th>
                <th className="text-center p-2 w-24">Value</th>
                <th className="text-left p-2 min-w-[140px]">Remark</th>
                <th className="text-center p-2 w-28">Mandatory</th>
              </tr>
            </thead>
            <tbody>
              {qcItems.map((it, idx) => (
                <tr key={it.qc_item_id || `${it.item_name}-${idx}`} className={idx % 2 === 0 ? 'bg-sky-50/50' : 'bg-background'}>
                  <td className="p-2 align-top text-muted-foreground">{idx + 1}</td>
                  <td className="p-2 align-top font-medium">{it.item_name}</td>
                  <td className="p-2 align-top text-center">
                    <input
                      type="checkbox"
                      checked={it.passed === true}
                      onChange={(e) => {
                        const v = e.target.checked
                        setQcItems((prev) =>
                          prev.map((row, i) => (i === idx ? { ...row, passed: v ? true : null } : row))
                        )
                      }}
                      disabled={!jobOrderId || isBlocked}
                      className="h-4 w-4"
                    />
                  </td>
                  <td className="p-2 align-top">
                    <Input
                      value={it.remark}
                      onChange={(e) => {
                        const v = e.target.value
                        setQcItems((prev) => prev.map((row, i) => (i === idx ? { ...row, remark: v } : row)))
                      }}
                      disabled={!jobOrderId || isBlocked}
                      className="h-9"
                    />
                  </td>
                  <td className="p-2 align-top text-center">
                    <input type="checkbox" checked={Boolean(it.is_mandatory)} readOnly disabled className="h-4 w-4 opacity-70" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!qcItems.length && jobOrderId ? (
          <p className="p-4 text-sm text-muted-foreground">No lines yet — use Add new to load the standard checklist.</p>
        ) : null}
      </Card>

      <Dialog open={lookupOpen} onOpenChange={setLookupOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Lookup job order</DialogTitle>
          </DialogHeader>
          <Input placeholder="Filter…" value={lookupFilter} onChange={(e) => setLookupFilter(e.target.value)} className="mb-3" />
          <ul className="space-y-1 text-sm max-h-72 overflow-y-auto">
            {filteredLookup.map((j) => (
              <li key={j.job_order_id}>
                <button
                  type="button"
                  className="w-full text-left rounded-md px-2 py-2 hover:bg-muted"
                  onClick={() => {
                    setJobNoInput(j.job_order_number)
                    setJobOrderId(j.job_order_id)
                    setLookupOpen(false)
                  }}
                >
                  <span className="font-medium">{j.job_order_number}</span>
                  <span className="text-muted-foreground"> — {j.status}</span>
                </button>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </div>
  )
}
