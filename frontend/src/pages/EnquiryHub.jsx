import { Link } from 'react-router-dom'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ENQUIRY_MENU, enquiryPath } from './EnquirySidebarMenu'

const BLURBS = {
  'job-order': 'Find job orders and inspect status, customer, vehicle, and work summary.',
  'products-or-parts': 'Look up product or part availability and master details.',
  'job-order-statement': 'Review job order statement lines and cost movement.',
  'stock-movement': 'Inspect stock issue, reserve, and return movement history.',
  'issue-enquiry': 'Search issued parts and consumables by job or period.',
  'reserve-enquiry': 'Review reserved quantities before issue.',
  'supplier-price-list-enquiry': 'Check supplier pricing references.',
  'internal-fuel-and-lubricant-issue': 'Review internal fuel and lubricant issue records.',
  'garage-invoice-enquiry': 'Search garage invoices and posted totals.',
  'lost-sales-enquiry-by-date': 'Review lost sales by selected date range.',
  'vrv-enquiry': 'Inspect VRV records and status.',
  'job-order-payment-enquiry': 'Review payments linked to job orders.',
  'estimation-enquiry': 'Search estimates and customer responses.',
  'journal-enquiry': 'Inspect GL journal entries and posting state.',
  'sublet-order': 'Review sublet order entry, approval, and receiving status.',
  appointment: 'Search appointments by customer, vehicle, date, or status.',
  'list-of-invoice-by-customer': 'List customer invoices and balances.',
  'view-audit-log': 'Review activity and change history.',
}

export default function EnquiryHub() {
  return (
    <div className="space-y-8">
      <div className="space-y-2 max-w-3xl">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Enquiry</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          HillMaster-style <strong>Enquiry</strong> menu for read-only lookup screens across jobs, stock, invoices,
          appointments, journals, and audit logs.
        </p>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <p>
            The enquiry menu is used to retrieve information on jobs accepted for action. Sub menus are organized for
            logical information retrieval.
          </p>
          <p className="mt-1">
            Users with valid access privilege can open each sub menu to enquire summary or detailed transaction/job
            data by entering a locator value or using filter criteria in the appropriate fields.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {ENQUIRY_MENU.map((item) => (
          <Link key={item.slug} to={enquiryPath(item.slug)} className="group block h-full">
            <Card className="h-full transition-all border-border/80 shadow-sm hover:border-primary/40 hover:shadow-md hover:bg-gradient-to-br hover:from-primary/[0.03] hover:to-transparent">
              <CardHeader className="space-y-2 py-4">
                <CardTitle className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-snug">
                  {item.label}
                </CardTitle>
                <CardDescription className="text-xs leading-relaxed">
                  {BLURBS[item.slug] || 'Read-only enquiry screen.'}
                </CardDescription>
                <span className="text-xs font-medium text-primary pt-0.5 group-hover:underline">Open →</span>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
