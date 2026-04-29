/**
 * HillMaster-style Garage Invoices menu — paths match existing invoice screens.
 * `group` changes drive divider lines in the sidebar (same order as the manual).
 */
export const GARAGE_INVOICES_MENU = [
  { path: '/garage-invoices/proforma', label: 'Proforma Invoice', group: 1 },
  { path: '/garage-invoices/cash', label: 'Cash Invoice', group: 1 },
  { path: '/garage-invoices/credit', label: 'Credit Invoice', group: 1 },
  { path: '/garage-invoices/itm', label: 'Invoice By ITM', group: 1 },
  { path: '/garage-invoices/discount-rate', label: 'Discount Rate Entry', group: 1 },
  { path: '/garage-invoices/credit-note', label: 'Credit Note', group: 2 },
  { path: '/garage-invoices/cancel-return', label: 'Cancel/Return Invoice', group: 2 },
  { path: '/garage-invoices/clear-uncollected', label: 'Clear Un-Printed Sales Order', group: 3 },
  { path: '/garage-invoices/cancel-vrv', label: 'Cancel VRV Entry', group: 4 },
  { path: '/garage-invoices/job-estimation', label: 'Job Estimation', group: 4 },
  { path: '/garage-invoices/estimation-template', label: 'Estimation Template', group: 4 },
]
