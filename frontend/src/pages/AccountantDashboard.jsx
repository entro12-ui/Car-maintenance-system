import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { accountantApi } from '../services/api'
import { DollarSign, CheckCircle, Clock, Filter, Search } from 'lucide-react'
import { format } from 'date-fns'
import StatCard from '@/components/StatCard'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import LoadingSpinner from '@/components/LoadingSpinner'
import { cn } from '@/lib/utils'

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
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border/80 bg-card/50 py-16">
        <LoadingSpinner size="lg" />
        <p className="text-sm font-medium text-muted-foreground">Loading payments…</p>
      </div>
    )
  }

  const summaryCards =
    summary &&
    [
      {
        title: 'Total revenue',
        value: `ETB ${(summary.total_revenue || 0).toLocaleString()}`,
        subtitle: `${summary.paid_count || 0} paid services`,
        icon: DollarSign,
        tone: 'emerald',
      },
      {
        title: 'Pending amount',
        value: `ETB ${(summary.pending_amount || 0).toLocaleString()}`,
        subtitle: `${summary.pending_count || 0} pending`,
        icon: Clock,
        tone: 'amber',
      },
      {
        title: 'Partial amount',
        value: `ETB ${(summary.partial_amount || 0).toLocaleString()}`,
        subtitle: `${summary.partial_count || 0} partial`,
        icon: DollarSign,
        tone: 'teal',
      },
      {
        title: 'Total services',
        value: summary.total_services || 0,
        subtitle: 'All recorded services',
        icon: CheckCircle,
        tone: 'slate',
      },
    ]

  return (
    <div className="animate-fade-in space-y-8">
      <header className="border-b border-border/60 pb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">Finance</p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Payment management
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track collections, pending balances, and payment status in one place.
        </p>
      </header>

      {summaryCards ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((c) => (
            <StatCard
              key={c.title}
              title={c.title}
              value={c.value}
              subtitle={c.subtitle}
              icon={c.icon}
              tone={c.tone}
            />
          ))}
        </div>
      ) : null}

      <Card className="overflow-hidden">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                type="search"
                placeholder="Search customer, email, vehicle, or reference…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Filter className="h-5 w-5 text-muted-foreground" aria-hidden />
              <select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                className={cn(
                  'h-11 rounded-xl border border-input bg-background px-4 text-sm font-medium shadow-sm',
                  'transition-colors hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/25'
                )}
              >
                <option value="">All statuses</option>
                <option value="Pending">Pending</option>
                <option value="Partial">Partial</option>
                <option value="Paid">Paid</option>
                <option value="Free Service">Free service</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/80 bg-muted/40 text-left">
                <th className="whitespace-nowrap px-5 py-3.5 font-semibold text-muted-foreground">
                  Service date
                </th>
                <th className="whitespace-nowrap px-5 py-3.5 font-semibold text-muted-foreground">
                  Customer
                </th>
                <th className="whitespace-nowrap px-5 py-3.5 font-semibold text-muted-foreground">
                  Vehicle
                </th>
                <th className="whitespace-nowrap px-5 py-3.5 font-semibold text-muted-foreground">
                  Service type
                </th>
                <th className="whitespace-nowrap px-5 py-3.5 font-semibold text-muted-foreground">
                  Reference
                </th>
                <th className="whitespace-nowrap px-5 py-3.5 text-right font-semibold text-muted-foreground">
                  Amount
                </th>
                <th className="whitespace-nowrap px-5 py-3.5 text-center font-semibold text-muted-foreground">
                  Status
                </th>
                <th className="whitespace-nowrap px-5 py-3.5 text-center font-semibold text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70">
              {filteredPayments.map((payment) => (
                <tr key={payment.service_id} className="bg-card transition-colors hover:bg-muted/25">
                  <td className="whitespace-nowrap px-5 py-4 text-foreground">
                    {format(new Date(payment.service_date), 'MMM dd, yyyy')}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4">
                    <div className="font-medium text-foreground">{payment.customer_name}</div>
                    <div className="text-muted-foreground">{payment.customer_email}</div>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-foreground">{payment.vehicle_info}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-foreground">{payment.service_type}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-muted-foreground">
                    {payment.reference_number || '—'}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-right font-semibold text-foreground">
                    ETB {payment.grand_total.toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-center">
                    <Badge
                      variant={
                        payment.payment_status === 'Paid'
                          ? 'success'
                          : payment.payment_status === 'Free Service'
                            ? 'secondary'
                            : payment.payment_status === 'Partial'
                              ? 'default'
                              : 'outline'
                      }
                      className={cn(
                        payment.payment_status === 'Pending' && 'border-amber-200 bg-amber-50 text-amber-900',
                        payment.payment_status === 'Partial' && 'border-teal-200 bg-teal-50 text-teal-900',
                        payment.payment_status === 'Free Service' && 'border-violet-200 bg-violet-50 text-violet-900'
                      )}
                    >
                      {payment.payment_status}
                    </Badge>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-center">
                    {payment.payment_status === 'Pending' && (
                      <Button
                        size="sm"
                        onClick={() => handleUpdatePayment(payment.service_id, 'Paid')}
                        disabled={updatePaymentMutation.isLoading}
                      >
                        Mark paid
                      </Button>
                    )}
                    {payment.payment_status === 'Paid' && (
                      <span className="text-sm font-semibold text-emerald-600">Paid</span>
                    )}
                    {payment.payment_status === 'Free Service' && (
                      <span className="text-sm font-semibold text-violet-600">Free</span>
                    )}
                    {payment.payment_status === 'Partial' && (
                      <span className="text-sm font-medium text-muted-foreground">Partial</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPayments.length === 0 && (
          <div className="border-t border-border/60 py-14 text-center">
            <p className="text-sm font-medium text-muted-foreground">No payments match your filters.</p>
          </div>
        )}
      </Card>
    </div>
  )
}
