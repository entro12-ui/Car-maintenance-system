import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { serviceTypesApi } from '../services/api'
import { Plus, Edit, Trash2, Save, X, CheckCircle } from 'lucide-react'

export default function ManageServiceChecklists() {
  const [selectedServiceType, setSelectedServiceType] = useState(null)
  const [editingItem, setEditingItem] = useState(null)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [newItem, setNewItem] = useState({
    item_name: '',
    item_description: '',
    is_mandatory: true,
    estimated_duration_minutes: 15,
    sort_order: 0,
  })
  const queryClient = useQueryClient()

  const { data: serviceTypes, isLoading: loadingTypes } = useQuery({
    queryKey: ['service-types'],
    queryFn: () => serviceTypesApi.getAll(),
  })

  const { data: serviceTypeWithChecklist, isLoading: loadingChecklist } = useQuery({
    queryKey: ['service-type-checklist', selectedServiceType],
    queryFn: () => serviceTypesApi.getWithChecklist(selectedServiceType),
    enabled: !!selectedServiceType,
  })

  const createMutation = useMutation({
    mutationFn: (data) => serviceTypesApi.createChecklistItem(selectedServiceType, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['service-type-checklist', selectedServiceType])
      setIsAddingNew(false)
      setNewItem({
        item_name: '',
        item_description: '',
        is_mandatory: true,
        estimated_duration_minutes: 15,
        sort_order: serviceTypeWithChecklist?.data?.checklists?.length || 0,
      })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ checklistId, data }) => serviceTypesApi.updateChecklistItem(checklistId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['service-type-checklist', selectedServiceType])
      setEditingItem(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (checklistId) => serviceTypesApi.deleteChecklistItem(checklistId),
    onSuccess: () => {
      queryClient.invalidateQueries(['service-type-checklist', selectedServiceType])
    },
  })

  const handleAddNew = () => {
    setNewItem({
      item_name: '',
      item_description: '',
      is_mandatory: true,
      estimated_duration_minutes: 15,
      sort_order: serviceTypeWithChecklist?.data?.checklists?.length || 0,
    })
    setIsAddingNew(true)
  }

  const handleSaveNew = () => {
    if (!newItem.item_name.trim()) {
      alert('Item name is required')
      return
    }
    createMutation.mutate(newItem)
  }

  const handleEdit = (item) => {
    setEditingItem({ ...item })
  }

  const handleSaveEdit = () => {
    if (!editingItem.item_name.trim()) {
      alert('Item name is required')
      return
    }
    updateMutation.mutate({
      checklistId: editingItem.checklist_id,
      data: editingItem,
    })
  }

  const handleDelete = (checklistId, itemName) => {
    if (window.confirm(`Are you sure you want to delete "${itemName}"?`)) {
      deleteMutation.mutate(checklistId)
    }
  }

  const checklistItems = serviceTypeWithChecklist?.data?.checklists || []

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Manage Service Checklists</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Service Types List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Service Types</h2>
          {loadingTypes ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : (
            <div className="space-y-2">
              {serviceTypes?.data?.map((st) => (
                <button
                  key={st.service_type_id}
                  onClick={() => setSelectedServiceType(st.service_type_id)}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                    selectedServiceType === st.service_type_id
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div className="font-semibold">{st.type_name}</div>
                  <div className={`text-sm ${selectedServiceType === st.service_type_id ? 'text-primary-100' : 'text-gray-600'}`}>
                    {st.description}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Checklist Items */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
          {!selectedServiceType ? (
            <div className="text-center py-12 text-gray-500">
              <p>Select a service type to manage its checklist items</p>
            </div>
          ) : loadingChecklist ? (
            <div className="text-center py-12 text-gray-500">Loading checklist...</div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-xl font-semibold">
                    {serviceTypeWithChecklist?.data?.type_name} - Checklist Items
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {checklistItems.length} item{checklistItems.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <button
                  onClick={handleAddNew}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center space-x-2"
                >
                  <Plus size={18} />
                  <span>Add Item</span>
                </button>
              </div>

              {/* Add New Item Form */}
              {isAddingNew && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-semibold mb-3">Add New Checklist Item</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Item Name *
                      </label>
                      <input
                        type="text"
                        value={newItem.item_name}
                        onChange={(e) => setNewItem({ ...newItem, item_name: e.target.value })}
                        placeholder="e.g., Engine Oil"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={newItem.item_description}
                        onChange={(e) => setNewItem({ ...newItem, item_description: e.target.value })}
                        rows="2"
                        placeholder="Item description"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Sort Order
                        </label>
                        <input
                          type="number"
                          value={newItem.sort_order}
                          onChange={(e) => setNewItem({ ...newItem, sort_order: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Duration (min)
                        </label>
                        <input
                          type="number"
                          value={newItem.estimated_duration_minutes}
                          onChange={(e) => setNewItem({ ...newItem, estimated_duration_minutes: parseInt(e.target.value) || 15 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div className="flex items-end">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={newItem.is_mandatory}
                            onChange={(e) => setNewItem({ ...newItem, is_mandatory: e.target.checked })}
                            className="w-4 h-4 text-primary-600 rounded"
                          />
                          <span className="text-sm text-gray-700">Mandatory</span>
                        </label>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={handleSaveNew}
                        disabled={createMutation.isLoading}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
                      >
                        <Save size={16} />
                        <span>Save</span>
                      </button>
                      <button
                        onClick={() => setIsAddingNew(false)}
                        className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 flex items-center space-x-2"
                      >
                        <X size={16} />
                        <span>Cancel</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Checklist Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-700">Sort</th>
                      <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-700">Item Name</th>
                      <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-700">Description</th>
                      <th className="border border-gray-300 px-4 py-2 text-center font-semibold text-gray-700">Mandatory</th>
                      <th className="border border-gray-300 px-4 py-2 text-center font-semibold text-gray-700">Duration</th>
                      <th className="border border-gray-300 px-4 py-2 text-center font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {checklistItems.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="border border-gray-300 px-4 py-8 text-center text-gray-500">
                          No checklist items. Click "Add Item" to create one.
                        </td>
                      </tr>
                    ) : (
                      checklistItems.map((item) => (
                        <tr key={item.checklist_id} className="hover:bg-gray-50">
                          {editingItem?.checklist_id === item.checklist_id ? (
                            <>
                              <td className="border border-gray-300 px-4 py-2">
                                <input
                                  type="number"
                                  value={editingItem.sort_order}
                                  onChange={(e) => setEditingItem({ ...editingItem, sort_order: parseInt(e.target.value) || 0 })}
                                  className="w-16 px-2 py-1 border border-gray-300 rounded"
                                />
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                <input
                                  type="text"
                                  value={editingItem.item_name}
                                  onChange={(e) => setEditingItem({ ...editingItem, item_name: e.target.value })}
                                  className="w-full px-2 py-1 border border-gray-300 rounded"
                                />
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                <input
                                  type="text"
                                  value={editingItem.item_description || ''}
                                  onChange={(e) => setEditingItem({ ...editingItem, item_description: e.target.value })}
                                  className="w-full px-2 py-1 border border-gray-300 rounded"
                                />
                              </td>
                              <td className="border border-gray-300 px-4 py-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={editingItem.is_mandatory}
                                  onChange={(e) => setEditingItem({ ...editingItem, is_mandatory: e.target.checked })}
                                  className="w-4 h-4 text-primary-600 rounded"
                                />
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                <input
                                  type="number"
                                  value={editingItem.estimated_duration_minutes}
                                  onChange={(e) => setEditingItem({ ...editingItem, estimated_duration_minutes: parseInt(e.target.value) || 15 })}
                                  className="w-20 px-2 py-1 border border-gray-300 rounded"
                                />
                              </td>
                              <td className="border border-gray-300 px-4 py-2">
                                <div className="flex justify-center space-x-2">
                                  <button
                                    onClick={handleSaveEdit}
                                    className="text-green-600 hover:text-green-700"
                                    title="Save"
                                  >
                                    <Save size={18} />
                                  </button>
                                  <button
                                    onClick={() => setEditingItem(null)}
                                    className="text-gray-600 hover:text-gray-700"
                                    title="Cancel"
                                  >
                                    <X size={18} />
                                  </button>
                                </div>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="border border-gray-300 px-4 py-2 text-center">{item.sort_order}</td>
                              <td className="border border-gray-300 px-4 py-2 font-medium">{item.item_name}</td>
                              <td className="border border-gray-300 px-4 py-2 text-sm text-gray-600">
                                {item.item_description || '-'}
                              </td>
                              <td className="border border-gray-300 px-4 py-2 text-center">
                                {item.is_mandatory ? (
                                  <CheckCircle className="mx-auto text-green-600" size={20} />
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              <td className="border border-gray-300 px-4 py-2 text-center">{item.estimated_duration_minutes} min</td>
                              <td className="border border-gray-300 px-4 py-2">
                                <div className="flex justify-center space-x-2">
                                  <button
                                    onClick={() => handleEdit(item)}
                                    className="text-blue-600 hover:text-blue-700"
                                    title="Edit"
                                  >
                                    <Edit size={18} />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(item.checklist_id, item.item_name)}
                                    className="text-red-600 hover:text-red-700"
                                    title="Delete"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

