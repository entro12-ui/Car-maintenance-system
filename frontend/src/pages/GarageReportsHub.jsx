import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BarChart3,
  ClipboardList,
  Factory,
  FileSpreadsheet,
  Layers,
  LineChart,
  PieChart,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import AiAssistantPromo from '@/components/AiAssistantPromo'
import { cn } from '@/lib/utils'

const structuredFamilies = [
  {
    title: 'Listing reports',
    description: 'Master listings and transaction detail — jobs, invoices, stock movements.',
    to: '/garage-reports-hub/listing',
    icon: ClipboardList,
    tone: 'from-teal-500 to-emerald-600',
  },
  {
    title: 'Garage sales reports',
    description: 'Invoice totals, discounts, and revenue breakdown by outlet or period.',
    to: '/garage-reports-hub/sales',
    icon: BarChart3,
    tone: 'from-amber-500 to-orange-600',
  },
  {
    title: 'Garage productivity',
    description: 'Technician hours, throughput, and labor-linked productivity views.',
    to: '/garage-reports-hub/productivity',
    icon: Factory,
    tone: 'from-violet-500 to-purple-700',
  },
  {
    title: 'Other reports',
    description: 'Control and operational reports outside core sales and labor.',
    to: '/garage-reports-hub/others',
    icon: PieChart,
    tone: 'from-slate-600 to-slate-800',
  },
]

export default function GarageReportsHub() {
  return (
    <div className="animate-fade-in space-y-10 pb-6">
      <header className="border-b border-border/60 pb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">Reporting</p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Garage reports dashboard
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Jump into grouped garage reports by manual alignment, or use{' '}
          <strong className="font-semibold text-foreground">analytics summaries</strong> for daily and monthly KPIs with
          charts. HillMaster-style report menus live under Reports Hub when you need the structured navigator.
        </p>
      </header>

      <AiAssistantPromo
        mode="reports"
        title="Need help choosing or reading a report?"
        description="Ask which family fits your question (listing vs sales vs productivity), typical filters, or how to interpret KPIs."
        examples={[
          'What is usually in a listing report vs a sales report?',
          'How should I pick a date range for month-end?',
        ]}
      />

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-card via-card to-primary/[0.06] shadow-md">
          <CardHeader className="relative z-10 pb-3">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-teal-600 text-white shadow-lg shadow-primary/25">
                <LineChart className="h-6 w-6" aria-hidden />
              </span>
              <div className="min-w-0 space-y-1">
                <CardTitle className="text-xl">Operational analytics</CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  Daily and monthly revenue splits (labor, parts, tax), service counts, and customers approaching due
                  service — backed by live data.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative z-10 flex flex-wrap gap-3 pt-0">
            <Button asChild className="gap-2">
              <Link to="/reports">
                Open reports & charts
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-border/80 shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted">
                <Layers className="h-6 w-6 text-foreground" aria-hidden />
              </span>
              <div className="min-w-0 space-y-1">
                <CardTitle className="text-xl">HillMaster report menu</CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  Listing, sales, productivity, others — plus custom and user-defined placeholders routed through the
                  same navigator used elsewhere in the app.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3 pt-0">
            <Button variant="outline" asChild className="gap-2">
              <Link to="/reports-hub">
                Reports Hub
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <section>
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">
              Garage report families
            </h2>
            <p className="text-sm text-muted-foreground">
              Manual-aligned categories — each opens its picker screen for HillMaster-style report IDs.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
          {structuredFamilies.map(({ title, description, to, icon: Icon, tone }) => (
            <Link key={to} to={to} className="group block h-full">
              <Card
                className={cn(
                  'h-full border-border/70 shadow-sm transition-all duration-300',
                  'hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-lg hover:shadow-primary/[0.07]'
                )}
              >
                <CardHeader className="space-y-3 pb-3">
                  <span
                    className={cn(
                      'inline-flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-md',
                      'bg-gradient-to-br',
                      tone
                    )}
                  >
                    <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
                  </span>
                  <CardTitle className="text-base font-semibold leading-snug">{title}</CardTitle>
                  <CardDescription className="text-sm leading-relaxed">{description}</CardDescription>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary group-hover:underline">
                    Open family
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <Card className="border-dashed border-primary/25 bg-muted/20">
        <CardHeader className="flex flex-row items-start gap-3 pb-2">
          <FileSpreadsheet className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
          <div>
            <CardTitle className="text-base">Custom & user-defined</CardTitle>
            <CardDescription>
              Custom layouts and saved definitions currently reuse the operational analytics page (
              <Link to="/reports" className="font-semibold text-primary underline-offset-4 hover:underline">
                /reports
              </Link>
              ). Extend backend runners later without changing this landing layout.
            </CardDescription>
          </div>
        </CardHeader>
      </Card>
    </div>
  )
}
