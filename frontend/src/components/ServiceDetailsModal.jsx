import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { X, CheckCircle, XCircle, Package, DollarSign } from 'lucide-react'
import { format } from 'date-fns'
import { adminCustomersApi } from '../services/api'

export default function ServiceDetailsModal({ isOpen, onClose, customerId, serviceId }) {
  const { data: response, isLoading } = useQuery({
    queryKey: ['service-details', customerId, serviceId],
    queryFn: () => adminCustomersApi.getServiceDetails(customerId, serviceId),
    enabled: isOpen && !!customerId && !!serviceId,
  })

  // Handle different response structures
  const service = response?.data || response

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto my-8">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b-2 border-gray-300 px-6 py-4 flex justify-between items-center z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Service Details</h2>
            <p className="text-sm text-gray-600 mt-1">
              {service?.vehicle?.make} {service?.vehicle?.model} - {service?.vehicle?.license_plate}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-gray-500">Loading service details...</p>
            </div>
          ) : service ? (
            <>
              {/* Header Section */}
              <div className="flex justify-between items-start mb-6 pb-4 border-b-2 border-gray-200">
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">{service.service_type}</h3>
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    {service.reference_number && (
                      <span className="text-gray-500">REF: <span className="font-semibold text-gray-700">{service.reference_number}</span></span>
                    )}
                    {service.branch && (
                      <span className="text-gray-500">Branch: <span className="font-semibold text-gray-700">{service.branch}</span></span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-primary-600">
                    ETB {(service.grand_total || 0).toLocaleString()}
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
                <h4 className="font-semibold text-gray-800 mb-3 text-lg">Service Information</h4>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <tbody className="text-sm">
                      <tr className="bg-gray-50">
                        <td className="border border-gray-300 px-4 py-2 font-semibold text-gray-700 w-1/3">Service Date</td>
                        <td className="border border-gray-300 px-4 py-2 text-gray-800">
                          {format(new Date(service.service_date), 'MMM dd, yyyy')}
                        </td>
                        <td className="border border-gray-300 px-4 py-2 font-semibold text-gray-700 w-1/3">Mileage at Service</td>
                        <td className="border border-gray-300 px-4 py-2 text-gray-800">
                          {(service.mileage_at_service || 0).toLocaleString()} km
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-4 py-2 font-semibold text-gray-700">Next Service Mileage</td>
                        <td className="border border-gray-300 px-4 py-2 text-gray-800">
                          {(service.next_service_mileage || 0).toLocaleString()} km
                        </td>
                        <td className="border border-gray-300 px-4 py-2 font-semibold text-gray-700">Next Service Date</td>
                        <td className="border border-gray-300 px-4 py-2 text-gray-800">
                          {service.next_service_date 
                            ? format(new Date(service.next_service_date), 'MMM dd, yyyy')
                            : 'N/A'}
                        </td>
                      </tr>
                      {service.oil_type && (
                        <tr className="bg-gray-50">
                          <td className="border border-gray-300 px-4 py-2 font-semibold text-gray-700">Oil Type</td>
                          <td className="border border-gray-300 px-4 py-2 text-gray-800">{service.oil_type}</td>
                          {service.service_note && (
                            <>
                              <td className="border border-gray-300 px-4 py-2 font-semibold text-gray-700">Service Note</td>
                              <td className="border border-gray-300 px-4 py-2 text-gray-800">{service.service_note}</td>
                            </>
                          )}
                        </tr>
                      )}
                      {service.serviced_by_name && (
                        <tr>
                          <td className="border border-gray-300 px-4 py-2 font-semibold text-gray-700">Serviced By</td>
                          <td className="border border-gray-300 px-4 py-2 text-gray-800">{service.serviced_by_name}</td>
                          <td className="border border-gray-300 px-4 py-2 font-semibold text-gray-700">Payment Method</td>
                          <td className="border border-gray-300 px-4 py-2 text-gray-800">
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
                  <h4 className="font-semibold text-gray-800 mb-3 text-lg flex items-center space-x-2">
                    <CheckCircle size={20} />
                    <span>Service Checklist Items</span>
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300 text-sm">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">
                            Item Name
                          </th>
                          {service.checklist_items[0]?.item_description && (
                            <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">
                              Description
                            </th>
                          )}
                          <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-700 w-32">
                            CHECKED
                          </th>
                          <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-700 w-32">
                            CHANGED
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {service.checklist_items.map((item) => (
                          <tr key={item.checklist_id} className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-4 py-3 text-gray-800 font-medium">
                              {item.item_name}
                            </td>
                            {item.item_description && (
                              <td className="border border-gray-300 px-4 py-3 text-gray-600 text-sm">
                                {item.item_description}
                              </td>
                            )}
                            <td className="border border-gray-300 px-4 py-3 text-center">
                              {item.checked ? (
                                <div className="flex items-center justify-center">
                                  <CheckCircle className="text-green-600" size={20} />
                                  <span className="ml-2 text-green-700 font-semibold">Yes</span>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center">
                                  <XCircle className="text-gray-300" size={20} />
                                  <span className="ml-2 text-gray-400">No</span>
                                </div>
                              )}
                            </td>
                            <td className="border border-gray-300 px-4 py-3 text-center">
                              {item.changed ? (
                                <div className="flex items-center justify-center">
                                  <CheckCircle className="text-green-600" size={20} />
                                  <span className="ml-2 text-green-700 font-semibold">Yes</span>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center">
                                  <XCircle className="text-gray-300" size={20} />
                                  <span className="ml-2 text-gray-400">No</span>
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
                  <h4 className="font-semibold text-gray-800 mb-3 text-lg flex items-center space-x-2">
                    <Package size={20} />
                    <span>Parts Used</span>
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300 text-sm">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">
                            Part Name
                          </th>
                          <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">
                            Part Code
                          </th>
                          <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-700">
                            Quantity
                          </th>
                          <th className="border border-gray-300 px-4 py-3 text-right font-semibold text-gray-700">
                            Unit Price
                          </th>
                          <th className="border border-gray-300 px-4 py-3 text-right font-semibold text-gray-700">
                            Total Price
                          </th>
                          <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-700">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {service.parts.map((part, index) => (
                          <tr 
                            key={index} 
                            className={`hover:bg-gray-50 ${
                              part.was_replaced ? 'bg-green-50' : 'bg-gray-50'
                            }`}
                          >
                            <td className="border border-gray-300 px-4 py-3 text-gray-800 font-medium">
                              {part.part_name}
                            </td>
                            <td className="border border-gray-300 px-4 py-3 text-gray-600">
                              {part.part_code}
                            </td>
                            <td className="border border-gray-300 px-4 py-3 text-center text-gray-800">
                              {part.quantity}
                            </td>
                            <td className="border border-gray-300 px-4 py-3 text-right text-gray-800">
                              ETB {(part.unit_price || 0).toLocaleString()}
                            </td>
                            <td className="border border-gray-300 px-4 py-3 text-right font-semibold text-gray-800">
                              {part.was_replaced ? (
                                <span className="text-green-700">ETB {(part.total_price || 0).toLocaleString()}</span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="border border-gray-300 px-4 py-3 text-center">
                              {part.was_replaced ? (
                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                                  Replaced
                                </span>
                              ) : (
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold">
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
                <h4 className="font-semibold text-gray-800 mb-3 text-lg flex items-center space-x-2">
                  <DollarSign size={20} />
                  <span>Financial Breakdown</span>
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300 text-sm">
                    <tbody>
                      <tr className="bg-gray-50">
                        <td className="border border-gray-300 px-4 py-3 font-semibold text-gray-700 w-1/2">
                          Labor Cost
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-right text-gray-800 font-semibold">
                          ETB {(service.total_labor_cost || 0).toLocaleString()}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-4 py-3 font-semibold text-gray-700">
                          Parts Cost
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-right text-gray-800 font-semibold">
                          ETB {(service.total_parts_cost || 0).toLocaleString()}
                        </td>
                      </tr>
                      {service.discount_amount > 0 && (
                        <tr className="bg-green-50">
                          <td className="border border-gray-300 px-4 py-3 font-semibold text-green-700">
                            Discount
                          </td>
                          <td className="border border-gray-300 px-4 py-3 text-right text-green-700 font-semibold">
                            -ETB {(service.discount_amount || 0).toLocaleString()}
                          </td>
                        </tr>
                      )}
                      <tr className="bg-gray-50">
                        <td className="border border-gray-300 px-4 py-3 font-semibold text-gray-700">
                          Tax ({service.tax_amount > 0 ? '15%' : '0%'})
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-right text-gray-800 font-semibold">
                          ETB {(service.tax_amount || 0).toLocaleString()}
                        </td>
                      </tr>
                      <tr className="bg-primary-50 border-2 border-primary-300">
                        <td className="border border-primary-300 px-4 py-3 font-bold text-gray-800 text-lg">
                          Grand Total
                        </td>
                        <td className="border border-primary-300 px-4 py-3 text-right font-bold text-primary-700 text-lg">
                          ETB {(service.grand_total || 0).toLocaleString()}
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
            </>
          ) : (
            <div className="flex justify-center items-center h-64">
              <p className="text-gray-500">Service not found</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

