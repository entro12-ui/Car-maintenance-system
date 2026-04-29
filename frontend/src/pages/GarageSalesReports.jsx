import GarageReportListingBase from './_GarageReportListingBase'

const GARAGE_SALES_REPORTS = [
  { name: 'Garage Sales Summary By Date', reportId: 92101 },
  { name: 'Garage Sales Summary - For Accounts', reportId: 92102 },
  { name: 'Garage Sales Summary', reportId: 92103 },
  { name: 'Garage Daily Sales Detail', reportId: 92104 },
  { name: 'Garage Sales By Repair Type', reportId: 92105 },
  { name: 'Hours Sold and Unit Serviced by Repair Type', reportId: 92106 },
]

export default function GarageSalesReports() {
  return (
    <GarageReportListingBase
      title="Garage Sales Reports"
      subtitle="Standard garage sales reports (Name + Report Id). Double click the report name to generate by ID."
      reports={GARAGE_SALES_REPORTS}
    />
  )
}

