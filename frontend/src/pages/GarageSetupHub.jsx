import { Link } from 'react-router-dom'

const setupItems = [
  { label: 'Working Hour Setup', category: 'working_hour' },
  { label: 'Working Calendar Setup', category: 'working_calendar' },
  { label: 'Workgroup Setup', category: 'workgroup' },
  { label: 'Job Type Allowed By User', category: 'job_type_allowed_user' },
  { label: 'Garage Locations', category: 'garage_location' },
  { label: 'Repair Sections', category: 'repair_section' },
  { label: 'Job Types', category: 'job_type' },
]

export default function GarageSetupHub() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-800">Setup Hub</h1>
      <p className="text-sm text-gray-600">
        Quick access to setup pages defined in the manual. Each item opens System Settings filtered by category.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {setupItems.map((item) => (
          <Link
            key={item.category}
            to={`/system-settings?category=${encodeURIComponent(item.category)}`}
            className="bg-white shadow rounded-lg p-4 border hover:border-indigo-300 hover:shadow-md transition"
          >
            <div className="font-medium text-gray-800">{item.label}</div>
            <div className="text-xs text-gray-500 mt-1">{item.category}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}

