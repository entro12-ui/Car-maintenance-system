import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminCustomersApi, serviceTypesApi, partsApi } from '../services/api'
import { ArrowLeft, CheckSquare, Square } from 'lucide-react'

export default function AddServiceForCustomer() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const vehicleId = searchParams.get('vehicle_id')
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState({
    vehicle_id: vehicleId ? parseInt(vehicleId) : '',
    service_type_id: '',
    service_date: new Date().toISOString().split('T')[0],
    mileage_at_service: '',
    mechanic_notes: '',
    oil_type: '',
    service_note: '',
    reference_number: '',
    branch: '',
    serviced_by_name: '',
  })

  const [selectedParts, setSelectedParts] = useState([])
  const [checklistItems, setChecklistItems] = useState([])
  const [checklistStatus, setChecklistStatus] = useState({}) // { checklist_id: { checked: bool, changed: bool } }

  const { data: customer } = useQuery({
    queryKey: ['admin-customer', id],
    queryFn: () => adminCustomersApi.getFullDetails(id),
  })

  const { data: serviceTypes } = useQuery({
    queryKey: ['service-types'],
    queryFn: () => serviceTypesApi.getAll(),
  })

  const { data: allParts } = useQuery({
    queryKey: ['parts'],
    queryFn: () => partsApi.getAll(),
  })

  const { data: checklist, refetch: refetchChecklist } = useQuery({
    queryKey: ['checklist', id, formData.service_type_id],
    queryFn: () => adminCustomersApi.getServiceChecklist(id, formData.service_type_id),
    enabled: !!formData.service_type_id,
  })

  const createServiceMutation = useMutation({
    mutationFn: (data) => adminCustomersApi.addService(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-customer', id])
      navigate(`/admin/customers/${id}`)
    },
  })

  useEffect(() => {
    if (formData.service_type_id) {
      refetchChecklist()
    }
  }, [formData.service_type_id, refetchChecklist])

  const handlePartToggle = (partId, checklistId, wasReplaced) => {
    setSelectedParts(prev => {
      const existing = prev.findIndex(p => p.part_id === partId && p.checklist_item_id === checklistId)
      if (existing >= 0) {
        // Toggle replacement status or remove
        if (prev[existing].was_replaced === wasReplaced) {
          return prev.filter((_, i) => i !== existing)
        } else {
          return prev.map((p, i) => 
            i === existing ? { ...p, was_replaced: wasReplaced } : p
          )
        }
      } else {
        return [...prev, {
          part_id: partId,
          checklist_item_id: checklistId,
          quantity: 1,
          was_replaced: wasReplaced,
        }]
      }
    })
    
    // Update checklist status when part is selected
    if (wasReplaced) {
      setChecklistStatus(prev => ({
        ...prev,
        [checklistId]: { ...prev[checklistId], changed: true, checked: true }
      }))
    } else {
      setChecklistStatus(prev => ({
        ...prev,
        [checklistId]: { ...prev[checklistId], checked: true }
      }))
    }
  }

  const isPartSelected = (partId, checklistId, wasReplaced) => {
    return selectedParts.some(p => 
      p.part_id === partId && 
      p.checklist_item_id === checklistId && 
      p.was_replaced === wasReplaced
    )
  }

  const handleChecklistToggle = (checklistId, type) => {
    setChecklistStatus(prev => {
      const current = prev[checklistId] || { checked: false, changed: false }
      const newStatus = { ...current }
      
      if (type === 'checked') {
        newStatus.checked = !current.checked
        // If unchecking "checked", also uncheck "changed"
        if (!newStatus.checked) {
          newStatus.changed = false
        }
      } else if (type === 'changed') {
        newStatus.changed = !current.changed
        // If checking "changed", also check "checked"
        if (newStatus.changed) {
          newStatus.checked = true
        }
      }
      
      return {
        ...prev,
        [checklistId]: newStatus
      }
    })
  }

  const getChecklistStatus = (checklistId) => {
    return checklistStatus[checklistId] || { checked: false, changed: false }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Validate mileage
    const mileage = parseFloat(formData.mileage_at_service)
    if (isNaN(mileage) || mileage < 0) {
      alert('Please enter a valid mileage (must be a positive number)')
      return
    }
    
    if (selectedVehicle && mileage < selectedVehicle.current_mileage) {
      if (!window.confirm(`The entered mileage (${mileage.toLocaleString()} km) is less than the vehicle's current mileage (${selectedVehicle.current_mileage.toLocaleString()} km). Do you want to continue?`)) {
        return
      }
    }
    
    // Convert checklistStatus to array format
    const checklistStatusArray = Object.entries(checklistStatus).map(([checklist_id, status]) => ({
      checklist_item_id: parseInt(checklist_id),
      checked: status.checked,
      changed: status.changed
    }))
    
    // Clean up empty strings to null for optional fields
    const serviceData = {
      ...formData,
      vehicle_id: parseInt(formData.vehicle_id),
      service_type_id: parseInt(formData.service_type_id),
      mileage_at_service: mileage,
      parts: selectedParts,
      checklist_status: checklistStatusArray,
      oil_type: formData.oil_type || null,
      service_note: formData.service_note || null,
      reference_number: formData.reference_number || null,
      branch: formData.branch || null,
      serviced_by_name: formData.serviced_by_name || null,
      mechanic_notes: formData.mechanic_notes || null,
    }

    createServiceMutation.mutate(serviceData)
  }

  const selectedVehicle = customer?.data?.vehicles?.find(v => v.vehicle_id === parseInt(formData.vehicle_id))

  return (
    <div>
      <div className="flex items-center space-x-4 mb-6">
        <button
          onClick={() => navigate(`/admin/customers/${id}`)}
          className="text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-3xl font-bold text-gray-800">Add Service</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Service Information</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vehicle
              </label>
              <select
                value={formData.vehicle_id}
                onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select Vehicle</option>
                {customer?.data?.vehicles?.map(v => (
                  <option key={v.vehicle_id} value={v.vehicle_id}>
                    {v.make} {v.model} ({v.license_plate})
                  </option>
                ))}
              </select>
              {selectedVehicle && (
                <p className="text-sm text-gray-500 mt-1">
                  Current Mileage: {selectedVehicle.current_mileage.toLocaleString()} km
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Type
              </label>
              <select
                value={formData.service_type_id}
                onChange={(e) => setFormData({ ...formData, service_type_id: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select Service Type</option>
                {serviceTypes?.data?.map(st => (
                  <option key={st.service_type_id} value={st.service_type_id}>
                    {st.type_name}
                  </option>
                ))}
              </select>
            </div>

          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mechanic Notes
            </label>
            <textarea
              value={formData.mechanic_notes}
              onChange={(e) => setFormData({ ...formData, mechanic_notes: e.target.value })}
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        {/* Service Record Details - Matching Image Format */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Service Record Details</h2>
          
          {/* Service Date and Mileage Section */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <input
                type="date"
                value={formData.service_date}
                onChange={(e) => setFormData({ ...formData, service_date: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Date
              </label>
              <input
                type="date"
                value={formData.service_date}
                onChange={(e) => setFormData({ ...formData, service_date: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kilometer (Current) *
              </label>
              <input
                type="number"
                value={formData.mileage_at_service}
                onChange={(e) => {
                  const value = e.target.value
                  // Only allow positive numbers, no decimals
                  if (value === '' || /^\d+$/.test(value)) {
                    setFormData({ ...formData, mileage_at_service: value })
                  }
                }}
                onBlur={(e) => {
                  // Validate on blur
                  const value = parseFloat(e.target.value)
                  if (selectedVehicle && value < selectedVehicle.current_mileage) {
                    alert(`Mileage cannot be less than vehicle's current mileage (${selectedVehicle.current_mileage.toLocaleString()} km)`)
                    setFormData({ ...formData, mileage_at_service: selectedVehicle.current_mileage.toString() })
                  }
                }}
                required
                min={selectedVehicle?.current_mileage || 0}
                step="1"
                placeholder="e.g., 20000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
              {selectedVehicle && (
                <p className="text-xs text-gray-500 mt-1">
                  Vehicle Current: {selectedVehicle.current_mileage.toLocaleString()} km
                  {formData.mileage_at_service && parseFloat(formData.mileage_at_service) < selectedVehicle.current_mileage && (
                    <span className="text-red-600 ml-2">⚠ Must be ≥ {selectedVehicle.current_mileage.toLocaleString()} km</span>
                  )}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Next Service KM
              </label>
              <input
                type="text"
                value={(() => {
                  if (!formData.service_type_id || !formData.mileage_at_service) return ''
                  const serviceType = serviceTypes?.data?.find(st => st.service_type_id === parseInt(formData.service_type_id))
                  if (!serviceType || !serviceType.mileage_interval) return ''
                  
                  const currentMileage = parseFloat(formData.mileage_at_service) || 0
                  // mileage_interval might be a string or number, parse it
                  const mileageInterval = typeof serviceType.mileage_interval === 'string' 
                    ? parseFloat(serviceType.mileage_interval) 
                    : (serviceType.mileage_interval || 0)
                  
                  if (currentMileage === 0 || mileageInterval === 0) return ''
                  
                  const nextMileage = Math.round(currentMileage + mileageInterval)
                  return nextMileage.toLocaleString()
                })()}
                readOnly
                placeholder="Auto-calculated"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
              />
              {formData.service_type_id && formData.mileage_at_service && (() => {
                const serviceType = serviceTypes?.data?.find(st => st.service_type_id === parseInt(formData.service_type_id))
                if (!serviceType || !serviceType.mileage_interval) return null
                const interval = typeof serviceType.mileage_interval === 'string' 
                  ? parseFloat(serviceType.mileage_interval) 
                  : (serviceType.mileage_interval || 0)
                return (
                  <p className="text-xs text-gray-500 mt-1">
                    Service Interval: +{interval.toLocaleString()} km
                  </p>
                )
              })()}
            </div>
          </div>

          {/* Oil Type and Notes Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Oil Type
              </label>
              <input
                type="text"
                value={formData.oil_type}
                onChange={(e) => setFormData({ ...formData, oil_type: e.target.value })}
                placeholder="e.g., 10 Tul 9000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Note
              </label>
              <input
                type="text"
                value={formData.service_note}
                onChange={(e) => setFormData({ ...formData, service_note: e.target.value })}
                placeholder="e.g., 1st Service completed"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          {/* Reference, Branch, and Serviced By Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reference Number
              </label>
              <input
                type="text"
                value={formData.reference_number}
                onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                placeholder="e.g., 0006601"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Branch
              </label>
              <input
                type="text"
                value={formData.branch}
                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                placeholder="e.g., YEKA BRANCH"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Serviced By Name
              </label>
              <input
                type="text"
                value={formData.serviced_by_name}
                onChange={(e) => setFormData({ ...formData, serviced_by_name: e.target.value })}
                placeholder="Mechanic name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Service Checklist */}
        {checklist?.data && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Service Checklist</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">
                      Item
                    </th>
                    <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-700 w-32">
                      CHECKED
                    </th>
                    <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-700 w-32">
                      CHANGED
                    </th>
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">
                      Parts
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {checklist.data.map((item) => {
                    const status = getChecklistStatus(item.checklist_id)
                    return (
                      <tr key={item.checklist_id} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-4 py-3">
                          <div>
                            <p className="font-medium text-gray-800">{item.item_name}</p>
                            {item.item_description && (
                              <p className="text-xs text-gray-500 mt-1">{item.item_description}</p>
                            )}
                          </div>
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center">
                          <label className="flex items-center justify-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={status.checked}
                              onChange={() => handleChecklistToggle(item.checklist_id, 'checked')}
                              className="w-5 h-5 text-primary-600 rounded"
                            />
                          </label>
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center">
                          <label className="flex items-center justify-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={status.changed}
                              onChange={() => handleChecklistToggle(item.checklist_id, 'changed')}
                              disabled={!status.checked}
                              className="w-5 h-5 text-primary-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                          </label>
                        </td>
                        <td className="border border-gray-300 px-4 py-3">
                          {item.related_parts && item.related_parts.length > 0 ? (
                            <div className="space-y-2">
                              {item.related_parts.map((part) => (
                                <div key={part.part_id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                                  <div className="flex-1">
                                    <p className="font-medium text-gray-800">{part.part_name}</p>
                                    <p className="text-xs text-gray-600">
                                      {part.part_code} • ETB {part.unit_price.toLocaleString()}
                                    </p>
                                  </div>
                                  <div className="flex items-center space-x-2 ml-2">
                                    <label className="flex items-center space-x-1 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={isPartSelected(part.part_id, item.checklist_id, false)}
                                        onChange={() => handlePartToggle(part.part_id, item.checklist_id, false)}
                                        className="w-4 h-4 text-primary-600 rounded"
                                      />
                                      <span className="text-xs text-gray-600">Insp</span>
                                    </label>
                                    <label className="flex items-center space-x-1 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={isPartSelected(part.part_id, item.checklist_id, true)}
                                        onChange={() => handlePartToggle(part.part_id, item.checklist_id, true)}
                                        className="w-4 h-4 text-primary-600 rounded"
                                      />
                                      <span className="text-xs text-green-700 font-medium">Rep</span>
                                    </label>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">No parts available</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate(`/admin/customers/${id}`)}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createServiceMutation.isLoading}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {createServiceMutation.isLoading ? 'Creating...' : 'Create Service'}
          </button>
        </div>
      </form>
    </div>
  )
}

