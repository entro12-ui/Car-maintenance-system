import GarageReportListingBase from './_GarageReportListingBase'

const GARAGE_OTHER_REPORTS = [
  { reportId: 92312, name: 'Job Order By Last Clock Out Reason - Detail' },
  { reportId: 92313, name: 'Job Order By Last Clock Out Reason - Summary' },
  { reportId: 92314, name: 'List of Active Jobs' },
]

export default function GarageOtherReports() {
  return (
    <GarageReportListingBase
      title="Other Reports"
      subtitle="Standard garage other reports in terms of report name and report id. Double click a report name to generate."
      reports={GARAGE_OTHER_REPORTS}
    />
  )
}

