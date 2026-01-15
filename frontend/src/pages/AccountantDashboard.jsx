import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { accountantApi } from '../services/api'
import { DollarSign, CheckCircle, XCircle, Clock, Filter, Search } from 'lucide-react'
import { format } from 'date-fns'

export default function AccountantDashboard() {
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const queryClient = useQueryClient()

  const { data: payments, isLoading } = useQuery({
    queryKey: ['accountant-payments', paymentStatusFilter],
    queryFn: async () => {
      const response = await accountantApi.getPayments({ payment_status: paymentStatusFilter || undefined })
      return response.data
    },
  })

  const { data: summary } = useQuery({
    queryKey: ['accountant-summary'],
    queryFn: async () => {
      const response = await accountantApi.getPaymentSummary()
      return response.data
    },
  })

  const updatePaymentMutation = useMutation({
    mutationFn: ({ serviceId, data }) => accountantApi.updatePaymentStatus(serviceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['accountant-payments'])
      queryClient.invalidateQueries(['accountant-summary'])
    },
  })

  const handleUpdatePayment = (serviceId, newStatus) => {
    if (window.confirm(`Change payment status to "${newStatus}"?`)) {
      updatePaymentMutation.mutate({
        serviceId,
        data: {
          payment_status: newStatus,
          payment_method: newStatus === 'Paid' ? 'Cash' : null,
        },
      })
    }
  }

  const paymentsList = payments?.data || []
  const filteredPayments = paymentsList.filter((payment) => {
    const matchesSearch = 
      payment.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.vehicle_info.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.reference_number?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Payment Management</h1>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">
                  ETB {(summary.total_revenue || 0).toLocaleString()}
                </p>
              </div>
              <DollarSign className="text-green-600" size={32} />
            </div>
            <p className="text-xs text-gray-500 mt-2">{summary.paid_count || 0} paid services</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Amount</p>
                <p className="text-2xl font-bold text-yellow-600">
                  ETB {(summary.pending_amount || 0).toLocaleString()}
                </p>
              </div>
              <Clock className="text-yellow-600" size={32} />
            </div>
            <p className="text-xs text-gray-500 mt-2">{summary.pending_count || 0} pending services</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Partial Amount</p>
                <p className="text-2xl font-bold text-blue-600">
                  ETB {(summary.partial_amount || 0).toLocaleString()}
                </p>
              </div>
              <DollarSign className="text-blue-600" size={32} />
            </div>
            <p className="text-xs text-gray-500 mt-2">{summary.partial_count || 0} partial payments</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Services</p>
                <p className="text-2xl font-bold text-gray-800">
                  {summary.total_services || 0}
                </p>
              </div>
              <CheckCircle className="text-gray-600" size={32} />
            </div>
            <p className="text-xs text-gray-500 mt-2">All services</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by customer, email, vehicle, or reference number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Filter size={20} className="text-gray-600" />
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Partial">Partial</option>
              <option value="Paid">Paid</option>
              <option value="Free Service">Free Service</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Service Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Vehicle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Service Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Reference
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPayments.map((payment) => (
                <tr key={payment.service_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {format(new Date(payment.service_date), 'MMM dd, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{payment.customer_name}</div>
                    <div className="text-sm text-gray-500">{payment.customer_email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {payment.vehicle_info}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {payment.service_type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {payment.reference_number || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                    ETB {payment.grand_total.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        payment.payment_status === 'Paid'
                          ? 'bg-green-100 text-green-800'
                          : payment.payment_status === 'Free Service'
                          ? 'bg-purple-100 text-purple-800'
                          : payment.payment_status === 'Partial'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {payment.payment_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                    {payment.payment_status === 'Pending' && (
                      <button
                        onClick={() => handleUpdatePayment(payment.service_id, 'Paid')}
                        disabled={updatePaymentMutation.isLoading}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-semibold"
                      >
                        Mark as Paid
                      </button>
                    )}
                    {payment.payment_status === 'Paid' && (
                      <span className="text-green-600 font-semibold">✓ Paid</span>
                    )}
                    {payment.payment_status === 'Free Service' && (
                      <span className="text-purple-600 font-semibold">Free</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPayments.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No payments found</p>
          </div>
        )}
      </div>
    </div>
  )
}

