import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { servicesApi } from '../services/api'
import { format } from 'date-fns'
import { ChevronDown, ChevronUp, Wrench, DollarSign, Calendar, MapPin, User, FileText, Star } from 'lucide-react'

export default function Services() {
  const [expandedRows, setExpandedRows] = useState(new Set())
  const { data: services, isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: () => servicesApi.getAll(),
  })

  const toggleRow = (serviceId) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(serviceId)) {
      newExpanded.delete(serviceId)
    } else {
      newExpanded.add(serviceId)
    }
    setExpandedRows(newExpanded)
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Services</h1>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700 w-12"></th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Service ID</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Service Type</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Vehicle</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Mileage</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Reference</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Branch</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Total</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {services?.data?.map((service) => {
                const isExpanded = expandedRows.has(service.service_id)
                return (
                  <>
                    <tr 
                      key={service.service_id} 
                      className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                      onClick={() => toggleRow(service.service_id)}
                    >
                      <td className="py-3 px-4">
                        {isExpanded ? (
                          <ChevronUp size={18} className="text-gray-500" />
                        ) : (
                          <ChevronDown size={18} className="text-gray-500" />
                        )}
                      </td>
                      <td className="py-3 px-4 font-semibold">#{service.service_id}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <Wrench size={16} className="text-gray-400" />
                          <span>{service.service_type || '-'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {service.vehicle ? (
                          <div>
                            <div className="font-medium">
                              {service.vehicle.license_plate || `${service.vehicle.make || ''} ${service.vehicle.model || ''}`.trim()}
                            </div>
                            {service.vehicle.make && service.vehicle.model && (
                              <div className="text-xs text-gray-500">
                                {service.vehicle.make} {service.vehicle.model} {service.vehicle.year ? `(${service.vehicle.year})` : ''}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <Calendar size={14} className="text-gray-400" />
                          <span>{format(new Date(service.service_date), 'MMM dd, yyyy')}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">{parseFloat(service.mileage_at_service).toLocaleString()} km</td>
                      <td className="py-3 px-4">
                        {service.reference_number ? (
                          <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                            {service.reference_number}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {service.branch ? (
                          <div className="flex items-center space-x-1">
                            <MapPin size={14} className="text-gray-400" />
                            <span className="text-sm">{service.branch}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-semibold">
                        <div className="flex items-center space-x-1">
                          <DollarSign size={16} className="text-green-600" />
                          <span>ETB {parseFloat(service.grand_total).toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            service.payment_status === 'Paid'
                              ? 'bg-green-100 text-green-800'
                              : service.payment_status === 'Free Service'
                              ? 'bg-purple-100 text-purple-800'
                              : service.payment_status === 'Partial'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {service.payment_status || 'Pending'}
                        </span>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-gray-50">
                        <td colSpan={10} className="px-4 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Service Details */}
                            <div>
                              <h4 className="font-semibold text-gray-700 mb-3 flex items-center space-x-2">
                                <Wrench size={16} />
                                <span>Service Details</span>
                              </h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Service Type:</span>
                                  <span className="font-medium">{service.service_type || '-'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Service Date:</span>
                                  <span className="font-medium">
                                    {format(new Date(service.service_date), 'MMM dd, yyyy')}
                                  </span>
                                </div>
                                {service.next_service_date && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Next Service:</span>
                                    <span className="font-medium">
                                      {format(new Date(service.next_service_date), 'MMM dd, yyyy')}
                                    </span>
                                  </div>
                                )}
                                {service.next_service_mileage && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Next Mileage:</span>
                                    <span className="font-medium">
                                      {parseFloat(service.next_service_mileage).toLocaleString()} km
                                    </span>
                                  </div>
                                )}
                                {service.oil_type && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Oil Type:</span>
                                    <span className="font-medium">{service.oil_type}</span>
                                  </div>
                                )}
                                {service.service_note && (
                                  <div>
                                    <span className="text-gray-600">Note:</span>
                                    <p className="font-medium mt-1">{service.service_note}</p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Financial Breakdown */}
                            <div>
                              <h4 className="font-semibold text-gray-700 mb-3 flex items-center space-x-2">
                                <DollarSign size={16} />
                                <span>Financial Breakdown</span>
                              </h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Labor Cost:</span>
                                  <span className="font-medium">
                                    ETB {parseFloat(service.total_labor_cost || 0).toLocaleString()}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Parts Cost:</span>
                                  <span className="font-medium">
                                    ETB {parseFloat(service.total_parts_cost || 0).toLocaleString()}
                                  </span>
                                </div>
                                {service.discount_amount > 0 && (
                                  <div className="flex justify-between text-red-600">
                                    <span>Discount:</span>
                                    <span className="font-medium">
                                      -ETB {parseFloat(service.discount_amount).toLocaleString()}
                                    </span>
                                  </div>
                                )}
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Tax (15%):</span>
                                  <span className="font-medium">
                                    ETB {parseFloat(service.tax_amount || 0).toLocaleString()}
                                  </span>
                                </div>
                                <div className="flex justify-between pt-2 border-t border-gray-200">
                                  <span className="font-semibold text-gray-700">Grand Total:</span>
                                  <span className="font-bold text-lg text-green-600">
                                    ETB {parseFloat(service.grand_total).toLocaleString()}
                                  </span>
                                </div>
                                {service.payment_method && (
                                  <div className="flex justify-between mt-2">
                                    <span className="text-gray-600">Payment Method:</span>
                                    <span className="font-medium">{service.payment_method}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Additional Information */}
                            <div>
                              <h4 className="font-semibold text-gray-700 mb-3 flex items-center space-x-2">
                                <FileText size={16} />
                                <span>Additional Information</span>
                              </h4>
                              <div className="space-y-2 text-sm">
                                {service.serviced_by_name && (
                                  <div className="flex items-center space-x-2">
                                    <User size={14} className="text-gray-400" />
                                    <div>
                                      <span className="text-gray-600">Serviced By:</span>
                                      <span className="font-medium ml-2">{service.serviced_by_name}</span>
                                    </div>
                                  </div>
                                )}
                                {service.branch && (
                                  <div className="flex items-center space-x-2">
                                    <MapPin size={14} className="text-gray-400" />
                                    <div>
                                      <span className="text-gray-600">Branch:</span>
                                      <span className="font-medium ml-2">{service.branch}</span>
                                    </div>
                                  </div>
                                )}
                                {service.reference_number && (
                                  <div>
                                    <span className="text-gray-600">Reference:</span>
                                    <span className="font-mono font-medium ml-2 bg-gray-100 px-2 py-1 rounded">
                                      {service.reference_number}
                                    </span>
                                  </div>
                                )}
                                {service.rating && (
                                  <div className="flex items-center space-x-2">
                                    <Star size={14} className="text-yellow-500 fill-yellow-500" />
                                    <div>
                                      <span className="text-gray-600">Rating:</span>
                                      <span className="font-medium ml-2">
                                        {service.rating}/5
                                      </span>
                                    </div>
                                  </div>
                                )}
                                {service.mechanic_notes && (
                                  <div className="mt-3">
                                    <span className="text-gray-600 block mb-1">Mechanic Notes:</span>
                                    <p className="text-gray-800 bg-gray-100 p-2 rounded text-xs">
                                      {service.mechanic_notes}
                                    </p>
                                  </div>
                                )}
                                {service.customer_feedback && (
                                  <div className="mt-3">
                                    <span className="text-gray-600 block mb-1">Customer Feedback:</span>
                                    <p className="text-gray-800 bg-blue-50 p-2 rounded text-xs">
                                      {service.customer_feedback}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
          </table>
          {(!services?.data || services.data.length === 0) && (
            <div className="text-center py-12 text-gray-500">
              <Wrench size={48} className="mx-auto mb-4 text-gray-400" />
              <p>No services found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
