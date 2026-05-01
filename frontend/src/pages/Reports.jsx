import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { reportsApi } from '../services/api'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { CalendarDays, DollarSign, RefreshCw, Users, Timer, Package, Percent } from 'lucide-react'
import LoadingSpinner from '@/components/LoadingSpinner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const CHART_COLORS = ['#0d9488', '#10b981', '#f59e0b', '#8b5cf6', '#f43f5e']

function MetricTile({ label, accentClass, children }) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-border/70 bg-gradient-to-br from-background to-muted/20 px-3 py-2 shadow-sm">
      <div className={cn('absolute inset-x-0 bottom-0 h-1 rounded-b-md', accentClass)} />
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-0.5 font-display text-lg font-bold tabular-nums leading-tight text-foreground sm:text-xl">
        {children}
      </div>
    </div>
  )
}

function urgencyBarPct(mileageRemaining) {
  if (mileageRemaining == null || mileageRemaining <= 0) return 100
  if (mileageRemaining >= 2500) return 8
  return Math.min(100, Math.round(100 - (mileageRemaining / 2500) * 92))
}

export default function Reports() {
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0])
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())

  const { data: dailyReport, isLoading: dailyLoading } = useQuery({
    queryKey: ['reports', 'daily', reportDate],
    queryFn: () => reportsApi.getDaily(reportDate),
  })

  const { data: monthlyReport, isLoading: monthlyLoading } = useQuery({
    queryKey: ['reports', 'monthly', month, year],
    queryFn: () => reportsApi.getMonthly(month, year),
  })

  const { data: customersDue, isLoading: dueLoading } = useQuery({
    queryKey: ['reports', 'customers-due'],
    queryFn: () => reportsApi.getCustomersDue(7),
  })

  const dailyPieData = useMemo(() => {
    const d = dailyReport?.data
    if (!d || d.total_revenue <= 0) return []
    const parts = Number(d.total_parts_revenue) || 0
    const disc = Number(d.total_discounts) || 0
    const balance = Math.max(0, d.total_revenue - parts - disc)
    const slices = [
      { name: 'Parts', value: parts },
      { name: 'Discounts', value: disc },
      { name: 'Labor & other', value: balance },
    ].filter((x) => x.value > 0)
    return slices.length ? slices : [{ name: 'Revenue', value: d.total_revenue }]
  }, [dailyReport?.data])

  const monthlyPieData = useMemo(() => {
    const m = monthlyReport?.data
    if (!m) return []
    return [
      { name: 'Labor', value: m.labor_revenue || 0 },
      { name: 'Parts', value: m.parts_revenue || 0 },
      { name: 'Tax', value: m.tax_collected || 0 },
    ].filter((x) => x.value > 0)
  }, [monthlyReport?.data])

  const chartTooltipStyle = {
    borderRadius: '10px',
    border: '1px solid hsl(var(--border))',
    fontSize: '12px',
  }

  return (
    <div className="animate-fade-in space-y-4 pb-4">
      <header className="flex flex-col gap-2 border-b border-border/60 pb-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Analytics</p>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Reports</h1>
          <p className="mt-0.5 max-w-2xl text-xs leading-snug text-muted-foreground sm:text-sm">
            Daily and monthly aggregates, revenue mix charts, and vehicles nearing service mileage.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground sm:text-xs">
          <Badge variant="secondary" className="px-2 py-0 text-[10px] font-normal">
            APIs
          </Badge>
          <span>Daily · Monthly · Due</span>
          <Link
            to="/garage-reports-hub"
            className="ml-auto font-semibold text-primary underline-offset-4 hover:underline lg:ml-0"
          >
            Garage hub →
          </Link>
        </div>
      </header>

      {/* Daily */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-col gap-2 space-y-0 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <CalendarDays className="h-4 w-4" aria-hidden />
            </span>
            <div>
              <CardTitle className="text-lg leading-tight">Daily report</CardTitle>
              <CardDescription className="text-xs leading-snug">Pick a service day — KPIs and revenue mix.</CardDescription>
            </div>
          </div>
          <Input
            type="date"
            value={reportDate}
            onChange={(e) => setReportDate(e.target.value)}
            className="h-10 w-full max-w-[188px] text-sm"
          />
        </CardHeader>
        <CardContent className="space-y-3 px-4 pb-4 pt-0">
          {dailyLoading ? (
            <div className="flex min-h-[140px] items-center justify-center gap-2 rounded-lg border border-dashed border-border/70 bg-muted/15 py-8">
              <LoadingSpinner size="sm" />
              <span className="text-xs text-muted-foreground">Loading…</span>
            </div>
          ) : dailyReport?.data ? (
            <>
              <div className="grid grid-cols-2 gap-2 lg:grid-cols-12 lg:gap-3">
                <div className="col-span-2 grid grid-cols-2 gap-2 lg:col-span-7 lg:grid-cols-4">
                  <MetricTile label="Services" accentClass="bg-teal-500">
                    {dailyReport.data.total_services}
                  </MetricTile>
                  <MetricTile label="Revenue" accentClass="bg-emerald-500">
                    <span className="text-base sm:text-lg">ETB {dailyReport.data.total_revenue.toLocaleString()}</span>
                  </MetricTile>
                  <MetricTile label="Customers" accentClass="bg-violet-500">
                    {dailyReport.data.unique_customers}
                  </MetricTile>
                  <MetricTile label="Avg ticket" accentClass="bg-amber-500">
                    <span className="text-base sm:text-lg">ETB {dailyReport.data.avg_service_cost.toFixed(0)}</span>
                  </MetricTile>
                </div>
                <div className="col-span-2 flex min-h-[168px] flex-col rounded-lg border border-border/60 bg-muted/10 px-2 py-2 lg:col-span-5">
                  <p className="mb-1 text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Revenue mix (estimate)
                  </p>
                  {dailyPieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%" minHeight={140}>
                      <PieChart>
                        <Pie
                          data={dailyPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={38}
                          outerRadius={58}
                          paddingAngle={2}
                          dataKey="value"
                          strokeWidth={0}
                        >
                          {dailyPieData.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v) => [`ETB ${Number(v).toLocaleString()}`, '']} contentStyle={chartTooltipStyle} />
                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-1 items-center justify-center text-xs text-muted-foreground">
                      No revenue this day
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border/50 pt-2 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Timer className="h-3.5 w-3.5 text-primary" aria-hidden />
                  Labor {Number(dailyReport.data.total_labor_hours || 0).toFixed(1)}h
                </span>
                <span className="inline-flex items-center gap-1">
                  <Package className="h-3.5 w-3.5 text-primary" aria-hidden />
                  Parts ETB {Number(dailyReport.data.total_parts_revenue || 0).toLocaleString()}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Percent className="h-3.5 w-3.5 text-primary" aria-hidden />
                  Discounts ETB {Number(dailyReport.data.total_discounts || 0).toLocaleString()}
                </span>
              </div>
            </>
          ) : (
            <p className="py-6 text-center text-xs text-muted-foreground">No data for this date.</p>
          )}
        </CardContent>
      </Card>

      {/* Monthly */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-col gap-2 space-y-0 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <DollarSign className="h-4 w-4" aria-hidden />
            </span>
            <div>
              <CardTitle className="text-lg leading-tight">Monthly report</CardTitle>
              <CardDescription className="text-xs leading-snug">KPIs plus pie and bar views of the same month mix.</CardDescription>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value, 10))}
              className={cn(
                'h-10 rounded-lg border border-input bg-background px-2.5 text-sm shadow-sm',
                'hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/25'
              )}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {new Date(2000, m - 1).toLocaleString('default', { month: 'short' })}
                </option>
              ))}
            </select>
            <Input
              type="number"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value, 10))}
              className="h-10 w-24 text-sm"
              min={2020}
              max={2100}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-3 px-4 pb-4 pt-0">
          {monthlyLoading ? (
            <div className="flex min-h-[180px] items-center justify-center gap-2 rounded-lg border border-dashed border-border/70 bg-muted/15 py-8">
              <LoadingSpinner size="sm" />
              <span className="text-xs text-muted-foreground">Loading…</span>
            </div>
          ) : monthlyReport?.data ? (
            <>
              <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                <MetricTile label="Services" accentClass="bg-teal-500">
                  {monthlyReport.data.total_services}
                </MetricTile>
                <MetricTile label="Revenue" accentClass="bg-emerald-500">
                  <span className="text-base sm:text-lg">ETB {monthlyReport.data.total_revenue.toLocaleString()}</span>
                </MetricTile>
                <MetricTile label="Avg ticket" accentClass="bg-violet-500">
                  <span className="text-base sm:text-lg">ETB {monthlyReport.data.avg_ticket_size.toFixed(0)}</span>
                </MetricTile>
                <MetricTile label="Customers" accentClass="bg-amber-500">
                  {monthlyReport.data.unique_customers}
                </MetricTile>
              </div>
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                <div className="h-[200px] rounded-lg border border-border/60 bg-muted/10 p-2">
                  <p className="mb-0.5 text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Mix (pie)
                  </p>
                  {monthlyPieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={monthlyPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={44}
                          outerRadius={68}
                          paddingAngle={2}
                          dataKey="value"
                          strokeWidth={0}
                        >
                          {monthlyPieData.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v) => [`ETB ${Number(v).toLocaleString()}`, '']} contentStyle={chartTooltipStyle} />
                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                      No split data
                    </div>
                  )}
                </div>
                <div className="h-[200px] rounded-lg border border-border/60 bg-muted/10 p-2">
                  <p className="mb-0.5 text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Mix (bars)
                  </p>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        {
                          name: 'Month',
                          Labor: monthlyReport.data.labor_revenue,
                          Parts: monthlyReport.data.parts_revenue,
                          Tax: monthlyReport.data.tax_collected,
                        },
                      ]}
                      margin={{ top: 4, right: 4, left: 4, bottom: 4 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} width={44} />
                      <Tooltip contentStyle={chartTooltipStyle} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Bar dataKey="Labor" fill="#0d9488" radius={[5, 5, 0, 0]} />
                      <Bar dataKey="Parts" fill="#10b981" radius={[5, 5, 0, 0]} />
                      <Bar dataKey="Tax" fill="#f59e0b" radius={[5, 5, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          ) : (
            <p className="py-6 text-center text-xs text-muted-foreground">No monthly data.</p>
          )}
        </CardContent>
      </Card>

      {/* Customers due */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center gap-2.5 space-y-0 py-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Users className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <CardTitle className="text-lg leading-tight">Customers due for service</CardTitle>
            <CardDescription className="text-xs leading-snug">Within 7 days — bar shows relative urgency.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0">
          {dueLoading ? (
            <div className="flex min-h-[100px] items-center justify-center gap-2 rounded-lg border border-dashed border-border/70 bg-muted/15 py-7">
              <LoadingSpinner size="sm" />
              <span className="text-xs text-muted-foreground">Loading…</span>
            </div>
          ) : customersDue?.data && customersDue.data.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-border/70">
              <table className="w-full text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-left">
                    <th className="whitespace-nowrap px-3 py-2 font-semibold text-muted-foreground">Customer</th>
                    <th className="whitespace-nowrap px-3 py-2 font-semibold text-muted-foreground">Vehicle</th>
                    <th className="whitespace-nowrap px-3 py-2 font-semibold text-muted-foreground">Now km</th>
                    <th className="whitespace-nowrap px-3 py-2 font-semibold text-muted-foreground">Next km</th>
                    <th className="whitespace-nowrap px-3 py-2 font-semibold text-muted-foreground">Left</th>
                    <th className="whitespace-nowrap px-3 py-2 font-semibold text-muted-foreground">Urgency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/70">
                  {customersDue.data.map((customer, index) => {
                    const up = urgencyBarPct(customer.mileage_remaining)
                    return (
                      <tr key={index} className="bg-card hover:bg-muted/20">
                        <td className="px-3 py-2">
                          <div className="font-medium leading-tight text-foreground">{customer.customer_name}</div>
                          <div className="text-[11px] text-muted-foreground">{customer.email}</div>
                        </td>
                        <td className="max-w-[160px] truncate px-3 py-2 text-foreground">
                          {customer.make} {customer.model}{' '}
                          <span className="font-mono text-muted-foreground">({customer.license_plate})</span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 tabular-nums">{customer.current_mileage.toLocaleString()}</td>
                        <td className="whitespace-nowrap px-3 py-2 tabular-nums">{customer.next_service_mileage.toLocaleString()}</td>
                        <td className="whitespace-nowrap px-3 py-2 tabular-nums">
                          <span
                            className={cn(
                              customer.mileage_remaining <= 500 ? 'font-semibold text-rose-600' : 'text-foreground'
                            )}
                          >
                            {customer.mileage_remaining.toLocaleString()}
                          </span>
                        </td>
                        <td className="w-[72px] px-3 py-2">
                          <div className="h-2 overflow-hidden rounded-full bg-muted">
                            <div
                              className={cn(
                                'h-full rounded-full transition-all',
                                up >= 70 ? 'bg-gradient-to-r from-rose-500 to-orange-400' : 'bg-teal-400/80'
                              )}
                              style={{ width: `${up}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border/70 bg-muted/10 py-10 text-center">
              <RefreshCw className="h-7 w-7 text-muted-foreground/45" aria-hidden />
              <p className="text-xs font-medium text-muted-foreground">No vehicles due in the next 7 days.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
