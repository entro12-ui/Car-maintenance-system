/** HillMaster-style Task menu — same sidebar pattern as Setup / Utilities. */
export const TASK_MENU = [
  { slug: 'absent-overtime-entry', label: 'Absent & OverTime Entry' },
  { slug: 'dispatch-job-to-section', label: 'Dispatch Job to Section' },
  { slug: 'receive-dispatched-job', label: 'Receive Dispatched Job' },
  { slug: 'job-clock-in', label: 'Job ClockIn' },
  { slug: 'job-clock-out', label: 'Job ClockOut' },
  { slug: 'transfer-charge-code-by-tech', label: 'Transfer Charge Code By Tech' },
  { slug: 'job-transfer-to-station', label: 'Job Transfer to Station' },
  { slug: 'change-job-order-station', label: 'Change Job Order Station' },
  { slug: 'update-last-clock-out-reason', label: 'Update Last Clock Out Reason' },
  { slug: 'technician-enquiry', label: 'Technician Enquiry' },
  { slug: 'in-out-enquiry', label: 'In/Out Enquiry' },
  { slug: 'end-of-working-day-clock-out', label: 'End of Working Day ClockOut' },
  { slug: 'customer-notification-entry', label: 'Customer Notification Entry' },
  { slug: 'pool-absent-ot-hr-from-hr', label: 'Pool Absent/Ot Hr from Hr' },
  { slug: 'appointment-registration', label: 'Appointment Registration' },
  { slug: 'appointment-status-update', label: 'Appointment Status Update' },
  { slug: 'request-for-job-opening', label: 'Request for Job Opening' },
  { slug: 'approve-open-job-requisition', label: 'Approve Open Job Requisition' },
  { slug: 'request-for-estimation', label: 'Request for Estimation' },
  { slug: 'assign-request-for-estimator', label: 'Assign Request for Estimator' },
  { slug: 'estimation-assesment-entry', label: 'Estimation Assesment Entry' },
  { slug: 'deliver-estimation-to-customer', label: 'Deliver Estimation to Customer' },
  { slug: 'delivered-estimation-confirmation', label: 'Delivered Estimation Confirmation' },
  { slug: 'authorize-opening-jobs', label: 'Authorize Opening Jobs' },
  { slug: 'washing-status-update', label: 'Washing Status Update' },
]

export function taskPath(slug) {
  return `/tasks/${slug}`
}
