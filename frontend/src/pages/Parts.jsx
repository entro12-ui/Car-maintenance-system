import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { partsApi } from '../services/api'
import { AlertTriangle, Package, Plus } from 'lucide-react'
import AddPartModal from '../components/AddPartModal'

export default function Parts() {
  const [showLowStock, setShowLowStock] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  
  const { data: parts, isLoading } = useQuery({
    queryKey: ['parts'],
    queryFn: async () => {
      const response = await partsApi.getAll()
      return response.data
    },
  })

  const { data: lowStockParts } = useQuery({
    queryKey: ['parts', 'low-stock'],
    queryFn: async () => {
      const response = await partsApi.getLowStock()
      return response.data
    },
  })

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Parts Inventory</h1>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowLowStock(!showLowStock)}
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
              showLowStock
                ? 'bg-red-600 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <AlertTriangle size={20} />
            <span>Low Stock ({lowStockParts?.length || 0})</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Add Part</span>
          </button>
        </div>
      </div>

      {showLowStock && lowStockParts && lowStockParts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-red-800 mb-4">Low Stock Items</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lowStockParts.map((part) => (
              <div key={part.part_id} className="bg-white border border-red-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-gray-800">{part.part_name}</p>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    part.stock_status === 'OUT OF STOCK' 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {part.stock_status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">Code: {part.part_code}</p>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Stock:</span>
                  <span className="font-semibold">{part.stock_quantity} / {part.min_stock_level}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-600">Price:</span>
                  <span className="font-semibold">ETB {part.unit_price.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Part Code</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Category</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Stock</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Unit Price</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {parts?.map((part) => (
                <tr key={part.part_id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono text-sm">{part.part_code}</td>
                  <td className="py-3 px-4">{part.part_name}</td>
                  <td className="py-3 px-4">{part.category || '-'}</td>
                  <td className="py-3 px-4">
                    <span className={part.stock_quantity <= part.min_stock_level ? 'text-red-600 font-semibold' : ''}>
                      {part.stock_quantity}
                    </span>
                    <span className="text-gray-500 text-sm ml-1">
                      / {part.min_stock_level}
                    </span>
                  </td>
                  <td className="py-3 px-4">ETB {parseFloat(part.unit_price).toLocaleString()}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        part.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {part.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Part Modal */}
      <AddPartModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
    </div>
  )
}

