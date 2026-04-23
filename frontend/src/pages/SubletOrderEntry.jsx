import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  jobOrdersApi,
  jobOrderSubletOrdersApi,
  subletWorkTypesApi,
  subletWorkSuppliersApi,
} from '../services/api'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'

function formatMoney(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return ''
  return n.toFixed(2)
}

export default function SubletOrderEntry() {
  const queryClient = useQueryClient()

  const [jobOrderId, setJobOrderId] = useState('')
  const [subletWorkTypeId, setSubletWorkTypeId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [remark, setRemark] = useState('')

  const { data: jobsData, isLoading: jobsLoading } = useQuery({
    queryKey: ['jobOrders', { for: 'subletOrderEntry' }],
    queryFn: () => jobOrdersApi.list(),
  })

  const jobs = useMemo(() => jobsData?.data || [], [jobsData])
  const selectableJobs = useMemo(
    () => jobs.filter((j) => j?.status !== 'Closed' && j?.status !== 'Cancelled'),
    [jobs]
  )

  const { data: workTypesData } = useQuery({
    queryKey: ['subletWorkTypes', { active_only: false }],
    queryFn: () => subletWorkTypesApi.list({ active_only: false }),
  })
  const workTypes = useMemo(() => workTypesData?.data || [], [workTypesData])
  const activeWorkTypes = useMemo(() => workTypes.filter((w) => w?.is_active !== false), [workTypes])

  const { data: suppliersData } = useQuery({
    queryKey: ['subletWorkSuppliers', { active_only: false }],
    queryFn: () => subletWorkSuppliersApi.list({ active_only: false }),
  })
  const suppliers = useMemo(() => suppliersData?.data || [], [suppliersData])

  const workTypeById = useMemo(() => {
    const map = new Map()
    for (const w of workTypes) map.set(w.sublet_work_type_id, w)
    return map
  }, [workTypes])

  const supplierById = useMemo(() => {
    const map = new Map()
    for (const s of suppliers) map.set(s.supplier_id, s)
    return map
  }, [suppliers])

  const selectedJobIdNum = jobOrderId ? Number(jobOrderId) : null

  const { data: jobOrdersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['subletOrdersForJob', selectedJobIdNum],
    queryFn: () => jobOrderSubletOrdersApi.listForJob(selectedJobIdNum),
    enabled: !!selectedJobIdNum,
  })

  const orders = useMemo(() => jobOrdersData?.data || [], [jobOrdersData])

  const draftCount = useMemo(() => orders.filter((o) => o.status === 'Draft').length, [orders])

  const createMutation = useMutation({
    mutationFn: ({ jobOrderId, payload }) => jobOrderSubletOrdersApi.create(jobOrderId, payload),
    onSuccess: async () => {
      setSubletWorkTypeId('')
      setQuantity('1')
      setRemark('')
      await queryClient.invalidateQueries({ queryKey: ['subletOrdersForJob', selectedJobIdNum] })
    },
  })

  const finishMutation = useMutation({
    mutationFn: (jobOrderId) => jobOrderSubletOrdersApi.finishForJob(jobOrderId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['subletOrdersForJob', selectedJobIdNum] })
      await queryClient.invalidateQueries({ queryKey: ['subletOrders'] })
    },
  })

  const addOrder = () => {
    if (!selectedJobIdNum) return
    const wtId = Number(subletWorkTypeId)
    if (!Number.isFinite(wtId) || wtId <= 0) return
    const qty = Number(quantity)
    if (!Number.isFinite(qty) || qty <= 0) return

    createMutation.mutate({
      jobOrderId: selectedJobIdNum,
      payload: {
        sublet_work_type_id: wtId,
        quantity: qty,
        remark: (remark || '').trim() || null,
      },
    })
  }

  const finish = () => {
    if (!selectedJobIdNum) return
    finishMutation.mutate(selectedJobIdNum)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sublet Order Entry</h1>
        <p className="text-gray-600">Record sublet work orders for a job order.</p>
      </div>

      <Card className="p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1">
            <div className="text-sm font-medium text-gray-700">Job Order</div>
            <select
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={jobOrderId}
              onChange={(e) => setJobOrderId(e.target.value)}
              disabled={jobsLoading}
            >
              <option value="">Select job order...</option>
              {selectableJobs.map((j) => (
                <option key={j.job_order_id} value={j.job_order_id}>
                  {j.job_order_number} ({j.status})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <div className="text-sm font-medium text-gray-700">Sublet Work Type</div>
            <select
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={subletWorkTypeId}
              onChange={(e) => setSubletWorkTypeId(e.target.value)}
              disabled={!selectedJobIdNum}
            >
              <option value="">Select work type...</option>
              {activeWorkTypes.map((w) => (
                <option key={w.sublet_work_type_id} value={w.sublet_work_type_id}>
                  {w.work_code} - {w.description}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <div className="text-sm font-medium text-gray-700">Quantity</div>
            <Input
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="1"
              disabled={!selectedJobIdNum}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
          <div className="space-y-1">
            <div className="text-sm font-medium text-gray-700">Remark</div>
            <Textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="Optional remark"
              disabled={!selectedJobIdNum}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" onClick={addOrder} disabled={!selectedJobIdNum || createMutation.isPending}>
              Add New
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={finish}
              disabled={!selectedJobIdNum || draftCount === 0 || finishMutation.isPending}
              title={draftCount === 0 ? 'No draft orders to finish' : undefined}
            >
              Finish
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold text-gray-800">Preview Orders</div>
          {selectedJobIdNum ? (
            <div className="text-xs text-gray-500">
              Draft: {draftCount} / Total: {orders.length}
            </div>
          ) : null}
        </div>

        {!selectedJobIdNum ? (
          <div className="text-sm text-gray-500">Select a job order to view sublet orders.</div>
        ) : ordersLoading ? (
          <div className="text-sm text-gray-500">Loading...</div>
        ) : orders.length === 0 ? (
          <div className="text-sm text-gray-500">No sublet orders recorded for this job order.</div>
        ) : (
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-3">Order #</th>
                  <th className="py-2 pr-3">Work Type</th>
                  <th className="py-2 pr-3">Supplier</th>
                  <th className="py-2 pr-3">Qty</th>
                  <th className="py-2 pr-3">Unit Price</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Remark</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const wt = workTypeById.get(o.sublet_work_type_id)
                  const supplier = supplierById.get(o.supplier_id)
                  return (
                    <tr key={o.sublet_order_id} className="border-b last:border-b-0">
                      <td className="py-2 pr-3 whitespace-nowrap">{o.sublet_order_number}</td>
                      <td className="py-2 pr-3">
                        {wt ? `${wt.work_code} - ${wt.description}` : `#${o.sublet_work_type_id}`}
                      </td>
                      <td className="py-2 pr-3">{supplier?.supplier_name || (o.supplier_id ? `#${o.supplier_id}` : '')}</td>
                      <td className="py-2 pr-3 whitespace-nowrap">{o.quantity}</td>
                      <td className="py-2 pr-3 whitespace-nowrap">{formatMoney(o.unit_price)}</td>
                      <td className="py-2 pr-3 whitespace-nowrap">{o.status}</td>
                      <td className="py-2 pr-3">{o.remark || ''}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {jobsLoading ? null : selectableJobs.length === 0 ? (
        <div className="text-xs text-gray-500">No active job orders found.</div>
      ) : null}
    </div>
  )
}
