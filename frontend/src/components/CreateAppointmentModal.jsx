import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { appointmentsApi, customersApi, serviceTypesApi } from '../services/api'
import { X } from 'lucide-react'

export default function CreateAppointmentModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    customer_id: '',
    vehicle_id: '',
    service_type_id: '',
    scheduled_date: '',
    scheduled_time: '',
    notes: '',
    estimated_duration_minutes: 60,
  })
  const [errors, setErrors] = useState({})
  const queryClient = useQueryClient()

  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customersApi.getAll(),
    enabled: isOpen,
  })

  const { data: vehicles } = useQuery({
    queryKey: ['vehicles', formData.customer_id],
    queryFn: () => customersApi.getVehicles(formData.customer_id),
    enabled: isOpen && !!formData.customer_id,
  })

  const { data: serviceTypes } = useQuery({
    queryKey: ['service-types'],
    queryFn: () => serviceTypesApi.getAll(),
    enabled: isOpen,
  })

  const createMutation = useMutation({
    mutationFn: (data) => appointmentsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['appointments'])
      onClose()
      resetForm()
    },
  })

  const resetForm = () => {
    setFormData({
      customer_id: '',
      vehicle_id: '',
      service_type_id: '',
      scheduled_date: '',
      scheduled_time: '',
      notes: '',
      estimated_duration_minutes: 60,
    })
    setErrors({})
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setErrors({})

    // Validation
    const newErrors = {}
    if (!formData.customer_id) newErrors.customer_id = 'Customer is required'
    if (!formData.vehicle_id) newErrors.vehicle_id = 'Vehicle is required'
    if (!formData.service_type_id) newErrors.service_type_id = 'Service type is required'
    if (!formData.scheduled_date) newErrors.scheduled_date = 'Date is required'
    if (!formData.scheduled_time) newErrors.scheduled_time = 'Time is required'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    createMutation.mutate({
      vehicle_id: parseInt(formData.vehicle_id),
      service_type_id: parseInt(formData.service_type_id),
      scheduled_date: formData.scheduled_date,
      scheduled_time: formData.scheduled_time,
      notes: formData.notes || null,
      estimated_duration_minutes: parseInt(formData.estimated_duration_minutes) || 60,
    })
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => {
      const newData = { ...prev, [name]: value }
      // Reset vehicle when customer changes
      if (name === 'customer_id') {
        newData.vehicle_id = ''
      }
      return newData
    })
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Create New Appointment</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Customer Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Customer <span className="text-red-500">*</span>
            </label>
            <select
              name="customer_id"
              value={formData.customer_id}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                errors.customer_id ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select a customer...</option>
              {customers?.data?.map((customer) => (
                <option key={customer.customer_id} value={customer.customer_id}>
                  {customer.first_name} {customer.last_name} - {customer.email}
                </option>
              ))}
            </select>
            {errors.customer_id && (
              <p className="mt-1 text-sm text-red-600">{errors.customer_id}</p>
            )}
          </div>

          {/* Vehicle Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vehicle <span className="text-red-500">*</span>
            </label>
            <select
              name="vehicle_id"
              value={formData.vehicle_id}
              onChange={handleChange}
              disabled={!formData.customer_id}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                errors.vehicle_id ? 'border-red-500' : 'border-gray-300'
              } ${!formData.customer_id ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            >
              <option value="">
                {formData.customer_id ? 'Select a vehicle...' : 'Select a customer first...'}
              </option>
              {vehicles?.data?.map((vehicle) => (
                <option key={vehicle.vehicle_id} value={vehicle.vehicle_id}>
                  {vehicle.make} {vehicle.model} ({vehicle.license_plate}) - {vehicle.year}
                </option>
              ))}
            </select>
            {errors.vehicle_id && (
              <p className="mt-1 text-sm text-red-600">{errors.vehicle_id}</p>
            )}
            {formData.customer_id && (!vehicles?.data || vehicles.data.length === 0) && (
              <p className="mt-1 text-sm text-yellow-600">
                This customer has no vehicles. Please add a vehicle first.
              </p>
            )}
          </div>

          {/* Service Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Service Type <span className="text-red-500">*</span>
            </label>
            <select
              name="service_type_id"
              value={formData.service_type_id}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                errors.service_type_id ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select a service type...</option>
              {serviceTypes?.data?.map((serviceType) => (
                <option key={serviceType.service_type_id} value={serviceType.service_type_id}>
                  {serviceType.type_name}
                </option>
              ))}
            </select>
            {errors.service_type_id && (
              <p className="mt-1 text-sm text-red-600">{errors.service_type_id}</p>
            )}
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Scheduled Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="scheduled_date"
                value={formData.scheduled_date}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                  errors.scheduled_date ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.scheduled_date && (
                <p className="mt-1 text-sm text-red-600">{errors.scheduled_date}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Scheduled Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                name="scheduled_time"
                value={formData.scheduled_time}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                  errors.scheduled_time ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.scheduled_time && (
                <p className="mt-1 text-sm text-red-600">{errors.scheduled_time}</p>
              )}
            </div>
          </div>

          {/* Estimated Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estimated Duration (minutes)
            </label>
            <input
              type="number"
              name="estimated_duration_minutes"
              value={formData.estimated_duration_minutes}
              onChange={handleChange}
              min="15"
              step="15"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Additional notes or special instructions..."
            />
          </div>

          {/* Error Message */}
          {createMutation.isError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {createMutation.error?.response?.data?.detail || 'Failed to create appointment'}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isLoading}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {createMutation.isLoading ? 'Creating...' : 'Create Appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

