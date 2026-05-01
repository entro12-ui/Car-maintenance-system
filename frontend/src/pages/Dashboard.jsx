import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { appointmentsApi, customersApi, dashboardApi, jobOrdersApi } from '../services/api'
import {
  Calendar,
  DollarSign,
  Users,
  Package,
  Bell,
  TrendingUp,
  ArrowRight,
  ClipboardList,
  UserRound,
  Warehouse,
  CalendarClock,
  ShieldCheck,
  AlertTriangle,
  BarChart3,
  LayoutDashboard,
} from 'lucide-react'
import StatCard from '@/components/StatCard'
import LoadingSpinner from '@/components/LoadingSpinner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

function formatAppointmentTime(scheduledTime) {
  if (!scheduledTime) return '—'
  const s = String(scheduledTime)
  return s.length >= 5 ? s.slice(0, 5) : s
}

function SectionLabel({ id, children }) {
  return (
    <p
      id={id}
      className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
    >
      {children}
    </p>
  )
}

const quickLinks = [
  {
    to: '/appointments',
    label: 'Appointments',
    description: "Today's schedule & status",
    icon: Calendar,
  },
  {
    to: '/customers',
    label: 'Customers',
    description: 'Accounts & vehicles',
    icon: UserRound,
  },
  {
    to: '/job-orders',
    label: 'Job orders',
    description: 'Open workshop jobs',
    icon: ClipboardList,
  },
  {
    to: '/parts',
    label: 'Parts & stock',
    description: 'Inventory levels',
    icon: Warehouse,
  },
  {
    to: '/garage-invoices/advanced-booking',
    label: 'Advanced booking',
    description: 'Plan incoming work',
    icon: CalendarClock,
  },
  {
    to: '/pending-approvals',
    label: 'Pending approvals',
    description: 'New registrations',
    icon: ShieldCheck,
  },
  {
    to: '/reports',
    label: 'Reports & analytics',
    description: 'Daily, monthly & due service',
    icon: BarChart3,
  },
]

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await dashboardApi.getStats()
      return response.data
    },
  })

  const { data: todayQueue, isLoading: todayLoading } = useQuery({
    queryKey: ['appointments', 'today'],
    queryFn: async () => {
      const res = await appointmentsApi.getToday()
      return Array.isArray(res.data) ? res.data : []
    },
  })

  const { data: pendingPayload } = useQuery({
    queryKey: ['customers', 'pending-approval'],
    queryFn: async () => {
      const res = await customersApi.getPendingApproval()
      return res.data
    },
  })

  const { data: recentJobsRaw, isLoading: jobsLoading } = useQuery({
    queryKey: ['jobOrders', 'dashboard-recent'],
    queryFn: async () => {
      const res = await jobOrdersApi.list({ limit: 6 })
      const payload = res.data
      return Array.isArray(payload) ? payload : []
    },
  })

  const pendingCount = pendingPayload?.count ?? pendingPayload?.data?.length ?? 0

  if (isLoading) {
    return (
      <div className="dashboard-page animate-fade-in">
        <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-md ring-1 ring-black/[0.03]">
          <div className="flex min-h-[360px] flex-col items-center justify-center gap-3 px-6 py-20">
            <LoadingSpinner size="lg" />
            <p className="text-sm font-medium text-muted-foreground">Loading dashboard…</p>
          </div>
        </div>
      </div>
    )
  }

  const appointments = stats?.today_appointments ?? 0
  const completed = stats?.completed_today ?? 0
  const revenue = stats?.today_revenue ?? 0
  const lowStock = stats?.low_stock_items ?? 0

  const completionPct =
    appointments > 0 ? Math.min(100, Math.round((completed / appointments) * 100)) : null

  const cards = [
    {
      title: "Today's appointments",
      value: appointments,
      icon: Calendar,
      tone: 'teal',
    },
    {
      title: 'Completed today',
      value: completed,
      icon: TrendingUp,
      tone: 'emerald',
    },
    {
      title: "Today's revenue",
      value: `ETB ${revenue.toLocaleString()}`,
      icon: DollarSign,
      tone: 'amber',
    },
    {
      title: 'Customers served',
      value: stats?.customers_served_today ?? 0,
      icon: Users,
      tone: 'violet',
    },
    {
      title: 'Low stock items',
      value: lowStock,
      icon: Package,
      tone: 'rose',
      highlight: lowStock > 0,
    },
    {
      title: 'Notifications sent',
      value: stats?.notifications_sent ?? 0,
      icon: Bell,
      tone: 'indigo',
    },
  ]

  const hasAlerts = pendingCount > 0 || lowStock > 0

  return (
    <div className="dashboard-page animate-fade-in">
      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-md ring-1 ring-black/[0.03]">
        {/* Page masthead */}
        <header className="relative border-b border-border/60 bg-gradient-to-br from-primary/[0.09] via-card to-teal-500/[0.06] px-5 py-6 sm:px-8 sm:py-8">
          <div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-[radial-gradient(ellipse_at_center,_rgba(20,184,166,0.12),transparent_70%)]" aria-hidden />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex gap-4">
              <div className="hidden h-14 w-14 shrink-0 rounded-2xl bg-gradient-to-br from-primary to-teal-600 text-primary-foreground shadow-lg shadow-primary/25 sm:flex sm:items-center sm:justify-center">
                <LayoutDashboard className="h-7 w-7 text-white" strokeWidth={2} aria-hidden />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="text-[10px] font-semibold uppercase tracking-wide">
                    Admin home
                  </Badge>
                  {stats?.report_date ? (
                    <span className="text-[11px] text-muted-foreground">Snapshot · {stats.report_date}</span>
                  ) : null}
                </div>
                <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-[2rem]">
                  Dashboard
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {format(new Date(), 'EEEE, MMMM d, yyyy')} — workshop overview and shortcuts.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              <Button variant="outline" size="sm" className="gap-1.5 bg-background/80 shadow-sm backdrop-blur-sm" asChild>
                <Link to="/reports">
                  <BarChart3 className="h-4 w-4" aria-hidden />
                  Reports
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 bg-background/80 shadow-sm backdrop-blur-sm" asChild>
                <Link to="/appointments">
                  <Calendar className="h-4 w-4" aria-hidden />
                  Schedule
                </Link>
              </Button>
            </div>
          </div>
        </header>

        {/* Page body */}
        <div className="space-y-6 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          <section aria-labelledby="dash-pulse-heading">
            <SectionLabel id="dash-pulse-heading">Today</SectionLabel>
            <Card className="overflow-hidden border-primary/15 bg-gradient-to-br from-card via-card to-primary/[0.03] shadow-sm">
              <CardHeader className="pb-2 pt-4 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
                <div className="space-y-0.5">
                  <CardTitle className="text-lg sm:text-xl">Today&apos;s pulse</CardTitle>
                  <CardDescription>
                    Appointment throughput and revenue — figures reset at midnight.
                  </CardDescription>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 sm:mt-0 sm:justify-end">
                  <div className="rounded-lg border border-border/80 bg-background/90 px-3 py-1.5 text-center shadow-sm backdrop-blur-sm">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Revenue
                    </p>
                    <p className="font-display text-base font-bold text-foreground sm:text-lg">
                      ETB {revenue.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/80 bg-background/90 px-3 py-1.5 text-center shadow-sm backdrop-blur-sm">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Scheduled
                    </p>
                    <p className="font-display text-base font-bold text-foreground sm:text-lg">{appointments}</p>
                  </div>
                  <div className="rounded-lg border border-border/80 bg-background/90 px-3 py-1.5 text-center shadow-sm backdrop-blur-sm">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Done
                    </p>
                    <p className="font-display text-base font-bold text-emerald-700 sm:text-lg">{completed}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 px-4 pb-4 pt-1">
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="font-medium text-foreground">Appointment completion</span>
                  {completionPct !== null ? (
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                      {completionPct}% of today&apos;s schedule
                    </span>
                  ) : (
                    <span className="text-muted-foreground">No appointments scheduled for today</span>
                  )}
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      'h-full rounded-full bg-gradient-to-r from-primary to-emerald-500 transition-all duration-500 ease-out',
                      completionPct === null && 'w-0'
                    )}
                    style={{
                      width: completionPct !== null ? `${completionPct}%` : '0%',
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {completionPct !== null
                    ? `${completed} of ${appointments} appointments marked completed.`
                    : 'Book appointments to track completion here.'}
                </p>
              </CardContent>
            </Card>
          </section>

          {hasAlerts ? (
            <section aria-labelledby="dash-alerts-heading" className="space-y-3">
              <SectionLabel id="dash-alerts-heading">Needs attention</SectionLabel>
              <div className="grid gap-3 md:grid-cols-2">
                {pendingCount > 0 ? (
                  <div className="flex flex-col gap-2 rounded-xl border border-violet-200/90 bg-gradient-to-br from-violet-50/95 to-purple-50/50 px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-700">
                        <ShieldCheck className="h-5 w-5" aria-hidden />
                      </div>
                      <div>
                        <p className="font-semibold text-violet-950">Pending approvals</p>
                        <p className="text-xs text-violet-900/85 sm:text-sm">
                          {pendingCount} registration{pendingCount === 1 ? '' : 's'} waiting for admin activation.
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0 border-violet-300/80 bg-white/90 hover:bg-white"
                      asChild
                    >
                      <Link to="/pending-approvals">
                        Review
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                ) : null}
                {lowStock > 0 ? (
                  <div className="flex flex-col gap-2 rounded-xl border border-amber-200/80 bg-gradient-to-br from-amber-50/95 to-orange-50/40 px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700">
                        <AlertTriangle className="h-5 w-5" aria-hidden />
                      </div>
                      <div>
                        <p className="font-semibold text-amber-950">Low stock</p>
                        <p className="text-xs text-amber-900/85 sm:text-sm">
                          {lowStock} part{lowStock === 1 ? '' : 's'} at or below minimum — restock before jobs stall.
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0 border-amber-300/80 bg-white/90 hover:bg-white"
                      asChild
                    >
                      <Link to="/parts">
                        Parts
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                ) : null}
              </div>
            </section>
          ) : null}

          <section aria-labelledby="dash-activity-heading">
            <SectionLabel id="dash-activity-heading">Live activity</SectionLabel>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <Card className="overflow-hidden shadow-sm">
                <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-3">
                  <div>
                    <CardTitle className="text-base sm:text-lg">Today&apos;s appointment queue</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Scheduled and in-progress visits (by time).
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" className="shrink-0 -mr-1 h-8 text-primary" asChild>
                    <Link to="/appointments">
                      All
                      <ArrowRight className="ml-0.5 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent className="px-4 pb-4 pt-0">
                  {todayLoading ? (
                    <div className="flex items-center justify-center gap-2 py-10 text-xs text-muted-foreground sm:text-sm">
                      <LoadingSpinner size="sm" />
                      Loading…
                    </div>
                  ) : todayQueue && todayQueue.length > 0 ? (
                    <div className="overflow-x-auto rounded-xl border border-border/70">
                      <table className="w-full text-xs sm:text-sm">
                        <thead>
                          <tr className="border-b border-border bg-muted/40 text-left">
                            <th className="whitespace-nowrap px-3 py-2 font-semibold text-muted-foreground">Time</th>
                            <th className="whitespace-nowrap px-3 py-2 font-semibold text-muted-foreground">
                              Customer
                            </th>
                            <th className="whitespace-nowrap px-3 py-2 font-semibold text-muted-foreground">Plate</th>
                            <th className="whitespace-nowrap px-3 py-2 font-semibold text-muted-foreground">Service</th>
                            <th className="whitespace-nowrap px-3 py-2 font-semibold text-muted-foreground">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/70">
                          {todayQueue.slice(0, 8).map((row) => (
                            <tr key={row.appointment_id} className="bg-card hover:bg-muted/20">
                              <td className="whitespace-nowrap px-3 py-2 font-medium tabular-nums text-foreground">
                                {formatAppointmentTime(row.scheduled_time)}
                              </td>
                              <td className="max-w-[130px] truncate px-3 py-2 text-foreground">{row.customer_name}</td>
                              <td className="whitespace-nowrap px-3 py-2 font-mono text-[11px] text-muted-foreground sm:text-xs">
                                {row.license_plate}
                              </td>
                              <td className="max-w-[110px] truncate px-3 py-2 text-muted-foreground">{row.service_type}</td>
                              <td className="whitespace-nowrap px-3 py-2">
                                <Badge
                                  variant={row.status === 'In Progress' ? 'default' : 'secondary'}
                                  className={cn(
                                    row.status === 'Scheduled' && 'border-teal-200/80 bg-teal-50 text-teal-900',
                                    row.status === 'In Progress' && 'border-amber-200/80 bg-amber-50 text-amber-900'
                                  )}
                                >
                                  {row.status}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-border/80 bg-muted/15 py-9 text-center text-xs text-muted-foreground sm:text-sm">
                      No active appointments for the rest of today.
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="overflow-hidden shadow-sm">
                <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-3">
                  <div>
                    <CardTitle className="text-base sm:text-lg">Recent job orders</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Latest jobs — open for full detail.</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" className="shrink-0 -mr-1 h-8 text-primary" asChild>
                    <Link to="/job-orders">
                      All
                      <ArrowRight className="ml-0.5 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent className="px-4 pb-4 pt-0">
                  {jobsLoading ? (
                    <div className="flex items-center justify-center gap-2 py-10 text-xs text-muted-foreground sm:text-sm">
                      <LoadingSpinner size="sm" />
                      Loading…
                    </div>
                  ) : recentJobsRaw && recentJobsRaw.length > 0 ? (
                    <div className="overflow-x-auto rounded-xl border border-border/70">
                      <table className="w-full text-xs sm:text-sm">
                        <thead>
                          <tr className="border-b border-border bg-muted/40 text-left">
                            <th className="whitespace-nowrap px-3 py-2 font-semibold text-muted-foreground">Job no</th>
                            <th className="whitespace-nowrap px-3 py-2 font-semibold text-muted-foreground">Status</th>
                            <th className="whitespace-nowrap px-3 py-2 font-semibold text-muted-foreground">Opened</th>
                            <th className="whitespace-nowrap px-3 py-2 text-right font-semibold text-muted-foreground">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/70">
                          {recentJobsRaw.map((jo) => (
                            <tr key={jo.job_order_id} className="bg-card hover:bg-muted/20">
                              <td className="whitespace-nowrap px-3 py-2 font-mono text-[11px] font-semibold text-foreground sm:text-xs">
                                {jo.job_order_number}
                              </td>
                              <td className="whitespace-nowrap px-3 py-2">
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    jo.status === 'Closed' && 'border-slate-200 bg-slate-50 text-slate-800',
                                    jo.status === 'Cancelled' && 'border-rose-200 bg-rose-50 text-rose-900',
                                    jo.status === 'Delivered' && 'border-emerald-200 bg-emerald-50 text-emerald-900',
                                    jo.status !== 'Closed' &&
                                      jo.status !== 'Cancelled' &&
                                      jo.status !== 'Delivered' &&
                                      'border-primary/30 bg-primary/5 text-primary'
                                  )}
                                >
                                  {jo.status}
                                </Badge>
                              </td>
                              <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">{jo.opened_date || '—'}</td>
                              <td className="whitespace-nowrap px-3 py-2 text-right">
                                <Link
                                  to={`/job-orders/${jo.job_order_id}`}
                                  className="text-[11px] font-semibold text-primary hover:underline sm:text-xs"
                                >
                                  View
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-border/80 bg-muted/15 py-9 text-center text-xs text-muted-foreground sm:text-sm">
                      No job orders yet — create one from Job orders.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </section>

          <section aria-labelledby="dash-metrics-heading">
            <SectionLabel id="dash-metrics-heading">All metrics</SectionLabel>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {cards.map((card) => {
                const Icon = card.icon
                return (
                  <StatCard
                    key={card.title}
                    title={card.title}
                    value={card.value}
                    icon={Icon}
                    tone={card.tone}
                    highlight={card.highlight}
                  />
                )
              })}
            </div>
          </section>

          <section aria-labelledby="dash-actions-heading" className="border-t border-border/60 pt-6">
            <SectionLabel id="dash-actions-heading">Quick actions</SectionLabel>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 lg:gap-3">
              {quickLinks.map(({ to, label, description, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    'group flex items-start gap-3 rounded-xl border border-border/70 bg-muted/10 p-3 shadow-sm transition-all sm:p-3.5',
                    'hover:border-primary/35 hover:bg-card hover:shadow-md hover:shadow-primary/[0.06]'
                  )}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                    <Icon className="h-[18px] w-[18px] sm:h-5 sm:w-5" strokeWidth={2} aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1 text-sm font-semibold text-foreground">
                      {label}
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100 sm:h-4 sm:w-4" />
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground sm:text-sm">{description}</span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
