import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { customerApi } from '../services/api'
import { Calendar, DollarSign, Package, CheckCircle, XCircle, Eye, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import ServiceRecord from '../components/ServiceRecord'

export default function CustomerServices() {
  const [selectedService, setSelectedService] = useState(null)
  const [currentServiceIndex, setCurrentServiceIndex] = useState(0)
  const { data: services, isLoading, error } = useQuery({
    queryKey: ['customer-services'],
    queryFn: async () => {
      const response = await customerApi.getServices()
      // Handle different response structures
      if (Array.isArray(response.data)) {
        return response.data
      } else if (Array.isArray(response)) {
        return response
      } else {
        return []
      }
    },
  })

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-2">Something went wrong</p>
          <p className="text-muted-foreground">{error.message || 'Failed to load services'}</p>
        </div>
      </div>
    )
  }

  // Ensure services is an array
  const servicesList = Array.isArray(services) ? services : []

  // Group services by date
  const servicesByDate = useMemo(() => {
    if (!servicesList.length) return []
    
    const grouped = {}
    servicesList.forEach(service => {
      const dateKey = format(parseISO(service.service_date), 'yyyy-MM-dd')
      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }
      grouped[dateKey].push(service)
    })
    
    // Convert to array and sort by date (newest first)
    return Object.entries(grouped)
      .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
      .map(([date, services]) => ({
        date,
        formattedDate: format(parseISO(date), 'MMMM dd, yyyy'),
        services: services.sort((a, b) => new Date(b.service_date) - new Date(a.service_date))
      }))
  }, [servicesList])

  // Flatten all services for navigation
  const allServices = useMemo(() => {
    return servicesByDate.flatMap(group => group.services)
  }, [servicesByDate])

  // Get current service
  const currentService = allServices[currentServiceIndex] || null
  const currentDateGroup = servicesByDate.find(group => 
    group.services.some(s => s.service_id === currentService?.service_id)
  )

  const handlePrevious = () => {
    if (currentServiceIndex > 0) {
      setCurrentServiceIndex(currentServiceIndex - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleNext = () => {
    if (currentServiceIndex < allServices.length - 1) {
      setCurrentServiceIndex(currentServiceIndex + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <div className="h-screen flex flex-col">
      <h1 className="text-3xl font-bold text-foreground mb-6">My Services</h1>

      {selectedService ? (
        <div className="flex-1 overflow-y-auto">
          <button
            onClick={() => setSelectedService(null)}
            className="mb-4 text-primary-600 hover:text-primary-700 flex items-center space-x-2"
          >
            <XCircle size={20} />
            <span>Back to Services List</span>
          </button>
          <ServiceRecord service={selectedService} />
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Navigation Header */}
          {allServices.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handlePrevious}
                    disabled={currentServiceIndex === 0}
                    className={`p-2 rounded-lg flex items-center space-x-2 ${
                      currentServiceIndex === 0
                        ? 'bg-muted text-muted-foreground/75 cursor-not-allowed'
                        : 'bg-primary-600 text-white hover:bg-primary-700'
                    }`}
                  >
                    <ChevronLeft size={20} />
                    <span>Previous</span>
                  </button>
                  
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Service</p>
                    <p className="text-lg font-bold text-foreground">
                      {currentServiceIndex + 1} of {allServices.length}
                    </p>
                    {currentDateGroup && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {currentDateGroup.formattedDate}
                      </p>
                    )}
                  </div>
                  
                  <button
                    onClick={handleNext}
                    disabled={currentServiceIndex === allServices.length - 1}
                    className={`p-2 rounded-lg flex items-center space-x-2 ${
                      currentServiceIndex === allServices.length - 1
                        ? 'bg-muted text-muted-foreground/75 cursor-not-allowed'
                        : 'bg-primary-600 text-white hover:bg-primary-700'
                    }`}
                  >
                    <span>Next</span>
                    <ChevronRight size={20} />
                  </button>
                </div>
                
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total Services</p>
                  <p className="text-xl font-bold text-primary-600">{allServices.length}</p>
                </div>
              </div>
            </div>
          )}

          {/* Services by Date Groups */}
          {servicesByDate.length > 0 ? (
            <div className="flex-1 overflow-y-auto space-y-8 pr-2">
              {servicesByDate.map((dateGroup) => (
                <div key={dateGroup.date} className="mb-8">
                  {/* Date Header */}
                  <div className="mb-4 pb-2 border-b-2 border-primary-200">
                    <div className="flex items-center space-x-3">
                      <Calendar className="text-primary-600" size={24} />
                      <h2 className="text-2xl font-bold text-foreground">{dateGroup.formattedDate}</h2>
                      <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
                        {dateGroup.services.length} {dateGroup.services.length === 1 ? 'Service' : 'Services'}
                      </span>
                    </div>
                  </div>

                  {/* Services for this date */}
                  <div className="space-y-6">
                    {dateGroup.services.map((service) => {
                      // Only show the current service
                      if (service.service_id !== currentService?.service_id) {
                        return null
                      }
                      
                      return (
                        <div key={service.service_id} className="bg-white rounded-lg shadow-md p-6">
              {/* Header Section */}
              <div className="flex justify-between items-start mb-6 pb-4 border-b-2 border-border">
                <div>
                  <h3 className="text-2xl font-bold text-foreground">
                    {service.vehicle.make} {service.vehicle.model}
                  </h3>
                  <p className="text-muted-foreground text-lg mt-1">{service.vehicle.license_plate}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <span className="text-muted-foreground">Service Type: <span className="font-semibold text-foreground/90">{service.service_type}</span></span>
                    {service.reference_number && (
                      <span className="text-muted-foreground">REF: <span className="font-semibold text-foreground/90">{service.reference_number}</span></span>
                    )}
                    {service.branch && (
                      <span className="text-muted-foreground">Branch: <span className="font-semibold text-foreground/90">{service.branch}</span></span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-primary-600">
                    ETB {service.grand_total.toLocaleString()}
                  </p>
                  <span className={`text-sm px-3 py-1 rounded-full mt-2 inline-block font-semibold ${
                    service.payment_status === 'Paid' 
                      ? 'bg-green-100 text-green-800'
                      : service.payment_status === 'Free Service'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {service.payment_status}
                  </span>
                </div>
              </div>

              {/* Service Information Table */}
              <div className="mb-6">
                <h4 className="font-semibold text-foreground mb-3 text-lg">Service Information</h4>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-border">
                    <tbody className="text-sm">
                      <tr className="bg-muted/35">
                        <td className="border border-border px-4 py-2 font-semibold text-foreground/90 w-1/3">Service Date</td>
                        <td className="border border-border px-4 py-2 text-foreground">
                          {format(new Date(service.service_date), 'MMM dd, yyyy')}
                        </td>
                        <td className="border border-border px-4 py-2 font-semibold text-foreground/90 w-1/3">Mileage at Service</td>
                        <td className="border border-border px-4 py-2 text-foreground">
                          {service.mileage_at_service.toLocaleString()} km
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-border px-4 py-2 font-semibold text-foreground/90">Next Service Mileage</td>
                        <td className="border border-border px-4 py-2 text-foreground">
                          {service.next_service_mileage.toLocaleString()} km
                        </td>
                        <td className="border border-border px-4 py-2 font-semibold text-foreground/90">Next Service Date</td>
                        <td className="border border-border px-4 py-2 text-foreground">
                          {service.next_service_date 
                            ? format(new Date(service.next_service_date), 'MMM dd, yyyy')
                            : 'N/A'}
                        </td>
                      </tr>
                      {service.oil_type && (
                        <tr className="bg-muted/35">
                          <td className="border border-border px-4 py-2 font-semibold text-foreground/90">Oil Type</td>
                          <td className="border border-border px-4 py-2 text-foreground">{service.oil_type}</td>
                          {service.service_note && (
                            <>
                              <td className="border border-border px-4 py-2 font-semibold text-foreground/90">Service Note</td>
                              <td className="border border-border px-4 py-2 text-foreground">{service.service_note}</td>
                            </>
                          )}
                        </tr>
                      )}
                      {service.serviced_by_name && (
                        <tr>
                          <td className="border border-border px-4 py-2 font-semibold text-foreground/90">Serviced By</td>
                          <td className="border border-border px-4 py-2 text-foreground">{service.serviced_by_name}</td>
                          <td className="border border-border px-4 py-2 font-semibold text-foreground/90">Payment Method</td>
                          <td className="border border-border px-4 py-2 text-foreground">
                            {service.payment_method || 'N/A'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            {/* Service Checklist - Enhanced Table */}
            {service.checklist_items && service.checklist_items.length > 0 && (
              <div className="mb-6">
                <h4 className="font-semibold text-foreground mb-3 text-lg flex items-center space-x-2">
                  <CheckCircle size={20} />
                  <span>Service Checklist Items</span>
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-border text-sm">
                    <thead>
                      <tr className="bg-muted">
                        <th className="border border-border px-4 py-3 text-left font-semibold text-foreground/90">
                          Item Name
                        </th>
                        {service.checklist_items[0]?.item_description && (
                          <th className="border border-border px-4 py-3 text-left font-semibold text-foreground/90">
                            Description
                          </th>
                        )}
                        <th className="border border-border px-4 py-3 text-center font-semibold text-foreground/90 w-32">
                          CHECKED
                        </th>
                        <th className="border border-border px-4 py-3 text-center font-semibold text-foreground/90 w-32">
                          CHANGED
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {service.checklist_items.map((item) => (
                        <tr key={item.checklist_id} className="hover:bg-muted/45">
                          <td className="border border-border px-4 py-3 text-foreground font-medium">
                            {item.item_name}
                          </td>
                          {item.item_description && (
                            <td className="border border-border px-4 py-3 text-muted-foreground text-sm">
                              {item.item_description}
                            </td>
                          )}
                          <td className="border border-border px-4 py-3 text-center">
                            {item.checked ? (
                              <div className="flex items-center justify-center">
                                <CheckCircle className="text-green-600" size={20} />
                                <span className="ml-2 text-green-700 font-semibold">Yes</span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center">
                                <XCircle className="text-muted-foreground/35" size={20} />
                                <span className="ml-2 text-muted-foreground/75">No</span>
                              </div>
                            )}
                          </td>
                          <td className="border border-border px-4 py-3 text-center">
                            {item.changed ? (
                              <div className="flex items-center justify-center">
                                <CheckCircle className="text-green-600" size={20} />
                                <span className="ml-2 text-green-700 font-semibold">Yes</span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center">
                                <XCircle className="text-muted-foreground/35" size={20} />
                                <span className="ml-2 text-muted-foreground/75">No</span>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Parts Used - Table Format */}
            {service.parts && service.parts.length > 0 && (
              <div className="mb-6">
                <h4 className="font-semibold text-foreground mb-3 text-lg flex items-center space-x-2">
                  <Package size={20} />
                  <span>Parts Used</span>
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-border text-sm">
                    <thead>
                      <tr className="bg-muted">
                        <th className="border border-border px-4 py-3 text-left font-semibold text-foreground/90">
                          Part Name
                        </th>
                        <th className="border border-border px-4 py-3 text-left font-semibold text-foreground/90">
                          Part Code
                        </th>
                        <th className="border border-border px-4 py-3 text-center font-semibold text-foreground/90">
                          Quantity
                        </th>
                        <th className="border border-border px-4 py-3 text-right font-semibold text-foreground/90">
                          Unit Price
                        </th>
                        <th className="border border-border px-4 py-3 text-right font-semibold text-foreground/90">
                          Total Price
                        </th>
                        <th className="border border-border px-4 py-3 text-center font-semibold text-foreground/90">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {service.parts.map((part, index) => (
                        <tr 
                          key={index} 
                          className={`hover:bg-muted/45 ${
                            part.was_replaced ? 'bg-green-50' : 'bg-muted/35'
                          }`}
                        >
                          <td className="border border-border px-4 py-3 text-foreground font-medium">
                            {part.part_name}
                          </td>
                          <td className="border border-border px-4 py-3 text-muted-foreground">
                            {part.part_code}
                          </td>
                          <td className="border border-border px-4 py-3 text-center text-foreground">
                            {part.quantity}
                          </td>
                          <td className="border border-border px-4 py-3 text-right text-foreground">
                            ETB {part.unit_price.toLocaleString()}
                          </td>
                          <td className="border border-border px-4 py-3 text-right font-semibold text-foreground">
                            {part.was_replaced ? (
                              <span className="text-green-700">ETB {part.total_price.toLocaleString()}</span>
                            ) : (
                              <span className="text-muted-foreground/75">-</span>
                            )}
                          </td>
                          <td className="border border-border px-4 py-3 text-center">
                            {part.was_replaced ? (
                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                                Replaced
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-muted text-muted-foreground rounded-full text-xs font-semibold">
                                Inspected
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Cost Breakdown - Table Format */}
            <div className="mb-6">
              <h4 className="font-semibold text-foreground mb-3 text-lg flex items-center space-x-2">
                <DollarSign size={20} />
                <span>Financial Breakdown</span>
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-border text-sm">
                  <tbody>
                    <tr className="bg-muted/35">
                      <td className="border border-border px-4 py-3 font-semibold text-foreground/90 w-1/2">
                        Labor Cost
                      </td>
                      <td className="border border-border px-4 py-3 text-right text-foreground font-semibold">
                        ETB {service.total_labor_cost.toLocaleString()}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-border px-4 py-3 font-semibold text-foreground/90">
                        Parts Cost
                      </td>
                      <td className="border border-border px-4 py-3 text-right text-foreground font-semibold">
                        ETB {service.total_parts_cost.toLocaleString()}
                      </td>
                    </tr>
                    {service.discount_amount > 0 && (
                      <tr className="bg-green-50">
                        <td className="border border-border px-4 py-3 font-semibold text-green-700">
                          Discount
                        </td>
                        <td className="border border-border px-4 py-3 text-right text-green-700 font-semibold">
                          -ETB {service.discount_amount.toLocaleString()}
                        </td>
                      </tr>
                    )}
                    <tr className="bg-muted/35">
                      <td className="border border-border px-4 py-3 font-semibold text-foreground/90">
                        Tax ({service.tax_amount > 0 ? '15%' : '0%'})
                      </td>
                      <td className="border border-border px-4 py-3 text-right text-foreground font-semibold">
                        ETB {service.tax_amount.toLocaleString()}
                      </td>
                    </tr>
                    <tr className="bg-primary-50 border-2 border-primary-300">
                      <td className="border border-primary-300 px-4 py-3 font-bold text-foreground text-lg">
                        Grand Total
                      </td>
                      <td className="border border-primary-300 px-4 py-3 text-right font-bold text-primary-700 text-lg">
                        ETB {service.grand_total.toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mechanic Notes */}
            {service.mechanic_notes && (
              <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">Mechanic Notes</h4>
                <p className="text-sm text-blue-700">{service.mechanic_notes}</p>
              </div>
            )}

            {/* View Full Record Button */}
            <div className="flex justify-end pt-4 border-t border-border">
              <button
                onClick={() => setSelectedService(service)}
                className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 flex items-center space-x-2 font-semibold"
              >
                <Eye size={18} />
                <span>View Full Detailed Record</span>
              </button>
            </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-muted-foreground text-lg">No services found</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

