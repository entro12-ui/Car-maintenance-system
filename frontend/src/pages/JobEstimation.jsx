import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { customersApi, proformasApi, serviceTypesApi, vehiclesApi } from '../services/api'

const EMPTY_ITEM = { item_type: 'Service', item_name: '', item_description: '', quantity: '1', unit_price: '' }

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
    valid_until: '',
    tax_rate: '15',
    discount_amount: '0',
    items: [{ ...EMPTY_ITEM }],
  })

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

  const updateItem = (idx, key, value) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((it, i) => (i === idx ? { ...it, [key]: value } : it)),
    }))
  }

  const addItem = () => setForm((prev) => ({ ...prev, items: [...prev.items, { ...EMPTY_ITEM }] }))
  const removeItem = (idx) =>
    setForm((prev) => ({
      ...prev,
      items: prev.items.length <= 1 ? prev.items : prev.items.filter((_, i) => i !== idx),
    }))

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
      description: form.description || null,
      notes: form.notes || null,
      valid_until: form.valid_until || null,
      tax_rate: num(form.tax_rate),
      discount_amount: num(form.discount_amount),
      items: cleanedItems,
    }
    createMutation.mutate(payload)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">Job Estimation</h1>
        <p className="text-sm text-gray-600">Create estimate lines directly here (real estimation form, not proforma screen redirect).</p>
      </div>

      <Card className="p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <label className="text-sm">
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
          <label className="text-sm">
            <span className="text-gray-600">Valid Until</span>
            <input type="date" className="w-full mt-1 border rounded px-2 py-1.5" value={form.valid_until} onChange={(e) => updateForm('valid_until', e.target.value)} />
          </label>
          <label className="text-sm">
            <span className="text-gray-600">Tax %</span>
            <input className="w-full mt-1 border rounded px-2 py-1.5" value={form.tax_rate} onChange={(e) => updateForm('tax_rate', e.target.value)} />
          </label>
          <label className="text-sm">
            <span className="text-gray-600">Discount Amount</span>
            <input className="w-full mt-1 border rounded px-2 py-1.5" value={form.discount_amount} onChange={(e) => updateForm('discount_amount', e.target.value)} />
          </label>
          <label className="text-sm md:col-span-3">
            <span className="text-gray-600">Description</span>
            <input className="w-full mt-1 border rounded px-2 py-1.5" value={form.description} onChange={(e) => updateForm('description', e.target.value)} />
          </label>
        </div>

        <div className="border rounded">
          <div className="grid grid-cols-12 gap-2 p-2 text-xs font-semibold bg-gray-50 border-b">
            <div className="col-span-2">Type</div>
            <div className="col-span-3">Name</div>
            <div className="col-span-3">Description</div>
            <div className="col-span-1">Qty</div>
            <div className="col-span-2">Unit Price</div>
            <div className="col-span-1 text-right">Action</div>
          </div>
          <div className="p-2 space-y-2">
            {form.items.map((it, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2">
                <select className="col-span-2 border rounded px-2 py-1.5 text-sm" value={it.item_type} onChange={(e) => updateItem(idx, 'item_type', e.target.value)}>
                  <option value="Service">Service</option>
                  <option value="Part">Part</option>
                  <option value="Other">Other</option>
                </select>
                <input className="col-span-3 border rounded px-2 py-1.5 text-sm" value={it.item_name} onChange={(e) => updateItem(idx, 'item_name', e.target.value)} />
                <input className="col-span-3 border rounded px-2 py-1.5 text-sm" value={it.item_description} onChange={(e) => updateItem(idx, 'item_description', e.target.value)} />
                <input className="col-span-1 border rounded px-2 py-1.5 text-sm" value={it.quantity} onChange={(e) => updateItem(idx, 'quantity', e.target.value)} />
                <input className="col-span-2 border rounded px-2 py-1.5 text-sm" value={it.unit_price} onChange={(e) => updateItem(idx, 'unit_price', e.target.value)} />
                <div className="col-span-1 text-right">
                  <Button type="button" variant="outline" size="sm" onClick={() => removeItem(idx)} disabled={form.items.length === 1}>
                    Del
                  </Button>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addItem}>Add Line</Button>
          </div>
        </div>

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
          <Button type="button" onClick={onCreate} disabled={createMutation.isPending}>
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

