import { Link } from 'react-router-dom'

/** Matches HillMaster Job Order → Utilities menu; each item opens its utility screen. */
export const UTILITIES_MENU = [
  { slug: 'close-job-order', label: 'Close Job Order' },
  { slug: 'job-order-check-sheet', label: 'Job Order Check Sheet' },
  { slug: 'reopen-job-order', label: 'Reopen Job Order' },
  { slug: 'deliver-job-order', label: 'Deliver Job Order' },
  { slug: 'receive-assembled-job', label: 'Receive Assembled Job' },
  { slug: 'copy-job-waiting', label: 'Copy Job to Waiting' },
  { slug: 'copy-invoiced-job-order', label: 'Copy Invoiced Job Order' },
  { slug: 'split-job-order', label: 'Split Job Order' },
  { slug: 'split-job-order-ai', label: 'Split Job Order - AI' },
  { slug: 'pairing-job-order', label: 'Pairing Job Order' },
  { slug: 'journalize-transaction', label: 'Journalize Transaction' },
  { slug: 'journal-listing', label: 'Journal Listing' },
  { slug: 'post-journals-gl', label: 'Post Journals to GL' },
  { slug: 'signed-estimated-letter', label: 'Signed Estimated Letter Entry' },
  { slug: 'estimation-letters', label: 'Estimation Letters' },
  { slug: 'credit-invoice-waiver', label: 'Credit Invoice Waiver' },
  { slug: 'update-menu-definition', label: 'Update Menu Definition' },
  { slug: 'calculator', label: 'Calculator' },
]

export default function UtilitiesHub() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Utilities</h1>
        <p className="text-sm text-gray-600 mt-1">
          HillMaster-style job order utilities. Choose a tool below (same list as in the sidebar).
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {UTILITIES_MENU.map((item) => (
          <Link
            key={item.slug}
            to={`/utilities/${item.slug}`}
            className="block rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-800 hover:border-indigo-300 hover:bg-indigo-50/50 transition"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  )
}
