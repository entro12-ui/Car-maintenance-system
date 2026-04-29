import { Link } from 'react-router-dom'
import SetupScreenFrame from './SetupScreenFrame'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function GarageEstimationTemplate() {
  return (
    <SetupScreenFrame
      hubTo="/garage-invoices-hub"
      hubLabel="Garage Invoices"
      relatedSectionDescription="Jump to live estimation and booking screens while template storage is implemented."
      reviewSectionDescription="Confirm template versions and tax wording before rolling out to all estimators."
      title="Estimation Template"
      subtitle="Define reusable estimate layouts, default labour/parts lines, and print footers so Job Estimation stays consistent across branches."
      reviewPoints={[
        'Version each template change so open estimates do not silently pick up new wording.',
        'Align VAT and discount behaviour with Company setup and GL account setup.',
        'Pilot a template on one estimator before marking it as the company default.',
      ]}
      relatedLinks={[
        { to: '/garage-invoices/job-estimation', label: 'Job Estimation' },
        { to: '/garage-invoices/advanced-booking', label: 'Advance Booking' },
        { to: '/company-setup', label: 'Company setup' },
      ]}
    >
      <Card className="border-dashed bg-muted/20">
        <CardHeader>
          <CardTitle className="text-base">Implementation status</CardTitle>
          <CardDescription>
            Template persistence and designer UI are not wired yet. Use{' '}
            <Link to="/garage-invoices/job-estimation" className="text-primary font-medium hover:underline">
              Job Estimation
            </Link>{' '}
            for live quotes today.
          </CardDescription>
        </CardHeader>
      </Card>
    </SetupScreenFrame>
  )
}
