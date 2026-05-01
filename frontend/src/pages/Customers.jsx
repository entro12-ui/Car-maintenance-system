import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { customersApi } from '../services/api'
import { Plus, Edit, Eye } from 'lucide-react'
import CustomerModal from '../components/CustomerModal'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PageHeader, PageLoading } from '@/components/PageChrome'
import { SortableTableHead, TableSearchBar } from '@/components/ui/sortable-table'
import { useClientTableSortFilter } from '@/lib/tableSortFilter'

export default function Customers() {
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const queryClient = useQueryClient()

  const { data: customers, isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customersApi.getAll(),
  })

  const searchFields = useMemo(
    () => [
      (c) => `${c.first_name || ''} ${c.last_name || ''}`,
      (c) => c.email,
      (c) => c.phone,
      (c) => c.city,
    ],
    []
  )

  const sortAccessors = useMemo(
    () => ({
      name: (c) => `${c.first_name || ''} ${c.last_name || ''}`.trim(),
      email: (c) => c.email || '',
      phone: (c) => c.phone || '',
      city: (c) => c.city || '',
      status: (c) => (c.is_active ? 'Active' : 'Inactive'),
    }),
    []
  )

  const rowData = customers?.data || []
  const { query, setQuery, sort, toggleSort, items: filteredCustomers } = useClientTableSortFilter(
    rowData,
    searchFields,
    sortAccessors
  )

  const createMutation = useMutation({
    mutationFn: customersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['customers'])
      setIsModalOpen(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => customersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['customers'])
      setIsModalOpen(false)
      setSelectedCustomer(null)
    },
  })

  if (isLoading) {
    return <PageLoading label="Loading customers…" />
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="CRM"
        title="Customers"
        description="Search accounts, open profiles, or create customers via quick modal or full registration flow."
        actions={
          <>
            <Button type="button" variant="outline" asChild>
              <Link to="/customers/creation">New customer (full)</Link>
            </Button>
            <Button
              type="button"
              onClick={() => {
                setSelectedCustomer(null)
                setIsModalOpen(true)
              }}
            >
              <Plus size={20} />
              <span>Add customer (quick)</span>
            </Button>
          </>
        }
      />

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Customer List</CardTitle>
        </CardHeader>
        <CardContent>
          <TableSearchBar
            value={query}
            onChange={setQuery}
            placeholder="Filter by name, email, phone, city…"
          />

          <Table shell="embed">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <SortableTableHead columnKey="name" sort={sort} onSort={toggleSort}>
                  Name
                </SortableTableHead>
                <SortableTableHead columnKey="email" sort={sort} onSort={toggleSort}>
                  Email
                </SortableTableHead>
                <SortableTableHead columnKey="phone" sort={sort} onSort={toggleSort}>
                  Phone
                </SortableTableHead>
                <SortableTableHead columnKey="city" sort={sort} onSort={toggleSort}>
                  City
                </SortableTableHead>
                <SortableTableHead columnKey="status" sort={sort} onSort={toggleSort}>
                  Status
                </SortableTableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow key={customer.customer_id}>
                  <TableCell className="font-medium">
                    {customer.first_name} {customer.last_name}
                  </TableCell>
                  <TableCell>{customer.email}</TableCell>
                  <TableCell>{customer.phone}</TableCell>
                  <TableCell>{customer.city || '-'}</TableCell>
                  <TableCell>
                    {customer.is_active ? (
                      <Badge variant="success">Active</Badge>
                    ) : (
                      <Badge variant="danger">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedCustomer(customer)
                          setIsModalOpen(true)
                        }}
                        aria-label="Edit customer"
                      >
                        <Edit size={18} />
                      </Button>
                      <Button asChild variant="ghost" size="icon" aria-label="View customer">
                        <Link to={`/admin/customers/${customer.customer_id}`}>
                          <Eye size={18} />
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {isModalOpen && (
        <CustomerModal
          customer={selectedCustomer}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedCustomer(null)
          }}
          onSave={(data) => {
            if (selectedCustomer) {
              updateMutation.mutate({ id: selectedCustomer.customer_id, data })
            } else {
              createMutation.mutate(data)
            }
          }}
        />
      )}
    </div>
  )
}
