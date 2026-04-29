/** HillMaster-style Transaction menu — same sidebar pattern as Task / Garage Invoices / Reports. */
export const TRANSACTION_MENU = [
  { slug: 'item-issue', label: 'Item Issue', group: 1 },
  { slug: 'item-issue-from-reserve', label: 'Item Issue from Reserve', group: 1 },
  { slug: 'garage-issue-requisition', label: 'Garage Issue Requisition', group: 1 },
  { slug: 'internal-fuel-and-lubricant-issue', label: 'Internal Fuel and Lubricant Issue', group: 2 },
  { slug: 'fuel-issue-km-editing', label: 'Fuel Issue KM Editing', group: 2 },
  { slug: 'labour-charge-entry', label: 'Labour Charge Entry', group: 3 },
  { slug: 'miscellaneous-charge-entry', label: 'Miscellaneous Charge Entry', group: 3 },
  { slug: 'lubricants-and-fuel-charge-entry', label: 'Lubricants and Fuel Charge Entry', group: 3 },
  { slug: 'sublet-work-charge-entry', label: 'Sublet Work Charge Entry', group: 3 },
  { slug: 'other-charges', label: 'Other Charges', group: 3 },
  { slug: 'labour-misc-lub-sublet-charge-entry', label: 'Labour/Misc/Lub/Sublet Charge Entry', group: 3 },
  { slug: 'item-reserve', label: 'Item Reserve', group: 4 },
  { slug: 'request-for-return', label: 'Request for Return', group: 4 },
  { slug: 'approve-request-for-return', label: 'Approve Request For Return', group: 4 },
  { slug: 'sublet-order-entry', label: 'Sublet Order Entry', group: 5 },
  { slug: 'sublet-order-entry-internal-vehicle', label: 'Sublet Order Entry - Internal Vehicle', group: 5 },
  { slug: 'sublet-order-approval', label: 'Sublet Order Approval', group: 6 },
  { slug: 'sublet-order-receiving', label: 'Sublet Order Receiving', group: 6 },
]

export function transactionPath(slug) {
  return `/transactions/${slug}`
}
