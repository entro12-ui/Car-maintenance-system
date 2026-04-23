import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { garageInvoicesApi } from '../services/api'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'

export default function GarageItmInvoice() {
  const invoiceType = 'ITM'
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['garageInvoiceEligibleJobs', { invoiceType }],
    queryFn: () => garageInvoicesApi.listEligibleJobs(invoiceType),
  })

  const jobs = useMemo(() => data?.data || [], [data])

  const createMutation = useMutation({
    mutationFn: (jobOrderId) => garageInvoicesApi.create({ job_order_id: jobOrderId, invoice_type: invoiceType }),
    onSuccess: async (res) => {
      const invoiceId = res?.data?.invoice_id
      await queryClient.invalidateQueries({ queryKey: ['garageInvoiceEligibleJobs'] })
      if (invoiceId) navigate(`/garage-invoices/${invoiceId}/print`)
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Invoice by ITM</h1>
        <p className="text-gray-600">Select a closed job order and print an ITM invoice.</p>
      </div>

      <Card className="p-4">
        {isLoading ? (
          <div className="text-sm text-gray-500">Loading...</div>
        ) : error ? (
          <div className="text-sm text-red-600">Failed to load eligible jobs</div>
        ) : jobs.length === 0 ? (
          <div className="text-sm text-gray-500">No eligible closed jobs for ITM invoicing.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">Job No</th>
                  <th className="text-left py-2 px-2">Vehicle</th>
                  <th className="text-left py-2 px-2">Customer</th>
                  <th className="text-right py-2 px-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((j) => (
                  <tr key={j.job_order_id} className="border-b last:border-0">
                    <td className="py-2 px-2 font-mono">{j.job_order_number}</td>
                    <td className="py-2 px-2">{j.plate_number ? j.plate_number : `#${j.vehicle_id}`}</td>
                    <td className="py-2 px-2">{j.customer_name || (j.customer_id ? `#${j.customer_id}` : '-')}</td>
                    <td className="py-2 px-2 text-right">
                      <Button
                        type="button"
                        onClick={() => createMutation.mutate(j.job_order_id)}
                        disabled={createMutation.isPending}
                      >
                        {createMutation.isPending ? 'Preparing...' : 'Print Invoice'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {createMutation.error && (
              <div className="text-sm text-red-600 mt-3">
                {createMutation.error?.response?.data?.detail || 'Failed to create invoice'}
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}
