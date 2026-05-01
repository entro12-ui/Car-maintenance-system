import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { customerApi, appointmentsApi, serviceTypesApi } from '../services/api'
import { Plus, Calendar, Clock, CheckCircle, XCircle, Filter, Search } from 'lucide-react'
import { format } from 'date-fns'
import CreateCustomerAppointmentModal from '../components/CreateCustomerAppointmentModal'

export default function CustomerAppointments() {
  const [statusFilter, setStatusFilter] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const queryClient = useQueryClient()

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['customer-appointments'],
    queryFn: async () => {
      const response = await customerApi.getAppointments()
      return response.data
    },
  })

  const { data: vehicles } = useQuery({
    queryKey: ['customer-vehicles'],
    queryFn: () => customerApi.getVehicles(),
  })

  const statusColors = {
    Scheduled: 'bg-blue-100 text-blue-800',
    'In Progress': 'bg-yellow-100 text-yellow-800',
    Completed: 'bg-green-100 text-green-800',
    Cancelled: 'bg-red-100 text-red-800',
    'No Show': 'bg-muted text-foreground',
  }

  // Filter appointments by search term and status
  const filteredAppointments = appointments?.filter((apt) => {
    const vehicleInfo = `${apt.vehicle?.license_plate || ''} ${apt.vehicle?.make || ''} ${apt.vehicle?.model || ''}`.toLowerCase()
    const serviceType = apt.service_type?.type_name?.toLowerCase() || ''
    const searchLower = searchTerm.toLowerCase()
    
    const matchesSearch = vehicleInfo.includes(searchLower) || serviceType.includes(searchLower)
    const matchesStatus = !statusFilter || apt.status === statusFilter
    
    return matchesSearch && matchesStatus
  }) || []

  const upcomingAppointments = filteredAppointments.filter(apt => {
    const aptDate = new Date(apt.scheduled_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return aptDate >= today && apt.status !== 'Completed' && apt.status !== 'Cancelled'
  })

  const pastAppointments = filteredAppointments.filter(apt => {
    const aptDate = new Date(apt.scheduled_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return aptDate < today || apt.status === 'Completed' || apt.status === 'Cancelled'
  })

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">My Appointments</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          disabled={!vehicles?.data || vehicles.data.length === 0}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={20} />
          <span>Schedule Appointment</span>
        </button>
      </div>

      {(!vehicles?.data || vehicles.data.length === 0) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
          <div className="flex items-center space-x-2 text-yellow-800">
            <XCircle size={20} />
            <p className="font-medium">You need to add a vehicle before scheduling an appointment.</p>
          </div>
        </div>
      )}

      <CreateCustomerAppointmentModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        vehicles={vehicles?.data || []}
      />

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground/75" size={20} />
              <input
                type="text"
                placeholder="Search by vehicle or service type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Filter size={20} className="text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Statuses</option>
              <option value="Scheduled">Scheduled</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
              <option value="No Show">No Show</option>
            </select>
          </div>
          {(statusFilter || searchTerm) && (
            <button
              onClick={() => {
                setStatusFilter('')
                setSearchTerm('')
              }}
              className="text-sm text-primary-600 hover:text-primary-700 px-4 py-2"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Upcoming Appointments */}
      {upcomingAppointments.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
            <Calendar className="text-primary-600" size={24} />
            <span>Upcoming Appointments</span>
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/35">
                  <th className="text-left py-3 px-4 font-semibold text-foreground/90">Vehicle</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground/90">Service</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground/90">Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground/90">Time</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground/90">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground/90">Duration</th>
                </tr>
              </thead>
              <tbody>
                {upcomingAppointments.map((apt) => (
                  <tr key={apt.appointment_id} className="border-b border-border/60 hover:bg-muted/45">
                    <td className="py-3 px-4">
                      <div className="font-medium text-foreground">
                        {apt.vehicle?.make} {apt.vehicle?.model}
                      </div>
                      <div className="text-sm text-muted-foreground">{apt.vehicle?.license_plate}</div>
                    </td>
                    <td className="py-3 px-4">{apt.service_type?.type_name || '-'}</td>
                    <td className="py-3 px-4">
                      {apt.scheduled_date ? format(new Date(apt.scheduled_date), 'MMM dd, yyyy') : '-'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <Clock size={16} className="text-muted-foreground/75" />
                        <span>
                          {apt.scheduled_time ? (typeof apt.scheduled_time === 'string' ? apt.scheduled_time.substring(0, 5) : apt.scheduled_time.substring(0, 5)) : '-'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[apt.status] || 'bg-muted text-foreground'}`}>
                        {apt.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {apt.estimated_duration_minutes} min
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Past Appointments */}
      {pastAppointments.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
            <CheckCircle className="text-muted-foreground" size={24} />
            <span>Past Appointments</span>
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/35">
                  <th className="text-left py-3 px-4 font-semibold text-foreground/90">Vehicle</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground/90">Service</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground/90">Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground/90">Time</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground/90">Status</th>
                </tr>
              </thead>
              <tbody>
                {pastAppointments.map((apt) => (
                  <tr key={apt.appointment_id} className="border-b border-border/60 hover:bg-muted/45">
                    <td className="py-3 px-4">
                      <div className="font-medium text-foreground">
                        {apt.vehicle?.make} {apt.vehicle?.model}
                      </div>
                      <div className="text-sm text-muted-foreground">{apt.vehicle?.license_plate}</div>
                    </td>
                    <td className="py-3 px-4">{apt.service_type?.type_name || '-'}</td>
                    <td className="py-3 px-4">
                      {apt.scheduled_date ? format(new Date(apt.scheduled_date), 'MMM dd, yyyy') : '-'}
                    </td>
                    <td className="py-3 px-4">
                      {apt.scheduled_time ? (typeof apt.scheduled_time === 'string' ? apt.scheduled_time.substring(0, 5) : apt.scheduled_time.substring(0, 5)) : '-'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[apt.status] || 'bg-muted text-foreground'}`}>
                        {apt.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredAppointments.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Calendar className="mx-auto text-muted-foreground/75 mb-4" size={48} />
          <p className="text-muted-foreground text-lg font-medium">No appointments found</p>
          <p className="text-muted-foreground/75 text-sm mt-2">
            {vehicles?.data && vehicles.data.length > 0
              ? 'Schedule your first appointment to get started.'
              : 'Add a vehicle first, then schedule an appointment.'}
          </p>
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center items-center h-64">
          <div className="text-muted-foreground">Loading appointments...</div>
        </div>
      )}
    </div>
  )
}

