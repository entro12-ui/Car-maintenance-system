import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { REPORT_MENU, reportsPath } from './ReportsSidebarMenu'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/PageChrome'
import AiAssistantPromo from '@/components/AiAssistantPromo'

const BLURBS = {
  listing: 'Master and transaction listings (jobs, invoices, stock movements).',
  sales: 'Revenue, discounts, and sales performance by period or outlet.',
  productivity: 'Technician hours, job throughput, and bay utilization.',
  others: 'Operational and control reports outside core sales and labor.',
  'custom-report': 'Run bespoke layouts built for your garage.',
  'user-defined-report': 'Saved definitions and parameters for repeat runs.',
  'edit-user-defined-report': 'Design or adjust columns, filters, and layouts.',
}

export default function ReportsHub() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Navigator"
        title="Reports hub"
        description={
          <>
            HillMaster-style <strong>Reports</strong> menu. Standard groups cover listing, sales, productivity, and
            other families; custom entries route to analytics where wired.
          </>
        }
        actions={
          <Button variant="outline" asChild className="shrink-0 gap-2">
            <Link to="/garage-reports-hub">
              Garage reports dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        }
      />

      <AiAssistantPromo
        mode="reports"
        title="Report assistant"
        description="Get suggestions on which report to run, typical filters, and how to interpret listings, sales, and productivity outputs."
        examples={[
          'Which report should I use for monthly sales totals?',
          'How do listing reports differ from sales reports?',
          'What parameters should I set before exporting?',
        ]}
      />

      <div className="space-y-6">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Listing & performance</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {REPORT_MENU.filter((r) => r.group === 'standard').map((item) => (
              <ReportCard key={item.slug} item={item} />
            ))}
          </div>
        </div>
        <div className="border-t border-border pt-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Custom & user defined</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {REPORT_MENU.filter((r) => r.group === 'custom').map((item) => (
              <ReportCard key={item.slug} item={item} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function ReportCard({ item }) {
  const to = reportsPath(item.slug)
  return (
    <Link to={to} className="group block h-full">
      <Card className="h-full transition-all border-border/80 shadow-sm hover:border-primary/40 hover:shadow-md hover:bg-gradient-to-br hover:from-primary/[0.03] hover:to-transparent">
        <CardHeader className="space-y-2 py-4">
          <CardTitle className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
            {item.label}
          </CardTitle>
          <CardDescription className="text-sm leading-relaxed">{BLURBS[item.slug] || 'Report entry.'}</CardDescription>
          <span className="text-xs font-medium text-primary pt-0.5 group-hover:underline">Open →</span>
        </CardHeader>
      </Card>
    </Link>
  )
}
