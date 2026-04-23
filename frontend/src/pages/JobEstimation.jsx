import { Link } from 'react-router-dom'
import Proformas from './Proformas'

export default function JobEstimation() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-800">Job Estimation</h1>
      <p className="text-sm text-gray-600">
        Estimation workflow is backed by Proformas. Create and print estimations from the Proforma module.
      </p>
      <div>
        <Link to="/proformas/new" className="inline-flex px-3 py-1.5 text-sm rounded bg-indigo-600 text-white hover:bg-indigo-700">
          Create New Estimation
        </Link>
      </div>
      <Proformas />
    </div>
  )
}

