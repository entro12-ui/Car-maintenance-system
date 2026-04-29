import { Link } from 'react-router-dom'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TRANSACTION_MENU, transactionPath } from './TransactionSidebarMenu'

const GROUP_TITLE = {
  1: 'Item issue',
  2: 'Fuel and lubricant',
  3: 'Charges',
  4: 'Reserve and return',
  5: 'Sublet entry',
  6: 'Sublet control',
}

const BLURBS = {
  'item-issue': 'Issue parts or stocked items against a job order.',
  'item-issue-from-reserve': 'Convert reserved items into issued job consumption.',
  'garage-issue-requisition': 'Raise or review requisitions before item issue.',
  'internal-fuel-and-lubricant-issue': 'Record internal fuel and lubricant usage.',
  'fuel-issue-km-editing': 'Correct odometer / KM readings attached to fuel issues.',
  'labour-charge-entry': 'Capture labour charges for job costing and invoicing.',
  'miscellaneous-charge-entry': 'Post miscellaneous charge lines against jobs.',
  'lubricants-and-fuel-charge-entry': 'Charge fuel and lubricant lines to work orders.',
  'sublet-work-charge-entry': 'Record third-party work charges against a job.',
  'other-charges': 'Maintain or post other charge lines.',
  'labour-misc-lub-sublet-charge-entry': 'Combined charge entry for labour, misc, lubricant, and sublet lines.',
  'item-reserve': 'Reserve stock for a job before issue.',
  'request-for-return': 'Request return of issued items back to stock.',
  'approve-request-for-return': 'Approve pending return requests.',
  'sublet-order-entry': 'Create sublet orders for supplier work.',
  'sublet-order-entry-internal-vehicle': 'Create sublet orders for internal vehicle work.',
  'sublet-order-approval': 'Approve requested sublet orders.',
  'sublet-order-receiving': 'Receive completed sublet work and costs.',
}

export default function TransactionHub() {
  const groups = [1, 2, 3, 4, 5, 6]

  return (
    <div className="space-y-8">
      <div className="space-y-2 max-w-3xl">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Transaction</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          HillMaster-style <strong>Transaction</strong> menu for item issue, charge entry, returns, and sublet order
          workflow. Existing application screens are reused where available.
        </p>
      </div>

      <div className="space-y-8">
        {groups.map((group) => {
          const items = TRANSACTION_MENU.filter((item) => item.group === group)
          if (items.length === 0) return null

          return (
            <div key={group}>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                {GROUP_TITLE[group]}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {items.map((item) => (
                  <Link key={item.slug} to={transactionPath(item.slug)} className="group block h-full">
                    <Card className="h-full transition-all border-border/80 shadow-sm hover:border-primary/40 hover:shadow-md hover:bg-gradient-to-br hover:from-primary/[0.03] hover:to-transparent">
                      <CardHeader className="space-y-2 py-4">
                        <CardTitle className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-snug">
                          {item.label}
                        </CardTitle>
                        <CardDescription className="text-xs leading-relaxed">
                          {BLURBS[item.slug] || 'Garage transaction entry.'}
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
