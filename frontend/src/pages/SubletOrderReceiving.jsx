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

function formatMoney(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return ''
  return n.toFixed(2)
}

export default function SubletOrderReceiving() {
  const queryClient = useQueryClient()

  const [selectedId, setSelectedId] = useState(null)
  const [deliveryOrderNumber, setDeliveryOrderNumber] = useState('')

  const { data: jobsData } = useQuery({
    queryKey: ['jobOrders', { for: 'subletOrderReceiving' }],
    queryFn: () => jobOrdersApi.list(),
  })
  const jobs = useMemo(() => jobsData?.data || [], [jobsData])
  const jobNumberById = useMemo(() => {
    const map = new Map()
    for (const j of jobs) map.set(j.job_order_id, j.job_order_number)
    return map
  }, [jobs])

  const { data: workTypesData } = useQuery({
    queryKey: ['subletWorkTypes', { active_only: false }],
    queryFn: () => subletWorkTypesApi.list({ active_only: false }),
  })
  const workTypes = useMemo(() => workTypesData?.data || [], [workTypesData])
  const workTypeById = useMemo(() => {
    const map = new Map()
    for (const w of workTypes) map.set(w.sublet_work_type_id, w)
    return map
  }, [workTypes])

  const { data: suppliersData } = useQuery({
    queryKey: ['subletWorkSuppliers', { active_only: false }],
    queryFn: () => subletWorkSuppliersApi.list({ active_only: false }),
  })
  const suppliers = useMemo(() => suppliersData?.data || [], [suppliersData])
  const supplierById = useMemo(() => {
    const map = new Map()
    for (const s of suppliers) map.set(s.supplier_id, s)
    return map
  }, [suppliers])

  const { data: listData, isLoading } = useQuery({
    queryKey: ['subletOrders', { status: 'Approved', for: 'receiving' }],
    queryFn: () => jobOrderSubletOrdersApi.list({ status: 'Approved' }),
  })

  const orders = useMemo(() => listData?.data || [], [listData])
  const selected = useMemo(
    () => orders.find((o) => o.sublet_order_id === selectedId) || null,
    [orders, selectedId]
  )

  const receiveMutation = useMutation({
    mutationFn: ({ id, payload }) => jobOrderSubletOrdersApi.receive(id, payload),
    onSuccess: async () => {
      setDeliveryOrderNumber('')
      setSelectedId(null)
      await queryClient.invalidateQueries({ queryKey: ['subletOrders'] })
    },
  })

  const saveReceiving = () => {
    if (!selected) return
    const don = (deliveryOrderNumber || '').trim()
    if (!don) return
    receiveMutation.mutate({
      id: selected.sublet_order_id,
      payload: { delivery_order_number: don },
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sublet Order Receiving</h1>
        <p className="text-gray-600">Record receiving of approved sublet work orders.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="text-sm font-semibold text-gray-800 mb-3">Approved Orders</div>
          {isLoading ? (
            <div className="text-sm text-gray-500">Loading...</div>
          ) : orders.length === 0 ? (
            <div className="text-sm text-gray-500">No approved orders.</div>
          ) : (
            <div className="space-y-2 max-h-[520px] overflow-auto">
              {orders.map((o) => {
                const wt = workTypeById.get(o.sublet_work_type_id)
                const supplier = supplierById.get(o.supplier_id)
                const jobNo = jobNumberById.get(o.job_order_id) || `#${o.job_order_id}`
                const label = wt ? `${wt.work_code} - ${wt.description}` : `#${o.sublet_work_type_id}`
                const active = o.sublet_order_id === selectedId
                return (
                  <button
                    type="button"
                    key={o.sublet_order_id}
                    onClick={() => {
                      setSelectedId(o.sublet_order_id)
                      setDeliveryOrderNumber('')
                    }}
                    className={`w-full text-left border rounded-md px-3 py-2 hover:bg-gray-50 ${active ? 'border-gray-900' : 'border-gray-200'}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium text-sm text-gray-900">{o.sublet_order_number}</div>
                      <div className="text-xs text-gray-500">{jobNo}</div>
                    </div>
                    <div className="text-xs text-gray-700 mt-1">{label}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {supplier?.supplier_name || ''} • Qty {o.quantity} • Unit {formatMoney(o.unit_price)}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </Card>

        <Card className="p-4 space-y-3">
          <div className="text-sm font-semibold text-gray-800">Details</div>
          {!selected ? (
            <div className="text-sm text-gray-500">Select an approved order to receive.</div>
          ) : (
            <>
              {(() => {
                const wt = workTypeById.get(selected.sublet_work_type_id)
                const supplier = supplierById.get(selected.supplier_id)
                const jobNo = jobNumberById.get(selected.job_order_id) || `#${selected.job_order_id}`
                return (
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div>
                        <div className="text-xs text-gray-500">Order #</div>
                        <div className="font-medium">{selected.sublet_order_number}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Job Order</div>
                        <div className="font-medium">{jobNo}</div>
                      </div>
                      <div className="md:col-span-2">
                        <div className="text-xs text-gray-500">Work Type</div>
                        <div className="font-medium">
                          {wt ? `${wt.work_code} - ${wt.description}` : `#${selected.sublet_work_type_id}`}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Supplier</div>
                        <div className="font-medium">{supplier?.supplier_name || ''}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Quantity</div>
                        <div className="font-medium">{selected.quantity}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Unit Price</div>
                        <div className="font-medium">{formatMoney(selected.unit_price)}</div>
                      </div>
                    </div>
                  </div>
                )
              })()}

              <div className="space-y-1">
                <div className="text-sm font-medium text-gray-700">Delivery Order Number</div>
                <Input
                  value={deliveryOrderNumber}
                  onChange={(e) => setDeliveryOrderNumber(e.target.value)}
                  placeholder="Supplier delivery order #"
                />
              </div>

              <div className="flex justify-end">
                <Button type="button" onClick={saveReceiving} disabled={receiveMutation.isPending}>
                  Save
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
