import { Link } from 'react-router-dom'

const setupItems = [
  { label: 'Working Hour Setup', category: 'working_hour' },
  { label: 'Working Calendar Setup', category: 'working_calendar' },
  { label: 'Workgroup Setup', category: 'workgroup' },
  { label: 'Job Type Allowed By User', category: 'job_type_allowed_user', route: '/job-type-allowed-by-user' },
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

      <Link
        to="/company-setup"
        className="block bg-indigo-50 border border-indigo-200 rounded-lg p-4 hover:border-indigo-400 hover:shadow-sm transition"
      >
        <div className="font-semibold text-indigo-900">Company Setup</div>
        <div className="text-sm text-indigo-800/80 mt-1">
          Company, application, address, email/SMS footers, default prefixes and next numbers (HillMaster File → Company Setup).
        </div>
      </Link>

      <Link
        to="/gl-account-setup"
        className="block bg-emerald-50 border border-emerald-200 rounded-lg p-4 hover:border-emerald-400 hover:shadow-sm transition"
      >
        <div className="font-semibold text-emerald-900">GL Account Setup</div>
        <div className="text-sm text-emerald-800/80 mt-1">
          Setup Stock, WIP, CGS, Sales, Discount and VAT accounts by parts/job/service/section/location across Parts, Fuel &amp; Lub, Labour, Miscellaneous, Other Charge and Sub Let tabs.
        </div>
      </Link>

      <Link
        to="/global-parameters"
        className="block bg-sky-50 border border-sky-200 rounded-lg p-4 hover:border-sky-400 hover:shadow-sm transition"
      >
        <div className="font-semibold text-sky-900">Global Parameters</div>
        <div className="text-sm text-sky-800/80 mt-1">
          Maintain lookup values used by selection lists across the module (e.g., car make/model and setup lookups).
        </div>
      </Link>

      <Link
        to="/vehicle-model-setup"
        className="block bg-amber-50 border border-amber-200 rounded-lg p-4 hover:border-amber-400 hover:shadow-sm transition"
      >
        <div className="font-semibold text-amber-900">Vehicle Model Setup</div>
        <div className="text-sm text-amber-800/80 mt-1">
          Create and maintain model groups, models, repair sections, and maintenance sections used in garage operations.
        </div>
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {setupItems.map((item) => (
          <Link
            key={item.category}
            to={item.route || `/system-settings?category=${encodeURIComponent(item.category)}`}
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

