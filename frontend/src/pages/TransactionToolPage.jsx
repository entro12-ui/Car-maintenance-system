import { useMemo } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import SetupScreenFrame from './SetupScreenFrame'
import { TRANSACTION_MENU } from './TransactionSidebarMenu'

const TRANSACTION_REDIRECTS = {
  'labour-charge-entry': '/job-orders/additional-charges',
  'miscellaneous-charge-entry': '/job-orders/additional-charges',
  'lubricants-and-fuel-charge-entry': '/job-orders/additional-charges',
  'sublet-work-charge-entry': '/job-orders/additional-charges',
  'other-charges': '/job-orders/additional-charges',
  'labour-misc-lub-sublet-charge-entry': '/job-orders/additional-charges',
  'sublet-order-entry': '/job-orders/sublet-orders/entry',
  'sublet-order-entry-internal-vehicle': '/job-orders/sublet-orders/entry',
  'sublet-order-approval': '/job-orders/sublet-orders/approval',
  'sublet-order-receiving': '/job-orders/sublet-orders/receiving',
}

const DEFAULT_RELATED = [
  { to: '/job-orders', label: 'Job orders' },
  { to: '/parts', label: 'Parts' },
  { to: '/transactions-hub', label: 'Transaction hub' },
]

export default function TransactionToolPage() {
  const { slug } = useParams()
  const entry = useMemo(() => TRANSACTION_MENU.find((item) => item.slug === slug), [slug])
  const redirect = slug ? TRANSACTION_REDIRECTS[slug] : null

  if (!slug || !entry) {
    return <Navigate to="/transactions-hub" replace />
  }

  if (redirect) {
    return <Navigate to={redirect} replace />
  }

  return (
    <SetupScreenFrame
      hubTo="/transactions-hub"
      hubLabel="Transaction"
      relatedSectionDescription="Open related job, inventory, or charge screens while this transaction form is implemented."
      reviewSectionDescription="Quick controls to verify before posting live transaction quantities or values."
      title={entry.label}
      subtitle={`HillMaster-style transaction entry for “${entry.label}”. A dedicated form and API can be added here; use related job and parts screens for live records already supported today.`}
      reviewPoints={[
        'Confirm the job order, item code, and quantity before posting any stock movement.',
        'Check reserve or return approvals before converting the transaction to an issue or credit.',
        'Reconcile parts, job cost, and invoice totals after adding new posting logic.',
      ]}
      relatedLinks={DEFAULT_RELATED}
    >
      <Card className="border-dashed bg-muted/20">
        <CardHeader>
          <CardTitle className="text-base">Implementation status</CardTitle>
          <CardDescription>
            This transaction menu entry is now reachable from the sidebar. Inventory issue, reserve, fuel, and return
            forms can be wired incrementally. Use{' '}
            <Link to="/parts" className="text-primary font-medium hover:underline">
              Parts
            </Link>{' '}
            and{' '}
            <Link to="/job-orders" className="text-primary font-medium hover:underline">
              Job orders
            </Link>{' '}
            for existing operational data today.
          </CardDescription>
        </CardHeader>
      </Card>
    </SetupScreenFrame>
  )
}
