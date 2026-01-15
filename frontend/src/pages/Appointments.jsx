import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { appointmentsApi, serviceTypesApi } from '../services/api'
import { Plus, Calendar, Clock, CheckCircle, XCircle, Filter, Search } from 'lucide-react'
import { format } from 'date-fns'
import CreateAppointmentModal from '../components/CreateAppointmentModal'

export default function Appointments() {
  const [selectedDate, setSelectedDate] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
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
    return <div className="flex justify-center items-center h-64">Loading...</div>
  }

  const statusColors = {
    Scheduled: 'bg-blue-100 text-blue-800',
    'In Progress': 'bg-yellow-100 text-yellow-800',
    Completed: 'bg-green-100 text-green-800',
    Cancelled: 'bg-red-100 text-red-800',
    'No Show': 'bg-gray-100 text-gray-800',
  }

  // Filter appointments by search term
  const filteredAppointments = appointments?.filter((apt) => {
    const customerName = `${apt.vehicle?.customer?.first_name || ''} ${apt.vehicle?.customer?.last_name || ''}`.toLowerCase()
    const vehicleInfo = `${apt.vehicle?.license_plate || ''} ${apt.vehicle?.make || ''} ${apt.vehicle?.model || ''}`.toLowerCase()
    const serviceType = apt.service_type?.type_name?.toLowerCase() || ''
    const searchLower = searchTerm.toLowerCase()
    
    return (
      customerName.includes(searchLower) ||
      vehicleInfo.includes(searchLower) ||
      serviceType.includes(searchLower)
    )
  }) || []

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Appointments</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>New Appointment</span>
        </button>
      </div>

      <CreateAppointmentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {/* Today's Appointments Summary */}
      {todayAppointments?.data && todayAppointments.data.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Today's Appointments</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {todayAppointments.data.map((apt) => (
              <div key={apt.appointment_id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold text-gray-800">{apt.customer_name}</p>
                    <p className="text-sm text-gray-600">{apt.license_plate}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${statusColors[apt.status] || 'bg-gray-100'}`}>
                    {apt.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{apt.service_type}</p>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
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
        </div>
      )}

      {/* All Appointments */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">All Appointments</h2>
          
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by customer, vehicle, or service..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                placeholder="Filter by date"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter size={20} className="text-gray-600" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
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
          {(selectedDate || statusFilter || searchTerm) && (
            <button
              onClick={() => {
                setSelectedDate('')
                setStatusFilter('')
                setSearchTerm('')
              }}
              className="text-sm text-primary-600 hover:text-primary-700 mb-4"
            >
              Clear all filters
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Customer</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Vehicle</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Service</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Time</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-gray-500">
                    {isLoading ? 'Loading appointments...' : 'No appointments found'}
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((apt) => (
                  <tr key={apt.appointment_id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">
                        {apt.vehicle?.customer?.first_name} {apt.vehicle?.customer?.last_name}
                      </div>
                      {apt.vehicle?.customer?.phone && (
                        <div className="text-sm text-gray-500">{apt.vehicle.customer.phone}</div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{apt.vehicle?.license_plate}</div>
                      <div className="text-sm text-gray-500">
                        {apt.vehicle?.make} {apt.vehicle?.model} ({apt.vehicle?.year})
                      </div>
                    </td>
                    <td className="py-3 px-4">{apt.service_type?.type_name || '-'}</td>
                    <td className="py-3 px-4">
                      {apt.scheduled_date ? format(new Date(apt.scheduled_date), 'MMM dd, yyyy') : '-'}
                    </td>
                    <td className="py-3 px-4">
                      {apt.scheduled_time ? (typeof apt.scheduled_time === 'string' ? apt.scheduled_time : apt.scheduled_time.substring(0, 5)) : '-'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[apt.status] || 'bg-gray-100 text-gray-800'}`}>
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
        </div>
      </div>
    </div>
  )
}

