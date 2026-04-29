/** HillMaster-style Maintenance menu — same sidebar pattern as Setup / Transaction / Enquiry. */
export const MAINTENANCE_MENU = [
  { slug: 'global-parameters', label: 'Global Parameters', group: 1, path: '/global-parameters' },
  { slug: 'name-value-parameter', label: 'Name Value Parameter', group: 1, path: '/name-value-parameter' },
  { slug: 'job-order', label: 'Job Order', group: 2, path: '/job-orders' },
  { slug: 'open-job-from-appointment', label: 'Open Job from Appointment', group: 2, path: '/work-order-creation' },
  { slug: 'customer-maintenance', label: 'Customer Maintenance', group: 3, path: '/customers' },
  { slug: 'plate-number', label: 'Plate Number', group: 3, path: '/plate-number-maintenance' },
  { slug: 'canceled-jobs-registry', label: 'Canceled Jobs Registry', group: 3, path: '/canceled-jobs-registry' },
  { slug: 'labour-types', label: 'Labour Types', group: 4, path: '/job-orders/labor-types' },
  { slug: 'other-charge-setup', label: 'Other Charge Setup', group: 4, path: '/job-orders/additional-charges' },
  { slug: 'lubricants-and-fuel', label: 'Lubricants  And Fuel', group: 4, path: '/job-orders/additional-charges' },
  { slug: 'miscellaneous-charges', label: 'Miscellaneous Charges', group: 4, path: '/job-orders/additional-charges' },
  { slug: 'sublet-work-type', label: 'Sublet Work Type', group: 4, path: '/job-orders/additional-charges' },
  { slug: 'consumable-charge-setup', label: 'Consumable Charge Setup', group: 4, path: '/consumable-charge-setup' },
  { slug: 'sublet-supplier-maintenance', label: 'Sublet Supplier Maintenance', group: 4, path: '/sublet-supplier-maintenance' },
  { slug: 'block-release-job-order', label: 'Block/Release Job Order', group: 5, path: '/block-release-job-order' },
  { slug: 'register-sold-vehicle', label: 'Register Sold Vehicle', group: 5, path: '/vehicles' },
  { slug: 'vehicle-model-setup', label: 'Vehicle Model Setup', group: 6, path: '/vehicle-model-setup' },
  { slug: 'job-type-per-hour-rate', label: 'Job Type Per Hour Rate', group: 6, path: '/job-type-hourly-rate' },
]

export function maintenancePath(itemOrSlug) {
  if (typeof itemOrSlug === 'object' && itemOrSlug?.path) return itemOrSlug.path
  const slug = typeof itemOrSlug === 'object' ? itemOrSlug.slug : itemOrSlug
  return `/maintenance/${slug}`
}
