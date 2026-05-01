import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { vehiclesApi, customersApi } from '../services/api'
import { Plus, Search, Car } from 'lucide-react'
import AddVehicleModal from '../components/AddVehicleModal'
import { PageHeader, PageLoading } from '@/components/PageChrome'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

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
    return <PageLoading label="Loading vehicles…" />
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Fleet"
        title="Vehicles"
        description="Search the registered fleet, pick a default customer for quick adds, and open the modal to register a new vehicle."
        actions={
          <Button
            type="button"
            className="gap-2 shadow-md shadow-primary/15"
            onClick={() => {
              setVehicleError(null)
              setIsVehicleModalOpen(true)
            }}
          >
            <Plus size={20} />
            Add vehicle
          </Button>
        }
      />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Default customer</CardTitle>
          <CardDescription>Used when adding a vehicle from the modal.</CardDescription>
        </CardHeader>
        <CardContent>
          <select
            className="flex h-11 w-full max-w-md rounded-xl border border-input bg-background px-4 text-sm shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/30 md:w-[420px]"
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Fleet directory</CardTitle>
          <CardDescription>Filter by plate, make, or model.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="relative max-w-lg">
            <Search className="absolute left-3 top-1/2 z-[1] -translate-y-1/2 text-muted-foreground/75" size={20} />
            <Input
              type="text"
              placeholder="Search vehicles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredVehicles.map((vehicle) => (
            <div key={vehicle.vehicle_id} className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-3 mb-3">
                <div className="bg-primary-100 p-3 rounded-full">
                  <Car className="text-primary-600" size={24} />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{vehicle.make} {vehicle.model}</p>
                  <p className="text-sm text-muted-foreground">{vehicle.license_plate}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Year:</span>
                  <span className="font-medium">{vehicle.year}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mileage:</span>
                  <span className="font-medium">{parseFloat(vehicle.current_mileage).toLocaleString()} km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Next Service:</span>
                  <span className="font-medium">{parseFloat(vehicle.next_service_mileage).toLocaleString()} km</span>
                </div>
                {vehicle.fuel_type && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fuel:</span>
                    <span className="font-medium">{vehicle.fuel_type}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        </CardContent>
      </Card>

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

