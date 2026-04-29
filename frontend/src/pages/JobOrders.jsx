import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { jobOrdersApi } from '../services/api'

export default function JobOrders() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['jobOrders'],
    queryFn: () => jobOrdersApi.list(),
  })

  const rows = data?.data || []

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>
  }

  if (error) {
    return <div className="text-red-600">Failed to load job orders</div>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Job Orders</h1>
      <div className="mb-4">
        <Link
          to="/work-order-creation"
          className="inline-flex items-center rounded-md border border-indigo-600 bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          New Work Order
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Job No</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Invoice</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Vehicle</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Customer</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Opened</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Blocked</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((jo) => (
                <tr key={jo.job_order_id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono text-sm">{jo.job_order_number}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        jo.status === 'Closed'
                          ? 'bg-gray-100 text-gray-800'
                          : jo.status === 'Cancelled'
                          ? 'bg-red-100 text-red-800'
                          : jo.status === 'Delivered'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {jo.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">{jo.invoice_type || '-'}</td>
                  <td className="py-3 px-4">#{jo.vehicle_id}</td>
                  <td className="py-3 px-4">{jo.customer_id ? `#${jo.customer_id}` : '-'}</td>
                  <td className="py-3 px-4">{jo.opened_date || '-'}</td>
                  <td className="py-3 px-4">{jo.is_blocked ? 'Yes' : 'No'}</td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      to={`/job-orders/${jo.job_order_id}`}
                      className="text-primary hover:underline font-medium"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-6 px-4 text-center text-gray-500">
                    No job orders
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
