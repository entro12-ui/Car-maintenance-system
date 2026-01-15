import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { reportsApi } from '../services/api'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Calendar, DollarSign, TrendingUp } from 'lucide-react'

export default function Reports() {
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0])
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())

  const { data: dailyReport } = useQuery({
    queryKey: ['reports', 'daily', reportDate],
    queryFn: () => reportsApi.getDaily(reportDate),
  })

  const { data: monthlyReport } = useQuery({
    queryKey: ['reports', 'monthly', month, year],
    queryFn: () => reportsApi.getMonthly(month, year),
  })

  const { data: customersDue } = useQuery({
    queryKey: ['reports', 'customers-due'],
    queryFn: () => reportsApi.getCustomersDue(7),
  })

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Reports</h1>

      {/* Daily Report */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Daily Report</h2>
          <input
            type="date"
            value={reportDate}
            onChange={(e) => setReportDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        {dailyReport?.data && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Total Services</p>
              <p className="text-2xl font-bold text-blue-600">{dailyReport.data.total_services}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Revenue</p>
              <p className="text-2xl font-bold text-green-600">
                ETB {dailyReport.data.total_revenue.toLocaleString()}
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Customers</p>
              <p className="text-2xl font-bold text-purple-600">{dailyReport.data.unique_customers}</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Avg Service Cost</p>
              <p className="text-2xl font-bold text-yellow-600">
                ETB {dailyReport.data.avg_service_cost.toFixed(2)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Monthly Report */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Monthly Report</h2>
          <div className="flex space-x-2">
            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>{new Date(2000, m - 1).toLocaleString('default', { month: 'long' })}</option>
              ))}
            </select>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg w-24"
              min="2020"
              max="2100"
            />
          </div>
        </div>
        {monthlyReport?.data && (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Total Services</p>
                <p className="text-2xl font-bold text-blue-600">{monthlyReport.data.total_services}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">
                  ETB {monthlyReport.data.total_revenue.toLocaleString()}
                </p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Avg Ticket Size</p>
                <p className="text-2xl font-bold text-purple-600">
                  ETB {monthlyReport.data.avg_ticket_size.toFixed(2)}
                </p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Unique Customers</p>
                <p className="text-2xl font-bold text-yellow-600">{monthlyReport.data.unique_customers}</p>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  {
                    name: 'Revenue',
                    Labor: monthlyReport.data.labor_revenue,
                    Parts: monthlyReport.data.parts_revenue,
                    Tax: monthlyReport.data.tax_collected,
                  }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Labor" fill="#3b82f6" />
                  <Bar dataKey="Parts" fill="#10b981" />
                  <Bar dataKey="Tax" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Customers Due for Service */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Customers Due for Service (Next 7 Days)</h2>
        {customersDue?.data && customersDue.data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Customer</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Vehicle</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Current Mileage</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Next Service</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Remaining</th>
                </tr>
              </thead>
              <tbody>
                {customersDue.data.map((customer, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-semibold">{customer.customer_name}</p>
                        <p className="text-sm text-gray-600">{customer.email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {customer.make} {customer.model} ({customer.license_plate})
                    </td>
                    <td className="py-3 px-4">{customer.current_mileage.toLocaleString()} km</td>
                    <td className="py-3 px-4">{customer.next_service_mileage.toLocaleString()} km</td>
                    <td className="py-3 px-4">
                      <span className={customer.mileage_remaining <= 500 ? 'text-red-600 font-semibold' : ''}>
                        {customer.mileage_remaining.toLocaleString()} km
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No customers due for service in the next 7 days</p>
        )}
      </div>
    </div>
  )
}

