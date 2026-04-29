/** HillMaster-style Enquiry menu — same sidebar pattern as Transaction / Task / Reports. */
export const ENQUIRY_MENU = [
  { slug: 'job-order', label: 'Job Order', group: 1 },
  { slug: 'products-or-parts', label: 'Products or Parts', group: 1 },
  { slug: 'job-order-statement', label: 'Job Order Statement', group: 1 },
  { slug: 'stock-movement', label: 'Stock Movement', group: 1 },
  { slug: 'issue-enquiry', label: 'Issue Enquiry', group: 1 },
  { slug: 'reserve-enquiry', label: 'Reserve Enquiry', group: 1 },
  { slug: 'supplier-price-list-enquiry', label: 'Supplier Price List Enquiry', group: 1 },
  { slug: 'internal-fuel-and-lubricant-issue', label: 'Internal Fuel and Lubricant Issue', group: 1 },
  { slug: 'garage-invoice-enquiry', label: 'Garage Invoice Enquiry', group: 1 },
  { slug: 'lost-sales-enquiry-by-date', label: 'Lost Sales Enquiry(By Date)', group: 1 },
  { slug: 'vrv-enquiry', label: 'VRV Enquiry', group: 1 },
  { slug: 'job-order-payment-enquiry', label: 'Job Order Payment Enquiry', group: 1 },
  { slug: 'estimation-enquiry', label: 'Estimation Enquiry', group: 1 },
  { slug: 'journal-enquiry', label: 'Journal Enquiry', group: 1 },
  { slug: 'sublet-order', label: 'Sublet Order', group: 1 },
  { slug: 'appointment', label: 'Appointment', group: 1 },
  { slug: 'list-of-invoice-by-customer', label: 'List of Invoice by Customer', group: 1 },
  { slug: 'view-audit-log', label: 'View Audit Log', group: 2 },
]

export function enquiryPath(slug) {
  return `/enquiries/${slug}`
}
