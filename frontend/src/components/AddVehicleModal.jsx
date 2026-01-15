import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

export default function AddVehicleModal({ isOpen, onClose, onSave, customerId, isLoading, error }) {
  const [formData, setFormData] = useState({
    license_plate: '',
    vin: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    engine_type: '',
    transmission_type: '',
    fuel_type: '',
    current_mileage: 0,
  })
  const [errors, setErrors] = useState({})

  // Handle API errors
  useEffect(() => {
    if (error) {
      if (error.includes('VIN')) {
        setErrors({ vin: 'VIN already registered' })
      } else if (error.includes('License plate')) {
        setErrors({ license_plate: 'License plate already registered' })
      } else {
        setErrors({ general: error })
      }
    } else {
      setErrors({})
    }
  }, [error])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'year' || name === 'current_mileage' ? parseInt(value) || 0 : value,
    }))
    setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const newErrors = {}

    if (!formData.license_plate.trim()) {
      newErrors.license_plate = 'License plate is required'
    }
    if (!formData.make.trim()) {
      newErrors.make = 'Make is required'
    }
    if (!formData.model.trim()) {
      newErrors.model = 'Model is required'
    }
    if (!formData.year || formData.year < 1900 || formData.year > new Date().getFullYear() + 1) {
      newErrors.year = 'Valid year is required'
    }
    if (formData.current_mileage < 0) {
      newErrors.current_mileage = 'Mileage cannot be negative'
    }
    if (formData.current_mileage > 99999999) {
      newErrors.current_mileage = 'Mileage cannot exceed 99,999,999 km'
    }
    // VIN validation: if provided, must be 17 characters (standard VIN length)
    if (formData.vin && formData.vin.trim() && formData.vin.trim().length > 17) {
      newErrors.vin = 'VIN cannot exceed 17 characters'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    // Convert empty strings to null for optional fields
    const vehicleData = {
      ...formData,
      customer_id: customerId,
      vin: formData.vin.trim() || null,
      color: formData.color.trim() || null,
      engine_type: formData.engine_type.trim() || null,
      fuel_type: formData.fuel_type || null,
      transmission_type: formData.transmission_type || null,
    }
    
    onSave(vehicleData)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b pb-4 p-6 sticky top-0 bg-white">
          <h2 className="text-2xl font-semibold text-gray-800">Add Vehicle</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
              {errors.general}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="license_plate" className="block text-sm font-medium text-gray-700 mb-2">
                License Plate <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="license_plate"
                name="license_plate"
                value={formData.license_plate}
                onChange={handleChange}
                className={`w-full px-4 py-2 border ${
                  errors.license_plate ? 'border-red-500' : 'border-gray-300'
                } rounded-lg focus:ring-2 focus:ring-primary-500`}
                required
              />
              {errors.license_plate && (
                <p className="text-red-500 text-xs mt-1">{errors.license_plate}</p>
              )}
            </div>

            <div>
              <label htmlFor="vin" className="block text-sm font-medium text-gray-700 mb-2">
                VIN (Optional)
              </label>
              <input
                type="text"
                id="vin"
                name="vin"
                value={formData.vin}
                onChange={handleChange}
                maxLength={17}
                className={`w-full px-4 py-2 border ${
                  errors.vin ? 'border-red-500' : 'border-gray-300'
                } rounded-lg focus:ring-2 focus:ring-primary-500`}
              />
              {errors.vin && (
                <p className="text-red-500 text-xs mt-1">{errors.vin}</p>
              )}
            </div>

            <div>
              <label htmlFor="make" className="block text-sm font-medium text-gray-700 mb-2">
                Make <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="make"
                name="make"
                value={formData.make}
                onChange={handleChange}
                className={`w-full px-4 py-2 border ${
                  errors.make ? 'border-red-500' : 'border-gray-300'
                } rounded-lg focus:ring-2 focus:ring-primary-500`}
                required
              />
              {errors.make && <p className="text-red-500 text-xs mt-1">{errors.make}</p>}
            </div>

            <div>
              <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-2">
                Model <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="model"
                name="model"
                value={formData.model}
                onChange={handleChange}
                className={`w-full px-4 py-2 border ${
                  errors.model ? 'border-red-500' : 'border-gray-300'
                } rounded-lg focus:ring-2 focus:ring-primary-500`}
                required
              />
              {errors.model && <p className="text-red-500 text-xs mt-1">{errors.model}</p>}
            </div>

            <div>
              <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-2">
                Year <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="year"
                name="year"
                value={formData.year}
                onChange={handleChange}
                min="1900"
                max={new Date().getFullYear() + 1}
                className={`w-full px-4 py-2 border ${
                  errors.year ? 'border-red-500' : 'border-gray-300'
                } rounded-lg focus:ring-2 focus:ring-primary-500`}
                required
              />
              {errors.year && <p className="text-red-500 text-xs mt-1">{errors.year}</p>}
            </div>

            <div>
              <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-2">
                Color
              </label>
              <input
                type="text"
                id="color"
                name="color"
                value={formData.color}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label htmlFor="fuel_type" className="block text-sm font-medium text-gray-700 mb-2">
                Fuel Type
              </label>
              <select
                id="fuel_type"
                name="fuel_type"
                value={formData.fuel_type}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select Fuel Type</option>
                <option value="Petrol">Petrol</option>
                <option value="Diesel">Diesel</option>
                <option value="Electric">Electric</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>

            <div>
              <label htmlFor="transmission_type" className="block text-sm font-medium text-gray-700 mb-2">
                Transmission
              </label>
              <select
                id="transmission_type"
                name="transmission_type"
                value={formData.transmission_type}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select Transmission</option>
                <option value="Manual">Manual</option>
                <option value="Automatic">Automatic</option>
                <option value="CVT">CVT</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="current_mileage" className="block text-sm font-medium text-gray-700 mb-2">
                Current Mileage (km)
              </label>
              <input
                type="number"
                id="current_mileage"
                name="current_mileage"
                value={formData.current_mileage}
                onChange={handleChange}
                min="0"
                max="99999999"
                className={`w-full px-4 py-2 border ${
                  errors.current_mileage ? 'border-red-500' : 'border-gray-300'
                } rounded-lg focus:ring-2 focus:ring-primary-500`}
              />
              {errors.current_mileage && (
                <p className="text-red-500 text-xs mt-1">{errors.current_mileage}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {isLoading ? 'Adding...' : 'Add Vehicle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

