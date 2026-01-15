import { useQuery } from '@tanstack/react-query'
import { customerApi } from '../services/api'
import { Car, Wrench, DollarSign, Calendar, AlertTriangle, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function CustomerDashboard() {
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['customer-summary'],
    queryFn: () => customerApi.getSummary(),
    refetchInterval: 30000, // Refetch every 30 seconds to catch admin-added vehicles
  })

  const { data: services, isLoading: servicesLoading } = useQuery({
    queryKey: ['customer-services'],
    queryFn: () => customerApi.getServices(),
  })

  if (summaryLoading || servicesLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  const dueServices = summary?.data?.next_services?.filter(s => s.is_due) || []

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            My Dashboard
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Welcome back! Here's your service overview.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-card rounded-xl shadow-sm border p-4 sm:p-6 hover:shadow-md transition-all duration-200 group">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-muted-foreground text-xs sm:text-sm font-medium">Total Payments</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold mt-2 text-foreground">
                ETB {summary?.data?.total_payments?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="ml-4 p-3 rounded-lg bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
              <DollarSign className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl shadow-sm border p-4 sm:p-6 hover:shadow-md transition-all duration-200 group">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-muted-foreground text-xs sm:text-sm font-medium">Vehicles</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold mt-2 text-foreground">
                {summary?.data?.vehicles_count || 0}
              </p>
            </div>
            <div className="ml-4 p-3 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
              <Car className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl shadow-sm border p-4 sm:p-6 hover:shadow-md transition-all duration-200 group">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-muted-foreground text-xs sm:text-sm font-medium">Total Services</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold mt-2 text-foreground">
                {summary?.data?.total_services || 0}
              </p>
            </div>
            <div className="ml-4 p-3 rounded-lg bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
              <Wrench className="text-purple-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl shadow-sm border p-4 sm:p-6 hover:shadow-md transition-all duration-200 group border-red-200/50">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-muted-foreground text-xs sm:text-sm font-medium">Services Due</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold mt-2 text-red-600">
                {dueServices.length}
              </p>
            </div>
            <div className="ml-4 p-3 rounded-lg bg-red-500/10 group-hover:bg-red-500/20 transition-colors">
              <AlertTriangle className="text-red-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* No Vehicles Prompt */}
      {summary?.data?.vehicles_count === 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 rounded-xl p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-lg sm:text-xl font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <Car size={24} className="text-blue-600" />
                <span>Add Your First Vehicle</span>
              </h2>
              <p className="text-blue-700/80 text-sm sm:text-base">
                Start by adding your vehicle to track services and maintenance.
              </p>
            </div>
            <Link
              to="/customer/vehicles"
              className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 flex items-center justify-center gap-2 font-medium shadow-md hover:shadow-lg transition-all duration-200 whitespace-nowrap"
            >
              <Plus size={20} />
              <span>Add Vehicle</span>
            </Link>
          </div>
        </div>
      )}

      {/* Next Services Due */}
      {dueServices.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-red-800 mb-4 flex items-center space-x-2">
            <AlertTriangle size={24} />
            <span>Services Due Soon</span>
          </h2>
          <div className="space-y-3">
            {dueServices.map((service, index) => (
              <div key={index} className="bg-white rounded-lg p-4">
                <p className="font-semibold text-gray-800">{service.vehicle}</p>
                <p className="text-sm text-gray-600">
                  {service.remaining_km.toLocaleString()} km remaining until next service
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Next service at: {service.next_service_mileage.toLocaleString()} km
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Services */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Recent Services</h2>
          <Link to="/customer/services" className="text-primary-600 hover:text-primary-700 text-sm">
            View All
          </Link>
        </div>
        <div className="space-y-4">
          {services?.data?.slice(0, 5).map((service) => (
            <div key={service.service_id} className="border-b border-gray-200 pb-4 last:border-0">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-gray-800">
                    {service.vehicle.make} {service.vehicle.model} ({service.vehicle.license_plate})
                  </p>
                  <p className="text-sm text-gray-600">{service.service_type}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(service.service_date).toLocaleDateString()} • 
                    {service.mileage_at_service.toLocaleString()} km
                  </p>
                  {service.parts.length > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      Parts: {service.parts.filter(p => p.was_replaced).length} replaced
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-800">
                    ETB {service.grand_total.toLocaleString()}
                  </p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    service.payment_status === 'Paid' 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {service.payment_status}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {(!services?.data || services.data.length === 0) && (
            <p className="text-gray-500 text-center py-8">No services yet</p>
          )}
        </div>
      </div>
    </div>
  )
}

