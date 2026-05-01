import { useEffect, useMemo, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import SetupScreenFrame from './SetupScreenFrame'
import { TRANSACTION_MENU } from './TransactionSidebarMenu'
import {
  customersApi,
  employeesApi,
  fuelLubricantsApi,
  garageInvoicesApi,
  jobOrderAdditionalChargesApi,
  jobOrderInventoryApi,
  jobOrderLaborApi,
  jobOrdersApi,
  laborTypesApi,
  miscChargeTypesApi,
  otherChargeTypesApi,
  partsApi,
  subletWorkSuppliersApi,
  subletWorkTypesApi,
  systemSettingsApi,
  vehiclesApi,
} from '../services/api'

const TRANSACTION_REDIRECTS = {
  'labour-misc-lub-sublet-charge-entry': '/job-orders/additional-charges',
  'sublet-order-entry': '/job-orders/sublet-orders/entry',
  'sublet-order-entry-internal-vehicle': '/job-orders/sublet-orders/entry',
  'sublet-order-approval': '/job-orders/sublet-orders/approval',
  'sublet-order-receiving': '/job-orders/sublet-orders/receiving',
}

function ItemIssuePage() {
  const [salesPersonId, setSalesPersonId] = useState('')
  const [jobOrderId, setJobOrderId] = useState('')
  const [requisitionNo, setRequisitionNo] = useState('')
  const [storeName, setStoreName] = useState('')
  const [partId, setPartId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [issueId, setIssueId] = useState(null)
  const [issueNo, setIssueNo] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isClockedIn, setIsClockedIn] = useState(null)

  const jobsQuery = useQuery({
    queryKey: ['jobOrders', { screen: 'transaction-item-issue' }],
    queryFn: () => jobOrdersApi.list({ limit: 500 }),
  })
  const vehiclesQuery = useQuery({
    queryKey: ['vehicles', { screen: 'transaction-item-issue' }],
    queryFn: () => vehiclesApi.getAll({ limit: 500 }),
  })
  const customersQuery = useQuery({
    queryKey: ['customers', { screen: 'transaction-item-issue' }],
    queryFn: () => customersApi.getAll({ limit: 500 }),
  })
  const employeesQuery = useQuery({
    queryKey: ['employees', { screen: 'transaction-item-issue' }],
    queryFn: () => employeesApi.list({ limit: 500 }),
  })
  const partsQuery = useQuery({
    queryKey: ['parts', { screen: 'transaction-item-issue' }],
    queryFn: () => partsApi.getAll({ limit: 500 }),
  })

  const jobs = useMemo(
    () =>
      (jobsQuery.data?.data || []).filter(
        (j) => !j.delivered_at && j.status !== 'Closed' && j.status !== 'Cancelled',
      ),
    [jobsQuery.data],
  )
  const vehicles = useMemo(() => vehiclesQuery.data?.data || [], [vehiclesQuery.data])
  const customers = useMemo(() => customersQuery.data?.data || [], [customersQuery.data])
  const employees = useMemo(() => employeesQuery.data?.data || [], [employeesQuery.data])
  const parts = useMemo(() => partsQuery.data?.data || [], [partsQuery.data])

  const selectedJob = useMemo(() => {
    const id = Number(jobOrderId)
    return jobs.find((j) => Number(j.job_order_id) === id) || null
  }, [jobOrderId, jobs])
  const selectedVehicle = useMemo(() => {
    const id = Number(selectedJob?.vehicle_id)
    return vehicles.find((v) => Number(v.vehicle_id) === id) || null
  }, [selectedJob, vehicles])
  const selectedCustomer = useMemo(() => {
    const id = Number(selectedJob?.customer_id)
    return customers.find((c) => Number(c.customer_id) === id) || null
  }, [selectedJob, customers])
  const selectedPart = useMemo(() => {
    const id = Number(partId)
    return parts.find((p) => Number(p.part_id) === id) || null
  }, [partId, parts])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      if (!selectedJob?.job_order_id) {
        setIsClockedIn(null)
        return
      }
      try {
        const res = await jobOrdersApi.listClocks(selectedJob.job_order_id)
        const clocks = res?.data || []
        const active = clocks.some((c) => !c.clock_out_at)
        if (!cancelled) setIsClockedIn(active)
      } catch {
        if (!cancelled) setIsClockedIn(null)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [selectedJob?.job_order_id])

  const createIssueMutation = useMutation({
    mutationFn: (payload) => jobOrderInventoryApi.createIssue(Number(jobOrderId), payload),
    onSuccess: (res) => {
      setIssueId(res?.data?.issue_id || null)
      setIssueNo(res?.data?.issue_number || '')
      setSuccess('Issue voucher started.')
    },
    onError: (e) => setError(e?.response?.data?.detail || 'Failed to start issue voucher.'),
  })

  const addLineMutation = useMutation({
    mutationFn: ({ id, payload }) => jobOrderInventoryApi.addIssueLine(id, payload),
    onSuccess: () => setSuccess('Issue line added.'),
    onError: (e) => setError(e?.response?.data?.detail || 'Failed to add issue line.'),
  })

  const finalizeMutation = useMutation({
    mutationFn: (id) => jobOrderInventoryApi.finalizeIssue(id),
    onSuccess: () => setSuccess('Issue voucher finalized.'),
    onError: (e) => setError(e?.response?.data?.detail || 'Failed to finalize issue voucher.'),
  })

  const onRefresh = () => {
    setSalesPersonId('')
    setJobOrderId('')
    setRequisitionNo('')
    setStoreName('')
    setPartId('')
    setQuantity('')
    setIssueId(null)
    setIssueNo('')
    setError('')
    setSuccess('')
    setIsClockedIn(null)
  }

  const onAddNew = () => {
    setError('')
    setSuccess('')
    if (!selectedJob?.job_order_id) {
      setError('Select job order first.')
      return
    }
    if (isClockedIn === false) {
      setError('This job has no active clock-in for technician. Item issue is blocked.')
      return
    }
    const remarks = [
      salesPersonId ? `SalesPersonId:${salesPersonId}` : null,
      requisitionNo ? `RequisitionNo:${requisitionNo}` : null,
      storeName ? `Store:${storeName}` : null,
    ]
      .filter(Boolean)
      .join(' | ')
    createIssueMutation.mutate({ remarks: remarks || null })
  }

  const onSaveLine = () => {
    setError('')
    setSuccess('')
    if (!issueId) {
      setError('Click Add New first to open an issue voucher.')
      return
    }
    const pid = Number(partId)
    const qty = Number(quantity)
    if (!Number.isFinite(pid) || pid <= 0) {
      setError('Select item code.')
      return
    }
    if (!Number.isFinite(qty) || qty <= 0) {
      setError('Enter valid quantity.')
      return
    }
    addLineMutation.mutate({ id: issueId, payload: { part_id: pid, quantity: qty } })
    setQuantity('')
  }

  const onFinish = () => {
    if (!issueId) {
      setError('No issue voucher to finalize.')
      return
    }
    finalizeMutation.mutate(issueId)
  }

  return (
    <SetupScreenFrame
      hubTo="/transactions-hub"
      hubLabel="Transaction"
      title="Garage Issue Voucher"
      subtitle="Process item issue transactions for active job orders."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" onClick={onAddNew} disabled={createIssueMutation.isPending}>
            Add New
          </Button>
          <Button type="button" variant="outline" onClick={onFinish} disabled={!issueId || finalizeMutation.isPending}>
            Finish Issue Voucher
          </Button>
          <Button type="button" variant="outline" onClick={onRefresh}>Refresh</Button>
          <span className="text-sm text-blue-700">Ready</span>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          Item issue is performed for active job orders. Select job order, salesperson, store, item, and quantity.
          The selected job should be clocked-in for a technician before finalizing issue.
        </div>
        {error && <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        {success && <div className="rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{success}</div>}

        <div className="bg-white border rounded-lg shadow-sm p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <label className="text-sm space-y-1">
              <div className="font-medium text-gray-800">Sales Person</div>
              <select className="w-full border rounded px-2 py-2 text-sm" value={salesPersonId} onChange={(e) => setSalesPersonId(e.target.value)}>
                <option value="">Select...</option>
                {employees.map((e) => (
                  <option key={e.employee_id} value={String(e.employee_id)}>
                    {`${e.first_name || ''} ${e.last_name || ''}`.trim() || e.employee_code || `#${e.employee_id}`}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm space-y-1">
              <div className="font-medium text-gray-800">Job Card No</div>
              <select className="w-full border rounded px-2 py-2 text-sm" value={jobOrderId} onChange={(e) => setJobOrderId(e.target.value)}>
                <option value="">Select active job...</option>
                {jobs.map((j) => (
                  <option key={j.job_order_id} value={String(j.job_order_id)}>
                    {j.job_order_number || `#${j.job_order_id}`}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm space-y-1">
              <div className="font-medium text-gray-800">Issue Voucher No</div>
              <Input readOnly value={issueNo || '(auto after Add New)'} />
            </label>
            <label className="text-sm space-y-1">
              <div className="font-medium text-gray-800">Requisition No</div>
              <Input value={requisitionNo} onChange={(e) => setRequisitionNo(e.target.value)} />
            </label>
            <label className="text-sm space-y-1">
              <div className="font-medium text-gray-800">Plate No</div>
              <Input readOnly value={selectedVehicle?.license_plate || ''} />
            </label>
            <label className="text-sm space-y-1 md:col-span-2">
              <div className="font-medium text-gray-800">Customer</div>
              <Input readOnly value={selectedCustomer ? `${selectedCustomer.first_name || ''} ${selectedCustomer.last_name || ''}`.trim() : ''} />
            </label>
            <label className="text-sm space-y-1">
              <div className="font-medium text-gray-800">Clocked-In Status</div>
              <Input readOnly value={isClockedIn == null ? 'Unknown' : isClockedIn ? 'Clocked-In' : 'Not Clocked-In'} />
            </label>
            <label className="text-sm space-y-1 md:col-span-4">
              <div className="font-medium text-gray-800">Address</div>
              <Input readOnly value={selectedCustomer?.address || ''} />
            </label>
          </div>
        </div>

        <div className="bg-white border rounded-lg shadow-sm p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <label className="text-sm space-y-1">
              <div className="font-medium text-gray-800">Store</div>
              <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="Store code/name" />
            </label>
            <label className="text-sm space-y-1 md:col-span-2">
              <div className="font-medium text-gray-800">Item Code</div>
              <select className="w-full border rounded px-2 py-2 text-sm" value={partId} onChange={(e) => setPartId(e.target.value)}>
                <option value="">Select item...</option>
                {parts.map((p) => (
                  <option key={p.part_id} value={String(p.part_id)}>
                    {p.part_number || `#${p.part_id}`} - {p.part_name || '-'}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm space-y-1">
              <div className="font-medium text-gray-800">Qty on Hand</div>
              <Input readOnly value={selectedPart?.stock_quantity != null ? String(selectedPart.stock_quantity) : ''} />
            </label>
            <label className="text-sm space-y-1">
              <div className="font-medium text-gray-800">Quantity</div>
              <Input value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={onSaveLine} disabled={!issueId || addLineMutation.isPending}>
              Save Line
            </Button>
          </div>
        </div>
      </div>
    </SetupScreenFrame>
  )
}

const RESERVE_CAT = 'item_reserve_transactions'
const REQUISITION_CAT = 'garage_issue_requisition'

function parseJsonSafe(value, fallback) {
  try {
    const parsed = JSON.parse(value)
    return parsed ?? fallback
  } catch {
    return fallback
  }
}

function ItemIssueFromReservePage() {
  const [salesPersonId, setSalesPersonId] = useState('')
  const [jobOrderId, setJobOrderId] = useState('')
  const [requisitionNo, setRequisitionNo] = useState('')
  const [partId, setPartId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [issueId, setIssueId] = useState(null)
  const [issueNo, setIssueNo] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [reserveSettingId, setReserveSettingId] = useState(null)
  const [reserveRows, setReserveRows] = useState([])

  const jobsQuery = useQuery({
    queryKey: ['jobOrders', { screen: 'transaction-item-issue-from-reserve' }],
    queryFn: () => jobOrdersApi.list({ limit: 500 }),
  })
  const vehiclesQuery = useQuery({
    queryKey: ['vehicles', { screen: 'transaction-item-issue-from-reserve' }],
    queryFn: () => vehiclesApi.getAll({ limit: 500 }),
  })
  const customersQuery = useQuery({
    queryKey: ['customers', { screen: 'transaction-item-issue-from-reserve' }],
    queryFn: () => customersApi.getAll({ limit: 500 }),
  })
  const employeesQuery = useQuery({
    queryKey: ['employees', { screen: 'transaction-item-issue-from-reserve' }],
    queryFn: () => employeesApi.list({ limit: 500 }),
  })
  const partsQuery = useQuery({
    queryKey: ['parts', { screen: 'transaction-item-issue-from-reserve' }],
    queryFn: () => partsApi.getAll({ limit: 500 }),
  })

  const jobs = useMemo(
    () =>
      (jobsQuery.data?.data || []).filter(
        (j) => !j.delivered_at && j.status !== 'Closed' && j.status !== 'Cancelled',
      ),
    [jobsQuery.data],
  )
  const vehicles = useMemo(() => vehiclesQuery.data?.data || [], [vehiclesQuery.data])
  const customers = useMemo(() => customersQuery.data?.data || [], [customersQuery.data])
  const employees = useMemo(() => employeesQuery.data?.data || [], [employeesQuery.data])
  const parts = useMemo(() => partsQuery.data?.data || [], [partsQuery.data])

  const selectedJob = useMemo(() => {
    const id = Number(jobOrderId)
    return jobs.find((j) => Number(j.job_order_id) === id) || null
  }, [jobOrderId, jobs])
  const selectedVehicle = useMemo(() => {
    const id = Number(selectedJob?.vehicle_id)
    return vehicles.find((v) => Number(v.vehicle_id) === id) || null
  }, [selectedJob, vehicles])
  const selectedCustomer = useMemo(() => {
    const id = Number(selectedJob?.customer_id)
    return customers.find((c) => Number(c.customer_id) === id) || null
  }, [selectedJob, customers])

  const loadReserveRows = async (targetJobId) => {
    const id = Number(targetJobId)
    if (!Number.isFinite(id) || id <= 0) {
      setReserveSettingId(null)
      setReserveRows([])
      return
    }
    try {
      const res = await systemSettingsApi.list({ category: RESERVE_CAT, limit: 500 })
      const all = res?.data || []
      const row = all.find((r) => String(r.setting_key) === `job_${id}`)
      setReserveSettingId(row?.setting_id || null)
      setReserveRows(parseJsonSafe(row?.setting_value, []))
    } catch {
      setReserveSettingId(null)
      setReserveRows([])
    }
  }

  useEffect(() => {
    loadReserveRows(jobOrderId)
  }, [jobOrderId])

  const createIssueMutation = useMutation({
    mutationFn: (payload) => jobOrderInventoryApi.createIssue(Number(jobOrderId), payload),
    onSuccess: (res) => {
      setIssueId(res?.data?.issue_id || null)
      setIssueNo(res?.data?.issue_number || '')
      setSuccess('Issue voucher started.')
    },
    onError: (e) => setError(e?.response?.data?.detail || 'Failed to start issue voucher.'),
  })
  const addLineMutation = useMutation({
    mutationFn: ({ id, payload }) => jobOrderInventoryApi.addIssueLine(id, payload),
    onSuccess: () => setSuccess('Issue line saved from reserve.'),
    onError: (e) => setError(e?.response?.data?.detail || 'Failed to save issue line.'),
  })
  const finalizeMutation = useMutation({
    mutationFn: (id) => jobOrderInventoryApi.finalizeIssue(id),
    onSuccess: () => setSuccess('Issue voucher finalized.'),
    onError: (e) => setError(e?.response?.data?.detail || 'Failed to finalize issue voucher.'),
  })

  const onRefresh = () => {
    setSalesPersonId('')
    setJobOrderId('')
    setRequisitionNo('')
    setPartId('')
    setQuantity('')
    setIssueId(null)
    setIssueNo('')
    setError('')
    setSuccess('')
    setReserveSettingId(null)
    setReserveRows([])
  }

  const onAddNew = () => {
    setError('')
    setSuccess('')
    if (!selectedJob?.job_order_id) {
      setError('Select job card number first.')
      return
    }
    if (!reserveRows.length) {
      setError('No reserve transaction found for this job. Record reserve first.')
      return
    }
    const remarks = [
      salesPersonId ? `SalesPersonId:${salesPersonId}` : null,
      requisitionNo ? `RequisitionNo:${requisitionNo}` : null,
      'FromReserve:true',
    ]
      .filter(Boolean)
      .join(' | ')
    createIssueMutation.mutate({ remarks: remarks || null })
  }

  const persistReserveRows = async (nextRows) => {
    const payload = {
      setting_key: `job_${Number(jobOrderId)}`,
      setting_value: JSON.stringify(nextRows),
      setting_type: 'json',
      category: RESERVE_CAT,
      description: 'Reserved items by job',
    }
    if (reserveSettingId) await systemSettingsApi.update(reserveSettingId, payload)
    else {
      const created = await systemSettingsApi.create(payload)
      setReserveSettingId(created?.data?.setting_id || null)
    }
    setReserveRows(nextRows)
  }

  const onSaveRecord = async () => {
    setError('')
    setSuccess('')
    if (!issueId) {
      setError('Click Add New first.')
      return
    }
    const pid = Number(partId)
    const qty = Number(quantity)
    if (!Number.isFinite(pid) || pid <= 0) {
      setError('Copy/paste or select an item code from Reserve tab.')
      return
    }
    if (!Number.isFinite(qty) || qty <= 0) {
      setError('Enter valid quantity.')
      return
    }
    const row = reserveRows.find((r) => Number(r.part_id) === pid || String(r.item_code || '').trim() === String(pid))
    if (!row) {
      setError('Selected item is not in reserve list for this job.')
      return
    }
    const reserved = Number(row.reserved_qty || 0)
    const supplied = Number(row.supplied_qty || 0)
    const available = reserved - supplied
    if (available < qty) {
      setError(`Reserved quantity not enough. Available from reserve: ${available}.`)
      return
    }

    addLineMutation.mutate({ id: issueId, payload: { part_id: pid, quantity: qty } }, {
      onSuccess: async () => {
        const next = reserveRows.map((r) => {
          if (r !== row) return r
          return {
            ...r,
            supplied_qty: Number(r.supplied_qty || 0) + qty,
          }
        })
        await persistReserveRows(next)
      },
    })
    setQuantity('')
  }

  const onFinish = () => {
    if (!issueId) {
      setError('No issue voucher to finalize.')
      return
    }
    finalizeMutation.mutate(issueId)
  }

  return (
    <SetupScreenFrame
      hubTo="/transactions-hub"
      hubLabel="Transaction"
      title="Garage Issue From Reserve"
      subtitle="Issue items previously reserved for the selected job."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" onClick={onAddNew} disabled={createIssueMutation.isPending}>
            Add New
          </Button>
          <Button type="button" variant="outline" onClick={onSaveRecord} disabled={!issueId || addLineMutation.isPending}>
            Save Record
          </Button>
          <Button type="button" variant="outline" onClick={onFinish} disabled={!issueId || finalizeMutation.isPending}>
            Finish Issue Voucher
          </Button>
          <Button type="button" variant="outline" onClick={onRefresh}>Refresh</Button>
          <span className="text-sm text-blue-700">Ready</span>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          This transaction requires prior reserve recording. If no reserve exists for the selected job, processing is blocked.
        </div>
        {error && <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        {success && <div className="rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{success}</div>}

        <div className="bg-white border rounded-lg shadow-sm p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <label className="text-sm space-y-1">
              <div className="font-medium text-gray-800">Sales Person</div>
              <select className="w-full border rounded px-2 py-2 text-sm" value={salesPersonId} onChange={(e) => setSalesPersonId(e.target.value)}>
                <option value="">Select...</option>
                {employees.map((e) => (
                  <option key={e.employee_id} value={String(e.employee_id)}>
                    {`${e.first_name || ''} ${e.last_name || ''}`.trim() || e.employee_code || `#${e.employee_id}`}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm space-y-1">
              <div className="font-medium text-gray-800">Job Card No</div>
              <select className="w-full border rounded px-2 py-2 text-sm" value={jobOrderId} onChange={(e) => setJobOrderId(e.target.value)}>
                <option value="">Select active job...</option>
                {jobs.map((j) => (
                  <option key={j.job_order_id} value={String(j.job_order_id)}>
                    {j.job_order_number || `#${j.job_order_id}`}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm space-y-1">
              <div className="font-medium text-gray-800">Issue Voucher No</div>
              <Input readOnly value={issueNo || '(auto after Add New)'} />
            </label>
            <label className="text-sm space-y-1">
              <div className="font-medium text-gray-800">Requisition No</div>
              <Input value={requisitionNo} onChange={(e) => setRequisitionNo(e.target.value)} />
            </label>
            <label className="text-sm space-y-1">
              <div className="font-medium text-gray-800">Plate No</div>
              <Input readOnly value={selectedVehicle?.license_plate || ''} />
            </label>
            <label className="text-sm space-y-1 md:col-span-3">
              <div className="font-medium text-gray-800">Customer Name</div>
              <Input readOnly value={selectedCustomer ? `${selectedCustomer.first_name || ''} ${selectedCustomer.last_name || ''}`.trim() : ''} />
            </label>
          </div>
        </div>

        <div className="bg-white border rounded-lg shadow-sm p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="text-sm space-y-1 md:col-span-2">
              <div className="font-medium text-gray-800">Item Code</div>
              <select className="w-full border rounded px-2 py-2 text-sm" value={partId} onChange={(e) => setPartId(e.target.value)}>
                <option value="">Select reserved item...</option>
                {reserveRows.map((r, idx) => (
                  <option key={`${r.part_id || r.item_code || 'x'}-${idx}`} value={String(r.part_id || r.item_code || '')}>
                    {r.item_code || `#${r.part_id}`} - {r.description || ''}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm space-y-1">
              <div className="font-medium text-gray-800">Quantity</div>
              <Input value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </label>
          </div>

          <div className="overflow-auto border rounded">
            <table className="min-w-[900px] w-full text-sm">
              <thead className="bg-gray-100 text-xs text-gray-600 uppercase">
                <tr>
                  <th className="py-2 px-2 text-left">Reserve No</th>
                  <th className="py-2 px-2 text-left">Item Code</th>
                  <th className="py-2 px-2 text-left">Description</th>
                  <th className="py-2 px-2 text-left">Reserved</th>
                  <th className="py-2 px-2 text-left">Supplied</th>
                  <th className="py-2 px-2 text-left">Available</th>
                </tr>
              </thead>
              <tbody>
                {reserveRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-5 px-2 text-center text-gray-500">
                      No reserve transaction found for this job.
                    </td>
                  </tr>
                ) : reserveRows.map((r, idx) => {
                  const reserved = Number(r.reserved_qty || 0)
                  const supplied = Number(r.supplied_qty || 0)
                  const available = reserved - supplied
                  return (
                    <tr key={`${r.part_id || r.item_code || idx}-${idx}`} className="border-t border-gray-100">
                      <td className="py-2 px-2">{r.reserve_no || '-'}</td>
                      <td className="py-2 px-2 font-medium">{r.item_code || `#${r.part_id}`}</td>
                      <td className="py-2 px-2">{r.description || '-'}</td>
                      <td className="py-2 px-2">{reserved}</td>
                      <td className="py-2 px-2">{supplied}</td>
                      <td className="py-2 px-2">{available}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </SetupScreenFrame>
  )
}

function GarageIssueRequisitionPage() {
  const [jobOrderId, setJobOrderId] = useState('')
  const [partId, setPartId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [remark, setRemark] = useState('')
  const [requisitionNo, setRequisitionNo] = useState('')
  const [orderDate, setOrderDate] = useState('')
  const [requisitionSettingId, setRequisitionSettingId] = useState(null)
  const [lines, setLines] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)

  const jobsQuery = useQuery({
    queryKey: ['jobOrders', { screen: 'transaction-garage-issue-requisition' }],
    queryFn: () => jobOrdersApi.list({ limit: 500 }),
  })
  const vehiclesQuery = useQuery({
    queryKey: ['vehicles', { screen: 'transaction-garage-issue-requisition' }],
    queryFn: () => vehiclesApi.getAll({ limit: 500 }),
  })
  const customersQuery = useQuery({
    queryKey: ['customers', { screen: 'transaction-garage-issue-requisition' }],
    queryFn: () => customersApi.getAll({ limit: 500 }),
  })
  const partsQuery = useQuery({
    queryKey: ['parts', { screen: 'transaction-garage-issue-requisition' }],
    queryFn: () => partsApi.getAll({ limit: 500 }),
  })

  const jobs = useMemo(
    () =>
      (jobsQuery.data?.data || []).filter(
        (j) => !j.delivered_at && j.status !== 'Closed' && j.status !== 'Cancelled',
      ),
    [jobsQuery.data],
  )
  const vehicles = useMemo(() => vehiclesQuery.data?.data || [], [vehiclesQuery.data])
  const customers = useMemo(() => customersQuery.data?.data || [], [customersQuery.data])
  const parts = useMemo(() => partsQuery.data?.data || [], [partsQuery.data])

  const selectedJob = useMemo(() => {
    const id = Number(jobOrderId)
    return jobs.find((j) => Number(j.job_order_id) === id) || null
  }, [jobOrderId, jobs])
  const selectedVehicle = useMemo(() => {
    const id = Number(selectedJob?.vehicle_id)
    return vehicles.find((v) => Number(v.vehicle_id) === id) || null
  }, [selectedJob, vehicles])
  const selectedCustomer = useMemo(() => {
    const id = Number(selectedJob?.customer_id)
    return customers.find((c) => Number(c.customer_id) === id) || null
  }, [selectedJob, customers])
  const selectedPart = useMemo(() => {
    const id = Number(partId)
    return parts.find((p) => Number(p.part_id) === id) || null
  }, [partId, parts])

  const onRefresh = () => {
    setJobOrderId('')
    setPartId('')
    setQuantity('')
    setRemark('')
    setRequisitionNo('')
    setOrderDate('')
    setRequisitionSettingId(null)
    setLines([])
    setError('')
    setSuccess('')
  }

  const onAddNew = () => {
    setError('')
    setSuccess('')
    const now = new Date()
    const y = String(now.getFullYear()).slice(-2)
    const seq = String(Math.floor(Math.random() * 100000)).padStart(5, '0')
    setRequisitionNo(`PRQ-${seq}-${y}`)
    setOrderDate(now.toISOString().slice(0, 10))
    setRequisitionSettingId(null)
    setLines([])
  }

  const persistRequisition = async (nextLines) => {
    const payload = {
      requisition_no: requisitionNo,
      order_date: orderDate,
      job_order_id: Number(jobOrderId),
      lines: nextLines,
    }
    const data = {
      setting_key: requisitionNo,
      setting_value: JSON.stringify(payload),
      setting_type: 'json',
      category: REQUISITION_CAT,
      description: `Garage issue requisition for job ${selectedJob?.job_order_number || jobOrderId}`,
    }
    if (requisitionSettingId) {
      await systemSettingsApi.update(requisitionSettingId, data)
    } else {
      const res = await systemSettingsApi.create(data)
      setRequisitionSettingId(res?.data?.setting_id || null)
    }
  }

  const onSave = async () => {
    setError('')
    setSuccess('')
    if (!requisitionNo) {
      setError('Click Add New first.')
      return
    }
    if (!selectedJob?.job_order_id) {
      setError('Select job card number.')
      return
    }
    const pid = Number(partId)
    const qty = Number(quantity)
    if (!Number.isFinite(pid) || pid <= 0) {
      setError('Select item code.')
      return
    }
    if (!Number.isFinite(qty) || qty <= 0) {
      setError('Specify valid quantity.')
      return
    }
    const line = {
      job_order_no: selectedJob.job_order_number || `#${selectedJob.job_order_id}`,
      item_code: selectedPart?.part_number || `#${pid}`,
      description: selectedPart?.part_name || '',
      quantity: qty,
      remark: (remark || '').trim() || '-',
      created_by: 'administrator',
      created_dt: new Date().toISOString().slice(0, 10),
      created_ws: typeof window !== 'undefined' ? window.location.hostname || 'WEB' : 'WEB',
    }
    const next = [...lines, line]
    setSaving(true)
    try {
      await persistRequisition(next)
      setLines(next)
      setSuccess('Requisition line saved.')
      setPartId('')
      setQuantity('')
      setRemark('')
    } catch (e) {
      setError(e?.response?.data?.detail || 'Failed to save requisition.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <SetupScreenFrame
      hubTo="/transactions-hub"
      hubLabel="Transaction"
      title="Garage Issue Requisition"
      subtitle="Record issue requisitions before garage item issue processing."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" onClick={onAddNew}>
            Add New
          </Button>
          <Button type="button" variant="outline" onClick={onSave} disabled={saving}>
            Save
          </Button>
          <Button type="button" variant="outline" onClick={onRefresh}>
            Refresh
          </Button>
          <span className="text-sm text-blue-700">Ready</span>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          Record requisition first: Refresh, Add New (auto requisition no/date), select job card, item code, quantity,
          remark, then Save. Repeat Save for more items under the same requisition.
        </div>
        {error && <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        {success && <div className="rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{success}</div>}

        <div className="bg-white border rounded-lg shadow-sm p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <label className="text-sm space-y-1">
              <div className="font-medium text-gray-800">Requisition No</div>
              <Input readOnly value={requisitionNo || '(auto after Add New)'} />
            </label>
            <label className="text-sm space-y-1">
              <div className="font-medium text-gray-800">Order Date</div>
              <Input readOnly value={orderDate} />
            </label>
            <label className="text-sm space-y-1 md:col-span-2">
              <div className="font-medium text-gray-800">Job Card No</div>
              <select className="w-full border rounded px-2 py-2 text-sm" value={jobOrderId} onChange={(e) => setJobOrderId(e.target.value)}>
                <option value="">Select job...</option>
                {jobs.map((j) => (
                  <option key={j.job_order_id} value={String(j.job_order_id)}>
                    {j.job_order_number || `#${j.job_order_id}`}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm space-y-1 md:col-span-2">
              <div className="font-medium text-gray-800">Customer Name</div>
              <Input readOnly value={selectedCustomer ? `${selectedCustomer.first_name || ''} ${selectedCustomer.last_name || ''}`.trim() : ''} />
            </label>
            <label className="text-sm space-y-1 md:col-span-2">
              <div className="font-medium text-gray-800">Plate No</div>
              <Input readOnly value={selectedVehicle?.license_plate || ''} />
            </label>
            <label className="text-sm space-y-1 md:col-span-2">
              <div className="font-medium text-gray-800">Item Code</div>
              <select className="w-full border rounded px-2 py-2 text-sm" value={partId} onChange={(e) => setPartId(e.target.value)}>
                <option value="">Select item...</option>
                {parts.map((p) => (
                  <option key={p.part_id} value={String(p.part_id)}>
                    {p.part_number || `#${p.part_id}`} - {p.part_name || '-'}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm space-y-1">
              <div className="font-medium text-gray-800">Quantity</div>
              <Input value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </label>
            <label className="text-sm space-y-1 md:col-span-3">
              <div className="font-medium text-gray-800">Remark If Any</div>
              <Input value={remark} onChange={(e) => setRemark(e.target.value)} />
            </label>
          </div>
        </div>

        <div className="bg-white border rounded-lg shadow-sm p-4">
          <div className="overflow-auto">
            <table className="min-w-[900px] w-full text-sm">
              <thead className="bg-gray-100 text-xs text-gray-600 uppercase">
                <tr>
                  <th className="py-2 px-2 text-left">No</th>
                  <th className="py-2 px-2 text-left">Job Order No</th>
                  <th className="py-2 px-2 text-left">Item Code</th>
                  <th className="py-2 px-2 text-left">Description</th>
                  <th className="py-2 px-2 text-left">Quantity</th>
                  <th className="py-2 px-2 text-left">Remark</th>
                  <th className="py-2 px-2 text-left">Created By</th>
                </tr>
              </thead>
              <tbody>
                {lines.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-5 px-2 text-center text-gray-500">No requisition lines yet.</td>
                  </tr>
                ) : lines.map((ln, idx) => (
                  <tr key={`${ln.item_code}-${idx}`} className="border-t border-gray-100">
                    <td className="py-2 px-2">{idx + 1}</td>
                    <td className="py-2 px-2">{ln.job_order_no}</td>
                    <td className="py-2 px-2">{ln.item_code}</td>
                    <td className="py-2 px-2">{ln.description}</td>
                    <td className="py-2 px-2">{ln.quantity}</td>
                    <td className="py-2 px-2">{ln.remark}</td>
                    <td className="py-2 px-2">{ln.created_by}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </SetupScreenFrame>
  )
}

function LaborChargeEntryPage() {
  const [jobOrderId, setJobOrderId] = useState('')
  const [chargeTypeId, setChargeTypeId] = useState('')
  const [hoursSpent, setHoursSpent] = useState('')
  const [amount, setAmount] = useState('')
  const [remark, setRemark] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [clockRows, setClockRows] = useState([])
  const [loadingClocks, setLoadingClocks] = useState(false)

  const jobsQuery = useQuery({
    queryKey: ['jobOrders', { screen: 'transaction-labour-charge-entry' }],
    queryFn: () => jobOrdersApi.list({ limit: 500 }),
  })
  const vehiclesQuery = useQuery({
    queryKey: ['vehicles', { screen: 'transaction-labour-charge-entry' }],
    queryFn: () => vehiclesApi.getAll({ limit: 500 }),
  })
  const customersQuery = useQuery({
    queryKey: ['customers', { screen: 'transaction-labour-charge-entry' }],
    queryFn: () => customersApi.getAll({ limit: 500 }),
  })
  const laborTypesQuery = useQuery({
    queryKey: ['laborTypes', { screen: 'transaction-labour-charge-entry' }],
    queryFn: () => laborTypesApi.list({ active_only: true }),
  })
  const employeesQuery = useQuery({
    queryKey: ['employees', { screen: 'transaction-labour-charge-entry' }],
    queryFn: () => employeesApi.list({ limit: 500 }),
  })

  const jobLaborQuery = useQuery({
    queryKey: ['jobOrderLaborCharges', Number(jobOrderId) || null],
    queryFn: () => jobOrderLaborApi.listCharges(Number(jobOrderId)),
    enabled: !!Number(jobOrderId),
  })

  const saveLaborMutation = useMutation({
    mutationFn: (payload) => jobOrderLaborApi.createCharge(Number(jobOrderId), payload),
    onSuccess: async () => {
      await jobLaborQuery.refetch()
      setSuccess('Labor charge saved.')
      setChargeTypeId('')
      setHoursSpent('')
      setAmount('')
      setRemark('')
    },
    onError: (e) => setError(e?.response?.data?.detail || 'Failed to save labor charge.'),
  })

  const jobs = useMemo(
    () =>
      (jobsQuery.data?.data || []).filter(
        (j) => !j.delivered_at && j.status !== 'Closed' && j.status !== 'Cancelled',
      ),
    [jobsQuery.data],
  )
  const vehicles = useMemo(() => vehiclesQuery.data?.data || [], [vehiclesQuery.data])
  const customers = useMemo(() => customersQuery.data?.data || [], [customersQuery.data])
  const laborTypes = useMemo(() => laborTypesQuery.data?.data || [], [laborTypesQuery.data])
  const employees = useMemo(() => employeesQuery.data?.data || [], [employeesQuery.data])
  const laborRows = useMemo(() => jobLaborQuery.data?.data || [], [jobLaborQuery.data])

  const selectedJob = useMemo(() => {
    const id = Number(jobOrderId)
    return jobs.find((j) => Number(j.job_order_id) === id) || null
  }, [jobOrderId, jobs])
  const selectedVehicle = useMemo(() => {
    const id = Number(selectedJob?.vehicle_id)
    return vehicles.find((v) => Number(v.vehicle_id) === id) || null
  }, [selectedJob, vehicles])
  const selectedCustomer = useMemo(() => {
    const id = Number(selectedJob?.customer_id)
    return customers.find((c) => Number(c.customer_id) === id) || null
  }, [selectedJob, customers])
  const selectedCharge = useMemo(() => {
    const id = Number(chargeTypeId)
    return laborTypes.find((l) => Number(l.labor_type_id) === id) || null
  }, [chargeTypeId, laborTypes])

  useEffect(() => {
    let cancelled = false
    const loadClocks = async () => {
      const id = Number(jobOrderId)
      if (!Number.isFinite(id) || id <= 0) {
        setClockRows([])
        return
      }
      setLoadingClocks(true)
      try {
        const res = await jobOrdersApi.listClocks(id)
        if (!cancelled) setClockRows(res?.data || [])
      } catch {
        if (!cancelled) setClockRows([])
      } finally {
        if (!cancelled) setLoadingClocks(false)
      }
    }
    loadClocks()
    return () => {
      cancelled = true
    }
  }, [jobOrderId])

  useEffect(() => {
    if (!selectedCharge) return
    setHoursSpent((prev) => (prev ? prev : String(selectedCharge.standard_hours ?? '')))
    const hourly = Number(selectedCharge.hourly_rate || 0)
    const hours = Number(hoursSpent || selectedCharge.standard_hours || 0)
    if (Number.isFinite(hourly) && Number.isFinite(hours)) {
      setAmount(String((hourly * hours).toFixed(2)))
    }
  }, [selectedCharge])

  useEffect(() => {
    if (!selectedCharge) return
    const hourly = Number(selectedCharge.hourly_rate || 0)
    const hours = Number(hoursSpent || 0)
    if (Number.isFinite(hourly) && Number.isFinite(hours)) {
      setAmount(String((hourly * hours).toFixed(2)))
    }
  }, [hoursSpent, selectedCharge])

  const hasClockedOutTechnician = useMemo(
    () => (clockRows || []).some((r) => Boolean(r.clock_out_at)),
    [clockRows],
  )

  const technicianRows = useMemo(
    () =>
      (clockRows || []).map((r) => {
        const emp = employees.find((e) => Number(e.employee_id) === Number(r.technician_employee_id))
        const name = emp ? `${emp.first_name || ''} ${emp.last_name || ''}`.trim() : (r.technician_name || '')
        const timeSpent = r.clock_in_at && r.clock_out_at
          ? ((new Date(r.clock_out_at).getTime() - new Date(r.clock_in_at).getTime()) / 3600000)
          : 0
        return {
          techCode: emp?.employee_code || r.technician_employee_id || '-',
          technicianName: name || '-',
          pct: 100,
          timeSpent: Number.isFinite(timeSpent) && timeSpent > 0 ? timeSpent.toFixed(2) : '0.00',
        }
      }),
    [clockRows, employees],
  )

  const onRefresh = () => {
    setJobOrderId('')
    setChargeTypeId('')
    setHoursSpent('')
    setAmount('')
    setRemark('')
    setClockRows([])
    setError('')
    setSuccess('')
  }

  const onAddNew = () => {
    setError('')
    setSuccess('')
    setChargeTypeId('')
    setHoursSpent('')
    setAmount('')
    setRemark('')
  }

  const onSave = () => {
    setError('')
    setSuccess('')
    const jid = Number(jobOrderId)
    const ltid = Number(chargeTypeId)
    const hrs = Number(hoursSpent)
    if (!Number.isFinite(jid) || jid <= 0) {
      setError('Select job order number.')
      return
    }
    if (!hasClockedOutTechnician) {
      setError('No technician clocked-out for this job. Labor charge entry is blocked.')
      return
    }
    if (!Number.isFinite(ltid) || ltid <= 0) {
      setError('Select charge code.')
      return
    }
    if (!Number.isFinite(hrs) || hrs <= 0) {
      setError('Enter valid hour spent.')
      return
    }
    saveLaborMutation.mutate({
      labor_type_id: ltid,
      hours_worked: hrs,
      mfc_hours: 0,
      repair_option: null,
      price_list_type: null,
      is_charged: true,
      charge_code: (selectedCharge?.labor_code || selectedCharge?.labor_type_name || '').toString().trim() || null,
      remark: (remark || '').trim() || selectedCharge?.labor_type_name || null,
    })
  }

  const totalAmount = useMemo(
    () => laborRows.reduce((acc, r) => acc + Number(r.charge_amount || 0), 0),
    [laborRows],
  )
  const totalHours = useMemo(
    () => laborRows.reduce((acc, r) => acc + Number(r.hours_worked || 0), 0),
    [laborRows],
  )

  return (
    <SetupScreenFrame
      hubTo="/transactions-hub"
      hubLabel="Transaction"
      title="Labour Charge Transaction Entry"
      subtitle="Record labor charges by charge type for jobs worked by technicians."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" onClick={onAddNew}>Add New</Button>
          <Button type="button" variant="outline" onClick={onSave} disabled={saveLaborMutation.isPending}>Save</Button>
          <Button type="button" variant="outline" onClick={onRefresh}>Refresh</Button>
          <span className="text-sm text-blue-700">Ready</span>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          Labor charge entry is allowed only when at least one technician has clocked-out on the selected job.
        </div>
        {error && <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        {success && <div className="rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{success}</div>}

        <div className="bg-white border rounded-lg shadow-sm p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-3">
            <label className="text-sm space-y-1 block">
              <div className="font-medium text-gray-800">Job Order No</div>
              <select className="w-full border rounded px-2 py-2 text-sm" value={jobOrderId} onChange={(e) => setJobOrderId(e.target.value)}>
                <option value="">Select job...</option>
                {jobs.map((j) => (
                  <option key={j.job_order_id} value={String(j.job_order_id)}>
                    {j.job_order_number || `#${j.job_order_id}`}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm space-y-1 block">
              <div className="font-medium text-gray-800">Plate No</div>
              <Input readOnly value={selectedVehicle?.license_plate || ''} />
            </label>
            <label className="text-sm space-y-1 block">
              <div className="font-medium text-gray-800">Customer</div>
              <Input readOnly value={selectedCustomer ? `${selectedCustomer.first_name || ''} ${selectedCustomer.last_name || ''}`.trim() : ''} />
            </label>
            <label className="text-sm space-y-1 block">
              <div className="font-medium text-gray-800">Address</div>
              <Input readOnly value={selectedCustomer?.address || ''} />
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <label className="text-sm space-y-1 block md:col-span-2">
                <div className="font-medium text-gray-800">Charge Code</div>
                <select className="w-full border rounded px-2 py-2 text-sm" value={chargeTypeId} onChange={(e) => setChargeTypeId(e.target.value)}>
                  <option value="">Select labor charge...</option>
                  {laborTypes.map((l) => (
                    <option key={l.labor_type_id} value={String(l.labor_type_id)}>
                      {(l.labor_code || l.labor_type_name || `#${l.labor_type_id}`)} - {l.labor_type_name || ''}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm space-y-1 block">
                <div className="font-medium text-gray-800">Hour Spent</div>
                <Input value={hoursSpent} onChange={(e) => setHoursSpent(e.target.value)} />
              </label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="text-sm space-y-1 block">
                <div className="font-medium text-gray-800">Description</div>
                <Input readOnly value={selectedCharge?.labor_type_name || ''} />
              </label>
              <label className="text-sm space-y-1 block">
                <div className="font-medium text-gray-800">Amount</div>
                <Input readOnly value={amount} />
              </label>
            </div>
            <label className="text-sm space-y-1 block">
              <div className="font-medium text-gray-800">Remark</div>
              <Input value={remark} onChange={(e) => setRemark(e.target.value)} />
            </label>
          </div>

          <div className="border rounded p-3">
            <div className="text-sm font-semibold text-gray-800 mb-2">Technician Distribution</div>
            <div className="overflow-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100 text-xs text-gray-600 uppercase">
                  <tr>
                    <th className="py-2 px-2 text-left">Tech Code</th>
                    <th className="py-2 px-2 text-left">Technician Name</th>
                    <th className="py-2 px-2 text-left">% Cont</th>
                    <th className="py-2 px-2 text-left">Time Spent</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingClocks ? (
                    <tr><td colSpan={4} className="py-4 px-2 text-center text-gray-500">Loading...</td></tr>
                  ) : technicianRows.length === 0 ? (
                    <tr><td colSpan={4} className="py-4 px-2 text-center text-gray-500">No technician clock records.</td></tr>
                  ) : technicianRows.map((r, idx) => (
                    <tr key={`${r.techCode}-${idx}`} className="border-t border-gray-100">
                      <td className="py-2 px-2">{r.techCode}</td>
                      <td className="py-2 px-2">{r.technicianName}</td>
                      <td className="py-2 px-2">{r.pct}</td>
                      <td className="py-2 px-2">{r.timeSpent}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg shadow-sm p-4">
          <div className="overflow-auto">
            <table className="min-w-[900px] w-full text-sm">
              <thead className="bg-gray-100 text-xs text-gray-600 uppercase">
                <tr>
                  <th className="py-2 px-2 text-left">No</th>
                  <th className="py-2 px-2 text-left">Date</th>
                  <th className="py-2 px-2 text-left">Charge Code</th>
                  <th className="py-2 px-2 text-left">Description</th>
                  <th className="py-2 px-2 text-left">Hours</th>
                  <th className="py-2 px-2 text-left">Amount</th>
                  <th className="py-2 px-2 text-left">Created By</th>
                </tr>
              </thead>
              <tbody>
                {laborRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-5 px-2 text-center text-gray-500">No labor charge transaction yet.</td>
                  </tr>
                ) : laborRows.map((r, idx) => (
                  <tr key={r.labor_charge_id || idx} className="border-t border-gray-100">
                    <td className="py-2 px-2">{idx + 1}</td>
                    <td className="py-2 px-2">{String(r.created_at || '').slice(0, 10) || '-'}</td>
                    <td className="py-2 px-2">{r.charge_code || '-'}</td>
                    <td className="py-2 px-2">{r.remark || r.labor_type_name || '-'}</td>
                    <td className="py-2 px-2">{Number(r.hours_worked || 0).toFixed(2)}</td>
                    <td className="py-2 px-2">{Number(r.charge_amount || 0).toFixed(2)}</td>
                    <td className="py-2 px-2">{r.created_by || 'administrator'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 text-sm text-gray-700 flex gap-6">
            <div>Total Hours: <span className="font-semibold">{totalHours.toFixed(2)}</span></div>
            <div>Total Amount: <span className="font-semibold">{totalAmount.toFixed(2)}</span></div>
          </div>
        </div>
      </div>
    </SetupScreenFrame>
  )
}

function MiscOrFuelChargeEntryPage({ mode = 'misc' }) {
  const isFuel = mode === 'fuel'
  const [jobOrderId, setJobOrderId] = useState('')
  const [chargeTypeId, setChargeTypeId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const jobsQuery = useQuery({
    queryKey: ['jobOrders', { screen: `transaction-${mode}-charge-entry` }],
    queryFn: () => jobOrdersApi.list({ limit: 500 }),
  })
  const vehiclesQuery = useQuery({
    queryKey: ['vehicles', { screen: `transaction-${mode}-charge-entry` }],
    queryFn: () => vehiclesApi.getAll({ limit: 500 }),
  })
  const customersQuery = useQuery({
    queryKey: ['customers', { screen: `transaction-${mode}-charge-entry` }],
    queryFn: () => customersApi.getAll({ limit: 500 }),
  })

  const typesQuery = useQuery({
    queryKey: [isFuel ? 'fuelLubricants' : 'miscChargeTypes', { active_only: true, screen: `transaction-${mode}-charge-entry` }],
    queryFn: () => (isFuel ? fuelLubricantsApi.list({ active_only: true }) : miscChargeTypesApi.list({ active_only: true })),
  })

  const rowsQuery = useQuery({
    queryKey: [isFuel ? 'jobFuelCharges' : 'jobMiscCharges', Number(jobOrderId) || null],
    queryFn: () => (isFuel ? jobOrderAdditionalChargesApi.listFuel(Number(jobOrderId)) : jobOrderAdditionalChargesApi.listMisc(Number(jobOrderId))),
    enabled: !!Number(jobOrderId),
  })

  const createMutation = useMutation({
    mutationFn: (payload) =>
      (isFuel
        ? jobOrderAdditionalChargesApi.createFuel(Number(jobOrderId), payload)
        : jobOrderAdditionalChargesApi.createMisc(Number(jobOrderId), payload)),
    onSuccess: async () => {
      await rowsQuery.refetch()
      setSuccess(`${isFuel ? 'Fuel/lubricant' : 'Miscellaneous'} charge saved.`)
      setChargeTypeId('')
      if (isFuel) setQuantity('1')
    },
    onError: (e) => setError(e?.response?.data?.detail || 'Save failed.'),
  })

  const jobs = useMemo(
    () =>
      (jobsQuery.data?.data || []).filter(
        (j) => !j.delivered_at && j.status !== 'Closed' && j.status !== 'Cancelled',
      ),
    [jobsQuery.data],
  )
  const vehicles = useMemo(() => vehiclesQuery.data?.data || [], [vehiclesQuery.data])
  const customers = useMemo(() => customersQuery.data?.data || [], [customersQuery.data])
  const typeRows = useMemo(() => typesQuery.data?.data || [], [typesQuery.data])
  const chargeRows = useMemo(() => rowsQuery.data?.data || [], [rowsQuery.data])

  const selectedJob = useMemo(() => {
    const id = Number(jobOrderId)
    return jobs.find((j) => Number(j.job_order_id) === id) || null
  }, [jobOrderId, jobs])
  const selectedVehicle = useMemo(() => {
    const id = Number(selectedJob?.vehicle_id)
    return vehicles.find((v) => Number(v.vehicle_id) === id) || null
  }, [selectedJob, vehicles])
  const selectedCustomer = useMemo(() => {
    const id = Number(selectedJob?.customer_id)
    return customers.find((c) => Number(c.customer_id) === id) || null
  }, [selectedJob, customers])
  const selectedType = useMemo(() => {
    const id = Number(chargeTypeId)
    if (!Number.isFinite(id) || id <= 0) return null
    const key = isFuel ? 'fuel_lubricant_id' : 'misc_charge_type_id'
    return typeRows.find((x) => Number(x[key]) === id) || null
  }, [chargeTypeId, typeRows, isFuel])

  const unitPrice = Number(selectedType?.unit_price || 0)
  const qtyNum = Number(quantity || 0)
  const amount = isFuel ? (Number.isFinite(qtyNum) ? qtyNum * unitPrice : 0) : unitPrice
  const vat = (selectedType?.taxable ? amount * 0.15 : 0)
  const totalIncVat = amount + vat

  const onRefresh = () => {
    setJobOrderId('')
    setChargeTypeId('')
    setQuantity('1')
    setError('')
    setSuccess('')
  }
  const onAddNew = () => {
    setChargeTypeId('')
    setQuantity('1')
    setError('')
    setSuccess('')
  }
  const onSave = () => {
    setError('')
    setSuccess('')
    const jid = Number(jobOrderId)
    const tid = Number(chargeTypeId)
    if (!Number.isFinite(jid) || jid <= 0) return setError('Select job order number.')
    if (!Number.isFinite(tid) || tid <= 0) return setError(`Select ${isFuel ? 'fuel/lubricant' : 'miscellaneous'} charge type.`)
    if (isFuel) {
      const qty = Number(quantity)
      if (!Number.isFinite(qty) || qty <= 0) return setError('Specify quantity to be charged.')
      createMutation.mutate({ fuel_lubricant_id: tid, quantity: qty, remark: null })
      return
    }
    createMutation.mutate({ misc_charge_type_id: tid, remark: null })
  }

  const totals = useMemo(() => {
    const subtotal = chargeRows.reduce((acc, r) => acc + Number(r.amount || 0), 0)
    const vatTotal = chargeRows.reduce((acc, r) => acc + Number(r.tax_amount || 0), 0)
    return { subtotal, vatTotal, total: subtotal + vatTotal }
  }, [chargeRows])

  return (
    <SetupScreenFrame
      hubTo="/transactions-hub"
      hubLabel="Transaction"
      title="Transaction Entry"
      subtitle={isFuel ? 'Lubricants Fuel Usage Entry' : 'Miscellaneous Charge Entry'}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" onClick={onAddNew}>Add New</Button>
          <Button type="button" variant="outline" onClick={onSave} disabled={createMutation.isPending}>Save</Button>
          <Button type="button" variant="outline" onClick={onRefresh}>Refresh</Button>
          <span className="text-sm text-blue-700">Ready</span>
        </div>
      }
    >
      <div className="space-y-4">
        {error && <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        {success && <div className="rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{success}</div>}
        <div className="bg-white border rounded-lg shadow-sm p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <label className="text-sm space-y-1 md:col-span-2">
              <div className="font-medium text-gray-800">JobOrder No.</div>
              <select className="w-full border rounded px-2 py-2 text-sm" value={jobOrderId} onChange={(e) => setJobOrderId(e.target.value)}>
                <option value="">Select job...</option>
                {jobs.map((j) => (
                  <option key={j.job_order_id} value={String(j.job_order_id)}>{j.job_order_number || `#${j.job_order_id}`}</option>
                ))}
              </select>
            </label>
            <label className="text-sm space-y-1">
              <div className="font-medium text-gray-800">Plate No</div>
              <Input readOnly value={selectedVehicle?.license_plate || ''} />
            </label>
            <label className="text-sm space-y-1">
              <div className="font-medium text-gray-800">Date</div>
              <Input readOnly value={new Date().toISOString().slice(0, 10)} />
            </label>
            <label className="text-sm space-y-1 md:col-span-2">
              <div className="font-medium text-gray-800">Customer</div>
              <Input readOnly value={selectedCustomer ? `${selectedCustomer.first_name || ''} ${selectedCustomer.last_name || ''}`.trim() : ''} />
            </label>
            <label className="text-sm space-y-1 md:col-span-2">
              <div className="font-medium text-gray-800">Address</div>
              <Input readOnly value={selectedCustomer?.address || ''} />
            </label>
          </div>
        </div>

        <div className="bg-white border rounded-lg shadow-sm p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <label className="text-sm space-y-1 md:col-span-2">
              <div className="font-medium text-gray-800">{isFuel ? 'Fuel & Lubricant' : 'Misc Charge'}</div>
              <select className="w-full border rounded px-2 py-2 text-sm" value={chargeTypeId} onChange={(e) => setChargeTypeId(e.target.value)}>
                <option value="">Select charge type...</option>
                {typeRows.map((t) => {
                  const idKey = isFuel ? 'fuel_lubricant_id' : 'misc_charge_type_id'
                  const codeKey = isFuel ? 'item_code' : 'charge_code'
                  return (
                    <option key={t[idKey]} value={String(t[idKey])}>
                      {t[codeKey]} - {t.description}
                    </option>
                  )
                })}
              </select>
            </label>
            <label className="text-sm space-y-1">
              <div className="font-medium text-gray-800">Charge Code</div>
              <Input readOnly value={isFuel ? (selectedType?.item_code || '') : (selectedType?.charge_code || '')} />
            </label>
            <label className="text-sm space-y-1">
              <div className="font-medium text-gray-800">Quantity</div>
              <Input value={isFuel ? quantity : '1'} onChange={(e) => setQuantity(e.target.value)} readOnly={!isFuel} />
            </label>
            <label className="text-sm space-y-1">
              <div className="font-medium text-gray-800">Unit Price</div>
              <Input readOnly value={unitPrice ? unitPrice.toFixed(2) : ''} />
            </label>
            <label className="text-sm space-y-1 md:col-span-2">
              <div className="font-medium text-gray-800">Description</div>
              <Input readOnly value={selectedType?.description || ''} />
            </label>
            <label className="text-sm space-y-1">
              <div className="font-medium text-gray-800">Amount</div>
              <Input readOnly value={amount ? amount.toFixed(2) : ''} />
            </label>
            <label className="text-sm space-y-1">
              <div className="font-medium text-gray-800">VAT</div>
              <Input readOnly value={vat ? vat.toFixed(2) : '0.00'} />
            </label>
            <label className="text-sm space-y-1">
              <div className="font-medium text-gray-800">Total Inc VAT</div>
              <Input readOnly value={totalIncVat ? totalIncVat.toFixed(2) : '0.00'} />
            </label>
          </div>

          <div className="overflow-auto border rounded">
            <table className="min-w-[900px] w-full text-sm">
              <thead className="bg-gray-100 text-xs text-gray-600 uppercase">
                <tr>
                  <th className="py-2 px-2 text-left">No</th>
                  <th className="py-2 px-2 text-left">Date</th>
                  <th className="py-2 px-2 text-left">Charge Code</th>
                  <th className="py-2 px-2 text-left">Description</th>
                  <th className="py-2 px-2 text-left">Quantity</th>
                  <th className="py-2 px-2 text-left">Unit Price</th>
                  <th className="py-2 px-2 text-left">Amount</th>
                  <th className="py-2 px-2 text-left">VAT</th>
                  <th className="py-2 px-2 text-left">Total Inc VAT</th>
                  <th className="py-2 px-2 text-left">Created By</th>
                </tr>
              </thead>
              <tbody>
                {chargeRows.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-5 px-2 text-center text-gray-500">No transaction records yet.</td>
                  </tr>
                ) : chargeRows.map((r, idx) => {
                  const lineVat = Number(r.tax_amount || 0)
                  const lineAmount = Number(r.amount || 0)
                  const code = isFuel ? r.item_code : r.charge_code
                  const qty = r.quantity != null ? Number(r.quantity) : 1
                  return (
                    <tr key={r.entry_id || idx} className="border-t border-gray-100">
                      <td className="py-2 px-2">{idx + 1}</td>
                      <td className="py-2 px-2">{String(r.created_at || '').slice(0, 10) || '-'}</td>
                      <td className="py-2 px-2">{code || '-'}</td>
                      <td className="py-2 px-2">{r.description || '-'}</td>
                      <td className="py-2 px-2">{Number.isFinite(qty) ? qty.toFixed(2) : '1.00'}</td>
                      <td className="py-2 px-2">{Number(r.unit_price || 0).toFixed(2)}</td>
                      <td className="py-2 px-2">{lineAmount.toFixed(2)}</td>
                      <td className="py-2 px-2">{lineVat.toFixed(2)}</td>
                      <td className="py-2 px-2">{(lineAmount + lineVat).toFixed(2)}</td>
                      <td className="py-2 px-2">{r.created_by || 'administrator'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="text-sm text-gray-700 flex gap-6">
            <div>Total: <span className="font-semibold">{totals.subtotal.toFixed(2)}</span></div>
            <div>VAT: <span className="font-semibold">{totals.vatTotal.toFixed(2)}</span></div>
            <div>Total Inc. VAT: <span className="font-semibold">{totals.total.toFixed(2)}</span></div>
          </div>
        </div>
      </div>
    </SetupScreenFrame>
  )
}

function SubletOrOtherChargeEntryPage({ mode = 'sublet' }) {
  const isSublet = mode === 'sublet'
  const [jobOrderId, setJobOrderId] = useState('')
  const [chargeTypeId, setChargeTypeId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const jobsQuery = useQuery({
    queryKey: ['jobOrders', { screen: `transaction-${mode}-charge-entry` }],
    queryFn: () => jobOrdersApi.list({ limit: 500 }),
  })
  const vehiclesQuery = useQuery({
    queryKey: ['vehicles', { screen: `transaction-${mode}-charge-entry` }],
    queryFn: () => vehiclesApi.getAll({ limit: 500 }),
  })
  const customersQuery = useQuery({
    queryKey: ['customers', { screen: `transaction-${mode}-charge-entry` }],
    queryFn: () => customersApi.getAll({ limit: 500 }),
  })
  const typesQuery = useQuery({
    queryKey: [isSublet ? 'subletWorkTypes' : 'otherChargeTypes', { active_only: true, screen: `transaction-${mode}-charge-entry` }],
    queryFn: () => (isSublet ? subletWorkTypesApi.list({ active_only: true }) : otherChargeTypesApi.list({ active_only: true })),
  })
  const suppliersQuery = useQuery({
    queryKey: ['subletWorkSuppliers', { screen: `transaction-${mode}-charge-entry` }],
    queryFn: () => subletWorkSuppliersApi.list({ active_only: false }),
    enabled: isSublet,
  })
  const rowsQuery = useQuery({
    queryKey: [isSublet ? 'jobSubletCharges' : 'jobOtherCharges', Number(jobOrderId) || null],
    queryFn: () => (isSublet ? jobOrderAdditionalChargesApi.listSublet(Number(jobOrderId)) : jobOrderAdditionalChargesApi.listOther(Number(jobOrderId))),
    enabled: !!Number(jobOrderId),
  })

  const createMutation = useMutation({
    mutationFn: (payload) =>
      (isSublet
        ? jobOrderAdditionalChargesApi.createSublet(Number(jobOrderId), payload)
        : jobOrderAdditionalChargesApi.createOther(Number(jobOrderId), payload)),
    onSuccess: async () => {
      await rowsQuery.refetch()
      setSuccess(`${isSublet ? 'Sublet work' : 'Other'} charge saved.`)
      setChargeTypeId('')
      setQuantity('1')
    },
    onError: (e) => setError(e?.response?.data?.detail || 'Save failed.'),
  })

  const jobs = useMemo(
    () =>
      (jobsQuery.data?.data || []).filter(
        (j) => !j.delivered_at && j.status !== 'Closed' && j.status !== 'Cancelled',
      ),
    [jobsQuery.data],
  )
  const vehicles = useMemo(() => vehiclesQuery.data?.data || [], [vehiclesQuery.data])
  const customers = useMemo(() => customersQuery.data?.data || [], [customersQuery.data])
  const typeRows = useMemo(() => typesQuery.data?.data || [], [typesQuery.data])
  const suppliers = useMemo(() => suppliersQuery.data?.data || [], [suppliersQuery.data])
  const chargeRows = useMemo(() => rowsQuery.data?.data || [], [rowsQuery.data])

  const selectedJob = useMemo(() => {
    const id = Number(jobOrderId)
    return jobs.find((j) => Number(j.job_order_id) === id) || null
  }, [jobOrderId, jobs])
  const selectedVehicle = useMemo(() => {
    const id = Number(selectedJob?.vehicle_id)
    return vehicles.find((v) => Number(v.vehicle_id) === id) || null
  }, [selectedJob, vehicles])
  const selectedCustomer = useMemo(() => {
    const id = Number(selectedJob?.customer_id)
    return customers.find((c) => Number(c.customer_id) === id) || null
  }, [selectedJob, customers])
  const selectedType = useMemo(() => {
    const id = Number(chargeTypeId)
    if (!Number.isFinite(id) || id <= 0) return null
    const key = isSublet ? 'sublet_work_type_id' : 'other_charge_type_id'
    return typeRows.find((x) => Number(x[key]) === id) || null
  }, [chargeTypeId, typeRows, isSublet])
  const supplierName = useMemo(() => {
    if (!isSublet) return ''
    const sid = Number(selectedType?.supplier_id)
    if (!Number.isFinite(sid) || sid <= 0) return ''
    return suppliers.find((s) => Number(s.supplier_id) === sid)?.supplier_name || `#${sid}`
  }, [isSublet, selectedType, suppliers])

  const unitPrice = Number(selectedType?.unit_price || 0)
  const qtyNum = Number(quantity || 0)
  const amount = Number.isFinite(qtyNum) ? qtyNum * unitPrice : 0
  const vat = (selectedType?.taxable ? amount * 0.15 : 0)
  const totalIncVat = amount + vat

  const onRefresh = () => {
    setJobOrderId('')
    setChargeTypeId('')
    setQuantity('1')
    setError('')
    setSuccess('')
  }
  const onAddNew = () => {
    setChargeTypeId('')
    setQuantity('1')
    setError('')
    setSuccess('')
  }
  const onSave = () => {
    setError('')
    setSuccess('')
    const jid = Number(jobOrderId)
    const tid = Number(chargeTypeId)
    const qty = Number(quantity)
    if (!Number.isFinite(jid) || jid <= 0) return setError('Select job order number.')
    if (!Number.isFinite(tid) || tid <= 0) return setError(`Select ${isSublet ? 'sublet work' : 'other'} charge type.`)
    if (!Number.isFinite(qty) || qty <= 0) return setError('Specify quantity to be charged.')
    if (isSublet) createMutation.mutate({ sublet_work_type_id: tid, quantity: qty, remark: null })
    else createMutation.mutate({ other_charge_type_id: tid, quantity: qty, remark: null })
  }

  const totals = useMemo(() => {
    const subtotal = chargeRows.reduce((acc, r) => acc + Number(r.amount || 0), 0)
    const vatTotal = chargeRows.reduce((acc, r) => acc + Number(r.tax_amount || 0), 0)
    return { subtotal, vatTotal, total: subtotal + vatTotal }
  }, [chargeRows])

  return (
    <SetupScreenFrame
      hubTo="/transactions-hub"
      hubLabel="Transaction"
      title="Transaction Entry"
      subtitle={isSublet ? 'Sublet Work Charge Entry' : 'Other Charges Entry'}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" onClick={onAddNew}>Add New</Button>
          <Button type="button" variant="outline" onClick={onSave} disabled={createMutation.isPending}>Save</Button>
          <Button type="button" variant="outline" onClick={onRefresh}>Refresh</Button>
          <span className="text-sm text-blue-700">Ready</span>
        </div>
      }
    >
      <div className="space-y-4">
        {error && <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        {success && <div className="rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{success}</div>}

        <div className="bg-white border rounded-lg shadow-sm p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <label className="text-sm space-y-1 md:col-span-2">
              <div className="font-medium text-gray-800">JobOrder No.</div>
              <select className="w-full border rounded px-2 py-2 text-sm" value={jobOrderId} onChange={(e) => setJobOrderId(e.target.value)}>
                <option value="">Select job...</option>
                {jobs.map((j) => (
                  <option key={j.job_order_id} value={String(j.job_order_id)}>{j.job_order_number || `#${j.job_order_id}`}</option>
                ))}
              </select>
            </label>
            <label className="text-sm space-y-1">
              <div className="font-medium text-gray-800">Plate No</div>
              <Input readOnly value={selectedVehicle?.license_plate || ''} />
            </label>
            <label className="text-sm space-y-1">
              <div className="font-medium text-gray-800">Date</div>
              <Input readOnly value={new Date().toISOString().slice(0, 10)} />
            </label>
            <label className="text-sm space-y-1 md:col-span-2">
              <div className="font-medium text-gray-800">Customer</div>
              <Input readOnly value={selectedCustomer ? `${selectedCustomer.first_name || ''} ${selectedCustomer.last_name || ''}`.trim() : ''} />
            </label>
            <label className="text-sm space-y-1 md:col-span-2">
              <div className="font-medium text-gray-800">Address</div>
              <Input readOnly value={selectedCustomer?.address || ''} />
            </label>
          </div>
        </div>

        <div className="bg-white border rounded-lg shadow-sm p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <label className="text-sm space-y-1 md:col-span-2">
              <div className="font-medium text-gray-800">{isSublet ? 'SubLet Charge' : 'Other Charge'}</div>
              <select className="w-full border rounded px-2 py-2 text-sm" value={chargeTypeId} onChange={(e) => setChargeTypeId(e.target.value)}>
                <option value="">Select charge type...</option>
                {typeRows.map((t) => {
                  const idKey = isSublet ? 'sublet_work_type_id' : 'other_charge_type_id'
                  const codeKey = isSublet ? 'work_code' : 'charge_code'
                  return (
                    <option key={t[idKey]} value={String(t[idKey])}>
                      {t[codeKey]} - {t.description}
                    </option>
                  )
                })}
              </select>
            </label>
            <label className="text-sm space-y-1">
              <div className="font-medium text-gray-800">Charge Code</div>
              <Input readOnly value={isSublet ? (selectedType?.work_code || '') : (selectedType?.charge_code || '')} />
            </label>
            <label className="text-sm space-y-1">
              <div className="font-medium text-gray-800">Quantity</div>
              <Input value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </label>
            <label className="text-sm space-y-1">
              <div className="font-medium text-gray-800">Unit Price</div>
              <Input readOnly value={unitPrice ? unitPrice.toFixed(2) : ''} />
            </label>
            <label className="text-sm space-y-1 md:col-span-2">
              <div className="font-medium text-gray-800">Description</div>
              <Input readOnly value={selectedType?.description || ''} />
            </label>
            {isSublet && (
              <label className="text-sm space-y-1 md:col-span-2">
                <div className="font-medium text-gray-800">Supplier</div>
                <Input readOnly value={supplierName} />
              </label>
            )}
            <label className="text-sm space-y-1">
              <div className="font-medium text-gray-800">Amount</div>
              <Input readOnly value={amount ? amount.toFixed(2) : ''} />
            </label>
            <label className="text-sm space-y-1">
              <div className="font-medium text-gray-800">VAT</div>
              <Input readOnly value={vat ? vat.toFixed(2) : '0.00'} />
            </label>
            <label className="text-sm space-y-1">
              <div className="font-medium text-gray-800">Total Inc VAT</div>
              <Input readOnly value={totalIncVat ? totalIncVat.toFixed(2) : '0.00'} />
            </label>
          </div>

          <div className="overflow-auto border rounded">
            <table className="min-w-[900px] w-full text-sm">
              <thead className="bg-gray-100 text-xs text-gray-600 uppercase">
                <tr>
                  <th className="py-2 px-2 text-left">No</th>
                  <th className="py-2 px-2 text-left">Date</th>
                  <th className="py-2 px-2 text-left">Charge Code</th>
                  <th className="py-2 px-2 text-left">Description</th>
                  <th className="py-2 px-2 text-left">Quantity</th>
                  <th className="py-2 px-2 text-left">Unit Price</th>
                  <th className="py-2 px-2 text-left">Amount</th>
                  <th className="py-2 px-2 text-left">VAT</th>
                  <th className="py-2 px-2 text-left">Total Inc VAT</th>
                  <th className="py-2 px-2 text-left">Created By</th>
                </tr>
              </thead>
              <tbody>
                {chargeRows.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-5 px-2 text-center text-gray-500">No transaction records yet.</td>
                  </tr>
                ) : chargeRows.map((r, idx) => {
                  const lineVat = Number(r.tax_amount || 0)
                  const lineAmount = Number(r.amount || 0)
                  const code = isSublet ? r.work_code : r.charge_code
                  const qty = r.quantity != null ? Number(r.quantity) : 1
                  return (
                    <tr key={r.entry_id || idx} className="border-t border-gray-100">
                      <td className="py-2 px-2">{idx + 1}</td>
                      <td className="py-2 px-2">{String(r.created_at || '').slice(0, 10) || '-'}</td>
                      <td className="py-2 px-2">{code || '-'}</td>
                      <td className="py-2 px-2">{r.description || '-'}</td>
                      <td className="py-2 px-2">{Number.isFinite(qty) ? qty.toFixed(2) : '1.00'}</td>
                      <td className="py-2 px-2">{Number(r.unit_price || 0).toFixed(2)}</td>
                      <td className="py-2 px-2">{lineAmount.toFixed(2)}</td>
                      <td className="py-2 px-2">{lineVat.toFixed(2)}</td>
                      <td className="py-2 px-2">{(lineAmount + lineVat).toFixed(2)}</td>
                      <td className="py-2 px-2">{r.created_by || 'administrator'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="text-sm text-gray-700 flex gap-6">
            <div>Total: <span className="font-semibold">{totals.subtotal.toFixed(2)}</span></div>
            <div>VAT: <span className="font-semibold">{totals.vatTotal.toFixed(2)}</span></div>
            <div>Total Inc. VAT: <span className="font-semibold">{totals.total.toFixed(2)}</span></div>
          </div>
        </div>
      </div>
    </SetupScreenFrame>
  )
}

function RequestForReturnPage() {
  const [jobOrderId, setJobOrderId] = useState('')
  const [issueId, setIssueId] = useState('')
  const [invoiceId, setInvoiceId] = useState('')
  const [returnReason, setReturnReason] = useState('')
  const [returnTo, setReturnTo] = useState('')
  const [qtyToReturn, setQtyToReturn] = useState('')
  const [itemRemark, setItemRemark] = useState('')
  const [items, setItems] = useState([])
  const [returnNo, setReturnNo] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const jobsQuery = useQuery({
    queryKey: ['jobOrders', { screen: 'transaction-request-for-return' }],
    queryFn: () => jobOrdersApi.list({ limit: 500 }),
  })
  const vehiclesQuery = useQuery({
    queryKey: ['vehicles', { screen: 'transaction-request-for-return' }],
    queryFn: () => vehiclesApi.getAll({ limit: 500 }),
  })
  const customersQuery = useQuery({
    queryKey: ['customers', { screen: 'transaction-request-for-return' }],
    queryFn: () => customersApi.getAll({ limit: 500 }),
  })
  const invoicesQuery = useQuery({
    queryKey: ['garageInvoices', { screen: 'transaction-request-for-return' }],
    queryFn: () => garageInvoicesApi.list({ limit: 500 }),
  })
  const returnReasonsQuery = useQuery({
    queryKey: ['systemSettings', { category: 'return_reason', screen: 'transaction-request-for-return' }],
    queryFn: () => systemSettingsApi.list({ category: 'return_reason', limit: 200 }),
  })
  const issuesQuery = useQuery({
    queryKey: ['jobOrderIssues', Number(jobOrderId) || null],
    queryFn: () => jobOrderInventoryApi.listIssues(Number(jobOrderId)),
    enabled: !!Number(jobOrderId),
  })

  const createReturnMutation = useMutation({
    mutationFn: (payload) => jobOrderInventoryApi.createReturnRequest(Number(issueId), payload),
    onSuccess: () => {
      setSuccess('Return requisition submitted to approver.')
      setItems([])
      setQtyToReturn('')
      setItemRemark('')
    },
    onError: (e) => setError(e?.response?.data?.detail || 'Failed to submit return requisition.'),
  })

  const jobs = useMemo(() => jobsQuery.data?.data || [], [jobsQuery.data])
  const vehicles = useMemo(() => vehiclesQuery.data?.data || [], [vehiclesQuery.data])
  const customers = useMemo(() => customersQuery.data?.data || [], [customersQuery.data])
  const invoices = useMemo(() => invoicesQuery.data?.data || [], [invoicesQuery.data])
  const reasonRows = useMemo(() => returnReasonsQuery.data?.data || [], [returnReasonsQuery.data])
  const issues = useMemo(
    () => (issuesQuery.data?.data || []).filter((x) => String(x.status || '').toLowerCase() === 'finalized'),
    [issuesQuery.data],
  )

  const reasons = useMemo(() => {
    const fromSettings = reasonRows
      .map((r) => (r.setting_value || r.setting_key || '').toString().trim())
      .filter(Boolean)
    if (fromSettings.length) return fromSettings
    return ['Model Error', 'Wrong Item Issued', 'Quantity Correction', 'Customer Return']
  }, [reasonRows])

  const selectedJob = useMemo(() => {
    const id = Number(jobOrderId)
    return jobs.find((j) => Number(j.job_order_id) === id) || null
  }, [jobOrderId, jobs])
  const selectedVehicle = useMemo(() => {
    const id = Number(selectedJob?.vehicle_id)
    return vehicles.find((v) => Number(v.vehicle_id) === id) || null
  }, [selectedJob, vehicles])
  const selectedCustomer = useMemo(() => {
    const id = Number(selectedJob?.customer_id)
    return customers.find((c) => Number(c.customer_id) === id) || null
  }, [selectedJob, customers])
  const selectedIssue = useMemo(() => {
    const id = Number(issueId)
    return issues.find((i) => Number(i.issue_id) === id) || null
  }, [issueId, issues])
  const selectedInvoice = useMemo(() => {
    const id = Number(invoiceId)
    return invoices.find((inv) => Number(inv.garage_invoice_id) === id) || null
  }, [invoiceId, invoices])

  const onRefresh = () => {
    setJobOrderId('')
    setIssueId('')
    setInvoiceId('')
    setReturnReason('')
    setReturnTo('')
    setQtyToReturn('')
    setItemRemark('')
    setItems([])
    setReturnNo('')
    setError('')
    setSuccess('')
  }

  const onAddNew = () => {
    setError('')
    setSuccess('')
    const seq = String(Math.floor(Math.random() * 1000) + 1).padStart(3, '0')
    setReturnNo(`RR${seq}`)
    setItems([])
  }

  const onAccept = () => {
    setError('')
    setSuccess('')
    if (!selectedIssue) return setError('Select MRV reference first.')
    const qty = Number(qtyToReturn)
    if (!Number.isFinite(qty) || qty <= 0) return setError('Enter valid qty to return.')
    const line = (selectedIssue.lines || [])[0]
    if (!line) return setError('Selected MRV has no issue lines.')
    const requested = Number(line.quantity || 0)
    const alreadyReturned = Number(line.returned_quantity || 0)
    const maxAllowed = requested - alreadyReturned
    if (qty > maxAllowed) return setError(`Qty to return exceeds available. Max allowed: ${maxAllowed}.`)
    const partCode = line.part_code || line.part_number || `#${line.part_id}`
    setItems((prev) => [
      ...prev,
      {
        part_id: line.part_id,
        item_code: partCode,
        description: line.part_name || line.description || '',
        quantity: qty,
        unit_price: Number(line.unit_price || 0),
        remark: itemRemark || null,
      },
    ])
    setQtyToReturn('')
    setItemRemark('')
    setSuccess('Return line accepted.')
  }

  const onFinish = () => {
    setError('')
    setSuccess('')
    if (!issueId) return setError('Select MRV reference.')
    if (!items.length) return setError('Accept at least one return item.')
    createReturnMutation.mutate({
      authority_name: (returnTo || '').trim() || null,
      return_reason: (returnReason || '').trim() || null,
      invoice_id: Number(invoiceId) || null,
      items: items.map((it) => ({ part_id: it.part_id, quantity: it.quantity, remark: it.remark })),
    })
  }

  const totals = useMemo(() => {
    const subtotal = items.reduce((acc, it) => acc + Number(it.quantity || 0) * Number(it.unit_price || 0), 0)
    const vat = subtotal * 0.15
    return { subtotal, vat, total: subtotal + vat }
  }, [items])

  return (
    <SetupScreenFrame
      hubTo="/transactions-hub"
      hubLabel="Transaction"
      title="Requisition For Return"
      subtitle="Return item issued with MRV for valid reasons."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" onClick={onAddNew}>Add New</Button>
          <Button type="button" variant="outline" onClick={onAccept}>Accept</Button>
          <Button type="button" variant="outline" onClick={onFinish} disabled={createReturnMutation.isPending}>Finish</Button>
          <Button type="button" variant="outline" onClick={onRefresh}>Refresh</Button>
          <span className="text-sm text-blue-700">Ready</span>
        </div>
      }
    >
      <div className="space-y-4">
        {error && <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        {success && <div className="rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{success}</div>}

        <div className="bg-white border rounded-lg shadow-sm p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <label className="text-sm space-y-1">
              <div className="font-medium text-gray-800">Requisition No</div>
              <Input readOnly value={returnNo || '(auto after Add New)'} />
            </label>
            <label className="text-sm space-y-1">
              <div className="font-medium text-gray-800">Date</div>
              <Input readOnly value={new Date().toISOString().slice(0, 10)} />
            </label>
            <label className="text-sm space-y-1 md:col-span-2">
              <div className="font-medium text-gray-800">Job Order No</div>
              <select className="w-full border rounded px-2 py-2 text-sm" value={jobOrderId} onChange={(e) => { setJobOrderId(e.target.value); setIssueId(''); }}>
                <option value="">Select job...</option>
                {jobs.map((j) => (
                  <option key={j.job_order_id} value={String(j.job_order_id)}>
                    {j.job_order_number || `#${j.job_order_id}`}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm space-y-1 md:col-span-2">
              <div className="font-medium text-gray-800">MRV Reference No</div>
              <select className="w-full border rounded px-2 py-2 text-sm" value={issueId} onChange={(e) => setIssueId(e.target.value)} disabled={!jobOrderId}>
                <option value="">Select MRV...</option>
                {issues.map((iss) => (
                  <option key={iss.issue_id} value={String(iss.issue_id)}>
                    {iss.issue_number || `#${iss.issue_id}`}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm space-y-1">
              <div className="font-medium text-gray-800">Return Reason</div>
              <select className="w-full border rounded px-2 py-2 text-sm" value={returnReason} onChange={(e) => setReturnReason(e.target.value)}>
                <option value="">Select reason...</option>
                {reasons.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </label>
            <label className="text-sm space-y-1">
              <div className="font-medium text-gray-800">Return To (Authority)</div>
              <Input value={returnTo} onChange={(e) => setReturnTo(e.target.value)} />
            </label>
            <label className="text-sm space-y-1 md:col-span-2">
              <div className="font-medium text-gray-800">Invoice Reference</div>
              <select className="w-full border rounded px-2 py-2 text-sm" value={invoiceId} onChange={(e) => setInvoiceId(e.target.value)}>
                <option value="">Select invoice...</option>
                {invoices.map((inv) => (
                  <option key={inv.garage_invoice_id} value={String(inv.garage_invoice_id)}>
                    {inv.invoice_number || `#${inv.garage_invoice_id}`}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm space-y-1">
              <div className="font-medium text-gray-800">Customer Name</div>
              <Input readOnly value={selectedCustomer ? `${selectedCustomer.first_name || ''} ${selectedCustomer.last_name || ''}`.trim() : ''} />
            </label>
            <label className="text-sm space-y-1">
              <div className="font-medium text-gray-800">Plate</div>
              <Input readOnly value={selectedVehicle?.license_plate || ''} />
            </label>
            <label className="text-sm space-y-1">
              <div className="font-medium text-gray-800">Qty To Return</div>
              <Input value={qtyToReturn} onChange={(e) => setQtyToReturn(e.target.value)} />
            </label>
            <label className="text-sm space-y-1 md:col-span-2">
              <div className="font-medium text-gray-800">Remark</div>
              <Input value={itemRemark} onChange={(e) => setItemRemark(e.target.value)} />
            </label>
          </div>
        </div>

        <div className="bg-white border rounded-lg shadow-sm p-4">
          <div className="overflow-auto border rounded">
            <table className="min-w-[900px] w-full text-sm">
              <thead className="bg-gray-100 text-xs text-gray-600 uppercase">
                <tr>
                  <th className="py-2 px-2 text-left">Item Code</th>
                  <th className="py-2 px-2 text-left">Description</th>
                  <th className="py-2 px-2 text-left">Qty</th>
                  <th className="py-2 px-2 text-left">Unit Price</th>
                  <th className="py-2 px-2 text-left">Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr><td colSpan={5} className="py-5 px-2 text-center text-gray-500">No accepted return items yet.</td></tr>
                ) : items.map((it, idx) => (
                  <tr key={`${it.item_code}-${idx}`} className="border-t border-gray-100">
                    <td className="py-2 px-2">{it.item_code}</td>
                    <td className="py-2 px-2">{it.description}</td>
                    <td className="py-2 px-2">{Number(it.quantity).toFixed(2)}</td>
                    <td className="py-2 px-2">{Number(it.unit_price).toFixed(2)}</td>
                    <td className="py-2 px-2">{(Number(it.quantity) * Number(it.unit_price)).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 text-sm text-gray-700 flex gap-6">
            <div>Total: <span className="font-semibold">{totals.subtotal.toFixed(2)}</span></div>
            <div>VAT: <span className="font-semibold">{totals.vat.toFixed(2)}</span></div>
            <div>Total Inc. VAT: <span className="font-semibold">{totals.total.toFixed(2)}</span></div>
          </div>
          {selectedInvoice && (
            <div className="mt-3 text-xs text-gray-500">
              Selected invoice: {selectedInvoice.invoice_number || `#${selectedInvoice.garage_invoice_id}`}
            </div>
          )}
        </div>
      </div>
    </SetupScreenFrame>
  )
}

function ApproveRequestForReturnPage() {
  const [selectedRequestId, setSelectedRequestId] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const listQuery = useQuery({
    queryKey: ['returnRequests', { screen: 'transaction-approve-request-for-return' }],
    queryFn: () => jobOrderInventoryApi.listReturnRequests({ limit: 500 }),
  })

  const approveMutation = useMutation({
    mutationFn: (id) => jobOrderInventoryApi.approveReturnRequest(id),
    onSuccess: async () => {
      await listQuery.refetch()
      setSuccess('Return request approved.')
    },
    onError: (e) => setError(e?.response?.data?.detail || 'Failed to approve request.'),
  })

  const rejectMutation = useMutation({
    mutationFn: (id) => jobOrderInventoryApi.rejectReturnRequest(id),
    onSuccess: async () => {
      await listQuery.refetch()
      setSuccess('Return request rejected/cancelled.')
    },
    onError: (e) => setError(e?.response?.data?.detail || 'Failed to reject request.'),
  })

  const allRows = useMemo(() => listQuery.data?.data || [], [listQuery.data])
  const pendingRows = useMemo(
    () => allRows.filter((r) => String(r.status || '').toLowerCase() === 'pending' || String(r.status || '').toLowerCase() === 'not approved'),
    [allRows],
  )
  const selected = useMemo(
    () => allRows.find((r) => Number(r.return_request_id) === Number(selectedRequestId)) || null,
    [allRows, selectedRequestId],
  )

  const onApprove = () => {
    setError('')
    setSuccess('')
    if (!selected?.return_request_id) {
      setError('Select a return request first.')
      return
    }
    approveMutation.mutate(selected.return_request_id)
  }

  const onReject = () => {
    setError('')
    setSuccess('')
    if (!selected?.return_request_id) {
      setError('Select a return request first.')
      return
    }
    rejectMutation.mutate(selected.return_request_id)
  }

  const lines = selected?.items || selected?.lines || []
  const totals = useMemo(() => {
    const subtotal = (lines || []).reduce((acc, it) => acc + Number(it.amount || (Number(it.quantity || 0) * Number(it.unit_price || 0))), 0)
    const vat = (lines || []).reduce((acc, it) => acc + Number(it.vat || it.tax_amount || 0), 0)
    return { subtotal, vat, total: subtotal + vat }
  }, [lines])

  return (
    <SetupScreenFrame
      hubTo="/transactions-hub"
      hubLabel="Transaction"
      title="Requisition For Sale Return"
      subtitle="Approve or reject pending return requisitions."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" onClick={onApprove} disabled={approveMutation.isPending}>Approve</Button>
          <Button type="button" variant="outline" onClick={onReject} disabled={rejectMutation.isPending}>Reject/Cancel</Button>
          <Button type="button" variant="outline" onClick={() => listQuery.refetch()}>Refresh</Button>
          <span className="text-sm text-blue-700">Ready</span>
        </div>
      }
    >
      <div className="space-y-4">
        {error && <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        {success && <div className="rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{success}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4">
          <div className="bg-white border rounded-lg shadow-sm p-3">
            <div className="text-sm font-semibold text-gray-800 mb-2">Pending Return Requests</div>
            <div className="overflow-auto max-h-[520px] border rounded">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100 text-xs text-gray-600 uppercase">
                  <tr>
                    <th className="py-2 px-2 text-left">Req. No</th>
                    <th className="py-2 px-2 text-left">Request For</th>
                    <th className="py-2 px-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingRows.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-5 px-2 text-center text-gray-500">No requests awaiting approval.</td>
                    </tr>
                  ) : pendingRows.map((r) => (
                    <tr
                      key={r.return_request_id}
                      className={`border-t border-gray-100 cursor-pointer ${Number(selectedRequestId) === Number(r.return_request_id) ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}
                      onDoubleClick={() => setSelectedRequestId(r.return_request_id)}
                      onClick={() => setSelectedRequestId(r.return_request_id)}
                      title="Double click to open details"
                    >
                      <td className="py-2 px-2 font-mono">{r.return_number || `RR-${r.return_request_id}`}</td>
                      <td className="py-2 px-2">{r.request_for || 'MRV'}</td>
                      <td className="py-2 px-2">{r.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white border rounded-lg shadow-sm p-4 space-y-3">
            {!selected ? (
              <div className="text-sm text-gray-500">Select a request on the left (double click) to view details.</div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <label className="text-sm space-y-1">
                    <div className="font-medium text-gray-800">Requisition No</div>
                    <Input readOnly value={selected.return_number || `RR-${selected.return_request_id}`} />
                  </label>
                  <label className="text-sm space-y-1">
                    <div className="font-medium text-gray-800">Request For</div>
                    <Input readOnly value={selected.request_for || 'MRV'} />
                  </label>
                  <label className="text-sm space-y-1">
                    <div className="font-medium text-gray-800">Status</div>
                    <Input readOnly value={selected.status || ''} />
                  </label>
                  <label className="text-sm space-y-1">
                    <div className="font-medium text-gray-800">Reason</div>
                    <Input readOnly value={selected.return_reason || ''} />
                  </label>
                  <label className="text-sm space-y-1 md:col-span-2">
                    <div className="font-medium text-gray-800">Return To</div>
                    <Input readOnly value={selected.authority_name || ''} />
                  </label>
                  <label className="text-sm space-y-1">
                    <div className="font-medium text-gray-800">Invoice Ref</div>
                    <Input readOnly value={selected.invoice_id != null ? String(selected.invoice_id) : ''} />
                  </label>
                  <label className="text-sm space-y-1">
                    <div className="font-medium text-gray-800">Issue/MRV Ref</div>
                    <Input readOnly value={selected.issue_id != null ? String(selected.issue_id) : ''} />
                  </label>
                  <label className="text-sm space-y-1">
                    <div className="font-medium text-gray-800">Requested By</div>
                    <Input readOnly value={selected.created_by || ''} />
                  </label>
                </div>

                <div className="overflow-auto border rounded">
                  <table className="min-w-[800px] w-full text-sm">
                    <thead className="bg-gray-100 text-xs text-gray-600 uppercase">
                      <tr>
                        <th className="py-2 px-2 text-left">Item Code</th>
                        <th className="py-2 px-2 text-left">Description</th>
                        <th className="py-2 px-2 text-left">Qty</th>
                        <th className="py-2 px-2 text-left">Unit Price</th>
                        <th className="py-2 px-2 text-left">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lines.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-5 px-2 text-center text-gray-500">No detail lines.</td>
                        </tr>
                      ) : lines.map((ln, idx) => (
                        <tr key={`${ln.part_id || ln.item_code || idx}-${idx}`} className="border-t border-gray-100">
                          <td className="py-2 px-2">{ln.item_code || ln.part_code || `#${ln.part_id || ''}`}</td>
                          <td className="py-2 px-2">{ln.description || ln.part_name || '-'}</td>
                          <td className="py-2 px-2">{Number(ln.quantity || 0).toFixed(2)}</td>
                          <td className="py-2 px-2">{Number(ln.unit_price || 0).toFixed(2)}</td>
                          <td className="py-2 px-2">{Number(ln.amount || (Number(ln.quantity || 0) * Number(ln.unit_price || 0))).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="text-sm text-gray-700 flex gap-6">
                  <div>Total: <span className="font-semibold">{totals.subtotal.toFixed(2)}</span></div>
                  <div>VAT: <span className="font-semibold">{totals.vat.toFixed(2)}</span></div>
                  <div>Total Inc. VAT: <span className="font-semibold">{totals.total.toFixed(2)}</span></div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </SetupScreenFrame>
  )
}

export default function TransactionToolPage() {
  const { slug } = useParams()
  const entry = useMemo(() => TRANSACTION_MENU.find((item) => item.slug === slug), [slug])
  const redirect = slug ? TRANSACTION_REDIRECTS[slug] : null

  if (!slug || !entry) {
    return <Navigate to="/transactions-hub" replace />
  }

  if (slug === 'item-issue') {
    return <ItemIssuePage />
  }
  if (slug === 'item-issue-from-reserve') {
    return <ItemIssueFromReservePage />
  }
  if (slug === 'garage-issue-requisition') {
    return <GarageIssueRequisitionPage />
  }
  if (slug === 'labour-charge-entry') {
    return <LaborChargeEntryPage />
  }
  if (slug === 'miscellaneous-charge-entry') {
    return <MiscOrFuelChargeEntryPage mode="misc" />
  }
  if (slug === 'lubricants-and-fuel-charge-entry') {
    return <MiscOrFuelChargeEntryPage mode="fuel" />
  }
  if (slug === 'sublet-work-charge-entry') {
    return <SubletOrOtherChargeEntryPage mode="sublet" />
  }
  if (slug === 'other-charges') {
    return <SubletOrOtherChargeEntryPage mode="other" />
  }
  if (slug === 'request-for-return') {
    return <RequestForReturnPage />
  }
  if (slug === 'approve-request-for-return') {
    return <ApproveRequestForReturnPage />
  }

  if (redirect) {
    return <Navigate to={redirect} replace />
  }

  return (
    <SetupScreenFrame
      hubTo="/transactions-hub"
      hubLabel="Transaction"
      title={entry.label}
      subtitle={`Transaction entry for ${entry.label}. This submenu remains available and can be wired to dedicated APIs incrementally.`}
    >
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        This transaction submenu is reachable from the menu and reserved for implementation with locator/criteria fields
        and posting controls.
      </div>
    </SetupScreenFrame>
  )
}
