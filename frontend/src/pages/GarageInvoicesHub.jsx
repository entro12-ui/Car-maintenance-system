import { Link } from 'react-router-dom'
import { GARAGE_INVOICES_MENU } from './GarageInvoicesSidebarMenu'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const BLURBS = {
  '/garage-invoices/proforma': 'Draft or print proforma invoices before converting to cash or credit.',
  '/garage-invoices/cash': 'Record cash sales and immediate payment.',
  '/garage-invoices/credit': 'Issue on-account / credit garage invoices.',
  '/garage-invoices/itm': 'Invoice by item (ITM) lines and totals.',
  '/garage-invoices/discount-rate': 'Maintain discount codes and rates applied at invoice time.',
  '/garage-invoices/credit-note': 'Post credit notes against prior invoices.',
  '/garage-invoices/cancel-return': 'Cancel or return posted invoice lines with audit trail.',
  '/garage-invoices/clear-uncollected': 'Clear or flush unprinted / uncollected sales orders per procedure.',
  '/garage-invoices/cancel-vrv': 'Cancel VRV (vehicle release / valuation) entries where applicable.',
  '/garage-invoices/job-estimation': 'Build and manage job estimates linked to work.',
  '/garage-invoices/estimation-template': 'Reusable layouts and defaults for estimates.',
  '/garage-invoices/advanced-booking': 'Schedule and manage advance service bookings.',
}

const GROUP_TITLE = {
  1: 'Core invoices',
  2: 'Adjustments',
  3: 'Sales order control',
  4: 'Estimation & VRV',
  5: 'Booking',
}

export default function GarageInvoicesHub() {
  const groups = [1, 2, 3, 4, 5]
  return (
    <div className="space-y-8">
      <div className="space-y-2 max-w-3xl">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Garage Invoices</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          HillMaster-style <strong>Garage Invoices</strong> menu. Each card opens the matching screen in this application.
        </p>
      </div>

      <div className="space-y-8">
        {groups.map((g) => {
          const items = GARAGE_INVOICES_MENU.filter((x) => x.group === g)
          if (items.length === 0) return null
          return (
            <div key={g}>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                {GROUP_TITLE[g]}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {items.map((item) => (
                  <Link key={item.path} to={item.path} className="group block h-full">
                    <Card className="h-full transition-all border-border/80 shadow-sm hover:border-primary/40 hover:shadow-md hover:bg-gradient-to-br hover:from-primary/[0.03] hover:to-transparent">
                      <CardHeader className="space-y-2 py-4">
                        <CardTitle className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                          {item.label}
                        </CardTitle>
                        <CardDescription className="text-sm leading-relaxed">
                          {BLURBS[item.path] || 'Garage invoice function.'}
                        </CardDescription>
                        <span className="text-xs font-medium text-primary pt-0.5 group-hover:underline">Open →</span>
                      </CardHeader>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
