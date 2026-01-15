import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminCustomersApi, serviceTypesApi, vehiclesApi } from '../services/api'
import { ArrowLeft, Plus, Car, Wrench, DollarSign, CheckCircle, Eye } from 'lucide-react'
import { Link } from 'react-router-dom'
import AddVehicleModal from '../components/AddVehicleModal'
import ServiceDetailsModal from '../components/ServiceDetailsModal'

export default function AdminCustomerDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false)
  const [selectedServiceId, setSelectedServiceId] = useState(null)
  const [successMessage, setSuccessMessage] = useState('')
  const queryClient = useQueryClient()

  const { data: customer, isLoading } = useQuery({
    queryKey: ['admin-customer', id],
    queryFn: () => adminCustomersApi.getFullDetails(id),
  })

  const { data: serviceTypes } = useQuery({
    queryKey: ['service-types'],
    queryFn: () => serviceTypesApi.getAll(),
  })

  const [vehicleError, setVehicleError] = useState(null)

  const createVehicleMutation = useMutation({
    mutationFn: (data) => vehiclesApi.create(data),
    onSuccess: () => {
      setSuccessMessage('Vehicle added successfully!')
      setVehicleError(null)
      queryClient.invalidateQueries(['admin-customer', id])
      setIsVehicleModalOpen(false)
      setTimeout(() => setSuccessMessage(''), 3000)
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.detail || 'Failed to add vehicle.'
      setVehicleError(errorMessage)
      console.error('Error adding vehicle:', error)
    },
  })

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>
  }

  return (
    <div>
      {successMessage && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center space-x-2">
          <CheckCircle size={20} />
          <span>{successMessage}</span>
        </div>
      )}
      <div className="flex items-center space-x-4 mb-6">
        <button
          onClick={() => navigate('/customers')}
          className="text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            {customer?.data?.customer?.first_name} {customer?.data?.customer?.last_name}
          </h1>
          <p className="text-gray-600">{customer?.data?.customer?.email}</p>
        </div>
      </div>

      {/* Customer Info */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Customer Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Phone</p>
            <p className="font-semibold">{customer?.data?.customer?.phone}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">City</p>
            <p className="font-semibold">{customer?.data?.customer?.city || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Payments</p>
            <p className="font-semibold text-green-600">
              ETB {customer?.data?.total_payments?.toLocaleString() || '0'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Services</p>
            <p className="font-semibold">{customer?.data?.total_services || 0}</p>
          </div>
        </div>
        
        {/* Loyalty Information */}
        {customer?.data?.loyalty && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold mb-3 text-primary-600">Loyalty Program</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Loyalty Number</p>
                <p className="font-bold text-primary-600 text-xl">
                  #{customer.data.loyalty.loyalty_id.toString().padStart(6, '0')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Consecutive Services</p>
                <p className="font-semibold text-gray-800">
                  {customer.data.loyalty.consecutive_count} / {customer.data.loyalty.services_required}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {customer.data.loyalty.services_needed} more for free service
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Free Services</p>
                <p className="font-semibold text-gray-800">
                  Earned: {customer.data.loyalty.free_services_earned} | 
                  Used: {customer.data.loyalty.free_services_used}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                {customer.data.loyalty.free_service_available ? (
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                    Free Service Available
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-semibold">
                    In Progress
                  </span>
                )}
              </div>
            </div>
            {customer.data.loyalty.total_services >= 3 && customer.data.loyalty.total_services % 4 === 0 && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">Next Service Benefit:</span> Free labor cost - only replacement material charges apply
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Vehicles */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center space-x-2">
            <Car size={24} />
            <span>Vehicles ({customer?.data?.vehicles?.length || 0})</span>
          </h2>
          <button
            onClick={() => setIsVehicleModalOpen(true)}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center space-x-2"
          >
            <Plus size={18} />
            <span>Add Vehicle</span>
          </button>
        </div>
        <div className="space-y-3">
          {customer?.data?.vehicles && customer.data.vehicles.length > 0 ? (
            customer.data.vehicles.map((vehicle) => (
            <div key={vehicle.vehicle_id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-gray-800">
                    {vehicle.make} {vehicle.model} ({vehicle.year})
                  </p>
                  <p className="text-sm text-gray-600">License: {vehicle.license_plate}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Current: {vehicle.current_mileage.toLocaleString()} km • 
                    Next: {vehicle.next_service_mileage.toLocaleString()} km
                  </p>
                </div>
                <Link
                  to={`/admin/customers/${id}/add-service?vehicle_id=${vehicle.vehicle_id}`}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center space-x-2"
                >
                  <Plus size={18} />
                  <span>Add Service</span>
                </Link>
              </div>
            </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Car className="mx-auto mb-2 text-gray-400" size={32} />
              <p>No vehicles added yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Vehicle Modal */}
      <AddVehicleModal
        isOpen={isVehicleModalOpen}
        onClose={() => {
          setIsVehicleModalOpen(false)
          setVehicleError(null)
        }}
        onSave={(data) => {
          setVehicleError(null)
          createVehicleMutation.mutate(data)
        }}
        customerId={parseInt(id)}
        isLoading={createVehicleMutation.isLoading}
        error={vehicleError}
      />

      {/* Service Details Modal */}
      <ServiceDetailsModal
        isOpen={!!selectedServiceId}
        onClose={() => setSelectedServiceId(null)}
        customerId={parseInt(id)}
        serviceId={selectedServiceId}
      />

      {/* Services */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
          <Wrench size={24} />
          <span>Services ({customer?.data?.services?.length || 0})</span>
        </h2>
        <div className="space-y-3">
          {customer?.data?.services?.map((service) => (
            <div 
              key={service.service_id} 
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => setSelectedServiceId(service.service_id)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">{service.service_type}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(service.service_date).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right flex items-center gap-3">
                  <div>
                    <p className="font-semibold text-gray-800">
                      ETB {service.grand_total.toLocaleString()}
                    </p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      service.payment_status === 'Paid'
                        ? 'bg-green-100 text-green-800'
                        : service.payment_status === 'Free Service'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {service.payment_status}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedServiceId(service.service_id)
                    }}
                    className="bg-primary-600 text-white px-3 py-2 rounded-lg hover:bg-primary-700 flex items-center space-x-2 text-sm"
                  >
                    <Eye size={16} />
                    <span>View Details</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
          {(!customer?.data?.services || customer.data.services.length === 0) && (
            <div className="text-center py-8 text-gray-500">
              <Wrench className="mx-auto mb-2 text-gray-400" size={32} />
              <p>No services found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

