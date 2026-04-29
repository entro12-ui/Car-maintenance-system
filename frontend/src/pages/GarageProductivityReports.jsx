import GarageReportListingBase from './_GarageReportListingBase'

const GARAGE_PRODUCTIVITY_REPORTS = [
  { name: 'Labour Utilization and Productivity By Department', reportId: 92301 },
  { name: 'Labour Utilization and Productivity By Section', reportId: 92302 },
  { name: 'Labour Utilization and Productivity By Unit', reportId: 92303 },
  { name: 'Labour Utilization and Productivity By Technician', reportId: 92304 },
  { name: 'Labour Sales and Vehicle Serviced By Technician', reportId: 92305 },
  { name: 'Labour Sales and Vehicle Serviced By Unit', reportId: 92306 },
  { name: 'Labour Sales and Vehicle Serviced By Section', reportId: 92307 },
  { name: 'Labour Sales and Vehicle Serviced By Technician Detail', reportId: 92308 },
  { name: 'Technician Available Hours - By Date', reportId: 92309 },
  { name: 'Job Order Movement Report', reportId: 92310 },
  { name: 'Job Order Movement Report - Summary', reportId: 92311 },
  { name: 'Labour Utilization and Productivity By Station', reportId: 92320 },
]

export default function GarageProductivityReports() {
  return (
    <GarageReportListingBase
      title="Garage Productivity Reports"
      subtitle="Standard garage productivity reports (Name + Report Id). Double click the report name to generate by ID."
      reports={GARAGE_PRODUCTIVITY_REPORTS}
    />
  )
}

