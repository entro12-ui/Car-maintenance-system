import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { loyaltyApi, customersApi } from '../services/api'
import { Gift, CheckCircle, XCircle, Award, Calendar, TrendingUp, Users } from 'lucide-react'
import { format } from 'date-fns'

export default function Loyalty() {
  const [selectedCustomerId, setSelectedCustomerId] = useState(null)

  const { data: programs } = useQuery({
    queryKey: ['loyalty-programs'],
    queryFn: () => loyaltyApi.getPrograms(),
  })

  const { data: loyaltyStatus, isLoading: loyaltyLoading } = useQuery({
    queryKey: ['loyalty-status', selectedCustomerId],
    queryFn: () => loyaltyApi.getStatus(selectedCustomerId),
    enabled: !!selectedCustomerId,
  })

  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customersApi.getAll(),
  })

  const selectedCustomer = customers?.data?.find(c => c.customer_id === selectedCustomerId)

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent mb-2">
          Loyalty Program
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Track customer loyalty status and rewards
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Programs */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Active Programs</h2>
          <div className="space-y-4">
            {programs?.data?.map((program) => (
              <div key={program.program_id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <Gift className="text-primary-600" size={24} />
                  <h3 className="text-lg font-semibold">{program.program_name}</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Services Required:</span>
                    <span className="font-semibold">{program.services_required}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Free Labor Hours:</span>
                    <span className="font-semibold">{parseFloat(program.free_labor_hours)} hrs</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Parts Discount:</span>
                    <span className="font-semibold">{parseFloat(program.free_parts_discount)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Valid Days:</span>
                    <span className="font-semibold">{program.valid_days} days</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Status */}
        <div className="bg-card rounded-xl shadow-sm border p-4 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 flex items-center gap-2">
            <Users className="text-primary" size={24} />
            <span>Customer Status</span>
          </h2>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-foreground mb-2">
              Select Customer
            </label>
            <select
              value={selectedCustomerId || ''}
              onChange={(e) => setSelectedCustomerId(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-4 py-2.5 border border-input rounded-lg bg-background focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
            >
              <option value="">Choose a customer...</option>
              {customers?.data?.map((customer) => (
                <option key={customer.customer_id} value={customer.customer_id}>
                  {customer.first_name} {customer.last_name} - {customer.email}
                </option>
              ))}
            </select>
          </div>

          {loyaltyLoading && selectedCustomerId && (
            <div className="flex justify-center items-center py-12">
              <div className="h-8 w-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
          )}

          {loyaltyStatus?.data && selectedCustomer && (
            <div className="space-y-4 animate-fade-in">
              {/* Customer Info Header */}
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4 border border-primary/20">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-foreground">
                    {selectedCustomer.first_name} {selectedCustomer.last_name}
                  </h3>
                  {loyaltyStatus.data.eligibility_status === 'ELIGIBLE' ? (
                    <CheckCircle className="text-green-600" size={24} />
                  ) : (
                    <XCircle className="text-muted-foreground" size={24} />
                  )}
                </div>
                {loyaltyStatus.data.loyalty_id && (
                  <p className="text-sm text-muted-foreground">
                    Loyalty Number: <span className="font-semibold text-primary">
                      #{loyaltyStatus.data.loyalty_id.toString().padStart(6, '0')}
                    </span>
                  </p>
                )}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-muted/50 rounded-lg p-3 sm:p-4 border">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="text-blue-600" size={18} />
                    <span className="text-xs sm:text-sm text-muted-foreground">Total Services</span>
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-foreground">
                    {loyaltyStatus.data.total_services_count ?? loyaltyStatus.data.total_services ?? 0}
                  </p>
                </div>

                <div className="bg-muted/50 rounded-lg p-3 sm:p-4 border">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="text-purple-600" size={18} />
                    <span className="text-xs sm:text-sm text-muted-foreground">Consecutive</span>
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-primary">
                    {loyaltyStatus.data.consecutive_count}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    / {loyaltyStatus.data.services_required}
                  </p>
                </div>

                <div className="bg-muted/50 rounded-lg p-3 sm:p-4 border">
                  <div className="flex items-center gap-2 mb-2">
                    <Gift className="text-green-600" size={18} />
                    <span className="text-xs sm:text-sm text-muted-foreground">Earned</span>
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-green-600">
                    {loyaltyStatus.data.free_services_earned || 0}
                  </p>
                </div>

                <div className="bg-muted/50 rounded-lg p-3 sm:p-4 border">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="text-orange-600" size={18} />
                    <span className="text-xs sm:text-sm text-muted-foreground">Used</span>
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-orange-600">
                    {loyaltyStatus.data.free_services_used || 0}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progress to Free Service</span>
                  <span className="font-semibold text-foreground">
                    {loyaltyStatus.data.consecutive_count} / {loyaltyStatus.data.services_required}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, (loyaltyStatus.data.consecutive_count / loyaltyStatus.data.services_required) * 100)}%`
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {loyaltyStatus.data.services_needed} more service{loyaltyStatus.data.services_needed !== 1 ? 's' : ''} needed
                </p>
              </div>

              {/* Detailed Information */}
              <div className="space-y-3 border-t pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Calendar size={16} />
                      Last Service:
                    </span>
                    <span className="font-semibold text-foreground">
                      {loyaltyStatus.data.last_service_date
                        ? format(new Date(loyaltyStatus.data.last_service_date), 'MMM dd, yyyy')
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Calendar size={16} />
                      Next Expected:
                    </span>
                    <span className="font-semibold text-foreground">
                      {loyaltyStatus.data.next_service_expected
                        ? format(new Date(loyaltyStatus.data.next_service_expected), 'MMM dd, yyyy')
                        : 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Free Service Available:</span>
                  <span className={`font-semibold ${
                    loyaltyStatus.data.free_service_available ? 'text-green-600' : 'text-muted-foreground'
                  }`}>
                    {loyaltyStatus.data.free_service_available ? 'Yes' : 'No'}
                  </span>
                </div>

                {loyaltyStatus.data.free_service_expiry && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Free Service Expires:</span>
                    <span className="font-semibold text-foreground">
                      {format(new Date(loyaltyStatus.data.free_service_expiry), 'MMM dd, yyyy')}
                    </span>
                  </div>
                )}
              </div>

              {/* Status Badge */}
              <div className={`p-4 rounded-lg border ${
                loyaltyStatus.data.eligibility_status === 'ELIGIBLE'
                  ? 'bg-green-50 border-green-200'
                  : 'bg-muted border-border'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-semibold ${
                      loyaltyStatus.data.eligibility_status === 'ELIGIBLE'
                        ? 'text-green-800'
                        : 'text-muted-foreground'
                    }`}>
                      Status: {loyaltyStatus.data.eligibility_status === 'ELIGIBLE' ? 'Eligible for Free Service' : 'Not Eligible'}
                    </p>
                    {loyaltyStatus.data.eligibility_status === 'ELIGIBLE' && (
                      <p className="text-xs text-green-700 mt-1">
                        This customer can use their free service benefit
                      </p>
                    )}
                  </div>
                  {loyaltyStatus.data.eligibility_status === 'ELIGIBLE' ? (
                    <CheckCircle className="text-green-600 flex-shrink-0" size={24} />
                  ) : (
                    <XCircle className="text-muted-foreground flex-shrink-0" size={24} />
                  )}
                </div>
              </div>
            </div>
          )}

          {!selectedCustomerId && (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="mx-auto mb-3 opacity-50" size={48} />
              <p>Select a customer to view their loyalty status</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

