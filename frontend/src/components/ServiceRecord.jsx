import { CheckCircle, XCircle, Calendar, Gauge, FileText, DollarSign } from 'lucide-react'
import { format } from 'date-fns'

export default function ServiceRecord({ service }) {
  if (!service) return null

  return (
    <div className="bg-white rounded-lg shadow-lg border-2 border-gray-200 p-6">
      {/* Header */}
      <div className="border-b-2 border-gray-300 pb-4 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Service Record</h2>
            <p className="text-sm text-gray-600 mt-1">BERHANU AL-ADEM Auto Solution</p>
          </div>
          {service.reference_number && (
            <div className="text-right">
              <p className="text-sm text-gray-600">REF No.</p>
              <p className="text-lg font-bold text-gray-800">{service.reference_number}</p>
            </div>
          )}
        </div>
      </div>

      {/* Service Details */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div>
          <p className="text-sm text-gray-600 mb-1">Date</p>
          <p className="font-semibold text-gray-800">
            {format(new Date(service.service_date), 'dd-MM-yy')}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Service Date</p>
          <p className="font-semibold text-gray-800">
            {format(new Date(service.service_date), 'dd-MM-yy')}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Kilometer</p>
          <p className="font-semibold text-gray-800">
            {service.mileage_at_service.toLocaleString()}
          </p>
        </div>
        {service.oil_type && (
          <div>
            <p className="text-sm text-gray-600 mb-1">Oil Type</p>
            <p className="font-semibold text-gray-800">{service.oil_type}</p>
          </div>
        )}
        <div>
          <p className="text-sm text-gray-600 mb-1">Next Service KM</p>
          <p className="font-semibold text-gray-800">
            {service.next_service_mileage.toLocaleString()}
          </p>
        </div>
        {service.service_note && (
          <div className="col-span-2 md:col-span-1">
            <p className="text-sm text-gray-600 mb-1">Note</p>
            <p className="font-semibold text-gray-800">{service.service_note}</p>
          </div>
        )}
      </div>

      {/* Checklist */}
      {service.checklist_items && service.checklist_items.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Service Checklist</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-700">
                    Item
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-center font-semibold text-gray-700 w-24">
                    CHECKED
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-center font-semibold text-gray-700 w-24">
                    CHANGED
                  </th>
                </tr>
              </thead>
              <tbody>
                {service.checklist_items.map((item) => (
                  <tr key={item.checklist_id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2 text-gray-800">
                      {item.item_name}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      {item.checked ? (
                        <CheckCircle className="mx-auto text-green-600" size={20} />
                      ) : (
                        <XCircle className="mx-auto text-gray-300" size={20} />
                      )}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      {item.changed ? (
                        <CheckCircle className="mx-auto text-green-600" size={20} />
                      ) : (
                        <XCircle className="mx-auto text-gray-300" size={20} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Parts Used */}
      {service.parts && service.parts.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Parts Used</h3>
          <div className="space-y-2">
            {service.parts.map((part, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  part.was_replaced
                    ? 'bg-green-50 border-green-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-800">{part.part_name}</p>
                    <p className="text-sm text-gray-600">{part.part_code}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">
                      Qty: {part.quantity} × ETB {part.unit_price.toLocaleString()}
                    </p>
                    {part.was_replaced && (
                      <p className="font-semibold text-gray-800">
                        ETB {part.total_price.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cost Breakdown */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Cost Breakdown</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Labor Cost:</span>
            <span className="font-semibold">ETB {service.total_labor_cost.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Parts Cost:</span>
            <span className="font-semibold">ETB {service.total_parts_cost.toLocaleString()}</span>
          </div>
          {service.discount_amount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount:</span>
              <span className="font-semibold">-ETB {service.discount_amount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-600">Tax:</span>
            <span className="font-semibold">ETB {service.tax_amount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between border-t-2 border-gray-300 pt-2 mt-2 font-bold text-lg">
            <span>Total:</span>
            <span>ETB {service.grand_total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Serviced By */}
      <div className="border-t-2 border-gray-300 pt-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {service.serviced_by_name && (
            <div>
              <p className="text-gray-600 mb-1">Serviced By</p>
              <p className="font-semibold text-gray-800">{service.serviced_by_name}</p>
            </div>
          )}
          {service.branch && (
            <div>
              <p className="text-gray-600 mb-1">Branch</p>
              <p className="font-semibold text-gray-800">{service.branch}</p>
            </div>
          )}
          <div>
            <p className="text-gray-600 mb-1">Payment Status</p>
            <span
              className={`px-2 py-1 rounded-full text-xs font-semibold ${
                service.payment_status === 'Paid'
                  ? 'bg-green-100 text-green-800'
                  : service.payment_status === 'Free Service'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {service.payment_status}
            </span>
          </div>
          <div>
            <p className="text-gray-600 mb-1">Cost/Amount</p>
            <p className="font-semibold text-gray-800">
              ETB {service.grand_total.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Notes */}
      {service.mechanic_notes && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm font-semibold text-blue-800 mb-1">Mechanic Notes:</p>
          <p className="text-sm text-blue-700">{service.mechanic_notes}</p>
        </div>
      )}
    </div>
  )
}



