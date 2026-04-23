import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  jobOrdersApi,
  jobOrderSubletOrdersApi,
  subletWorkTypesApi,
  subletWorkSuppliersApi,
  employeesApi,
} from '../services/api'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Textarea } from '../components/ui/textarea'

const TABS = [
  { key: 'Finalized', label: 'Pending' },
  { key: 'Approved', label: 'Approved' },
  { key: 'Rejected', label: 'Rejected' },
  { key: 'Cancelled', label: 'Cancelled' },
]

function formatMoney(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return ''
  return n.toFixed(2)
}

export default function SubletOrderApproval() {
  const queryClient = useQueryClient()

  const [tabStatus, setTabStatus] = useState('Finalized')
  const [selectedId, setSelectedId] = useState(null)
  const [decisionRemark, setDecisionRemark] = useState('')

  const { data: jobsData } = useQuery({
    queryKey: ['jobOrders', { for: 'subletOrderApproval' }],
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

  const { data: employeesData } = useQuery({
    queryKey: ['employees', { for: 'subletOrderApproval' }],
    queryFn: () => employeesApi.list(),
  })
  const employees = useMemo(() => employeesData?.data || [], [employeesData])
  const employeeNameById = useMemo(() => {
    const map = new Map()
    for (const e of employees) {
      map.set(e.employee_id, `${e.first_name || ''} ${e.last_name || ''}`.trim())
    }
    return map
  }, [employees])

  const { data: listData, isLoading } = useQuery({
    queryKey: ['subletOrders', { status: tabStatus }],
    queryFn: () => jobOrderSubletOrdersApi.list({ status: tabStatus }),
  })

  const orders = useMemo(() => listData?.data || [], [listData])

  const selected = useMemo(
    () => orders.find((o) => o.sublet_order_id === selectedId) || null,
    [orders, selectedId]
  )

  const decide = useMutation({
    mutationFn: ({ action, id, payload }) => jobOrderSubletOrdersApi[action](id, payload),
    onSuccess: async () => {
      setDecisionRemark('')
      setSelectedId(null)
      await queryClient.invalidateQueries({ queryKey: ['subletOrders'] })
    },
  })

  const approve = () => {
    if (!selected) return
    decide.mutate({
      action: 'approve',
      id: selected.sublet_order_id,
      payload: { decision_remark: (decisionRemark || '').trim() || null },
    })
  }

  const returnToRequester = () => {
    if (!selected) return
    decide.mutate({
      action: 'returnToRequester',
      id: selected.sublet_order_id,
      payload: { decision_remark: (decisionRemark || '').trim() || null },
    })
  }

  const reject = () => {
    if (!selected) return
    decide.mutate({
      action: 'reject',
      id: selected.sublet_order_id,
      payload: { decision_remark: (decisionRemark || '').trim() || null },
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sublet Order Approval</h1>
        <p className="text-gray-600">Approve or reject finalized sublet work orders.</p>
      </div>

      <Card className="p-3">
        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <Button
              key={t.key}
              type="button"
              variant={tabStatus === t.key ? 'default' : 'secondary'}
              onClick={() => {
                setTabStatus(t.key)
                setSelectedId(null)
                setDecisionRemark('')
              }}
            >
              {t.label}
            </Button>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="text-sm font-semibold text-gray-800 mb-3">Orders</div>
          {isLoading ? (
            <div className="text-sm text-gray-500">Loading...</div>
          ) : orders.length === 0 ? (
            <div className="text-sm text-gray-500">No orders.</div>
          ) : (
            <div className="space-y-2 max-h-[480px] overflow-auto">
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
                    onClick={() => setSelectedId(o.sublet_order_id)}
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
            <div className="text-sm text-gray-500">Select an order to view details.</div>
          ) : (
            <>
              {(() => {
                const wt = workTypeById.get(selected.sublet_work_type_id)
                const supplier = supplierById.get(selected.supplier_id)
                const jobNo = jobNumberById.get(selected.job_order_id) || `#${selected.job_order_id}`
                const requestedBy = employeeNameById.get(selected.requested_by_employee_id) || ''
                const decidedBy = employeeNameById.get(selected.decided_by_employee_id) || ''

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
                      <div>
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
                      <div>
                        <div className="text-xs text-gray-500">Status</div>
                        <div className="font-medium">{selected.status}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Requested By</div>
                        <div className="font-medium">{requestedBy}</div>
                      </div>
                      <div className="md:col-span-2">
                        <div className="text-xs text-gray-500">Remark</div>
                        <div className="font-medium">{selected.remark || ''}</div>
                      </div>
                      {selected.decided_at ? (
                        <>
                          <div>
                            <div className="text-xs text-gray-500">Decided By</div>
                            <div className="font-medium">{decidedBy}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Decision Remark</div>
                            <div className="font-medium">{selected.decision_remark || ''}</div>
                          </div>
                        </>
                      ) : null}
                    </div>
                  </div>
                )
              })()}

              {tabStatus === 'Finalized' ? (
                <>
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1">Decision Remark (optional)</div>
                    <Textarea value={decisionRemark} onChange={(e) => setDecisionRemark(e.target.value)} />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button type="button" onClick={approve} disabled={decide.isPending}>
                      Approve
                    </Button>
                    <Button type="button" variant="secondary" onClick={returnToRequester} disabled={decide.isPending}>
                      Return
                    </Button>
                    <Button type="button" variant="destructive" onClick={reject} disabled={decide.isPending}>
                      Reject
                    </Button>
                  </div>
                </>
              ) : null}
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
