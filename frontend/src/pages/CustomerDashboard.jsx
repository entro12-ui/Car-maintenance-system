import { useQuery } from '@tanstack/react-query'
import { customerApi } from '../services/api'
import { Car, Wrench, DollarSign, Calendar, AlertTriangle, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import LoadingSpinner from '@/components/LoadingSpinner'

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
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border/80 bg-card/40 py-16">
        <LoadingSpinner size="lg" />
        <p className="text-sm font-medium text-muted-foreground">Loading your dashboard…</p>
      </div>
    )
  }

  const dueServices = summary?.data?.next_services?.filter(s => s.is_due) || []

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
            My dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            Welcome back — here&apos;s your service overview.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="group rounded-2xl border border-border/70 bg-card p-4 shadow-sm transition-all duration-300 hover:border-primary/20 hover:shadow-md hover:shadow-primary/[0.06] sm:p-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-muted-foreground sm:text-sm">Total payments</p>
              <p className="mt-2 font-display text-xl font-bold text-foreground sm:text-2xl lg:text-3xl">
                ETB {summary?.data?.total_payments?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="ml-4 rounded-xl bg-emerald-500/12 p-3 transition-colors group-hover:bg-emerald-500/18">
              <DollarSign className="text-emerald-600" size={24} strokeWidth={2} />
            </div>
          </div>
        </div>

        <div className="group rounded-2xl border border-border/70 bg-card p-4 shadow-sm transition-all duration-300 hover:border-primary/20 hover:shadow-md hover:shadow-primary/[0.06] sm:p-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-muted-foreground sm:text-sm">Vehicles</p>
              <p className="mt-2 font-display text-xl font-bold text-foreground sm:text-2xl lg:text-3xl">
                {summary?.data?.vehicles_count || 0}
              </p>
            </div>
            <div className="ml-4 rounded-xl bg-teal-500/12 p-3 transition-colors group-hover:bg-teal-500/18">
              <Car className="text-teal-600" size={24} strokeWidth={2} />
            </div>
          </div>
        </div>

        <div className="group rounded-2xl border border-border/70 bg-card p-4 shadow-sm transition-all duration-300 hover:border-primary/20 hover:shadow-md hover:shadow-primary/[0.06] sm:p-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-muted-foreground sm:text-sm">Total services</p>
              <p className="mt-2 font-display text-xl font-bold text-foreground sm:text-2xl lg:text-3xl">
                {summary?.data?.total_services || 0}
              </p>
            </div>
            <div className="ml-4 rounded-xl bg-violet-500/12 p-3 transition-colors group-hover:bg-violet-500/18">
              <Wrench className="text-violet-600" size={24} strokeWidth={2} />
            </div>
          </div>
        </div>

        <div className="group rounded-2xl border border-rose-200/60 bg-card p-4 shadow-sm ring-1 ring-rose-500/10 transition-all duration-300 hover:shadow-md sm:p-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-muted-foreground sm:text-sm">Services due</p>
              <p className="mt-2 font-display text-xl font-bold text-rose-600 sm:text-2xl lg:text-3xl">
                {dueServices.length}
              </p>
            </div>
            <div className="ml-4 rounded-xl bg-rose-500/12 p-3 transition-colors group-hover:bg-rose-500/18">
              <AlertTriangle className="text-rose-600" size={24} strokeWidth={2} />
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
                <p className="font-semibold text-foreground">{service.vehicle}</p>
                <p className="text-sm text-muted-foreground">
                  {service.remaining_km.toLocaleString()} km remaining until next service
                </p>
                <p className="text-sm text-muted-foreground mt-1">
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
            <div key={service.service_id} className="border-b border-border pb-4 last:border-0">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-foreground">
                    {service.vehicle.make} {service.vehicle.model} ({service.vehicle.license_plate})
                  </p>
                  <p className="text-sm text-muted-foreground">{service.service_type}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(service.service_date).toLocaleDateString()} • 
                    {service.mileage_at_service.toLocaleString()} km
                  </p>
                  {service.parts.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Parts: {service.parts.filter(p => p.was_replaced).length} replaced
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-semibold text-foreground">
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
            <p className="text-muted-foreground text-center py-8">No services yet</p>
          )}
        </div>
      </div>
    </div>
  )
}

