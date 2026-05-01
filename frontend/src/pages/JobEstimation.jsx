import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { customersApi, proformasApi, serviceTypesApi, vehiclesApi } from '../services/api'

const EMPTY_ITEM = { item_type: 'Service', item_name: '', item_description: '', quantity: '1', unit_price: '' }
const ITEM_TAB_TO_TYPE = {
  parts: 'Part',
  labor: 'Labor',
  fuel: 'FuelLub',
  misc: 'Misc',
  sublet: 'Sublet',
  other: 'Other',
}

function num(v) {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

export default function JobEstimation() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState({
    customer_id: '',
    vehicle_id: '',
    service_type_id: '',
    description: '',
    notes: '',
    estimation_type: 'External Estimation',
    estimator: '',
    priority: '',
    requisition_no: '',
    estimation_number: '',
    estimation_date: '',
    finalized: false,
    chassis_no: '',
    plate_no: '',
    cell_no: '',
    address: '',
    make: '',
    model_type: '',
    engine_no: '',
    type_of_job: '',
    delivery_time: '',
    color_code: '',
    trim_code: '',
    millage: '',
    claim_no: '',
    supplied_by_us: false,
    supplied_by_others: false,
    detail_work_description: '',
    remark: '',
    valid_until: '',
    tax_rate: '15',
    discount_amount: '0',
    items: [{ ...EMPTY_ITEM }],
  })
  const [activeTab, setActiveTab] = useState('general')
  const [lineDraft, setLineDraft] = useState({ item_name: '', item_description: '', quantity: '1', unit_price: '' })

  const { data: customersRes } = useQuery({
    queryKey: ['jobEstimationCustomers'],
    queryFn: () => customersApi.getAll({ limit: 300 }),
  })
  const { data: vehiclesRes } = useQuery({
    queryKey: ['jobEstimationVehicles'],
    queryFn: () => vehiclesApi.getAll({ limit: 500 }),
  })
  const { data: serviceTypesRes } = useQuery({
    queryKey: ['jobEstimationServiceTypes'],
    queryFn: () => serviceTypesApi.getAll(),
  })
  const { data: listRes, isLoading: listLoading } = useQuery({
    queryKey: ['jobEstimationsList'],
    queryFn: () => proformasApi.getAll({ limit: 50 }),
  })

  const customers = customersRes?.data || []
  const vehicles = vehiclesRes?.data || []
  const serviceTypes = serviceTypesRes?.data || []
  const estimations = listRes?.data || []

  const filteredVehicles = useMemo(() => {
    if (!form.customer_id) return vehicles
    return vehicles.filter((v) => Number(v.customer_id) === Number(form.customer_id))
  }, [vehicles, form.customer_id])
  const selectedVehicle = useMemo(
    () => vehicles.find((v) => Number(v.vehicle_id) === Number(form.vehicle_id)) || null,
    [vehicles, form.vehicle_id],
  )
  const selectedCustomer = useMemo(
    () => customers.find((c) => Number(c.customer_id) === Number(form.customer_id)) || null,
    [customers, form.customer_id],
  )

  const itemsSubtotal = useMemo(
    () => form.items.reduce((acc, it) => acc + num(it.quantity) * num(it.unit_price), 0),
    [form.items]
  )
  const taxAmount = useMemo(() => itemsSubtotal * (num(form.tax_rate) / 100), [itemsSubtotal, form.tax_rate])
  const grandTotal = useMemo(() => itemsSubtotal + taxAmount - num(form.discount_amount), [itemsSubtotal, taxAmount, form.discount_amount])

  const createMutation = useMutation({
    mutationFn: (payload) => proformasApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobEstimationsList'] })
      setSuccess('Job estimation created.')
      setError('')
      setForm((prev) => ({
        ...prev,
        description: '',
        notes: '',
        valid_until: '',
        discount_amount: '0',
        items: [{ ...EMPTY_ITEM }],
      }))
    },
    onError: (e) => {
      setSuccess('')
      setError(e?.response?.data?.detail || 'Failed to create job estimation.')
    },
  })

  const updateForm = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setError('')
    setSuccess('')
  }

  const onCreate = () => {
    const cleanedItems = form.items
      .map((it) => ({
        item_type: it.item_type || 'Other',
        item_name: String(it.item_name || '').trim(),
        item_description: String(it.item_description || '').trim() || null,
        quantity: num(it.quantity),
        unit_price: num(it.unit_price),
      }))
      .filter((it) => it.item_name && it.quantity > 0)

    if (!cleanedItems.length) {
      setError('Add at least one estimation line with name and quantity.')
      return
    }
    const payload = {
      customer_id: form.customer_id ? Number(form.customer_id) : null,
      vehicle_id: form.vehicle_id ? Number(form.vehicle_id) : null,
      service_type_id: form.service_type_id ? Number(form.service_type_id) : null,
      description: form.detail_work_description || form.description || null,
      notes: [form.notes, form.remark].filter(Boolean).join('\n') || null,
      valid_until: form.valid_until || null,
      tax_rate: num(form.tax_rate),
      discount_amount: num(form.discount_amount),
      items: cleanedItems,
    }
    createMutation.mutate(payload)
  }

  const refreshAll = () => {
    setError('')
    setSuccess('')
    setActiveTab('general')
    setLineDraft({ item_name: '', item_description: '', quantity: '1', unit_price: '' })
    setForm({
      customer_id: '',
      vehicle_id: '',
      service_type_id: '',
      description: '',
      notes: '',
      estimation_type: 'External Estimation',
      estimator: '',
      priority: '',
      requisition_no: '',
      estimation_number: '',
      estimation_date: '',
      finalized: false,
      chassis_no: '',
      plate_no: '',
      cell_no: '',
      address: '',
      make: '',
      model_type: '',
      engine_no: '',
      type_of_job: '',
      delivery_time: '',
      color_code: '',
      trim_code: '',
      millage: '',
      claim_no: '',
      supplied_by_us: false,
      supplied_by_others: false,
      detail_work_description: '',
      remark: '',
      valid_until: '',
      tax_rate: '15',
      discount_amount: '0',
      items: [{ ...EMPTY_ITEM }],
    })
  }

  const addNewEstimate = () => {
    const now = new Date()
    const yy = String(now.getFullYear()).slice(-2)
    const seq = String(Math.floor(Math.random() * 100000)).padStart(5, '0')
    updateForm('estimation_number', `EST-${seq}-${yy}`)
    updateForm('estimation_date', now.toISOString().slice(0, 10))
    setActiveTab('general')
    setSuccess('New estimation initialized.')
  }

  const saveGeneralInfo = () => {
    if (!form.estimation_number) {
      setError('Click Add New first.')
      return
    }
    setError('')
    setSuccess('General information saved. You can now capture line items in other tabs.')
  }

  const refreshTab = () => {
    setLineDraft({ item_name: '', item_description: '', quantity: '1', unit_price: '' })
  }

  const addNewTabLine = () => {
    refreshTab()
    setSuccess('Line entry reset.')
  }

  const addTabLine = () => {
    const itemType = ITEM_TAB_TO_TYPE[activeTab]
    if (!itemType) return
    const name = (lineDraft.item_name || '').trim()
    const qty = num(lineDraft.quantity)
    const unit = num(lineDraft.unit_price)
    if (!name) return setError('Item/charge name is required.')
    if (qty <= 0) return setError('Quantity must be greater than zero.')
    if (unit < 0) return setError('Unit price must be non-negative.')
    setForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          item_type: itemType,
          item_name: name,
          item_description: (lineDraft.item_description || '').trim() || null,
          quantity: String(qty),
          unit_price: String(unit),
        },
      ],
    }))
    setError('')
    setSuccess(`${itemType} line added.`)
    refreshTab()
  }

  const filteredTabItems = useMemo(() => {
    const itemType = ITEM_TAB_TO_TYPE[activeTab]
    if (!itemType) return []
    return form.items.filter((it) => String(it.item_type || '').toLowerCase() === itemType.toLowerCase())
  }, [form.items, activeTab])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">Job Estimation</h1>
        <p className="text-sm text-gray-600">Process garage job estimations with general info and category tabs.</p>
      </div>

      <Card className="p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" onClick={addNewEstimate}>Add New</Button>
          <Button type="button" variant="outline" onClick={saveGeneralInfo}>Save</Button>
          <Button type="button" variant="outline" onClick={refreshAll}>Refresh</Button>
          <label className="ml-2 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={!!form.finalized} onChange={(e) => updateForm('finalized', e.target.checked)} />
            Finalized
          </label>
          <span className="text-sm text-blue-700">Ready</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <label className="text-sm">
            <span className="text-gray-600">Estimation No.</span>
            <Input readOnly value={form.estimation_number || '(auto)'} className="mt-1" />
          </label>
          <label className="text-sm">
            <span className="text-gray-600">Estimation Date</span>
            <Input readOnly value={form.estimation_date || ''} className="mt-1" />
          </label>
          <label className="text-sm">
            <span className="text-gray-600">Estimation Type</span>
            <select className="w-full mt-1 border rounded px-2 py-1.5" value={form.estimation_type} onChange={(e) => updateForm('estimation_type', e.target.value)}>
              <option>External Estimation</option>
              <option>Insurance Claim Estimation</option>
              <option>Internal Estimation</option>
              <option>Template Estimation</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="text-gray-600">Valid Until</span>
            <input type="date" className="w-full mt-1 border rounded px-2 py-1.5" value={form.valid_until} onChange={(e) => updateForm('valid_until', e.target.value)} />
          </label>
          <label className="text-sm">
            <span className="text-gray-600">Estimator</span>
            <Input className="mt-1" value={form.estimator} onChange={(e) => updateForm('estimator', e.target.value)} />
          </label>
          <label className="text-sm">
            <span className="text-gray-600">Priority</span>
            <select className="w-full mt-1 border rounded px-2 py-1.5" value={form.priority} onChange={(e) => updateForm('priority', e.target.value)}>
              <option value="">Select priority...</option>
              <option value="Low">Low</option>
              <option value="Normal">Normal</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="text-gray-600">Requisition No.</span>
            <Input className="mt-1" value={form.requisition_no} onChange={(e) => updateForm('requisition_no', e.target.value)} />
          </label>
        </div>

        <div className="flex flex-wrap gap-1 border-b">
          {[
            ['general', 'General Info'],
            ['parts', 'Parts'],
            ['labor', 'Labour Charge'],
            ['fuel', 'Fuel & Lub'],
            ['misc', 'Miscellaneous Charge'],
            ['sublet', 'Sub Let'],
            ['other', 'Other Charges'],
            ['summary', 'Summary'],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`px-3 py-2 text-xs border rounded-t ${activeTab === key ? 'bg-white border-gray-300' : 'bg-gray-100 border-gray-200 text-gray-600'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === 'general' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <label className="text-sm">
            <span className="text-gray-600">Customer</span>
            <select className="w-full mt-1 border rounded px-2 py-1.5" value={form.customer_id} onChange={(e) => updateForm('customer_id', e.target.value)}>
              <option value="">Select customer...</option>
              {customers.map((c) => (
                <option key={c.customer_id} value={c.customer_id}>
                  #{c.customer_id} - {[c.first_name, c.last_name].filter(Boolean).join(' ') || c.email}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm md:col-span-2">
            <span className="text-gray-600">Vehicle</span>
            <select className="w-full mt-1 border rounded px-2 py-1.5" value={form.vehicle_id} onChange={(e) => updateForm('vehicle_id', e.target.value)}>
              <option value="">Select vehicle...</option>
              {filteredVehicles.map((v) => (
                <option key={v.vehicle_id} value={v.vehicle_id}>
                  #{v.vehicle_id} - {v.license_plate} ({v.make} {v.model})
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="text-gray-600">Chassi/VIN No.</span>
            <Input className="mt-1" value={form.chassis_no || selectedVehicle?.vin || ''} onChange={(e) => updateForm('chassis_no', e.target.value)} />
          </label>
          <label className="text-sm">
            <span className="text-gray-600">Plate No.</span>
            <Input className="mt-1" value={form.plate_no || selectedVehicle?.license_plate || ''} onChange={(e) => updateForm('plate_no', e.target.value)} />
          </label>
          <label className="text-sm">
            <span className="text-gray-600">Cell No.</span>
            <Input className="mt-1" value={form.cell_no || selectedCustomer?.phone || ''} onChange={(e) => updateForm('cell_no', e.target.value)} />
          </label>
          <label className="text-sm md:col-span-2">
            <span className="text-gray-600">Address</span>
            <Input className="mt-1" value={form.address || selectedCustomer?.address || ''} onChange={(e) => updateForm('address', e.target.value)} />
          </label>
          <label className="text-sm">
            <span className="text-gray-600">Make</span>
            <Input className="mt-1" value={form.make || selectedVehicle?.make || ''} onChange={(e) => updateForm('make', e.target.value)} />
          </label>
          <label className="text-sm">
            <span className="text-gray-600">Model Type</span>
            <Input className="mt-1" value={form.model_type || selectedVehicle?.model || ''} onChange={(e) => updateForm('model_type', e.target.value)} />
          </label>
          <label className="text-sm">
            <span className="text-gray-600">Engine No.</span>
            <Input className="mt-1" value={form.engine_no} onChange={(e) => updateForm('engine_no', e.target.value)} />
          </label>
          <label className="text-sm">
            <span className="text-gray-600">Type of Job</span>
            <Input className="mt-1" value={form.type_of_job || (serviceTypes.find((s) => Number(s.service_type_id) === Number(form.service_type_id))?.service_name || '')} onChange={(e) => updateForm('type_of_job', e.target.value)} />
          </label>
          <label className="text-sm">
            <span className="text-gray-600">Delivery Time</span>
            <Input className="mt-1" value={form.delivery_time} onChange={(e) => updateForm('delivery_time', e.target.value)} />
          </label>
          <label className="text-sm">
            <span className="text-gray-600">Color Code</span>
            <Input className="mt-1" value={form.color_code} onChange={(e) => updateForm('color_code', e.target.value)} />
          </label>
          <label className="text-sm">
            <span className="text-gray-600">Trim Code</span>
            <Input className="mt-1" value={form.trim_code} onChange={(e) => updateForm('trim_code', e.target.value)} />
          </label>
          <label className="text-sm">
            <span className="text-gray-600">Millage</span>
            <Input className="mt-1" value={form.millage} onChange={(e) => updateForm('millage', e.target.value)} />
          </label>
          <label className="text-sm">
            <span className="text-gray-600">Claim No</span>
            <Input className="mt-1" value={form.claim_no} onChange={(e) => updateForm('claim_no', e.target.value)} />
          </label>
          <label className="text-sm">
            <span className="text-gray-600">Service Type</span>
            <select className="w-full mt-1 border rounded px-2 py-1.5" value={form.service_type_id} onChange={(e) => updateForm('service_type_id', e.target.value)}>
              <option value="">Select service type...</option>
              {serviceTypes.map((s) => (
                <option key={s.service_type_id} value={s.service_type_id}>
                  {s.service_name || s.type_name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm flex items-center gap-2 mt-6">
            <input type="checkbox" checked={!!form.supplied_by_us} onChange={(e) => updateForm('supplied_by_us', e.target.checked)} />
            Supplied By US
          </label>
          <label className="text-sm flex items-center gap-2 mt-6">
            <input type="checkbox" checked={!!form.supplied_by_others} onChange={(e) => updateForm('supplied_by_others', e.target.checked)} />
            Supplied By Others
          </label>
          <label className="text-sm">
            <span className="text-gray-600">Tax %</span>
            <input className="w-full mt-1 border rounded px-2 py-1.5" value={form.tax_rate} onChange={(e) => updateForm('tax_rate', e.target.value)} />
          </label>
          <label className="text-sm">
            <span className="text-gray-600">Discount Amount</span>
            <input className="w-full mt-1 border rounded px-2 py-1.5" value={form.discount_amount} onChange={(e) => updateForm('discount_amount', e.target.value)} />
          </label>
          <label className="text-sm md:col-span-2">
            <span className="text-gray-600">Remark</span>
            <input className="w-full mt-1 border rounded px-2 py-1.5" value={form.remark} onChange={(e) => updateForm('remark', e.target.value)} />
          </label>
          <label className="text-sm md:col-span-4">
            <span className="text-gray-600">Detail Work Description</span>
            <textarea className="w-full mt-1 border rounded px-2 py-1.5 min-h-[90px]" value={form.detail_work_description} onChange={(e) => updateForm('detail_work_description', e.target.value)} />
          </label>
          <label className="text-sm md:col-span-4">
            <span className="text-gray-600">Description</span>
            <input className="w-full mt-1 border rounded px-2 py-1.5" value={form.description} onChange={(e) => updateForm('description', e.target.value)} />
          </label>
        </div>
        )}

        {activeTab !== 'general' && activeTab !== 'summary' && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={refreshTab}>Refresh</Button>
            <Button type="button" variant="outline" onClick={addNewTabLine}>Add New</Button>
            <Button type="button" onClick={addTabLine}>Add</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <label className="text-sm md:col-span-2">
              <span className="text-gray-600">Item / Charge</span>
              <input className="w-full mt-1 border rounded px-2 py-1.5" value={lineDraft.item_name} onChange={(e) => setLineDraft((d) => ({ ...d, item_name: e.target.value }))} />
            </label>
            <label className="text-sm">
              <span className="text-gray-600">Quantity</span>
              <input className="w-full mt-1 border rounded px-2 py-1.5" value={lineDraft.quantity} onChange={(e) => setLineDraft((d) => ({ ...d, quantity: e.target.value }))} />
            </label>
            <label className="text-sm">
              <span className="text-gray-600">Unit Price</span>
              <input className="w-full mt-1 border rounded px-2 py-1.5" value={lineDraft.unit_price} onChange={(e) => setLineDraft((d) => ({ ...d, unit_price: e.target.value }))} />
            </label>
            <label className="text-sm md:col-span-4">
              <span className="text-gray-600">Description</span>
              <input className="w-full mt-1 border rounded px-2 py-1.5" value={lineDraft.item_description} onChange={(e) => setLineDraft((d) => ({ ...d, item_description: e.target.value }))} />
            </label>
          </div>
          <div className="overflow-auto border rounded">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 text-xs text-gray-600 uppercase">
                <tr>
                  <th className="py-2 px-2 text-left">No</th>
                  <th className="py-2 px-2 text-left">Code/Name</th>
                  <th className="py-2 px-2 text-left">Description</th>
                  <th className="py-2 px-2 text-left">Qty</th>
                  <th className="py-2 px-2 text-left">Unit Price</th>
                  <th className="py-2 px-2 text-left">Amount</th>
                </tr>
              </thead>
              <tbody>
                {filteredTabItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-4 px-2 text-center text-gray-500">No items in this tab.</td>
                  </tr>
                ) : (
                  filteredTabItems.map((it, idx) => (
                    <tr key={`${it.item_name}-${idx}`} className="border-t">
                      <td className="py-2 px-2">{idx + 1}</td>
                      <td className="py-2 px-2">{it.item_name}</td>
                      <td className="py-2 px-2">{it.item_description || '-'}</td>
                      <td className="py-2 px-2">{num(it.quantity).toFixed(2)}</td>
                      <td className="py-2 px-2">{num(it.unit_price).toFixed(2)}</td>
                      <td className="py-2 px-2">{(num(it.quantity) * num(it.unit_price)).toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        )}

        {activeTab === 'summary' && (
        <div className="space-y-3">
          <div className="overflow-auto border rounded">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 text-xs text-gray-600 uppercase">
                <tr>
                  <th className="py-2 px-2 text-left">Type</th>
                  <th className="py-2 px-2 text-left">Name</th>
                  <th className="py-2 px-2 text-left">Qty</th>
                  <th className="py-2 px-2 text-left">Unit Price</th>
                  <th className="py-2 px-2 text-left">Amount</th>
                </tr>
              </thead>
              <tbody>
                {form.items.filter((x) => x.item_name).length === 0 ? (
                  <tr><td colSpan={5} className="py-4 px-2 text-center text-gray-500">No estimation lines yet.</td></tr>
                ) : form.items.filter((x) => x.item_name).map((it, idx) => (
                  <tr key={`${it.item_name}-${idx}`} className="border-t">
                    <td className="py-2 px-2">{it.item_type}</td>
                    <td className="py-2 px-2">{it.item_name}</td>
                    <td className="py-2 px-2">{num(it.quantity).toFixed(2)}</td>
                    <td className="py-2 px-2">{num(it.unit_price).toFixed(2)}</td>
                    <td className="py-2 px-2">{(num(it.quantity) * num(it.unit_price)).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
            <div className="border rounded p-2">Subtotal: {itemsSubtotal.toFixed(2)}</div>
            <div className="border rounded p-2">Tax: {taxAmount.toFixed(2)}</div>
            <div className="border rounded p-2 font-semibold">Grand Total: {grandTotal.toFixed(2)}</div>
          </div>
        </div>
        )}

        <label className="text-sm block">
          <span className="text-gray-600">Notes</span>
          <textarea className="w-full mt-1 border rounded px-2 py-1.5 min-h-[80px]" value={form.notes} onChange={(e) => updateForm('notes', e.target.value)} />
        </label>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
          <div className="border rounded p-2">Subtotal: {itemsSubtotal.toFixed(2)}</div>
          <div className="border rounded p-2">Tax: {taxAmount.toFixed(2)}</div>
          <div className="border rounded p-2 font-semibold">Grand Total: {grandTotal.toFixed(2)}</div>
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}
        {success && <div className="text-sm text-green-600">{success}</div>}

        <div className="flex gap-2">
          <Button type="button" onClick={onCreate} disabled={createMutation.isPending || !form.finalized}>
            {createMutation.isPending ? 'Creating...' : 'Create Job Estimation'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/proformas')}>
            Open Full Proforma List
          </Button>
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="font-semibold mb-3">Recent Job Estimations</h2>
        {listLoading ? (
          <div className="text-sm text-gray-500">Loading estimations...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 pr-3">Estimate No.</th>
                  <th className="py-2 pr-3">Customer</th>
                  <th className="py-2 pr-3">Vehicle</th>
                  <th className="py-2 pr-3">Total</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {estimations.map((e) => (
                  <tr key={e.proforma_id} className="border-b">
                    <td className="py-2 pr-3">{e.proforma_number}</td>
                    <td className="py-2 pr-3">{e.customer_name || '-'}</td>
                    <td className="py-2 pr-3">{e.vehicle_info || '-'}</td>
                    <td className="py-2 pr-3">{num(e.grand_total).toFixed(2)}</td>
                    <td className="py-2 pr-3">{e.status}</td>
                    <td className="py-2 pr-3">
                      <Button type="button" variant="outline" size="sm" onClick={() => navigate(`/proformas/${e.proforma_id}/print`)}>
                        Print
                      </Button>
                    </td>
                  </tr>
                ))}
                {!estimations.length && (
                  <tr>
                    <td className="py-3 text-gray-500" colSpan={6}>No estimations found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

