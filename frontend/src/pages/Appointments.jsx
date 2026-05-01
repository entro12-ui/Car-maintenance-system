import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { appointmentsApi, serviceTypesApi } from '../services/api'
import { Plus, Clock, Filter } from 'lucide-react'
import { format } from 'date-fns'
import CreateAppointmentModal from '../components/CreateAppointmentModal'
import { PageHeader, PageLoading } from '@/components/PageChrome'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { DataTableShell } from '@/components/ui/table'
import { SortableTh, TableSearchBar } from '@/components/ui/sortable-table'
import { useClientTableSortFilter } from '@/lib/tableSortFilter'

export default function Appointments() {
  const [selectedDate, setSelectedDate] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const queryClient = useQueryClient()

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['appointments', selectedDate, statusFilter],
    queryFn: async () => {
      const response = await appointmentsApi.getAll({ 
        scheduled_date: selectedDate || undefined,
        status: statusFilter || undefined,
      })
      return response.data
    },
  })

  const { data: todayAppointments } = useQuery({
    queryKey: ['appointments', 'today'],
    queryFn: () => appointmentsApi.getToday(),
  })

  const startMutation = useMutation({
    mutationFn: appointmentsApi.start,
    onSuccess: () => {
      queryClient.invalidateQueries(['appointments'])
    },
  })

  const completeMutation = useMutation({
    mutationFn: appointmentsApi.complete,
    onSuccess: () => {
      queryClient.invalidateQueries(['appointments'])
    },
  })

  if (isLoading) {
    return <PageLoading label="Loading appointments…" />
  }

  const searchFields = useMemo(
    () => [
      (apt) =>
        `${apt.vehicle?.customer?.first_name || ''} ${apt.vehicle?.customer?.last_name || ''} ${apt.vehicle?.customer?.phone || ''} ${apt.vehicle?.license_plate || ''} ${apt.vehicle?.make || ''} ${apt.vehicle?.model || ''} ${apt.service_type?.type_name || ''} ${apt.status || ''}`,
    ],
    []
  )

  const sortAccessors = useMemo(
    () => ({
      customer: (a) =>
        `${a.vehicle?.customer?.first_name || ''} ${a.vehicle?.customer?.last_name || ''}`.trim(),
      vehicle: (a) =>
        `${a.vehicle?.license_plate || ''} ${a.vehicle?.make || ''} ${a.vehicle?.model || ''}`.trim(),
      service: (a) => a.service_type?.type_name || '',
      date: (a) => a.scheduled_date || '',
      time: (a) => String(a.scheduled_time ?? ''),
      status: (a) => a.status || '',
    }),
    []
  )

  const { query, setQuery, sort, toggleSort, items: tableRows } = useClientTableSortFilter(
    appointments || [],
    searchFields,
    sortAccessors
  )

  const statusColors = {
    Scheduled: 'bg-blue-100 text-blue-800',
    'In Progress': 'bg-yellow-100 text-yellow-800',
    Completed: 'bg-green-100 text-green-800',
    Cancelled: 'bg-red-100 text-red-800',
    'No Show': 'bg-muted text-foreground',
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Scheduling"
        title="Appointments"
        description="Review today’s queue, filter the master list, and progress visits from scheduled through completion."
        actions={
          <Button type="button" className="gap-2 shadow-md shadow-primary/15" onClick={() => setIsModalOpen(true)}>
            <Plus size={20} />
            New appointment
          </Button>
        }
      />

      <CreateAppointmentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {/* Today's Appointments Summary */}
      {todayAppointments?.data && todayAppointments.data.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Today&apos;s appointments</CardTitle>
          </CardHeader>
          <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {todayAppointments.data.map((apt) => (
              <div key={apt.appointment_id} className="border border-border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold text-foreground">{apt.customer_name}</p>
                    <p className="text-sm text-muted-foreground">{apt.license_plate}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${statusColors[apt.status] || 'bg-muted'}`}>
                    {apt.status}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{apt.service_type}</p>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Clock size={16} />
                  <span>{apt.scheduled_time}</span>
                </div>
                <div className="flex space-x-2 mt-3">
                  {apt.status === 'Scheduled' && (
                    <button
                      onClick={() => startMutation.mutate(apt.appointment_id)}
                      className="flex-1 bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600"
                    >
                      Start
                    </button>
                  )}
                  {apt.status === 'In Progress' && (
                    <button
                      onClick={() => completeMutation.mutate(apt.appointment_id)}
                      className="flex-1 bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                    >
                      Complete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          </CardContent>
        </Card>
      )}

      {/* All Appointments */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">All appointments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filters */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <TableSearchBar
              value={query}
              onChange={setQuery}
              placeholder="Filter list by customer, vehicle, service, status…"
              className="mb-0 max-w-none md:col-span-1"
            />
            <div>
              <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={20} className="shrink-0 text-muted-foreground" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex h-11 w-full flex-1 rounded-xl border border-input bg-background px-4 text-sm shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/30"
              >
                <option value="">All Statuses</option>
                <option value="Scheduled">Scheduled</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
                <option value="No Show">No Show</option>
              </select>
            </div>
          </div>

          {/* Clear Filters */}
          {(selectedDate || statusFilter || query) && (
            <Button
              type="button"
              variant="ghost"
              className="h-auto px-0 text-sm text-primary hover:text-primary/90"
              onClick={() => {
                setSelectedDate('')
                setStatusFilter('')
                setQuery('')
              }}
            >
              Clear all filters
            </Button>
          )}

        <DataTableShell>
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/65 bg-muted/60 shadow-[inset_0_-1px_0_0_rgba(255,255,255,0.45)]">
                <SortableTh columnKey="customer" sort={sort} onSort={toggleSort}>
                  Customer
                </SortableTh>
                <SortableTh columnKey="vehicle" sort={sort} onSort={toggleSort}>
                  Vehicle
                </SortableTh>
                <SortableTh columnKey="service" sort={sort} onSort={toggleSort}>
                  Service
                </SortableTh>
                <SortableTh columnKey="date" sort={sort} onSort={toggleSort}>
                  Date
                </SortableTh>
                <SortableTh columnKey="time" sort={sort} onSort={toggleSort}>
                  Time
                </SortableTh>
                <SortableTh columnKey="status" sort={sort} onSort={toggleSort}>
                  Status
                </SortableTh>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="[&_tr:nth-child(even)]:bg-muted/[0.22]">
              {tableRows.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-10 text-center text-sm text-muted-foreground">
                    {isLoading ? 'Loading appointments...' : 'No appointments found'}
                  </td>
                </tr>
              ) : (
                tableRows.map((apt) => (
                  <tr
                    key={apt.appointment_id}
                    className="border-b border-border/55 transition-colors duration-150 hover:bg-primary/[0.055]"
                  >
                    <td className="px-4 py-4 text-[13px]">
                      <div className="font-medium text-foreground">
                        {apt.vehicle?.customer?.first_name} {apt.vehicle?.customer?.last_name}
                      </div>
                      {apt.vehicle?.customer?.phone && (
                        <div className="text-sm text-muted-foreground">{apt.vehicle.customer.phone}</div>
                      )}
                    </td>
                    <td className="px-4 py-4 text-[13px]">
                      <div className="font-medium text-foreground">{apt.vehicle?.license_plate}</div>
                      <div className="text-sm text-muted-foreground">
                        {apt.vehicle?.make} {apt.vehicle?.model} ({apt.vehicle?.year})
                      </div>
                    </td>
                    <td className="px-4 py-4 text-[13px]">{apt.service_type?.type_name || '-'}</td>
                    <td className="px-4 py-4 text-[13px]">
                      {apt.scheduled_date ? format(new Date(apt.scheduled_date), 'MMM dd, yyyy') : '-'}
                    </td>
                    <td className="px-4 py-4 text-[13px]">
                      {apt.scheduled_time ? (typeof apt.scheduled_time === 'string' ? apt.scheduled_time : apt.scheduled_time.substring(0, 5)) : '-'}
                    </td>
                    <td className="px-4 py-4 text-[13px]">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[apt.status] || 'bg-muted text-foreground'}`}>
                        {apt.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        {apt.status === 'Scheduled' && (
                          <button
                            onClick={() => startMutation.mutate(apt.appointment_id)}
                            className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600"
                          >
                            Start
                          </button>
                        )}
                        {apt.status === 'In Progress' && (
                          <button
                            onClick={() => completeMutation.mutate(apt.appointment_id)}
                            className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                          >
                            Complete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </DataTableShell>
        </CardContent>
      </Card>
    </div>
  )
}

