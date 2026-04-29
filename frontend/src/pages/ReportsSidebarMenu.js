/** HillMaster-style Reports menu — same sidebar pattern as Setup / Task / Utilities. */
export const REPORT_MENU = [
  { slug: 'listing', label: 'Listing', group: 'standard' },
  { slug: 'sales', label: 'Sales', group: 'standard' },
  { slug: 'productivity', label: 'Productivity', group: 'standard' },
  { slug: 'others', label: 'Others', group: 'standard' },
  { slug: 'custom-report', label: 'Custom Report', group: 'custom' },
  { slug: 'user-defined-report', label: 'User Defined Report', group: 'custom' },
  { slug: 'edit-user-defined-report', label: 'Edit User Defined Report', group: 'custom' },
]

export function reportsPath(slug) {
  return `/reports-hub/${slug}`
}
