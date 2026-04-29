import { Link } from 'react-router-dom'
import { TASK_MENU, taskPath } from './TaskSidebarMenu'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const BLURBS = {
  'absent-overtime-entry': 'Record technician absence and overtime for payroll and capacity.',
  'dispatch-job-to-section': 'Send work from the job order to a repair section or bay.',
  'receive-dispatched-job': 'Section lead accepts dispatched work onto the floor.',
  'job-clock-in': 'Start labor time on a job for a technician.',
  'job-clock-out': 'Stop labor time; capture reason where required.',
  'transfer-charge-code-by-tech': 'Reassign labor charge codes between technicians.',
  'job-transfer-to-station': 'Move the job to another physical station or line.',
  'change-job-order-station': 'Correct the job order’s current station assignment.',
  'update-last-clock-out-reason': 'Amend the most recent clock-out reason code.',
  'technician-enquiry': 'Look up technician status, skills, and assignments.',
  'in-out-enquiry': 'Review who is clocked in and on which job.',
  'end-of-working-day-clock-out': 'Bulk or guided clock-out at shift end.',
  'customer-notification-entry': 'Log calls, SMS, or promises to the customer on the job.',
  'pool-absent-ot-hr-from-hr': 'Pull approved absent/OT hours from HR into shop records.',
  'appointment-registration': 'Create or book a service appointment.',
  'appointment-status-update': 'Change appointment state (confirmed, arrived, no-show).',
  'request-for-job-opening': 'Raise a requisition to open a new job order.',
  'approve-open-job-requisition': 'Manager approval for opening requested jobs.',
  'request-for-estimation': 'Ask estimating to price work before authorization.',
  'assign-request-for-estimator': 'Allocate estimation requests to estimators.',
  'estimation-assesment-entry': 'Enter line-level assessment on an estimate.',
  'deliver-estimation-to-customer': 'Issue or print estimate to the customer.',
  'delivered-estimation-confirmation': 'Confirm customer received the estimate.',
  'authorize-opening-jobs': 'Final authorization to convert estimate or request into live job.',
  'washing-status-update': 'Track vehicle through wash / detail queue.',
}

export default function TaskHub() {
  return (
    <div className="space-y-8">
      <div className="space-y-2 max-w-3xl">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Task</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          HillMaster-style <strong>Task</strong> menu: shop-floor time, dispatch, appointments, estimation workflow, and
          washing status. Each card opens a task screen; some entries redirect to an existing module where coverage
          already exists.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {TASK_MENU.map((item) => {
          const to = taskPath(item.slug)
          return (
            <Link key={item.slug} to={to} className="group block h-full">
              <Card className="h-full transition-all border-border/80 shadow-sm hover:border-primary/40 hover:shadow-md hover:bg-gradient-to-br hover:from-primary/[0.03] hover:to-transparent">
                <CardHeader className="space-y-2 py-4">
                  <CardTitle className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-snug">
                    {item.label}
                  </CardTitle>
                  <CardDescription className="text-xs leading-relaxed line-clamp-3">
                    {BLURBS[item.slug] || 'Operational task entry.'}
                  </CardDescription>
                  <span className="text-xs font-medium text-primary pt-0.5 group-hover:underline">Open →</span>
                </CardHeader>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
