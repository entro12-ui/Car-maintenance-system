import { useMemo } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import SetupScreenFrame from './SetupScreenFrame'
import { REPORT_MENU } from './ReportsSidebarMenu'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import CustomReports from './CustomReports'
import EditUserDefinedReport from './EditUserDefinedReport'

const REPORT_REDIRECTS = {
  listing: '/garage-reports-hub/listing',
  sales: '/garage-reports-hub/sales',
  productivity: '/garage-reports-hub/productivity',
  others: '/garage-reports-hub/others',
}

const DEFAULT_RELATED = [
  { to: '/reports', label: 'Reports dashboard' },
  { to: '/garage-reports-hub', label: 'Garage reports hub' },
  { to: '/reports-hub', label: 'Reports hub' },
]

export default function ReportsToolPage() {
  const { slug } = useParams()
  const entry = useMemo(() => REPORT_MENU.find((r) => r.slug === slug), [slug])
  const redirect = slug ? REPORT_REDIRECTS[slug] : null

  if (!slug || !entry) {
    return <Navigate to="/reports-hub" replace />
  }

  if (redirect) {
    return <Navigate to={redirect} replace />
  }

  const customEntry = entry.slug === 'custom-report' || entry.slug === 'user-defined-report'

  if (customEntry) {
    return (
      <SetupScreenFrame
        hubTo="/reports-hub"
        hubLabel="Reports"
        relatedSectionDescription="Open standard report areas or the garage hub while custom report builders are implemented."
        reviewSectionDescription="Confirm filters and parameters before running custom/user reports."
        title={entry.slug === 'user-defined-report' ? 'User defined reports' : 'Custom reports'}
        subtitle={
          entry.slug === 'user-defined-report'
            ? 'This page lists user defined reports so you can generate as needed and define your own reports using available data fields.'
            : 'List of setup custom reports. Double click a report type to run, or edit its fields/definition.'
        }
        relatedLinks={DEFAULT_RELATED}
        reviewPoints={[
          'Keep field definitions aligned with available modules and data sources.',
          'Test the same report for different date ranges before sharing.',
          'Only allow authorized users to edit report definitions to avoid layout drift.',
        ]}
      >
        <CustomReports mode={entry.slug === 'user-defined-report' ? 'user-defined' : 'custom'} />
      </SetupScreenFrame>
    )
  }

  if (entry.slug === 'edit-user-defined-report') {
    return (
      <SetupScreenFrame
        hubTo="/reports-hub"
        hubLabel="Reports"
        relatedSectionDescription="Edit and maintain user-defined report fields and layout configuration."
        reviewSectionDescription="Save report definition JSON and verify it before running."
        title="Edit user defined report"
        subtitle="Change report name/code and update its definition (query_definition)."
        relatedLinks={DEFAULT_RELATED}
        reviewPoints={[
          'Ensure report_code is unique before saving.',
          'Keep query_definition valid JSON; syntax errors will break the UI preview.',
          'Test with a date range on the run screen after edits.',
        ]}
      >
        <EditUserDefinedReport />
      </SetupScreenFrame>
    )
  }

  return (
    <SetupScreenFrame
      hubTo="/reports-hub"
      hubLabel="Reports"
      relatedSectionDescription="Open standard report areas or the garage hub while custom report builders are implemented."
      reviewSectionDescription="Confirm filters, date ranges, and export formats before distributing figures outside finance."
      title={entry.label}
      subtitle={`HillMaster-style report entry for “${entry.label}”. Builder UI and saved definitions can be added here; use the reports dashboard and garage hub for live summaries today.`}
      reviewPoints={[
        'Align column definitions with GL and job order fields before publishing a user-defined layout.',
        'Test the same report for a closed month and compare totals to control totals.',
        'Restrict who can edit user-defined reports to avoid accidental layout drift.',
      ]}
      relatedLinks={DEFAULT_RELATED}
    >
      <Card className="border-dashed bg-muted/20">
        <CardHeader>
          <CardTitle className="text-base">Implementation status</CardTitle>
          <CardDescription>
            Custom and user-defined reporting screens are navigation stubs. Use{' '}
            <Link to="/reports" className="text-primary font-medium hover:underline">
              Reports
            </Link>{' '}
            and{' '}
            <Link to="/garage-reports-hub" className="text-primary font-medium hover:underline">
              Garage reports hub
            </Link>{' '}
            for grouped access to existing analytics.
          </CardDescription>
        </CardHeader>
      </Card>
    </SetupScreenFrame>
  )
}
