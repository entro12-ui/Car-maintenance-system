import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { proformasApi, partsApi } from '../services/api'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { Plus, Trash2, Save, X, ChevronDown, ChevronUp, Building2 } from 'lucide-react'

export default function ProformaForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = !!id

  const [formData, setFormData] = useState({
    organization_name: '',  // Insurance company or organization name
    customer_name: '',  // External customer name (not in car service system)
    car_model: '',  // Car model
    tax_rate: '15.00',
    discount_amount: '0.00',
    items: [],
  })

  const [newItem, setNewItem] = useState({
    part_id: '',
    item_type: 'Other',  // Service, Part, or Other
    item_name: '',
    item_description: '',
    quantity: '1',
    unit_price: '0',
    notes: '',
  })

  const [expandedItems, setExpandedItems] = useState(new Set())
  const [marketPrices, setMarketPrices] = useState({}) // { itemIndex: [{ organization_name, unit_price, notes }] }
  const [newMarketPrice, setNewMarketPrice] = useState({}) // { itemIndex: { organization_name: '', unit_price: '', notes: '' } }

  // Fetch proforma if editing
  const { data: proformaData, isLoading: loadingProforma } = useQuery({
    queryKey: ['proforma', id],
    queryFn: () => proformasApi.getById(id),
    enabled: isEdit,
  })

  // Fetch parts only (no customer, vehicle, service type needed)
  const { data: parts } = useQuery({
    queryKey: ['parts'],
    queryFn: () => partsApi.getAll(),
  })

  // Load proforma data if editing
  useEffect(() => {
    if (isEdit && proformaData?.data) {
      const proforma = proformaData.data
      setFormData({
        organization_name: proforma.organization_name || '',
        customer_name: proforma.customer_name || '',
        car_model: proforma.car_model || '',
        tax_rate: proforma.tax_rate.toString(),
        discount_amount: proforma.discount_amount.toString(),
        items: proforma.items || [],
      })
      // Load market prices
      const marketPricesData = {}
      proforma.items?.forEach((item, index) => {
        if (item.market_prices && item.market_prices.length > 0) {
          marketPricesData[index] = item.market_prices
        }
      })
      setMarketPrices(marketPricesData)
    }
  }, [isEdit, proformaData])

  const createMutation = useMutation({
    mutationFn: (data) => proformasApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['proformas'])
      navigate('/proformas')
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data) => proformasApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['proformas'])
      queryClient.invalidateQueries(['proforma', id])
      navigate('/proformas')
    },
  })

  const addItemMutation = useMutation({
    mutationFn: ({ proformaId, itemData }) => proformasApi.addItem(proformaId, itemData),
    onSuccess: () => {
      queryClient.invalidateQueries(['proforma', id])
    },
  })

  const deleteItemMutation = useMutation({
    mutationFn: ({ proformaId, itemId }) => proformasApi.deleteItem(proformaId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries(['proforma', id])
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Validate required fields for insurance proformas
    if (!formData.organization_name || !formData.customer_name || !formData.car_model) {
      alert('Please fill in Organization Name, Customer Name (External), and Car Model')
      return
    }
    
    const submitData = {
      organization_name: formData.organization_name,
      customer_name: formData.customer_name,  // External customer (not in car service system)
      car_model: formData.car_model,
      tax_rate: parseFloat(formData.tax_rate),
      discount_amount: parseFloat(formData.discount_amount),
      items: formData.items.map((item, index) => ({
        part_id: item.part_id || null,
        item_type: item.item_type || 'Other',
        item_name: item.item_name,
        item_description: item.item_description || null,
        quantity: parseFloat(item.quantity),
        unit_price: parseFloat(item.unit_price),
        notes: item.notes || null,
        market_prices: (marketPrices[index] || []).map(mp => ({
          organization_name: mp.organization_name,
          unit_price: parseFloat(mp.unit_price),
          notes: mp.notes || null,
        })),
      })),
    }

    if (isEdit) {
      // For edit, update proforma and items separately
      updateMutation.mutate({
        organization_name: submitData.organization_name,
        customer_name: submitData.customer_name,
        car_model: submitData.car_model,
        tax_rate: submitData.tax_rate,
        discount_amount: submitData.discount_amount,
      })
    } else {
      createMutation.mutate(submitData)
    }
  }

  const handleAddItem = () => {
    if (!newItem.item_name || !newItem.unit_price) {
      alert('Please fill in item name and unit price')
      return
    }

    if (isEdit) {
      // Add item via API
      addItemMutation.mutate({
        proformaId: id,
        itemData: {
          part_id: newItem.part_id ? parseInt(newItem.part_id) : null,
          item_type: newItem.item_type || 'Other',
          item_name: newItem.item_name,
          item_description: newItem.item_description || null,
          quantity: parseFloat(newItem.quantity),
          unit_price: parseFloat(newItem.unit_price),
          notes: newItem.notes || null,
        },
      })
    } else {
      // Add item to local state
      setFormData({
        ...formData,
        items: [
          ...formData.items,
          {
            ...newItem,
            quantity: parseFloat(newItem.quantity),
            unit_price: parseFloat(newItem.unit_price),
            total_price: parseFloat(newItem.quantity) * parseFloat(newItem.unit_price),
          },
        ],
      })
    }

    // Reset new item form
    setNewItem({
      part_id: '',
      item_type: 'Other',
      item_name: '',
      item_description: '',
      quantity: '1',
      unit_price: '0',
      notes: '',
    })
  }

  const handleRemoveItem = (index) => {
    if (isEdit) {
      const item = formData.items[index]
      if (item.proforma_item_id) {
        deleteItemMutation.mutate({
          proformaId: id,
          itemId: item.proforma_item_id,
        })
      }
    } else {
      setFormData({
        ...formData,
        items: formData.items.filter((_, i) => i !== index),
      })
    }
  }

  const handlePartSelect = (partId) => {
    if (partId) {
      const part = parts?.data?.find((p) => p.part_id === parseInt(partId))
      if (part) {
        setNewItem({
          ...newItem,
          part_id: partId,
          item_type: 'Part',  // Automatically set to Part when part is selected
          item_name: part.part_name,
          unit_price: part.unit_price.toString(),
        })
      }
    } else {
      setNewItem({
        ...newItem,
        part_id: '',
        item_type: 'Other',  // Reset to Other when no part selected
        item_name: '',
        unit_price: '0',
      })
    }
  }

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => {
      return sum + (parseFloat(item.total_price) || 0)
    }, 0)
    const taxRate = parseFloat(formData.tax_rate) || 0
    const discount = parseFloat(formData.discount_amount) || 0
    const taxAmount = subtotal * (taxRate / 100)
    const grandTotal = subtotal + taxAmount - discount
    return { subtotal, taxAmount, grandTotal }
  }

  const totals = calculateTotals()

  if (isEdit && loadingProforma) {
    return <div className="flex justify-center items-center h-64">Loading...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          {isEdit ? 'Edit Proforma' : 'Create Proforma'}
        </h1>
        <Button variant="outline" onClick={() => navigate('/proformas')}>
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Organization and Customer Info - For Insurance Proformas */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Organization & Customer Information</h2>
          <p className="text-sm text-gray-500 mb-4">
            For insurance proformas - The customer may be external (not in the car service system). 
            The organization sends this proforma to the insurance company for the customer.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organization Name (Insurance Company) *
              </label>
              <Input
                value={formData.organization_name}
                onChange={(e) => setFormData({ ...formData, organization_name: e.target.value })}
                placeholder="e.g., ABC Insurance Company"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer Name (External) *
              </label>
              <Input
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                placeholder="External customer name (not in system)"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Customer outside the car service system - for insurance purposes
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Car Model *
              </label>
              <Input
                value={formData.car_model}
                onChange={(e) => setFormData({ ...formData, car_model: e.target.value })}
                placeholder="e.g., Toyota Corolla 2020"
                required
              />
            </div>
          </div>
        </div>

        {/* Items Section - Only Items and Prices */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Items</h2>

          {/* Add New Item */}
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <h3 className="text-sm font-medium mb-3">Add New Item</h3>
            <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Item Type *</label>
                <select
                  value={newItem.item_type}
                  onChange={(e) => {
                    const type = e.target.value
                    setNewItem({ ...newItem, item_type: type, part_id: type === 'Part' ? newItem.part_id : '' })
                  }}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Service">Service/Labor</option>
                  <option value="Part">Parts/Materials</option>
                  <option value="Other">Other Maintenance</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Part (Optional)</label>
                <select
                  value={newItem.part_id}
                  onChange={(e) => handlePartSelect(e.target.value)}
                  disabled={newItem.item_type !== 'Part'}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                >
                  <option value="">Custom Item</option>
                  {parts?.data?.map((part) => (
                    <option key={part.part_id} value={part.part_id}>
                      {part.part_code} - {part.part_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Item Name *</label>
                <Input
                  value={newItem.item_name}
                  onChange={(e) => setNewItem({ ...newItem, item_name: e.target.value })}
                  placeholder="Item name"
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Quantity</label>
                <Input
                  type="number"
                  step="0.01"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Unit Price *</label>
                <Input
                  type="number"
                  step="0.01"
                  value={newItem.unit_price}
                  onChange={(e) => setNewItem({ ...newItem, unit_price: e.target.value })}
                  placeholder="0.00"
                  className="text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-gray-600 mb-1">Description</label>
                <Input
                  value={newItem.item_description}
                  onChange={(e) => setNewItem({ ...newItem, item_description: e.target.value })}
                  placeholder="Item description"
                  className="text-sm"
                />
              </div>
            </div>
            <Button
              type="button"
              onClick={handleAddItem}
              className="mt-3"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Item
            </Button>
          </div>

          {/* Items List */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-2 px-3 text-sm font-semibold">Type</th>
                  <th className="text-left py-2 px-3 text-sm font-semibold">Item Name</th>
                  <th className="text-left py-2 px-3 text-sm font-semibold">Quantity</th>
                  <th className="text-left py-2 px-3 text-sm font-semibold">Unit Price</th>
                  <th className="text-left py-2 px-3 text-sm font-semibold">Total</th>
                  <th className="text-left py-2 px-3 text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {formData.items.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-4 text-gray-500">
                      No items added yet
                    </td>
                  </tr>
                ) : (
                  formData.items.map((item, index) => {
                    const isExpanded = expandedItems.has(index)
                    const itemMarketPrices = marketPrices[index] || (item.market_prices || [])
                    const itemNewMarketPrice = newMarketPrice[index] || { organization_name: '', unit_price: '', notes: '' }
                    
                    return (
                      <>
                        <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="py-2 px-3">
                            <span className={`px-2 py-1 text-xs font-semibold rounded ${
                              item.item_type === 'Service' ? 'bg-blue-100 text-blue-800' :
                              item.item_type === 'Part' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {item.item_type || 'Other'}
                            </span>
                          </td>
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  const newExpanded = new Set(expandedItems)
                                  if (newExpanded.has(index)) {
                                    newExpanded.delete(index)
                                  } else {
                                    newExpanded.add(index)
                                  }
                                  setExpandedItems(newExpanded)
                                }}
                                className="text-gray-500 hover:text-gray-700"
                              >
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                              <div>
                                <div className="font-medium">{item.item_name}</div>
                                {item.item_description && (
                                  <div className="text-xs text-gray-500">{item.item_description}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-2 px-3">{item.quantity}</td>
                          <td className="py-2 px-3">
                            {new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: 'ETB',
                            }).format(item.unit_price)}
                          </td>
                          <td className="py-2 px-3 font-semibold">
                            {new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: 'ETB',
                            }).format(item.total_price)}
                          </td>
                          <td className="py-2 px-3">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr key={`${index}-market`} className="bg-gray-50">
                            <td colSpan="6" className="py-4 px-3">
                              <div className="space-y-3">
                                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                  <Building2 className="w-4 h-4" />
                                  Market Prices from Other Organizations
                                </div>
                                
                                {/* Existing Market Prices */}
                                {itemMarketPrices.length > 0 && (
                                  <div className="space-y-2">
                                    {itemMarketPrices.map((mp, mpIndex) => (
                                      <div key={mpIndex} className="flex items-center gap-2 p-2 bg-white rounded border">
                                        <div className="flex-1">
                                          <div className="font-medium text-sm">{mp.organization_name}</div>
                                          <div className="text-xs text-gray-600">
                                            {new Intl.NumberFormat('en-US', {
                                              style: 'currency',
                                              currency: 'ETB',
                                            }).format(mp.unit_price)}
                                            {mp.notes && ` - ${mp.notes}`}
                                          </div>
                                        </div>
                                        {isEdit && mp.market_price_id ? (
                                          <button
                                            type="button"
                                            onClick={async () => {
                                              try {
                                                await proformasApi.deleteMarketPrice(id, item.proforma_item_id, mp.market_price_id)
                                                queryClient.invalidateQueries(['proforma', id])
                                              } catch (error) {
                                                console.error('Error deleting market price:', error)
                                              }
                                            }}
                                            className="text-red-600 hover:text-red-800"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const newPrices = { ...marketPrices }
                                              newPrices[index] = (newPrices[index] || []).filter((_, i) => i !== mpIndex)
                                              setMarketPrices(newPrices)
                                            }}
                                            className="text-red-600 hover:text-red-800"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                                
                                {/* Add New Market Price */}
                                <div className="p-3 bg-white rounded border border-dashed">
                                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2">
                                    <div>
                                      <label className="block text-xs text-gray-600 mb-1">Organization Name *</label>
                                      <Input
                                        value={itemNewMarketPrice.organization_name}
                                        onChange={(e) => {
                                          setNewMarketPrice({
                                            ...newMarketPrice,
                                            [index]: { ...itemNewMarketPrice, organization_name: e.target.value }
                                          })
                                        }}
                                        placeholder="Organization name"
                                        className="text-sm"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs text-gray-600 mb-1">Price *</label>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        value={itemNewMarketPrice.unit_price}
                                        onChange={(e) => {
                                          setNewMarketPrice({
                                            ...newMarketPrice,
                                            [index]: { ...itemNewMarketPrice, unit_price: e.target.value }
                                          })
                                        }}
                                        placeholder="0.00"
                                        className="text-sm"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs text-gray-600 mb-1">Notes</label>
                                      <Input
                                        value={itemNewMarketPrice.notes}
                                        onChange={(e) => {
                                          setNewMarketPrice({
                                            ...newMarketPrice,
                                            [index]: { ...itemNewMarketPrice, notes: e.target.value }
                                          })
                                        }}
                                        placeholder="Optional notes"
                                        className="text-sm"
                                      />
                                    </div>
                                    <div className="flex items-end">
                                      <Button
                                        type="button"
                                        onClick={async () => {
                                          if (!itemNewMarketPrice.organization_name || !itemNewMarketPrice.unit_price) {
                                            alert('Please fill in organization name and price')
                                            return
                                          }
                                          
                                          if (isEdit && item.proforma_item_id) {
                                            try {
                                              await proformasApi.addMarketPrice(id, item.proforma_item_id, {
                                                organization_name: itemNewMarketPrice.organization_name,
                                                unit_price: parseFloat(itemNewMarketPrice.unit_price),
                                                notes: itemNewMarketPrice.notes || null,
                                              })
                                              queryClient.invalidateQueries(['proforma', id])
                                              setNewMarketPrice({
                                                ...newMarketPrice,
                                                [index]: { organization_name: '', unit_price: '', notes: '' }
                                              })
                                            } catch (error) {
                                              console.error('Error adding market price:', error)
                                            }
                                          } else {
                                            const newPrices = { ...marketPrices }
                                            newPrices[index] = [...(newPrices[index] || []), {
                                              organization_name: itemNewMarketPrice.organization_name,
                                              unit_price: parseFloat(itemNewMarketPrice.unit_price),
                                              notes: itemNewMarketPrice.notes || null,
                                            }]
                                            setMarketPrices(newPrices)
                                            setNewMarketPrice({
                                              ...newMarketPrice,
                                              [index]: { organization_name: '', unit_price: '', notes: '' }
                                            })
                                          }
                                        }}
                                        size="sm"
                                        className="w-full"
                                      >
                                        <Plus className="w-4 h-4 mr-1" />
                                        Add
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tax Rate (%)
              </label>
              <Input
                type="number"
                step="0.01"
                value={formData.tax_rate}
                onChange={(e) => setFormData({ ...formData, tax_rate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Discount Amount
              </label>
              <Input
                type="number"
                step="0.01"
                value={formData.discount_amount}
                onChange={(e) => setFormData({ ...formData, discount_amount: e.target.value })}
              />
            </div>
          </div>

          {/* Totals */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-semibold">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'ETB',
                }).format(totals.subtotal)}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Tax ({formData.tax_rate}%):</span>
              <span className="font-semibold">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'ETB',
                }).format(totals.taxAmount)}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Discount:</span>
              <span className="font-semibold text-red-600">
                - {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'ETB',
                }).format(parseFloat(formData.discount_amount) || 0)}
              </span>
            </div>
            <div className="flex justify-between py-2 pt-2 border-t border-gray-300">
              <span className="text-lg font-bold">Grand Total:</span>
              <span className="text-lg font-bold text-blue-600">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'ETB',
                }).format(totals.grandTotal)}
              </span>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate('/proformas')}>
            Cancel
          </Button>
          <Button type="submit" disabled={createMutation.isLoading || updateMutation.isLoading}>
            <Save className="w-4 h-4 mr-2" />
            {isEdit ? 'Update Proforma' : 'Create Proforma'}
          </Button>
        </div>
      </form>
    </div>
  )
}
