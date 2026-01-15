import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { partsApi } from '../services/api'
import { X, Package, AlertCircle } from 'lucide-react'

export default function AddPartModal({ isOpen, onClose }) {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    part_code: '',
    part_name: '',
    description: '',
    category: '',
    unit_price: '',
    cost_price: '',
    stock_quantity: 0,
    min_stock_level: 5,
    supplier_id: '',
    compatible_models: '',
  })
  const [error, setError] = useState('')

  const createMutation = useMutation({
    mutationFn: (data) => partsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['parts'])
      queryClient.invalidateQueries(['parts', 'low-stock'])
      onClose()
      // Reset form
      setFormData({
        part_code: '',
        part_name: '',
        description: '',
        category: '',
        unit_price: '',
        cost_price: '',
        stock_quantity: 0,
        min_stock_level: 5,
        supplier_id: '',
        compatible_models: '',
      })
      setError('')
    },
    onError: (error) => {
      setError(error.response?.data?.detail || 'Failed to create part')
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!formData.part_code || !formData.part_name) {
      setError('Part code and name are required')
      return
    }

    if (!formData.unit_price || !formData.cost_price) {
      setError('Unit price and cost price are required')
      return
    }

    // Prepare data
    const partData = {
      part_code: formData.part_code.trim().toUpperCase(),
      part_name: formData.part_name.trim(),
      description: formData.description || null,
      category: formData.category || null,
      unit_price: parseFloat(formData.unit_price),
      cost_price: parseFloat(formData.cost_price),
      stock_quantity: parseInt(formData.stock_quantity) || 0,
      min_stock_level: parseInt(formData.min_stock_level) || 5,
      supplier_id: formData.supplier_id ? parseInt(formData.supplier_id) : null,
      compatible_models: formData.compatible_models || null,
    }

    createMutation.mutate(partData)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  if (!isOpen) return null

  const categories = [
    'Engine',
    'Transmission',
    'Brake',
    'Suspension',
    'Electrical',
    'Body',
    'Interior',
    'Exterior',
    'Filter',
    'Fluid',
    'Other',
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Package className="text-primary-600" size={24} />
            <h2 className="text-2xl font-bold text-gray-800">Add New Part</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center space-x-2">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Part Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Part Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="part_code"
                value={formData.part_code}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="e.g., ENG-001"
              />
            </div>

            {/* Part Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Part Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="part_name"
                value={formData.part_name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="e.g., Engine Oil Filter"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Unit Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unit Price (ETB) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="unit_price"
                value={formData.unit_price}
                onChange={handleChange}
                required
                step="0.01"
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>

            {/* Cost Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cost Price (ETB) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="cost_price"
                value={formData.cost_price}
                onChange={handleChange}
                required
                step="0.01"
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>

            {/* Stock Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Initial Stock Quantity
              </label>
              <input
                type="number"
                name="stock_quantity"
                value={formData.stock_quantity}
                onChange={handleChange}
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="0"
              />
            </div>

            {/* Min Stock Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Stock Level
              </label>
              <input
                type="number"
                name="min_stock_level"
                value={formData.min_stock_level}
                onChange={handleChange}
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="5"
              />
            </div>

            {/* Supplier ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supplier ID (Optional)
              </label>
              <input
                type="number"
                name="supplier_id"
                value={formData.supplier_id}
                onChange={handleChange}
                min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Optional"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Part description and specifications..."
            />
          </div>

          {/* Compatible Models */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Compatible Models
            </label>
            <input
              type="text"
              name="compatible_models"
              value={formData.compatible_models}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g., Toyota Corolla 2015-2020, Honda Civic 2018-2023"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isLoading}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Package size={18} />
              <span>{createMutation.isLoading ? 'Adding...' : 'Add Part'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

