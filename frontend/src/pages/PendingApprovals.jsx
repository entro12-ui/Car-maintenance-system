import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { customersApi, authApi, accountantApi } from '../services/api'
import { UserCheck, CheckCircle, XCircle, Clock, Mail, Phone, MapPin, Calendar, Users } from 'lucide-react'

export default function PendingApprovals() {
  const [activeTab, setActiveTab] = useState('customers') // 'customers' or 'accountants'
  const queryClient = useQueryClient()

  const { data: pendingCustomers, isLoading: customersLoading, error: customersError } = useQuery({
    queryKey: ['pending-approvals'],
    queryFn: async () => {
      const response = await customersApi.getPendingApproval()
      return response.data
    },
  })

  const { data: pendingAccountants, isLoading: accountantsLoading, error: accountantsError } = useQuery({
    queryKey: ['pending-accountants'],
    queryFn: async () => {
      const response = await accountantApi.getPendingApprovals()
      return response.data
    },
  })

  const approveCustomerMutation = useMutation({
    mutationFn: (customerId) => authApi.approveCustomer(customerId),
    onSuccess: () => {
      queryClient.invalidateQueries(['pending-approvals'])
      queryClient.invalidateQueries(['customers'])
    },
  })

  const approveAccountantMutation = useMutation({
    mutationFn: (accountantId) => authApi.approveAccountant(accountantId),
    onSuccess: () => {
      queryClient.invalidateQueries(['pending-accountants'])
    },
  })

  const isLoading = activeTab === 'customers' ? customersLoading : accountantsLoading
  const error = activeTab === 'customers' ? customersError : accountantsError

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading pending approvals...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-600">Error loading pending approvals. Please try again.</p>
      </div>
    )
  }

  const pendingCustomersList = pendingCustomers?.data || []
  const pendingAccountantsList = pendingAccountants?.data || []
  const customersCount = pendingCustomers?.count || pendingCustomersList.length
  const accountantsCount = pendingAccountantsList.length
  const totalCount = customersCount + accountantsCount

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <UserCheck className="text-primary-600" size={32} />
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Pending Approvals</h1>
            <p className="text-gray-500 mt-1">
              {totalCount} {totalCount === 1 ? 'account' : 'accounts'} waiting for approval
            </p>
          </div>
        </div>
        {totalCount > 0 && (
          <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg flex items-center space-x-2">
            <Clock size={20} />
            <span className="font-medium">Action Required</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('customers')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'customers'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Users size={18} />
              <span>Customers ({customersCount})</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('accountants')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'accountants'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <UserCheck size={18} />
              <span>Accountants ({accountantsCount})</span>
            </div>
          </button>
        </nav>
      </div>

      {/* Customers Table */}
      {activeTab === 'customers' && pendingCustomersList.length > 0 && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registered
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingCustomersList.map((customer) => (
                  <tr key={customer.customer_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        {customer.first_name} {customer.last_name}
                      </div>
                      <div className="text-sm text-gray-500">ID: {customer.customer_id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Mail size={14} />
                          <span className="text-sm">{customer.email}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Phone size={14} />
                          <span className="text-sm">{customer.phone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {customer.city ? (
                        <div className="flex items-center space-x-2 text-gray-600">
                          <MapPin size={14} />
                          <span>{customer.city}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Calendar size={14} />
                        <span className="text-sm">
                          {customer.registration_date
                            ? new Date(customer.registration_date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })
                            : '-'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <Clock size={12} className="mr-1" />
                        Pending
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => {
                          if (window.confirm(`Approve ${customer.first_name} ${customer.last_name}?`)) {
                            approveCustomerMutation.mutate(customer.customer_id)
                          }
                        }}
                        disabled={approveCustomerMutation.isLoading}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <CheckCircle size={18} />
                        <span>Approve</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Accountants Table */}
      {activeTab === 'accountants' && pendingAccountantsList.length > 0 && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Accountant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registered
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingAccountantsList.map((accountant) => (
                  <tr key={accountant.accountant_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        {accountant.first_name} {accountant.last_name}
                      </div>
                      <div className="text-sm text-gray-500">ID: {accountant.accountant_id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Mail size={14} />
                          <span className="text-sm">{accountant.email}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Phone size={14} />
                          <span className="text-sm">{accountant.phone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {accountant.city ? (
                        <div className="flex items-center space-x-2 text-gray-600">
                          <MapPin size={14} />
                          <span>{accountant.city}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Calendar size={14} />
                        <span className="text-sm">
                          {accountant.registration_date
                            ? new Date(accountant.registration_date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })
                            : '-'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <Clock size={12} className="mr-1" />
                        Pending
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => {
                          if (window.confirm(`Approve ${accountant.first_name} ${accountant.last_name}?`)) {
                            approveAccountantMutation.mutate(accountant.accountant_id)
                          }
                        }}
                        disabled={approveAccountantMutation.isLoading}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <CheckCircle size={18} />
                        <span>Approve</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {((activeTab === 'customers' && pendingCustomersList.length === 0) ||
        (activeTab === 'accountants' && pendingAccountantsList.length === 0)) && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <XCircle className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-500 text-lg font-medium">No pending {activeTab}</p>
          <p className="text-gray-400 text-sm mt-2">
            All {activeTab === 'customers' ? 'customer' : 'accountant'} accounts have been approved
          </p>
        </div>
      )}
    </div>
  )
}

