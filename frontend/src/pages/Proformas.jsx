import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { proformasApi } from '../services/api'
import { format } from 'date-fns'
import { Plus, Printer, Edit, Trash2, Eye, Search, Filter } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { SortableTh } from '@/components/ui/sortable-table'
import { useClientTableSortFilter } from '@/lib/tableSortFilter'

export default function Proformas() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('')

  const { data: proformas, isLoading } = useQuery({
    queryKey: ['proformas', statusFilter],
    queryFn: () => proformasApi.getAll({ status: statusFilter || undefined }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => proformasApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['proformas'])
    },
  })

  const markPrintedMutation = useMutation({
    mutationFn: (id) => proformasApi.markPrinted(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['proformas'])
    },
  })

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this proforma?')) {
      deleteMutation.mutate(id)
    }
  }

  const handlePrint = (id) => {
    markPrintedMutation.mutate(id)
    navigate(`/proformas/${id}/print`)
  }

  const proformaRows = proformas?.data || []

  const searchFields = useMemo(
    () => [
      (p) =>
        `${p.proforma_number || ''} ${p.customer_name || ''} ${p.vehicle_info || ''} ${p.status || ''} ${p.grand_total ?? ''}`,
    ],
    []
  )

  const sortAccessors = useMemo(
    () => ({
      number: (p) => p.proforma_number || '',
      customer: (p) => p.customer_name || '',
      vehicle: (p) => p.vehicle_info || '',
      total: (p) => Number(p.grand_total) || 0,
      status: (p) => p.status || '',
      created: (p) => p.created_at || '',
      validUntil: (p) => p.valid_until || '',
    }),
    []
  )

  const { query, setQuery, sort, toggleSort, items: displayRows } = useClientTableSortFilter(
    proformaRows,
    searchFields,
    sortAccessors
  )

  const getStatusBadge = (status) => {
    const colors = {
      Draft: 'bg-muted/350',
      Sent: 'bg-blue-500',
      Approved: 'bg-green-500',
      Converted: 'bg-purple-500',
      Cancelled: 'bg-red-500',
    }
    return (
      <Badge className={`${colors[status] || 'bg-muted/350'} text-white`}>
        {status}
      </Badge>
    )
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">Proforma Invoices</h1>
        <Button onClick={() => navigate('/proformas/new')}>
          <Plus className="w-4 h-4 mr-2" />
          Create Proforma
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground/75 w-4 h-4" />
            <input
              type="search"
              placeholder="Search by number, customer, or vehicle..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoComplete="off"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground/75 w-4 h-4" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
              <option value="Approved">Approved</option>
              <option value="Converted">Converted</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Proformas Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/35">
              <tr>
                <SortableTh columnKey="number" sort={sort} onSort={toggleSort} className="text-foreground/90">
                  Proforma #
                </SortableTh>
                <SortableTh columnKey="customer" sort={sort} onSort={toggleSort} className="text-foreground/90">
                  Customer Name
                </SortableTh>
                <SortableTh columnKey="vehicle" sort={sort} onSort={toggleSort} className="text-foreground/90">
                  Vehicle / Car Model
                </SortableTh>
                <SortableTh columnKey="total" sort={sort} onSort={toggleSort} className="text-foreground/90">
                  Total
                </SortableTh>
                <SortableTh columnKey="status" sort={sort} onSort={toggleSort} className="text-foreground/90">
                  Status
                </SortableTh>
                <SortableTh columnKey="created" sort={sort} onSort={toggleSort} className="text-foreground/90">
                  Created
                </SortableTh>
                <SortableTh columnKey="validUntil" sort={sort} onSort={toggleSort} className="text-foreground/90">
                  Valid Until
                </SortableTh>
                <th className="text-left py-3 px-4 font-semibold text-foreground/90">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayRows.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-muted-foreground">
                    {proformaRows.length === 0 ? 'No proformas found' : 'No matching proformas'}
                  </td>
                </tr>
              ) : (
                displayRows.map((proforma) => (
                  <tr key={proforma.proforma_id} className="border-b border-border hover:bg-muted/45">
                    <td className="py-3 px-4">
                      <span className="font-medium text-blue-600">{proforma.proforma_number}</span>
                    </td>
                    <td className="py-3 px-4">{proforma.customer_name || 'N/A'}</td>
                    <td className="py-3 px-4">{proforma.vehicle_info || 'N/A'}</td>
                    <td className="py-3 px-4 font-semibold">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'ETB',
                      }).format(proforma.grand_total)}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(proforma.status)}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {format(new Date(proforma.created_at), 'MMM dd, yyyy')}
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {proforma.valid_until ? format(new Date(proforma.valid_until), 'MMM dd, yyyy') : 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/proformas/${proforma.proforma_id}`)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {proforma.status !== 'Converted' && (
                          <>
                            <button
                              onClick={() => navigate(`/proformas/${proforma.proforma_id}/edit`)}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handlePrint(proforma.proforma_id)}
                              className="p-1 text-purple-600 hover:bg-purple-50 rounded"
                              title="Print"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(proforma.proforma_id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
