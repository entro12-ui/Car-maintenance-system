import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { jobOrderNoticeTypesApi } from '../services/api'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card } from '../components/ui/card'

export default function JobOrderNoticeTypes() {
  const queryClient = useQueryClient()
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState('')

  const { data, isLoading, error } = useQuery({
    queryKey: ['jobOrderNoticeTypes', { active_only: false }],
    queryFn: () => jobOrderNoticeTypesApi.list({ active_only: false }),
  })

  const rows = useMemo(() => data?.data || [], [data])

  const createMutation = useMutation({
    mutationFn: (payload) => jobOrderNoticeTypesApi.create(payload),
    onSuccess: async () => {
      setNewName('')
      await queryClient.invalidateQueries({ queryKey: ['jobOrderNoticeTypes'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => jobOrderNoticeTypesApi.update(id, payload),
    onSuccess: async () => {
      setEditingId(null)
      setEditingName('')
      await queryClient.invalidateQueries({ queryKey: ['jobOrderNoticeTypes'] })
    },
  })

  const onCreate = (e) => {
    e.preventDefault()
    const name = (newName || '').trim()
    if (!name) return
    createMutation.mutate({ notice_type_name: name })
  }

  const startEdit = (row) => {
    setEditingId(row.notice_type_id)
    setEditingName(row.notice_type_name || '')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditingName('')
  }

  const saveEdit = () => {
    const name = (editingName || '').trim()
    if (!name) return
    updateMutation.mutate({ id: editingId, payload: { notice_type_name: name } })
  }

  const toggleActive = (row) => {
    updateMutation.mutate({
      id: row.notice_type_id,
      payload: { is_active: !row.is_active },
    })
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Job Order Notice Types</h1>

      <Card className="p-6 mb-6">
        <form onSubmit={onCreate} className="flex flex-col sm:flex-row gap-3">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New notice type name"
          />
          <Button type="submit" disabled={createMutation.isPending || !(newName || '').trim()}>
            {createMutation.isPending ? 'Adding...' : 'Add'}
          </Button>
        </form>
        {createMutation.error && (
          <p className="text-sm text-red-600 mt-3">{createMutation.error?.response?.data?.detail || 'Failed to add notice type'}</p>
        )}
      </Card>

      <div className="bg-white rounded-lg shadow-md p-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-48">Loading...</div>
        ) : error ? (
          <div className="text-red-600">Failed to load notice types</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const isEditing = editingId === row.notice_type_id
                  return (
                    <tr key={row.notice_type_id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        {isEditing ? (
                          <Input value={editingName} onChange={(e) => setEditingName(e.target.value)} />
                        ) : (
                          <span className="font-medium">{row.notice_type_name}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            row.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {row.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-end gap-2">
                          {isEditing ? (
                            <>
                              <Button type="button" variant="outline" onClick={cancelEdit}>
                                Cancel
                              </Button>
                              <Button
                                type="button"
                                onClick={saveEdit}
                                disabled={updateMutation.isPending || !(editingName || '').trim()}
                              >
                                Save
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button type="button" variant="outline" onClick={() => startEdit(row)}>
                                Edit
                              </Button>
                              <Button
                                type="button"
                                variant={row.is_active ? 'destructive' : 'default'}
                                onClick={() => toggleActive(row)}
                                disabled={updateMutation.isPending}
                              >
                                {row.is_active ? 'Deactivate' : 'Activate'}
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-6 px-4 text-center text-gray-500">
                      No notice types
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {updateMutation.error && (
          <p className="text-sm text-red-600 mt-3">{updateMutation.error?.response?.data?.detail || 'Failed to update notice type'}</p>
        )}
      </div>
    </div>
  )
}
