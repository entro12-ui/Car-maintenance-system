import { useMemo } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import SetupScreenFrame from './SetupScreenFrame'
import { ENQUIRY_MENU } from './EnquirySidebarMenu'

const ENQUIRY_REDIRECTS = {
  'job-order': '/job-orders',
  'products-or-parts': '/parts',
  'garage-invoice-enquiry': '/garage-invoices-hub',
  'estimation-enquiry': '/garage-invoices/job-estimation',
  'journal-enquiry': '/gl/journals',
  'sublet-order': '/job-orders/sublet-orders/entry',
  appointment: '/appointments',
  'list-of-invoice-by-customer': '/reports',
}

const DEFAULT_RELATED = [
  { to: '/job-orders', label: 'Job orders' },
  { to: '/parts', label: 'Parts' },
  { to: '/enquiries-hub', label: 'Enquiry hub' },
]

export default function EnquiryToolPage() {
  const { slug } = useParams()
  const entry = useMemo(() => ENQUIRY_MENU.find((item) => item.slug === slug), [slug])
  const redirect = slug ? ENQUIRY_REDIRECTS[slug] : null

  if (!slug || !entry) {
    return <Navigate to="/enquiries-hub" replace />
  }

  if (redirect) {
    return <Navigate to={redirect} replace />
  }

  return (
    <SetupScreenFrame
      hubTo="/enquiries-hub"
      hubLabel="Enquiry"
      relatedSectionDescription="Open live list and reporting screens while this dedicated enquiry is implemented."
      reviewSectionDescription="Use these checks before trusting enquiry totals for operations or finance decisions."
      title={entry.label}
      subtitle={`HillMaster-style read-only enquiry for “${entry.label}”. A focused filter/search table can be added here as the underlying API becomes available.`}
      reviewPoints={[
        'Keep enquiry screens read-only unless the workflow explicitly requires correction actions.',
        'Match filters to operational keys such as job order, customer, vehicle, invoice, date, and item code.',
        'Validate totals against source transaction screens before using them for month-end review.',
      ]}
      relatedLinks={DEFAULT_RELATED}
    >
      <Card className="border-dashed bg-muted/20">
        <CardHeader>
          <CardTitle className="text-base">Implementation status</CardTitle>
          <CardDescription>
            This enquiry entry is reachable from the sidebar. Dedicated search fields and result grids can be wired
            incrementally. Use{' '}
            <Link to="/job-orders" className="text-primary font-medium hover:underline">
              Job orders
            </Link>{' '}
            and{' '}
            <Link to="/reports" className="text-primary font-medium hover:underline">
              Reports
            </Link>{' '}
            for available lookup and summary data today.
          </CardDescription>
        </CardHeader>
      </Card>
    </SetupScreenFrame>
  )
}
