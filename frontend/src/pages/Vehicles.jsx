import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { vehiclesApi, customersApi } from '../services/api'
import { Plus, Search, Car } from 'lucide-react'
import AddVehicleModal from '../components/AddVehicleModal'

export default function Vehicles() {
  const [searchTerm, setSearchTerm] = useState('')
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false)
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [vehicleError, setVehicleError] = useState(null)
  const queryClient = useQueryClient()

  const { data: vehicles, isLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => vehiclesApi.getAll(),
  })
  const { data: customersData, isLoading: isCustomersLoading } = useQuery({
    queryKey: ['customers', { for: 'vehiclesPage' }],
    queryFn: () => customersApi.getAll(),
  })

  const customers = useMemo(() => customersData?.data || [], [customersData])

  const createVehicleMutation = useMutation({
    mutationFn: (data) => vehiclesApi.create(data),
    onSuccess: async () => {
      setVehicleError(null)
      setIsVehicleModalOpen(false)
      await queryClient.invalidateQueries({ queryKey: ['vehicles'] })
    },
    onError: (error) => {
      setVehicleError(error.response?.data?.detail || 'Failed to add vehicle')
    },
  })

  const filteredVehicles = vehicles?.data?.filter((vehicle) =>
    vehicle.license_plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${vehicle.make} ${vehicle.model}`.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Vehicles</h1>
        <button
          type="button"
          onClick={() => {
            setVehicleError(null)
            setIsVehicleModalOpen(true)
          }}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Add Vehicle</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Default Customer for New Vehicle</label>
        <select
          className="w-full md:w-[420px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          value={selectedCustomerId}
          onChange={(e) => setSelectedCustomerId(e.target.value)}
        >
          <option value="">{isCustomersLoading ? 'Loading customers...' : 'Select customer...'}</option>
          {customers.map((c) => (
            <option key={c.customer_id} value={String(c.customer_id)}>
              {`${c.first_name || ''} ${c.last_name || ''}`.trim()} (#{c.customer_id})
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search vehicles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVehicles.map((vehicle) => (
            <div key={vehicle.vehicle_id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-3 mb-3">
                <div className="bg-primary-100 p-3 rounded-full">
                  <Car className="text-primary-600" size={24} />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{vehicle.make} {vehicle.model}</p>
                  <p className="text-sm text-gray-600">{vehicle.license_plate}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Year:</span>
                  <span className="font-medium">{vehicle.year}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Mileage:</span>
                  <span className="font-medium">{parseFloat(vehicle.current_mileage).toLocaleString()} km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Next Service:</span>
                  <span className="font-medium">{parseFloat(vehicle.next_service_mileage).toLocaleString()} km</span>
                </div>
                {vehicle.fuel_type && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fuel:</span>
                    <span className="font-medium">{vehicle.fuel_type}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <AddVehicleModal
        isOpen={isVehicleModalOpen}
        onClose={() => {
          setIsVehicleModalOpen(false)
          setVehicleError(null)
        }}
        onSave={(data) => {
          const cid = Number(selectedCustomerId || data.customer_id)
          if (!Number.isFinite(cid) || cid <= 0) {
            setVehicleError('Please select a customer before adding vehicle.')
            return
          }
          setVehicleError(null)
          createVehicleMutation.mutate({ ...data, customer_id: cid })
        }}
        customerId={Number(selectedCustomerId) || null}
        isLoading={createVehicleMutation.isPending}
        error={vehicleError}
      />
    </div>
  )
}

