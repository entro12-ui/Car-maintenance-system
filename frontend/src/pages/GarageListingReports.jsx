import GarageReportListingBase from './_GarageReportListingBase'

const GARAGE_LISTING_REPORTS = [
  { name: 'Job Order Followup Report - Detail', reportId: 92001 },
  { name: 'Job Order Followup Report - Detail', reportId: 92001 },
  { name: 'Job Order Followup Report - Summary', reportId: 92002 },
  { name: 'On Process Jobs By Section/Unit', reportId: 92003 },
  { name: 'Job Order Not Started By Section/Unit', reportId: 92004 },
  { name: 'Job Order Status', reportId: 92005 },
  { name: 'Job Order On Process by Technician', reportId: 92006 },
  { name: 'Job Order Status By Job Card No', reportId: 92007 },
  { name: 'Job Order Not Dispatched', reportId: 92008 },
  { name: 'On Process Job Card - Detail', reportId: 92009 },
  { name: 'On Process Job Card - Summary', reportId: 92010 },
  { name: 'On Process Job Card - By Technician', reportId: 92011 },
  { name: 'Job Order Opened By Date', reportId: 92012 },
  { name: 'Closed Job Order By Date', reportId: 92013 },
  { name: 'WIP By Job Order No', reportId: 92014 },
  { name: 'WIP By Job Order No - Summary', reportId: 92015 },
  { name: 'UnCollected Job Order', reportId: 92016 },
  { name: 'UnCollected Job Order - Summary', reportId: 92017 },
  { name: 'Charge Transaction Listing - Detail', reportId: 92018 },
  { name: 'Charge Transaction Listing - Summary', reportId: 92019 },
  { name: 'Job Order Transaction Listing By Charge Category - Detail', reportId: 92020 },
  { name: 'Job Order Transaction Listing By Charge Category - Summary', reportId: 92021 },
  { name: 'Job Order Reopened But Not Closed', reportId: 92022 },
  { name: 'Job Order Closed But Not Invoiced', reportId: 92023 },
  { name: 'Delivered Job Order by Date Range', reportId: 92024 },
  { name: 'Delivered Job Order by Date Range - Summary', reportId: 92025 },
  { name: 'Job Order Closed By Date Range - Detail', reportId: 92030 },
]

export default function GarageListingReports() {
  return (
    <GarageReportListingBase
      title="Listing Reports"
      subtitle="Standard listing reports (Name + Report Id). Double click the report name to generate by ID."
      reports={GARAGE_LISTING_REPORTS}
    />
  )
}

