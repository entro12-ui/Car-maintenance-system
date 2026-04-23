import { Link } from 'react-router-dom'

const groups = [
  { title: 'Listing Reports', desc: 'Master and transaction listings' },
  { title: 'Garage Sales Reports', desc: 'Invoice and sales performance' },
  { title: 'Garage Productivity Reports', desc: 'Technician and job productivity' },
  { title: 'Other Reports', desc: 'Operational and control reports' },
  { title: 'Custom Reports', desc: 'Custom built reports' },
  { title: 'User Defined Reports', desc: 'User-managed report definitions' },
]

export default function GarageReportsHub() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-800">Garage Reports Hub</h1>
      <p className="text-sm text-gray-600">
        Report groups aligned with the manual. Use the standard reports page to run currently available reports.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map((g) => (
          <div key={g.title} className="bg-white shadow rounded-lg p-4 border">
            <h2 className="font-semibold text-gray-800">{g.title}</h2>
            <p className="text-sm text-gray-600 mt-1">{g.desc}</p>
            <Link to="/reports" className="text-indigo-600 text-sm hover:text-indigo-800 mt-3 inline-block">
              Open Reports
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}

