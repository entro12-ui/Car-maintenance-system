import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import SetupScreenFrame from './SetupScreenFrame'
import { TASK_MENU } from './TaskSidebarMenu'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  systemSettingsApi,
  jobOrdersApi,
  jobOrderNoticeTypesApi,
  jobOrderCustomerNotificationsApi,
  employeesApi,
} from '../services/api'

/** Map task slugs to existing app routes where behaviour is closest. */
const TASK_REDIRECTS = {
  'appointment-registration': '/appointments',
  'appointment-status-update': '/appointments',
  'request-for-estimation': '/garage-invoices/job-estimation',
  'assign-request-for-estimator': '/garage-invoices/job-estimation',
  'estimation-assesment-entry': '/garage-invoices/job-estimation',
  'deliver-estimation-to-customer': '/garage-invoices/job-estimation',
  'delivered-estimation-confirmation': '/garage-invoices/job-estimation',
}

const DEFAULT_RELATED = [
  { to: '/job-orders', label: 'Job orders' },
  { to: '/task-operations', label: 'Task operations' },
  { to: '/tasks', label: 'Task hub' },
]

const TASK_ENTRY_CATEGORY = 'task_entry_forms'

const FIELD_CONFIG = {
  'absent-overtime-entry': [
    { key: 'technician_employee_id', label: 'Technician Employee ID', type: 'text' },
    { key: 'entry_date', label: 'Entry Date', type: 'date' },
    { key: 'entry_type', label: 'Entry Type', type: 'select', options: ['Absent', 'Overtime'] },
    { key: 'hours', label: 'Hours', type: 'number' },
    { key: 'reason', label: 'Reason', type: 'textarea' },
    { key: 'approved_by', label: 'Approved By', type: 'text' },
  ],
  'dispatch-job-to-section': [
    { key: 'job_order_id', label: 'Job Order ID', type: 'text' },
    { key: 'section', label: 'Section', type: 'text' },
    { key: 'station', label: 'Station', type: 'text' },
    { key: 'dispatch_note', label: 'Dispatch Note', type: 'textarea' },
  ],
  'receive-dispatched-job': [
    { key: 'job_order_id', label: 'Job Order ID', type: 'text' },
    { key: 'section', label: 'Section', type: 'text' },
    { key: 'receiver_employee_id', label: 'Receiver Employee ID', type: 'text' },
    { key: 'received_note', label: 'Receive Note', type: 'textarea' },
  ],
  'job-clock-in': [
    { key: 'job_order_id', label: 'Job Order ID', type: 'text' },
    { key: 'technician_employee_id', label: 'Technician Employee ID', type: 'text' },
    { key: 'task_id', label: 'Task ID (optional)', type: 'text' },
    { key: 'clock_in_remark', label: 'Clock In Remark', type: 'textarea' },
  ],
  'job-clock-out': [
    { key: 'job_order_id', label: 'Job Order ID', type: 'text' },
    { key: 'job_clock_id', label: 'Job Clock ID', type: 'text' },
    { key: 'clock_out_reason', label: 'Clock Out Reason', type: 'text' },
    { key: 'clock_out_remark', label: 'Clock Out Remark', type: 'textarea' },
  ],
  'transfer-charge-code-by-tech': [
    { key: 'job_order_id', label: 'Job Order ID', type: 'text' },
    { key: 'from_technician_id', label: 'From Technician ID', type: 'text' },
    { key: 'to_technician_id', label: 'To Technician ID', type: 'text' },
    { key: 'charge_code', label: 'Charge Code', type: 'text' },
    { key: 'reason', label: 'Reason', type: 'textarea' },
  ],
  'job-transfer-to-station': [
    { key: 'job_order_id', label: 'Job Order ID', type: 'text' },
    { key: 'from_station', label: 'From Station', type: 'text' },
    { key: 'to_station', label: 'To Station', type: 'text' },
    { key: 'reason', label: 'Reason', type: 'textarea' },
  ],
  'change-job-order-station': [
    { key: 'job_order_id', label: 'Job Order ID', type: 'text' },
    { key: 'old_station', label: 'Old Station', type: 'text' },
    { key: 'new_station', label: 'New Station', type: 'text' },
    { key: 'change_note', label: 'Change Note', type: 'textarea' },
  ],
  'update-last-clock-out-reason': [
    { key: 'job_order_id', label: 'Job Order ID', type: 'text' },
    { key: 'job_clock_id', label: 'Job Clock ID', type: 'text' },
    { key: 'clock_out_reason', label: 'New Clock Out Reason', type: 'text' },
    { key: 'remark', label: 'Remark', type: 'textarea' },
  ],
  'in-out-enquiry': [
    { key: 'section', label: 'Section', type: 'text' },
    { key: 'from_date', label: 'From Date', type: 'date' },
    { key: 'to_date', label: 'To Date', type: 'date' },
    { key: 'employee_id', label: 'Employee ID (optional)', type: 'text' },
  ],
  'end-of-working-day-clock-out': [
    { key: 'section', label: 'Section', type: 'text' },
    { key: 'clock_out_reason', label: 'Clock Out Reason', type: 'text' },
    { key: 'clock_out_remark', label: 'Clock Out Remark', type: 'textarea' },
  ],
  'pool-absent-ot-hr-from-hr': [
    { key: 'period_month', label: 'Period Month (YYYY-MM)', type: 'text' },
    { key: 'import_batch_no', label: 'Import Batch No', type: 'text' },
    { key: 'import_source', label: 'Import Source', type: 'text' },
    { key: 'remarks', label: 'Remarks', type: 'textarea' },
  ],
  'request-for-job-opening': [
    { key: 'customer_name', label: 'Customer Name', type: 'text' },
    { key: 'plate_number', label: 'Plate Number', type: 'text' },
    { key: 'requested_work', label: 'Requested Work', type: 'textarea' },
    { key: 'requested_by', label: 'Requested By', type: 'text' },
  ],
  'approve-open-job-requisition': [
    { key: 'requisition_no', label: 'Requisition No', type: 'text' },
    { key: 'decision', label: 'Decision', type: 'select', options: ['Approved', 'Rejected', 'Returned'] },
    { key: 'review_note', label: 'Review Note', type: 'textarea' },
  ],
  'authorize-opening-jobs': [
    { key: 'request_no', label: 'Request No', type: 'text' },
    { key: 'job_order_id', label: 'Job Order ID (if already assigned)', type: 'text' },
    { key: 'authorization_decision', label: 'Authorization Decision', type: 'select', options: ['Authorized', 'Rejected', 'Hold'] },
    { key: 'authorized_by', label: 'Authorized By', type: 'text' },
    { key: 'authorization_date', label: 'Authorization Date', type: 'date' },
    { key: 'authorization_note', label: 'Authorization Note', type: 'textarea' },
  ],
  'washing-status-update': [
    { key: 'job_order_id', label: 'Job Order ID', type: 'text' },
    { key: 'washing_status', label: 'Washing Status', type: 'select', options: ['Queued', 'In Progress', 'Completed'] },
    { key: 'updated_by', label: 'Updated By', type: 'text' },
    { key: 'remarks', label: 'Remarks', type: 'textarea' },
  ],
}

const DEFAULT_FIELDS = [
  { key: 'reference_no', label: 'Reference No', type: 'text' },
  { key: 'entry_date', label: 'Entry Date', type: 'date' },
  { key: 'remarks', label: 'Remarks', type: 'textarea' },
]

function buildEmpty(fields) {
  const out = {}
  for (const f of fields) out[f.key] = ''
  return out
}

function CustomerNotificationEntryPanel() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [jobOrders, setJobOrders] = useState([])
  const [noticeTypes, setNoticeTypes] = useState([])
  const [rows, setRows] = useState([])
  const [selectedJob, setSelectedJob] = useState(null)
  const [form, setForm] = useState({
    job_order_id: '',
    notice_date: new Date().toISOString().slice(0, 10),
    notice_type: '',
    contact_name: '',
    contact_phone: '',
    remark: '',
  })

  const loadBase = async () => {
    setLoading(true)
    setError('')
    try {
      const [jobsRes, ntRes] = await Promise.all([
        jobOrdersApi.list({}),
        jobOrderNoticeTypesApi.list({ active_only: true }),
      ])
      setJobOrders(jobsRes?.data || [])
      setNoticeTypes(ntRes?.data || [])
    } catch (e) {
      console.error(e)
      setError('Failed to load job orders or notice types.')
    } finally {
      setLoading(false)
    }
  }

  const loadJobNotifications = async (jobOrderId) => {
    if (!jobOrderId) {
      setRows([])
      setSelectedJob(null)
      return
    }
    try {
      const [jobRes, listRes] = await Promise.all([
        jobOrdersApi.getById(jobOrderId),
        jobOrderCustomerNotificationsApi.list(jobOrderId),
      ])
      setSelectedJob(jobRes?.data || null)
      setRows(listRes?.data || [])
    } catch (e) {
      console.error(e)
      setError(e?.response?.data?.detail || 'Failed to load selected job notifications.')
      setRows([])
    }
  }

  useEffect(() => {
    loadBase()
  }, [])

  useEffect(() => {
    if (!form.job_order_id) {
      setRows([])
      setSelectedJob(null)
      return
    }
    loadJobNotifications(form.job_order_id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.job_order_id])

  const onSave = async () => {
    if (!form.job_order_id) {
      setError('Select job order first.')
      return
    }
    if (!form.notice_date) {
      setError('Notice date is required.')
      return
    }
    if (!form.notice_type) {
      setError('Notice type is required.')
      return
    }
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await jobOrderCustomerNotificationsApi.create(form.job_order_id, {
        notice_date: form.notice_date,
        notice_type: form.notice_type,
        contact_name: form.contact_name || null,
        contact_phone: form.contact_phone || null,
        remark: form.remark || null,
      })
      await loadJobNotifications(form.job_order_id)
      setSuccess('Notification entry saved.')
      setForm((prev) => ({
        ...prev,
        notice_type: '',
        contact_name: '',
        contact_phone: '',
        remark: '',
      }))
    } catch (e) {
      console.error(e)
      setError(e?.response?.data?.detail || 'Failed to save notification entry.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Job Order General Information</CardTitle>
          <CardDescription>Record notifications made with customers and select notice type from maintained list.</CardDescription>
        </CardHeader>
        <div className="px-6 pb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="text-sm">
              <span className="text-muted-foreground">Job Order No.</span>
              <select
                className="w-full mt-1 border rounded px-3 py-2"
                value={form.job_order_id}
                onChange={(e) => setForm((p) => ({ ...p, job_order_id: e.target.value }))}
                disabled={loading}
              >
                <option value="">Select job order...</option>
                {jobOrders.map((j) => (
                  <option key={j.job_order_id} value={j.job_order_id}>
                    {j.job_order_number || `#${j.job_order_id}`}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="text-muted-foreground">Customer</span>
              <input
                className="w-full mt-1 border rounded px-3 py-2 bg-muted/35"
                value={selectedJob?.customer_name || selectedJob?.customer_id || ''}
                disabled
              />
            </label>
            <label className="text-sm">
              <span className="text-muted-foreground">Plate No.</span>
              <input className="w-full mt-1 border rounded px-3 py-2 bg-muted/35" value={selectedJob?.vehicle_plate || ''} disabled />
            </label>
            <label className="text-sm">
              <span className="text-muted-foreground">Invoice No.</span>
              <input className="w-full mt-1 border rounded px-3 py-2 bg-muted/35" value={selectedJob?.invoice_number || ''} disabled />
            </label>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Notice Detail</CardTitle>
        </CardHeader>
        <div className="px-6 pb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="text-sm">
              <span className="text-muted-foreground">Notice Date</span>
              <input
                type="date"
                className="w-full mt-1 border rounded px-3 py-2"
                value={form.notice_date}
                onChange={(e) => setForm((p) => ({ ...p, notice_date: e.target.value }))}
              />
            </label>
            <label className="text-sm">
              <span className="text-muted-foreground">Notice Type</span>
              <select
                className="w-full mt-1 border rounded px-3 py-2"
                value={form.notice_type}
                onChange={(e) => setForm((p) => ({ ...p, notice_type: e.target.value }))}
              >
                <option value="">Select notice type...</option>
                {noticeTypes.map((n) => (
                  <option key={n.notice_type_id} value={n.notice_type_name}>
                    {n.notice_type_name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="text-muted-foreground">Notified To</span>
              <input
                className="w-full mt-1 border rounded px-3 py-2"
                value={form.contact_name}
                onChange={(e) => setForm((p) => ({ ...p, contact_name: e.target.value }))}
              />
            </label>
            <label className="text-sm">
              <span className="text-muted-foreground">Phone</span>
              <input
                className="w-full mt-1 border rounded px-3 py-2"
                value={form.contact_phone}
                onChange={(e) => setForm((p) => ({ ...p, contact_phone: e.target.value }))}
              />
            </label>
            <label className="text-sm md:col-span-2">
              <span className="text-muted-foreground">Remark</span>
              <input
                className="w-full mt-1 border rounded px-3 py-2"
                value={form.remark}
                onChange={(e) => setForm((p) => ({ ...p, remark: e.target.value }))}
                placeholder="Type any remark here"
              />
            </label>
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}
          {success && <div className="text-sm text-green-600">{success}</div>}
          <div className="flex gap-2">
            <Button type="button" onClick={onSave} disabled={saving || !form.job_order_id}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
            <Button type="button" variant="outline" onClick={() => loadJobNotifications(form.job_order_id)} disabled={!form.job_order_id}>
              Refresh
            </Button>
          </div>
        </div>
      </Card>

      <Card className="border-dashed bg-muted/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Notification History</CardTitle>
        </CardHeader>
        <div className="px-6 pb-6">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 pr-3">No</th>
                  <th className="py-2 pr-3">Date</th>
                  <th className="py-2 pr-3">Notice Type</th>
                  <th className="py-2 pr-3">Notified To</th>
                  <th className="py-2 pr-3">Remark</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td className="py-3 text-muted-foreground" colSpan={5}>No notifications found for selected job.</td>
                  </tr>
                ) : (
                  rows.map((r, idx) => (
                    <tr key={r.notification_id || idx} className="border-b">
                      <td className="py-2 pr-3">{idx + 1}</td>
                      <td className="py-2 pr-3">{String(r.notice_date || '').slice(0, 10)}</td>
                      <td className="py-2 pr-3">{r.notice_type || '-'}</td>
                      <td className="py-2 pr-3">{r.contact_name || '-'}</td>
                      <td className="py-2 pr-3">{r.remark || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  )
}

function EndOfWorkingDayCheckoutPanel() {
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [clockedInJobs, setClockedInJobs] = useState([])
  const [resultCount, setResultCount] = useState(null)
  const [form, setForm] = useState({
    clock_out_date: new Date().toISOString().slice(0, 10),
    clock_out_time: new Date().toTimeString().slice(0, 5),
    section: '',
    clock_out_reason: 'End of working day',
    clock_out_remark: '',
  })

  const loadClockedIn = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await jobOrdersApi.enquiryClockedInJobs(form.section || undefined)
      setClockedInJobs(res?.data || [])
    } catch (e) {
      console.error(e)
      setError('Failed to load clocked-in jobs.')
      setClockedInJobs([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadClockedIn()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onClockOutAll = async () => {
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const remarkCombined = [form.clock_out_remark, `ClockOutDate:${form.clock_out_date}`, `ClockOutTime:${form.clock_out_time}`]
        .filter(Boolean)
        .join(' | ')
      const res = await jobOrdersApi.endOfDayCheckout({
        section: form.section || null,
        clock_out_reason: form.clock_out_reason || 'End of working day',
        clock_out_remark: remarkCombined || null,
      })
      setResultCount(res?.data?.clocked_out_count ?? 0)
      setSuccess(`Clocked out ${res?.data?.clocked_out_count ?? 0} active jobs.`)
      await loadClockedIn()
    } catch (e) {
      console.error(e)
      setError(e?.response?.data?.detail || 'End of working day checkout failed.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">End Of Working Hour Clock Out</CardTitle>
          <CardDescription>
            Used by the foreman to clock-out all active jobs at end of day. Click “Clock-out all jobs”.
          </CardDescription>
        </CardHeader>
        <div className="px-6 pb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <label className="text-sm">
              <span className="text-muted-foreground">Clock Out Date</span>
              <input
                type="date"
                className="w-full mt-1 border rounded px-3 py-2"
                value={form.clock_out_date}
                onChange={(e) => setForm((p) => ({ ...p, clock_out_date: e.target.value }))}
              />
            </label>
            <label className="text-sm">
              <span className="text-muted-foreground">Clock Out Time</span>
              <input
                type="time"
                className="w-full mt-1 border rounded px-3 py-2"
                value={form.clock_out_time}
                onChange={(e) => setForm((p) => ({ ...p, clock_out_time: e.target.value }))}
              />
            </label>
            <label className="text-sm">
              <span className="text-muted-foreground">Section (optional)</span>
              <input
                className="w-full mt-1 border rounded px-3 py-2"
                value={form.section}
                onChange={(e) => setForm((p) => ({ ...p, section: e.target.value }))}
              />
            </label>
            <label className="text-sm">
              <span className="text-muted-foreground">Reason</span>
              <input
                className="w-full mt-1 border rounded px-3 py-2"
                value={form.clock_out_reason}
                onChange={(e) => setForm((p) => ({ ...p, clock_out_reason: e.target.value }))}
              />
            </label>
            <label className="text-sm md:col-span-4">
              <span className="text-muted-foreground">Remark If Any</span>
              <textarea
                className="w-full mt-1 border rounded px-3 py-2 min-h-[72px]"
                value={form.clock_out_remark}
                onChange={(e) => setForm((p) => ({ ...p, clock_out_remark: e.target.value }))}
                placeholder="End of Working Day ..."
              />
            </label>
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}
          {success && <div className="text-sm text-green-600">{success}</div>}

          <div className="flex gap-2">
            <Button type="button" variant="destructive" onClick={onClockOutAll} disabled={saving}>
              {saving ? 'Clocking out...' : 'Clock-out all jobs'}
            </Button>
            <Button type="button" variant="outline" onClick={loadClockedIn} disabled={loading}>
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
          {resultCount != null && (
            <div className="text-sm font-medium text-blue-700">Total Jobs to be Clock Out: {resultCount}</div>
          )}
        </div>
      </Card>

      <Card className="border-dashed bg-muted/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Currently Active Clocks</CardTitle>
        </CardHeader>
        <div className="px-6 pb-6">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 pr-3">Jc No</th>
                  <th className="py-2 pr-3">Technician</th>
                  <th className="py-2 pr-3">Charge Code</th>
                  <th className="py-2 pr-3">Clock In Date</th>
                  <th className="py-2 pr-3">Clock In Time</th>
                  <th className="py-2 pr-3">Remark</th>
                </tr>
              </thead>
              <tbody>
                {clockedInJobs.length === 0 ? (
                  <tr>
                    <td className="py-3 text-muted-foreground" colSpan={6}>No active clocked-in jobs.</td>
                  </tr>
                ) : (
                  clockedInJobs.map((r, idx) => (
                    <tr key={r.job_clock_id || idx} className="border-b">
                      <td className="py-2 pr-3">{r.job_order_number || r.job_order_id}</td>
                      <td className="py-2 pr-3">{r.technician_name || '-'}</td>
                      <td className="py-2 pr-3">{r.task_id || '-'}</td>
                      <td className="py-2 pr-3">{String(r.clock_in_at || '').slice(0, 10)}</td>
                      <td className="py-2 pr-3">{String(r.clock_in_at || '').slice(11, 16)}</td>
                      <td className="py-2 pr-3">{r.clock_in_remark || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  )
}

function DispatchJobToSectionPanel() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isAddMode, setIsAddMode] = useState(false)
  const [jobOrders, setJobOrders] = useState([])
  const [history, setHistory] = useState([])
  const [selectedJob, setSelectedJob] = useState(null)
  const [form, setForm] = useState({
    job_order_id: '',
    dispatched_section: '',
    dispatch_date: new Date().toISOString().slice(0, 10),
    dispatch_time: new Date().toISOString().slice(11, 16),
    dispatch_remark: '',
  })

  const resetForm = () => {
    setForm({
      job_order_id: '',
      dispatched_section: '',
      dispatch_date: new Date().toISOString().slice(0, 10),
      dispatch_time: new Date().toISOString().slice(11, 16),
      dispatch_remark: '',
    })
    setSelectedJob(null)
    setError('')
    setSuccess('')
    setIsAddMode(false)
  }

  const loadBase = async () => {
    setLoading(true)
    setError('')
    try {
      const [jobsRes, historyRes] = await Promise.all([
        jobOrdersApi.list({ limit: 300 }),
        jobOrdersApi.enquiryDispatchedJobs(),
      ])
      setJobOrders(jobsRes?.data || [])
      setHistory(historyRes?.data || [])
    } catch (e) {
      console.error(e)
      setError(e?.response?.data?.detail || 'Failed to load dispatch setup.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBase()
  }, [])

  useEffect(() => {
    if (!form.job_order_id) {
      setSelectedJob(null)
      return
    }
    const job = jobOrders.find((j) => Number(j.job_order_id) === Number(form.job_order_id)) || null
    setSelectedJob(job)
  }, [form.job_order_id, jobOrders])

  const sectionOptions = useMemo(() => {
    const options = new Set()
    if (selectedJob?.service_type_name) options.add(String(selectedJob.service_type_name))
    if (selectedJob?.dispatched_section) options.add(String(selectedJob.dispatched_section))
    if (selectedJob?.received_section) options.add(String(selectedJob.received_section))
    jobOrders.forEach((j) => {
      if (j.dispatched_section) options.add(String(j.dispatched_section))
      if (j.received_section) options.add(String(j.received_section))
      if (j.service_type_name) options.add(String(j.service_type_name))
    })
    return Array.from(options).sort((a, b) => a.localeCompare(b))
  }, [jobOrders, selectedJob])

  const filteredHistory = useMemo(() => {
    if (!form.job_order_id) return history.slice(0, 50)
    return history.filter((h) => Number(h.job_order_id) === Number(form.job_order_id)).slice(0, 50)
  }, [history, form.job_order_id])

  const onAddNew = () => {
    setIsAddMode(true)
    setError('')
    setSuccess('')
    setForm((p) => ({
      ...p,
      dispatch_date: new Date().toISOString().slice(0, 10),
      dispatch_time: new Date().toISOString().slice(11, 16),
    }))
  }

  const onRefresh = async () => {
    resetForm()
    await loadBase()
  }

  const onSave = async () => {
    if (!isAddMode) {
      setError('Click Add New before saving a dispatch entry.')
      return
    }
    if (!form.job_order_id) {
      setError('Select job order number.')
      return
    }
    if (!form.dispatched_section) {
      setError('Select section to dispatch.')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await jobOrdersApi.dispatch(Number(form.job_order_id), {
        dispatched_section: form.dispatched_section,
      })
      setSuccess('Job successfully dispatched to section.')
      setIsAddMode(false)
      await loadBase()
    } catch (e) {
      console.error(e)
      setError(e?.response?.data?.detail || 'Failed to dispatch job order.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Dispatch Job to Section</CardTitle>
          <CardDescription>
            Dispatch open jobs to a section before clock-in begins. Clock-in is not possible unless job is dispatched and received.
          </CardDescription>
        </CardHeader>
        <div className="px-6 pb-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={onAddNew}>Add New</Button>
            <Button type="button" onClick={onSave} disabled={saving || loading}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
            <Button type="button" variant="outline" onClick={onRefresh} disabled={loading}>
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
            <div className="text-sm text-muted-foreground self-center">
              {isAddMode ? 'Ready for new dispatch entry' : 'Click Add New to start'}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="text-sm md:col-span-2">
              <span className="text-muted-foreground">Job Order No</span>
              <select
                className="w-full mt-1 border rounded px-3 py-2"
                value={form.job_order_id}
                onChange={(e) => setForm((p) => ({ ...p, job_order_id: e.target.value }))}
                disabled={!isAddMode}
              >
                <option value="">Select job order</option>
                {jobOrders
                  .filter((j) => String(j.status || '').toLowerCase() === 'open')
                  .map((j) => (
                    <option key={j.job_order_id} value={j.job_order_id}>
                      {j.job_order_number || `#${j.job_order_id}`}
                    </option>
                  ))}
              </select>
            </label>

            <label className="text-sm">
              <span className="text-muted-foreground">Plate No</span>
              <input
                className="w-full mt-1 border rounded px-3 py-2 bg-muted/35"
                value={selectedJob?.license_plate || ''}
                readOnly
              />
            </label>

            <label className="text-sm md:col-span-2">
              <span className="text-muted-foreground">Customer Name</span>
              <input
                className="w-full mt-1 border rounded px-3 py-2 bg-muted/35"
                value={selectedJob?.customer_name || ''}
                readOnly
              />
            </label>

            <label className="text-sm">
              <span className="text-muted-foreground">Job Type</span>
              <input
                className="w-full mt-1 border rounded px-3 py-2 bg-muted/35"
                value={selectedJob?.service_type_name || ''}
                readOnly
              />
            </label>

            <label className="text-sm md:col-span-2">
              <span className="text-muted-foreground">Dispatch To (Section)</span>
              <select
                className="w-full mt-1 border rounded px-3 py-2"
                value={form.dispatched_section}
                onChange={(e) => setForm((p) => ({ ...p, dispatched_section: e.target.value }))}
                disabled={!isAddMode}
              >
                <option value="">Select section</option>
                {sectionOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>

            <label className="text-sm">
              <span className="text-muted-foreground">Dispatch Date</span>
              <input
                type="date"
                className="w-full mt-1 border rounded px-3 py-2 bg-muted/35"
                value={form.dispatch_date}
                readOnly
              />
            </label>

            <label className="text-sm">
              <span className="text-muted-foreground">Dispatch Time (in 24)</span>
              <input
                className="w-full mt-1 border rounded px-3 py-2 bg-muted/35"
                value={form.dispatch_time}
                readOnly
              />
            </label>

            <label className="text-sm md:col-span-3">
              <span className="text-muted-foreground">Remark</span>
              <textarea
                className="w-full mt-1 border rounded px-3 py-2 min-h-[72px]"
                value={form.dispatch_remark}
                onChange={(e) => setForm((p) => ({ ...p, dispatch_remark: e.target.value }))}
                disabled={!isAddMode}
                placeholder="Specify any dispatch remark..."
              />
            </label>
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}
          {success && <div className="text-sm text-green-600">{success}</div>}
        </div>
      </Card>

      <Card className="border-dashed bg-muted/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Dispatch History</CardTitle>
        </CardHeader>
        <div className="px-6 pb-6">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 pr-3">Jc No</th>
                  <th className="py-2 pr-3">Date</th>
                  <th className="py-2 pr-3">Time</th>
                  <th className="py-2 pr-3">Dispatch To</th>
                  <th className="py-2 pr-3">Job Type</th>
                  <th className="py-2 pr-3">Remark</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td className="py-3 text-muted-foreground" colSpan={6}>No dispatch rows found.</td>
                  </tr>
                ) : (
                  filteredHistory.map((r, idx) => (
                    <tr key={`${r.job_order_id || idx}-${idx}`} className="border-b">
                      <td className="py-2 pr-3">{r.job_order_number || r.job_order_id}</td>
                      <td className="py-2 pr-3">{String(r.dispatched_at || '').slice(0, 10)}</td>
                      <td className="py-2 pr-3">{String(r.dispatched_at || '').slice(11, 16)}</td>
                      <td className="py-2 pr-3">{r.dispatched_section || '-'}</td>
                      <td className="py-2 pr-3">{r.job_type || '-'}</td>
                      <td className="py-2 pr-3">{r.dispatch_remark || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  )
}

function ReceiveDispatchedJobPanel() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [jobOrders, setJobOrders] = useState([])
  const [history, setHistory] = useState([])
  const [selectedJob, setSelectedJob] = useState(null)
  const [form, setForm] = useState({
    job_order_id: '',
    received_section: '',
    received_vehicle_location: '',
    receive_date: new Date().toISOString().slice(0, 10),
    receive_time: new Date().toISOString().slice(11, 16),
  })

  const resetForm = () => {
    setForm({
      job_order_id: '',
      received_section: '',
      received_vehicle_location: '',
      receive_date: new Date().toISOString().slice(0, 10),
      receive_time: new Date().toISOString().slice(11, 16),
    })
    setSelectedJob(null)
    setError('')
    setSuccess('')
  }

  const loadBase = async () => {
    setLoading(true)
    setError('')
    try {
      const [jobsRes, historyRes] = await Promise.all([
        jobOrdersApi.list({ limit: 300 }),
        jobOrdersApi.enquiryDispatchedJobs(),
      ])
      setJobOrders(jobsRes?.data || [])
      setHistory(historyRes?.data || [])
    } catch (e) {
      console.error(e)
      setError(e?.response?.data?.detail || 'Failed to load dispatched jobs.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBase()
  }, [])

  useEffect(() => {
    if (!form.job_order_id) {
      setSelectedJob(null)
      return
    }
    const job = jobOrders.find((j) => Number(j.job_order_id) === Number(form.job_order_id)) || null
    setSelectedJob(job)
    setForm((p) => ({
      ...p,
      received_section: job?.dispatched_section || p.received_section,
    }))
  }, [form.job_order_id, jobOrders])

  const onRefresh = async () => {
    resetForm()
    await loadBase()
  }

  const onReceive = async () => {
    if (!form.job_order_id) {
      setError('Select the job order number to receive.')
      return
    }
    if (!form.received_section) {
      setError('Section is required.')
      return
    }
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await jobOrdersApi.receive(Number(form.job_order_id), {
        received_section: form.received_section,
        received_vehicle_location: form.received_vehicle_location || null,
      })
      setSuccess('Received dispatched job recorded successfully.')
      await loadBase()
    } catch (e) {
      console.error(e)
      setError(e?.response?.data?.detail || 'Failed to receive dispatched job.')
    } finally {
      setSaving(false)
    }
  }

  const filteredHistory = useMemo(() => {
    if (!form.job_order_id) return history.slice(0, 50)
    return history.filter((h) => Number(h.job_order_id) === Number(form.job_order_id)).slice(0, 50)
  }, [history, form.job_order_id])

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Receive Dispatched Job</CardTitle>
          <CardDescription>
            Record receipt of dispatched jobs by section so technicians can clock-in and the job can later be closed.
          </CardDescription>
        </CardHeader>
        <div className="px-6 pb-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={onReceive} disabled={saving || loading}>
              {saving ? 'Receiving...' : 'Receive Dispatched Job'}
            </Button>
            <Button type="button" variant="outline" onClick={onRefresh} disabled={loading}>
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="text-sm md:col-span-2">
              <span className="text-muted-foreground">Job Order No</span>
              <select
                className="w-full mt-1 border rounded px-3 py-2"
                value={form.job_order_id}
                onChange={(e) => setForm((p) => ({ ...p, job_order_id: e.target.value }))}
              >
                <option value="">Select dispatched job order</option>
                {jobOrders
                  .filter((j) => String(j.status || '').toLowerCase() === 'dispatched')
                  .map((j) => (
                    <option key={j.job_order_id} value={j.job_order_id}>
                      {j.job_order_number || `#${j.job_order_id}`}
                    </option>
                  ))}
              </select>
            </label>

            <label className="text-sm">
              <span className="text-muted-foreground">Plate No</span>
              <input className="w-full mt-1 border rounded px-3 py-2 bg-muted/35" value={selectedJob?.license_plate || ''} readOnly />
            </label>

            <label className="text-sm md:col-span-2">
              <span className="text-muted-foreground">Customer Name</span>
              <input className="w-full mt-1 border rounded px-3 py-2 bg-muted/35" value={selectedJob?.customer_name || ''} readOnly />
            </label>

            <label className="text-sm">
              <span className="text-muted-foreground">Job Type</span>
              <input className="w-full mt-1 border rounded px-3 py-2 bg-muted/35" value={selectedJob?.service_type_name || ''} readOnly />
            </label>

            <label className="text-sm md:col-span-2">
              <span className="text-muted-foreground">Dispatch To</span>
              <input className="w-full mt-1 border rounded px-3 py-2 bg-muted/35" value={selectedJob?.dispatched_section || ''} readOnly />
            </label>

            <label className="text-sm">
              <span className="text-muted-foreground">Dispatch Date</span>
              <input
                type="date"
                className="w-full mt-1 border rounded px-3 py-2 bg-muted/35"
                value={String(selectedJob?.dispatched_at || '').slice(0, 10)}
                readOnly
              />
            </label>

            <label className="text-sm">
              <span className="text-muted-foreground">Dispatch Time (24 Hr)</span>
              <input className="w-full mt-1 border rounded px-3 py-2 bg-muted/35" value={String(selectedJob?.dispatched_at || '').slice(11, 16)} readOnly />
            </label>

            <label className="text-sm">
              <span className="text-muted-foreground">Receive Date</span>
              <input type="date" className="w-full mt-1 border rounded px-3 py-2 bg-muted/35" value={form.receive_date} readOnly />
            </label>

            <label className="text-sm">
              <span className="text-muted-foreground">Receive Time (24Hr)</span>
              <input className="w-full mt-1 border rounded px-3 py-2 bg-muted/35" value={form.receive_time} readOnly />
            </label>

            <label className="text-sm md:col-span-3">
              <span className="text-muted-foreground">Vehicle Location</span>
              <input
                className="w-full mt-1 border rounded px-3 py-2"
                value={form.received_vehicle_location}
                onChange={(e) => setForm((p) => ({ ...p, received_vehicle_location: e.target.value }))}
                placeholder="Specify where the vehicle is parked..."
              />
            </label>

            <label className="text-sm md:col-span-3">
              <span className="text-muted-foreground">Received By Section</span>
              <input
                className="w-full mt-1 border rounded px-3 py-2"
                value={form.received_section}
                onChange={(e) => setForm((p) => ({ ...p, received_section: e.target.value }))}
                placeholder="Section receiving this job"
              />
            </label>
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}
          {success && <div className="text-sm text-green-600">{success}</div>}
        </div>
      </Card>

      <Card className="border-dashed bg-muted/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Dispatched Job Log</CardTitle>
        </CardHeader>
        <div className="px-6 pb-6">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 pr-3">Jc No</th>
                  <th className="py-2 pr-3">Date</th>
                  <th className="py-2 pr-3">Time</th>
                  <th className="py-2 pr-3">Dispatch To</th>
                  <th className="py-2 pr-3">Remark</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.length === 0 ? (
                  <tr><td className="py-3 text-muted-foreground" colSpan={5}>No dispatched jobs found.</td></tr>
                ) : (
                  filteredHistory.map((r, idx) => (
                    <tr key={`${r.job_order_id || idx}-${idx}`} className="border-b">
                      <td className="py-2 pr-3">{r.job_order_number || r.job_order_id}</td>
                      <td className="py-2 pr-3">{String(r.dispatched_at || '').slice(0, 10)}</td>
                      <td className="py-2 pr-3">{String(r.dispatched_at || '').slice(11, 16)}</td>
                      <td className="py-2 pr-3">{r.dispatched_section || '-'}</td>
                      <td className="py-2 pr-3">{r.dispatch_remark || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  )
}

function JobClockInPanel() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isAddMode, setIsAddMode] = useState(false)
  const [jobOrders, setJobOrders] = useState([])
  const [technicians, setTechnicians] = useState([])
  const [selectedJob, setSelectedJob] = useState(null)
  const [jobTasks, setJobTasks] = useState([])
  const [history, setHistory] = useState([])
  const [form, setForm] = useState({
    job_order_id: '',
    technician_employee_id: '',
    task_id: '',
    clock_in_remark: '',
    clock_in_date: new Date().toISOString().slice(0, 10),
    clock_in_time: new Date().toISOString().slice(11, 16),
  })

  const loadBase = async () => {
    setLoading(true)
    setError('')
    try {
      const [jobsRes, techRes, activeRes] = await Promise.all([
        jobOrdersApi.list({ limit: 300 }),
        employeesApi.getMechanics(),
        jobOrdersApi.enquiryClockedInJobs(),
      ])
      setJobOrders(jobsRes?.data || [])
      setTechnicians(techRes?.data || [])
      setHistory(activeRes?.data || [])
    } catch (e) {
      console.error(e)
      setError(e?.response?.data?.detail || 'Failed to load clock-in screen.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBase()
  }, [])

  useEffect(() => {
    const loadJobDetails = async () => {
      if (!form.job_order_id) {
        setSelectedJob(null)
        setJobTasks([])
        return
      }
      const base = jobOrders.find((j) => Number(j.job_order_id) === Number(form.job_order_id)) || null
      setSelectedJob(base)
      try {
        const res = await jobOrdersApi.getById(Number(form.job_order_id))
        const job = res?.data || base
        setSelectedJob(job)
        setJobTasks(job?.tasks || [])
      } catch (e) {
        console.error(e)
        setJobTasks(base?.tasks || [])
      }
    }
    loadJobDetails()
  }, [form.job_order_id, jobOrders])

  const technicianOptions = useMemo(() => {
    const sec = (selectedJob?.received_section || '').toLowerCase()
    if (!sec) return technicians
    const inSection = technicians.filter((t) => String(t.section || '').toLowerCase() === sec)
    return inSection.length > 0 ? inSection : technicians
  }, [technicians, selectedJob])

  const onRefresh = async () => {
    setForm({
      job_order_id: '',
      technician_employee_id: '',
      task_id: '',
      clock_in_remark: '',
      clock_in_date: new Date().toISOString().slice(0, 10),
      clock_in_time: new Date().toISOString().slice(11, 16),
    })
    setSelectedJob(null)
    setJobTasks([])
    setIsAddMode(false)
    setError('')
    setSuccess('')
    await loadBase()
  }

  const onAddNew = () => {
    setIsAddMode(true)
    setError('')
    setSuccess('')
    setForm((p) => ({
      ...p,
      clock_in_date: new Date().toISOString().slice(0, 10),
      clock_in_time: new Date().toISOString().slice(11, 16),
    }))
  }

  const onSave = async () => {
    if (!isAddMode) {
      setError('Click Add New before saving clock-in.')
      return
    }
    if (!form.job_order_id) {
      setError('Select job order.')
      return
    }
    if (!form.technician_employee_id) {
      setError('Select technician.')
      return
    }
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await jobOrdersApi.clockIn(Number(form.job_order_id), {
        technician_employee_id: Number(form.technician_employee_id),
        task_id: form.task_id ? Number(form.task_id) : null,
        clock_in_remark: form.clock_in_remark || null,
      })
      setSuccess('Job clocked-in successfully.')
      setIsAddMode(false)
      setForm((p) => ({ ...p, technician_employee_id: '', task_id: '', clock_in_remark: '' }))
      await loadBase()
    } catch (e) {
      console.error(e)
      setError(e?.response?.data?.detail || 'Failed to clock-in job.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Job Clock In</CardTitle>
          <CardDescription>
            Clock-in a received job to a technician with selected task/charge type.
          </CardDescription>
        </CardHeader>
        <div className="px-6 pb-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={onAddNew}>Add New</Button>
            <Button type="button" onClick={onSave} disabled={saving || loading}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
            <Button type="button" variant="outline" onClick={onRefresh} disabled={loading}>
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="text-sm md:col-span-2">
              <span className="text-muted-foreground">Job Order No</span>
              <select
                className="w-full mt-1 border rounded px-3 py-2"
                value={form.job_order_id}
                onChange={(e) => setForm((p) => ({ ...p, job_order_id: e.target.value }))}
                disabled={!isAddMode}
              >
                <option value="">Select received job order</option>
                {jobOrders
                  .filter((j) => String(j.status || '').toLowerCase() === 'received')
                  .map((j) => (
                    <option key={j.job_order_id} value={j.job_order_id}>
                      {j.job_order_number || `#${j.job_order_id}`}
                    </option>
                  ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="text-muted-foreground">Plate No</span>
              <input className="w-full mt-1 border rounded px-3 py-2 bg-muted/35" value={selectedJob?.license_plate || ''} readOnly />
            </label>
            <label className="text-sm md:col-span-3">
              <span className="text-muted-foreground">Customer Name</span>
              <input className="w-full mt-1 border rounded px-3 py-2 bg-muted/35" value={selectedJob?.customer_name || ''} readOnly />
            </label>
            <label className="text-sm">
              <span className="text-muted-foreground">Job Type</span>
              <input className="w-full mt-1 border rounded px-3 py-2 bg-muted/35" value={selectedJob?.service_type_name || ''} readOnly />
            </label>
            <label className="text-sm md:col-span-2">
              <span className="text-muted-foreground">Technician</span>
              <select
                className="w-full mt-1 border rounded px-3 py-2"
                value={form.technician_employee_id}
                onChange={(e) => setForm((p) => ({ ...p, technician_employee_id: e.target.value }))}
                disabled={!isAddMode}
              >
                <option value="">Select technician</option>
                {technicianOptions.map((t) => (
                  <option key={t.employee_id} value={t.employee_id}>
                    {(t.name || `${t.first_name || ''} ${t.last_name || ''}`.trim() || `#${t.employee_id}`)}{t.section ? ` - ${t.section}` : ''}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="text-muted-foreground">Clock In Date</span>
              <input type="date" className="w-full mt-1 border rounded px-3 py-2 bg-muted/35" value={form.clock_in_date} readOnly />
            </label>
            <label className="text-sm">
              <span className="text-muted-foreground">Clock In Time (In 24Hr)</span>
              <input className="w-full mt-1 border rounded px-3 py-2 bg-muted/35" value={form.clock_in_time} readOnly />
            </label>
            <label className="text-sm md:col-span-3">
              <span className="text-muted-foreground">Remark</span>
              <input
                className="w-full mt-1 border rounded px-3 py-2"
                value={form.clock_in_remark}
                onChange={(e) => setForm((p) => ({ ...p, clock_in_remark: e.target.value }))}
                disabled={!isAddMode}
                placeholder="Write a remark if any"
              />
            </label>
            <label className="text-sm md:col-span-3">
              <span className="text-muted-foreground">For Charge Type</span>
              <select
                className="w-full mt-1 border rounded px-3 py-2"
                value={form.task_id}
                onChange={(e) => setForm((p) => ({ ...p, task_id: e.target.value }))}
                disabled={!isAddMode}
              >
                <option value="">Select task / charge type</option>
                {jobTasks.map((t) => (
                  <option key={t.task_id} value={t.task_id}>
                    {t.task_description || t.task_name || `Task #${t.task_id}`}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}
          {success && <div className="text-sm text-green-600">{success}</div>}
        </div>
      </Card>

      <Card className="border-dashed bg-muted/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Current Clock In Entries</CardTitle>
        </CardHeader>
        <div className="px-6 pb-6 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2 pr-3">Jc No</th>
                <th className="py-2 pr-3">Technician</th>
                <th className="py-2 pr-3">Charge Code</th>
                <th className="py-2 pr-3">Clock In Date</th>
                <th className="py-2 pr-3">Clock In Time</th>
                <th className="py-2 pr-3">Remark</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr><td colSpan={6} className="py-3 text-muted-foreground">No active clock-ins.</td></tr>
              ) : (
                history.map((r, idx) => (
                  <tr key={r.job_clock_id || idx} className="border-b">
                    <td className="py-2 pr-3">{r.job_order_number || r.job_order_id}</td>
                    <td className="py-2 pr-3">{r.technician_name || '-'}</td>
                    <td className="py-2 pr-3">{r.task_id || '-'}</td>
                    <td className="py-2 pr-3">{String(r.clock_in_at || '').slice(0, 10)}</td>
                    <td className="py-2 pr-3">{String(r.clock_in_at || '').slice(11, 16)}</td>
                    <td className="py-2 pr-3">{r.clock_in_remark || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

function JobClockOutPanel() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [jobOrders, setJobOrders] = useState([])
  const [selectedJob, setSelectedJob] = useState(null)
  const [clocks, setClocks] = useState([])
  const [selectedClockId, setSelectedClockId] = useState(null)
  const [form, setForm] = useState({
    job_order_id: '',
    clock_out_reason: 'Completed',
    clock_out_remark: '',
    clock_out_date: new Date().toISOString().slice(0, 10),
    clock_out_time: new Date().toISOString().slice(11, 16),
  })

  const CLOCK_OUT_REASONS = ['Completed', 'Paused', 'Waiting Parts', 'Waiting Approval', 'Reassigned', 'Other']

  const loadJobs = async () => {
    setLoading(true)
    setError('')
    try {
      const jobsRes = await jobOrdersApi.list({ limit: 300 })
      setJobOrders(jobsRes?.data || [])
    } catch (e) {
      console.error(e)
      setError(e?.response?.data?.detail || 'Failed to load clock-out screen.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadJobs()
  }, [])

  useEffect(() => {
    const loadData = async () => {
      if (!form.job_order_id) {
        setSelectedJob(null)
        setClocks([])
        setSelectedClockId(null)
        return
      }
      const job = jobOrders.find((j) => Number(j.job_order_id) === Number(form.job_order_id)) || null
      setSelectedJob(job)
      try {
        const [jobRes, clocksRes] = await Promise.all([
          jobOrdersApi.getById(Number(form.job_order_id)),
          jobOrdersApi.listClocks(Number(form.job_order_id)),
        ])
        setSelectedJob(jobRes?.data || job)
        const active = (clocksRes?.data || []).filter((c) => !c.clock_out_at)
        setClocks(active)
      } catch (e) {
        console.error(e)
        setClocks([])
      }
      setSelectedClockId(null)
    }
    loadData()
  }, [form.job_order_id, jobOrders])

  const selectedClock = useMemo(
    () => clocks.find((c) => Number(c.job_clock_id) === Number(selectedClockId)) || null,
    [clocks, selectedClockId]
  )

  const onRefresh = async () => {
    setForm({
      job_order_id: '',
      clock_out_reason: 'Completed',
      clock_out_remark: '',
      clock_out_date: new Date().toISOString().slice(0, 10),
      clock_out_time: new Date().toISOString().slice(11, 16),
    })
    setSelectedJob(null)
    setClocks([])
    setSelectedClockId(null)
    setError('')
    setSuccess('')
    await loadJobs()
  }

  const onClockOut = async () => {
    if (!form.job_order_id) {
      setError('Select job order.')
      return
    }
    if (!selectedClockId) {
      setError('Double click an active job text row to select a clock entry.')
      return
    }
    if (!form.clock_out_reason) {
      setError('Reason for clock-out is required.')
      return
    }
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await jobOrdersApi.clockOut(Number(form.job_order_id), Number(selectedClockId), {
        clock_out_reason: form.clock_out_reason,
        clock_out_remark: form.clock_out_remark || null,
      })
      setSuccess('Clock-out recorded successfully.')
      setForm((p) => ({ ...p, clock_out_remark: '' }))
      const clocksRes = await jobOrdersApi.listClocks(Number(form.job_order_id))
      setClocks((clocksRes?.data || []).filter((c) => !c.clock_out_at))
      setSelectedClockId(null)
    } catch (e) {
      console.error(e)
      setError(e?.response?.data?.detail || 'Failed to clock-out entry.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Job Clock Out</CardTitle>
          <CardDescription>
            Record completion/parking of technician work so technician can be assigned to another job.
          </CardDescription>
        </CardHeader>
        <div className="px-6 pb-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="destructive" onClick={onClockOut} disabled={saving || loading}>
              {saving ? 'Clocking Out...' : 'Clock Out'}
            </Button>
            <Button type="button" variant="outline" onClick={onRefresh} disabled={loading}>
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="text-sm md:col-span-2">
              <span className="text-muted-foreground">Job Order No</span>
              <select
                className="w-full mt-1 border rounded px-3 py-2"
                value={form.job_order_id}
                onChange={(e) => setForm((p) => ({ ...p, job_order_id: e.target.value }))}
              >
                <option value="">Select job order</option>
                {jobOrders.map((j) => (
                  <option key={j.job_order_id} value={j.job_order_id}>
                    {j.job_order_number || `#${j.job_order_id}`}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="text-muted-foreground">Plate No</span>
              <input className="w-full mt-1 border rounded px-3 py-2 bg-muted/35" value={selectedJob?.license_plate || ''} readOnly />
            </label>
            <label className="text-sm md:col-span-3">
              <span className="text-muted-foreground">Customer Name</span>
              <input className="w-full mt-1 border rounded px-3 py-2 bg-muted/35" value={selectedJob?.customer_name || ''} readOnly />
            </label>
            <label className="text-sm">
              <span className="text-muted-foreground">Job Type</span>
              <input className="w-full mt-1 border rounded px-3 py-2 bg-muted/35" value={selectedJob?.service_type_name || ''} readOnly />
            </label>
            <label className="text-sm md:col-span-2">
              <span className="text-muted-foreground">Selected Technician</span>
              <input
                className="w-full mt-1 border rounded px-3 py-2 bg-muted/35"
                value={selectedClock?.technician_employee_id ? `#${selectedClock.technician_employee_id}` : ''}
                readOnly
              />
            </label>
            <label className="text-sm">
              <span className="text-muted-foreground">Clock In Date</span>
              <input type="date" className="w-full mt-1 border rounded px-3 py-2 bg-muted/35" value={String(selectedClock?.clock_in_at || '').slice(0, 10)} readOnly />
            </label>
            <label className="text-sm">
              <span className="text-muted-foreground">Clock In Time</span>
              <input className="w-full mt-1 border rounded px-3 py-2 bg-muted/35" value={String(selectedClock?.clock_in_at || '').slice(11, 16)} readOnly />
            </label>
            <label className="text-sm">
              <span className="text-muted-foreground">Clock Out Date</span>
              <input type="date" className="w-full mt-1 border rounded px-3 py-2 bg-muted/35" value={form.clock_out_date} readOnly />
            </label>
            <label className="text-sm">
              <span className="text-muted-foreground">Clock Out Time</span>
              <input className="w-full mt-1 border rounded px-3 py-2 bg-muted/35" value={form.clock_out_time} readOnly />
            </label>
            <label className="text-sm md:col-span-3">
              <span className="text-muted-foreground">Remark</span>
              <input
                className="w-full mt-1 border rounded px-3 py-2"
                value={form.clock_out_remark}
                onChange={(e) => setForm((p) => ({ ...p, clock_out_remark: e.target.value }))}
                placeholder="Write a remark if any"
              />
            </label>
            <label className="text-sm md:col-span-3">
              <span className="text-muted-foreground">Reason For Out</span>
              <select
                className="w-full mt-1 border rounded px-3 py-2"
                value={form.clock_out_reason}
                onChange={(e) => setForm((p) => ({ ...p, clock_out_reason: e.target.value }))}
              >
                {CLOCK_OUT_REASONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </label>
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}
          {success && <div className="text-sm text-green-600">{success}</div>}
        </div>
      </Card>

      <Card className="border-dashed bg-muted/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Active Job Text / Charge Type</CardTitle>
          <CardDescription>Double click a row to populate the clock-out fields.</CardDescription>
        </CardHeader>
        <div className="px-6 pb-6 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2 pr-3">Jc No</th>
                <th className="py-2 pr-3">Technician</th>
                <th className="py-2 pr-3">Charge Code</th>
                <th className="py-2 pr-3">Clock In Date</th>
                <th className="py-2 pr-3">Clock In Time</th>
                <th className="py-2 pr-3">Remark</th>
              </tr>
            </thead>
            <tbody>
              {clocks.length === 0 ? (
                <tr><td colSpan={6} className="py-3 text-muted-foreground">No active clock entries.</td></tr>
              ) : (
                clocks.map((c, idx) => (
                  <tr
                    key={c.job_clock_id || idx}
                    className={`border-b cursor-pointer ${Number(selectedClockId) === Number(c.job_clock_id) ? 'bg-blue-50' : ''}`}
                    onDoubleClick={() => setSelectedClockId(c.job_clock_id)}
                  >
                    <td className="py-2 pr-3">{selectedJob?.job_order_number || selectedJob?.job_order_id || form.job_order_id}</td>
                    <td className="py-2 pr-3">{c.technician_employee_id || '-'}</td>
                    <td className="py-2 pr-3">{c.task_id || '-'}</td>
                    <td className="py-2 pr-3">{String(c.clock_in_at || '').slice(0, 10)}</td>
                    <td className="py-2 pr-3">{String(c.clock_in_at || '').slice(11, 16)}</td>
                    <td className="py-2 pr-3">{c.clock_in_remark || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

function TransferChargeCodeByTechnicianPanel() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isAddMode, setIsAddMode] = useState(false)
  const [settingId, setSettingId] = useState(null)
  const [rows, setRows] = useState([])
  const [jobOrders, setJobOrders] = useState([])
  const [technicians, setTechnicians] = useState([])
  const [selectedJob, setSelectedJob] = useState(null)
  const [allClocks, setAllClocks] = useState([])
  const [form, setForm] = useState({
    job_order_id: '',
    technician_employee_id: '',
    from_task_id: '',
    to_task_id: '',
    transfer_percent: '',
    remark: '',
  })

  const SETTING_KEY = 'task:transfer-charge-code-by-tech'
  const SETTING_CATEGORY = 'task_entry_forms'

  const loadRows = async () => {
    const res = await systemSettingsApi.list({ category: SETTING_CATEGORY, limit: 500 })
    const found = (res?.data || []).find((r) => r.setting_key === SETTING_KEY)
    setSettingId(found?.setting_id || null)
    const parsed = found?.setting_value ? JSON.parse(found.setting_value) : []
    setRows(Array.isArray(parsed) ? parsed : [])
  }

  const loadBase = async () => {
    setLoading(true)
    setError('')
    try {
      const [jobsRes, techRes] = await Promise.all([
        jobOrdersApi.list({ limit: 300 }),
        employeesApi.getMechanics(),
      ])
      setJobOrders(jobsRes?.data || [])
      setTechnicians(techRes?.data || [])
      await loadRows()
    } catch (e) {
      console.error(e)
      setError(e?.response?.data?.detail || 'Failed to load transfer charge code screen.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBase()
  }, [])

  useEffect(() => {
    const loadJob = async () => {
      if (!form.job_order_id) {
        setSelectedJob(null)
        setAllClocks([])
        return
      }
      try {
        const [jobRes, clocksRes] = await Promise.all([
          jobOrdersApi.getById(Number(form.job_order_id)),
          jobOrdersApi.listClocks(Number(form.job_order_id)),
        ])
        setSelectedJob(jobRes?.data || null)
        setAllClocks(clocksRes?.data || [])
      } catch (e) {
        console.error(e)
        setSelectedJob(null)
        setAllClocks([])
      }
    }
    loadJob()
  }, [form.job_order_id])

  const availableTechnicians = useMemo(() => {
    const ids = new Set(allClocks.map((c) => c.technician_employee_id).filter(Boolean))
    if (ids.size === 0) return []
    return technicians.filter((t) => ids.has(t.employee_id))
  }, [allClocks, technicians])

  const technicianClocks = useMemo(() => {
    if (!form.technician_employee_id) return []
    return allClocks.filter((c) => Number(c.technician_employee_id) === Number(form.technician_employee_id))
  }, [allClocks, form.technician_employee_id])

  const operationOptions = useMemo(() => {
    const out = new Map()
    technicianClocks.forEach((c) => {
      const t = selectedJob?.tasks?.find((x) => Number(x.task_id) === Number(c.task_id))
      out.set(
        String(c.task_id || ''),
        t?.task_description || t?.task_name || (c.task_id ? `Task #${c.task_id}` : 'Unknown task')
      )
    })
    return Array.from(out.entries()).map(([id, name]) => ({ id, name })).filter((x) => x.id)
  }, [technicianClocks, selectedJob])

  const onRefresh = async () => {
    setForm({
      job_order_id: '',
      technician_employee_id: '',
      from_task_id: '',
      to_task_id: '',
      transfer_percent: '',
      remark: '',
    })
    setSelectedJob(null)
    setAllClocks([])
    setIsAddMode(false)
    setError('')
    setSuccess('')
    await loadBase()
  }

  const onAddNew = () => {
    setIsAddMode(true)
    setError('')
    setSuccess('')
  }

  const onSave = async () => {
    if (!isAddMode) {
      setError('Click Add New before saving.')
      return
    }
    if (!form.job_order_id || !form.technician_employee_id || !form.from_task_id || !form.to_task_id) {
      setError('Job order, technician, from operation, and to operation are required.')
      return
    }
    const pct = Number(form.transfer_percent)
    if (!Number.isFinite(pct) || pct <= 0 || pct > 100) {
      setError('Transfer percentage must be between 0 and 100.')
      return
    }
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const tech = technicians.find((t) => Number(t.employee_id) === Number(form.technician_employee_id))
      const fromOp = operationOptions.find((o) => Number(o.id) === Number(form.from_task_id))
      const toOp = operationOptions.find((o) => Number(o.id) === Number(form.to_task_id))
      const record = {
        entry_id: Date.now(),
        created_at: new Date().toISOString(),
        job_order_id: Number(form.job_order_id),
        job_order_number: selectedJob?.job_order_number || null,
        technician_employee_id: Number(form.technician_employee_id),
        technician_name: tech?.name || `${tech?.first_name || ''} ${tech?.last_name || ''}`.trim() || null,
        from_task_id: Number(form.from_task_id),
        from_operation: fromOp?.name || null,
        to_task_id: Number(form.to_task_id),
        to_operation: toOp?.name || null,
        transfer_percent: pct,
        remark: form.remark || null,
      }
      const nextRows = [record, ...rows].slice(0, 500)
      const payload = {
        setting_key: SETTING_KEY,
        setting_value: JSON.stringify(nextRows),
        setting_type: 'json',
        category: SETTING_CATEGORY,
        description: 'Transfer charge code allocations by technician',
      }
      if (settingId) await systemSettingsApi.update(settingId, payload)
      else await systemSettingsApi.create(payload)
      await loadRows()
      setSuccess('Transfer allocation saved.')
      setIsAddMode(false)
      setForm((p) => ({ ...p, technician_employee_id: '', from_task_id: '', to_task_id: '', transfer_percent: '', remark: '' }))
    } catch (e) {
      console.error(e)
      setError(e?.response?.data?.detail || 'Failed to save transfer allocation.')
    } finally {
      setSaving(false)
    }
  }

  const shownRows = useMemo(() => {
    if (!form.job_order_id) return rows.slice(0, 30)
    return rows.filter((r) => Number(r.job_order_id) === Number(form.job_order_id)).slice(0, 30)
  }, [rows, form.job_order_id])

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Transfer Charge Code By Technician</CardTitle>
          <CardDescription>
            Allocate charge percentages for a technician across operations worked on the selected job order.
          </CardDescription>
        </CardHeader>
        <div className="px-6 pb-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={onAddNew}>Add New</Button>
            <Button type="button" onClick={onSave} disabled={saving || loading}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
            <Button type="button" variant="outline" onClick={onRefresh} disabled={loading}>
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="text-sm md:col-span-2">
              <span className="text-muted-foreground">Job Order No</span>
              <select
                className="w-full mt-1 border rounded px-3 py-2"
                value={form.job_order_id}
                onChange={(e) => setForm((p) => ({ ...p, job_order_id: e.target.value, technician_employee_id: '', from_task_id: '', to_task_id: '' }))}
                disabled={!isAddMode}
              >
                <option value="">Select job order</option>
                {jobOrders.map((j) => (
                  <option key={j.job_order_id} value={j.job_order_id}>
                    {j.job_order_number || `#${j.job_order_id}`}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="text-muted-foreground">Plate No</span>
              <input className="w-full mt-1 border rounded px-3 py-2 bg-muted/35" value={selectedJob?.license_plate || ''} readOnly />
            </label>
            <label className="text-sm md:col-span-3">
              <span className="text-muted-foreground">Customer Name</span>
              <input className="w-full mt-1 border rounded px-3 py-2 bg-muted/35" value={selectedJob?.customer_name || ''} readOnly />
            </label>
            <label className="text-sm md:col-span-3">
              <span className="text-muted-foreground">Technician</span>
              <select
                className="w-full mt-1 border rounded px-3 py-2"
                value={form.technician_employee_id}
                onChange={(e) => setForm((p) => ({ ...p, technician_employee_id: e.target.value, from_task_id: '', to_task_id: '' }))}
                disabled={!isAddMode}
              >
                <option value="">Select technician</option>
                {availableTechnicians.map((t) => (
                  <option key={t.employee_id} value={t.employee_id}>
                    {t.name || `${t.first_name || ''} ${t.last_name || ''}`.trim() || `#${t.employee_id}`}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm md:col-span-3">
              <span className="text-muted-foreground">From Operation</span>
              <select
                className="w-full mt-1 border rounded px-3 py-2"
                value={form.from_task_id}
                onChange={(e) => setForm((p) => ({ ...p, from_task_id: e.target.value }))}
                disabled={!isAddMode}
              >
                <option value="">Select from operation</option>
                {operationOptions.map((o) => (
                  <option key={`from-${o.id}`} value={o.id}>{o.name}</option>
                ))}
              </select>
            </label>
            <label className="text-sm md:col-span-3">
              <span className="text-muted-foreground">To Operation</span>
              <select
                className="w-full mt-1 border rounded px-3 py-2"
                value={form.to_task_id}
                onChange={(e) => setForm((p) => ({ ...p, to_task_id: e.target.value }))}
                disabled={!isAddMode}
              >
                <option value="">Select to operation</option>
                {operationOptions.map((o) => (
                  <option key={`to-${o.id}`} value={o.id}>{o.name}</option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="text-muted-foreground">Charge % To Transfer</span>
              <input
                type="number"
                min="0"
                max="100"
                className="w-full mt-1 border rounded px-3 py-2"
                value={form.transfer_percent}
                onChange={(e) => setForm((p) => ({ ...p, transfer_percent: e.target.value }))}
                disabled={!isAddMode}
              />
            </label>
            <label className="text-sm md:col-span-2">
              <span className="text-muted-foreground">Remark</span>
              <input
                className="w-full mt-1 border rounded px-3 py-2"
                value={form.remark}
                onChange={(e) => setForm((p) => ({ ...p, remark: e.target.value }))}
                disabled={!isAddMode}
              />
            </label>
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}
          {success && <div className="text-sm text-green-600">{success}</div>}
        </div>
      </Card>

      <Card className="border-dashed bg-muted/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Allocation History</CardTitle>
        </CardHeader>
        <div className="px-6 pb-6 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2 pr-3">Jc No</th>
                <th className="py-2 pr-3">Technician</th>
                <th className="py-2 pr-3">From Operation</th>
                <th className="py-2 pr-3">To Operation</th>
                <th className="py-2 pr-3">Charge %</th>
                <th className="py-2 pr-3">Remark</th>
              </tr>
            </thead>
            <tbody>
              {shownRows.length === 0 ? (
                <tr><td colSpan={6} className="py-3 text-muted-foreground">No transfer records yet.</td></tr>
              ) : (
                shownRows.map((r, idx) => (
                  <tr key={r.entry_id || idx} className="border-b">
                    <td className="py-2 pr-3">{r.job_order_number || r.job_order_id}</td>
                    <td className="py-2 pr-3">{r.technician_name || r.technician_employee_id}</td>
                    <td className="py-2 pr-3">{r.from_operation || r.from_task_id}</td>
                    <td className="py-2 pr-3">{r.to_operation || r.to_task_id}</td>
                    <td className="py-2 pr-3">{r.transfer_percent}</td>
                    <td className="py-2 pr-3">{r.remark || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

function UpdateLastClockOutReasonPanel() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isAddMode, setIsAddMode] = useState(false)
  const [jobOrders, setJobOrders] = useState([])
  const [selectedJob, setSelectedJob] = useState(null)
  const [clocks, setClocks] = useState([])
  const [form, setForm] = useState({
    job_order_id: '',
    clock_out_reason: '',
  })

  const loadBase = async () => {
    setLoading(true)
    setError('')
    try {
      const jobsRes = await jobOrdersApi.list({ limit: 300 })
      setJobOrders(jobsRes?.data || [])
    } catch (e) {
      console.error(e)
      setError(e?.response?.data?.detail || 'Failed to load clock-out reason update screen.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBase()
  }, [])

  useEffect(() => {
    const loadJobData = async () => {
      if (!form.job_order_id) {
        setSelectedJob(null)
        setClocks([])
        return
      }
      try {
        const [jobRes, clocksRes] = await Promise.all([
          jobOrdersApi.getById(Number(form.job_order_id)),
          jobOrdersApi.listClocks(Number(form.job_order_id)),
        ])
        const job = jobRes?.data || null
        const list = clocksRes?.data || []
        setSelectedJob(job)
        setClocks(list)
      } catch (e) {
        console.error(e)
        setSelectedJob(null)
        setClocks([])
      }
    }
    loadJobData()
  }, [form.job_order_id])

  const lastClockedOut = useMemo(
    () => clocks.find((c) => c.clock_out_at) || null,
    [clocks]
  )

  const onRefresh = async () => {
    setForm({ job_order_id: '', clock_out_reason: '' })
    setSelectedJob(null)
    setClocks([])
    setError('')
    setSuccess('')
    setIsAddMode(false)
    await loadBase()
  }

  const onAddNew = () => {
    setIsAddMode(true)
    setError('')
    setSuccess('')
  }

  const onSave = async () => {
    if (!isAddMode) {
      setError('Click Add New before saving.')
      return
    }
    if (!form.job_order_id) {
      setError('Select job order.')
      return
    }
    if (!form.clock_out_reason.trim()) {
      setError('Clock out reason is required.')
      return
    }
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await jobOrdersApi.updateLastClockOutReason(Number(form.job_order_id), {
        clock_out_reason: form.clock_out_reason.trim(),
      })
      setSuccess('Last clock-out reason updated.')
      setIsAddMode(false)
      const clocksRes = await jobOrdersApi.listClocks(Number(form.job_order_id))
      setClocks(clocksRes?.data || [])
    } catch (e) {
      console.error(e)
      setError(e?.response?.data?.detail || 'Failed to update last clock-out reason.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Update Last Clock Out Reason</CardTitle>
          <CardDescription>
            Change the reason for the last clock-out entry of a selected job order.
          </CardDescription>
        </CardHeader>
        <div className="px-6 pb-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={onAddNew}>Add New</Button>
            <Button type="button" onClick={onSave} disabled={saving || loading}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
            <Button type="button" variant="outline" onClick={onRefresh} disabled={loading}>
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="text-sm md:col-span-2">
              <span className="text-muted-foreground">Job Order No</span>
              <select
                className="w-full mt-1 border rounded px-3 py-2"
                value={form.job_order_id}
                onChange={(e) => setForm((p) => ({ ...p, job_order_id: e.target.value }))}
                disabled={!isAddMode}
              >
                <option value="">Select job order</option>
                {jobOrders.map((j) => (
                  <option key={j.job_order_id} value={j.job_order_id}>
                    {j.job_order_number || `#${j.job_order_id}`}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="text-muted-foreground">Plate No</span>
              <input className="w-full mt-1 border rounded px-3 py-2 bg-muted/35" value={selectedJob?.license_plate || ''} readOnly />
            </label>
            <label className="text-sm md:col-span-3">
              <span className="text-muted-foreground">Customer Name</span>
              <input className="w-full mt-1 border rounded px-3 py-2 bg-muted/35" value={selectedJob?.customer_name || ''} readOnly />
            </label>
            <label className="text-sm md:col-span-3">
              <span className="text-muted-foreground">Current Clock Out Reason</span>
              <input className="w-full mt-1 border rounded px-3 py-2 bg-muted/35" value={lastClockedOut?.clock_out_reason || ''} readOnly />
            </label>
            <label className="text-sm md:col-span-3">
              <span className="text-muted-foreground">Current Clock Out Remark</span>
              <textarea className="w-full mt-1 border rounded px-3 py-2 min-h-[80px] bg-muted/35" value={lastClockedOut?.clock_out_remark || ''} readOnly />
            </label>
            <label className="text-sm md:col-span-3">
              <span className="text-muted-foreground">New Clock Out Reason</span>
              <input
                className="w-full mt-1 border rounded px-3 py-2"
                value={form.clock_out_reason}
                onChange={(e) => setForm((p) => ({ ...p, clock_out_reason: e.target.value }))}
                disabled={!isAddMode}
                placeholder="Enter new reason"
              />
            </label>
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}
          {success && <div className="text-sm text-green-600">{success}</div>}
        </div>
      </Card>

      <Card className="border-dashed bg-muted/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Clock Out Entries</CardTitle>
        </CardHeader>
        <div className="px-6 pb-6 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2 pr-3">Jc No</th>
                <th className="py-2 pr-3">Technician</th>
                <th className="py-2 pr-3">Clock In</th>
                <th className="py-2 pr-3">Clock Out</th>
                <th className="py-2 pr-3">Clock Out Reason</th>
              </tr>
            </thead>
            <tbody>
              {clocks.filter((c) => c.clock_out_at).length === 0 ? (
                <tr><td colSpan={5} className="py-3 text-muted-foreground">No clocked-out rows.</td></tr>
              ) : (
                clocks
                  .filter((c) => c.clock_out_at)
                  .map((c, idx) => (
                    <tr key={c.job_clock_id || idx} className="border-b">
                      <td className="py-2 pr-3">{selectedJob?.job_order_number || form.job_order_id}</td>
                      <td className="py-2 pr-3">{c.technician_employee_id || '-'}</td>
                      <td className="py-2 pr-3">{String(c.clock_in_at || '').slice(0, 16)}</td>
                      <td className="py-2 pr-3">{String(c.clock_out_at || '').slice(0, 16)}</td>
                      <td className="py-2 pr-3">{c.clock_out_reason || '-'}</td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

function JobTransferToStationPanel() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isAddMode, setIsAddMode] = useState(false)
  const [settingId, setSettingId] = useState(null)
  const [rows, setRows] = useState([])
  const [jobOrders, setJobOrders] = useState([])
  const [selectedJob, setSelectedJob] = useState(null)
  const [form, setForm] = useState({
    job_order_id: '',
    from_station: '',
    to_station: '',
    reason: '',
  })

  const settingKey = 'task:job-transfer-to-station'

  const loadRows = async () => {
    const res = await systemSettingsApi.list({ category: TASK_ENTRY_CATEGORY, limit: 500 })
    const found = (res?.data || []).find((r) => r.setting_key === settingKey)
    setSettingId(found?.setting_id || null)
    const parsed = found?.setting_value ? JSON.parse(found.setting_value) : []
    setRows(Array.isArray(parsed) ? parsed : [])
  }

  const loadBase = async () => {
    setLoading(true)
    setError('')
    try {
      const jobsRes = await jobOrdersApi.list({ limit: 300 })
      setJobOrders(jobsRes?.data || [])
      await loadRows()
    } catch (e) {
      console.error(e)
      setError('Failed to load station transfer screen.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadBase() }, [])

  useEffect(() => {
    if (!form.job_order_id) return setSelectedJob(null)
    setSelectedJob(jobOrders.find((j) => Number(j.job_order_id) === Number(form.job_order_id)) || null)
  }, [form.job_order_id, jobOrders])

  const stationOptions = useMemo(() => {
    const out = new Set()
    rows.forEach((r) => {
      if (r.from_station) out.add(String(r.from_station))
      if (r.to_station) out.add(String(r.to_station))
    })
    return Array.from(out)
  }, [rows])

  const onRefresh = async () => {
    setForm({ job_order_id: '', from_station: '', to_station: '', reason: '' })
    setSelectedJob(null)
    setIsAddMode(false)
    setError('')
    setSuccess('')
    await loadBase()
  }

  const onSave = async () => {
    if (!isAddMode) return setError('Click Add New before saving.')
    if (!form.job_order_id || !form.from_station || !form.to_station) {
      return setError('Job order, from station and to station are required.')
    }
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const row = {
        entry_id: Date.now(),
        created_at: new Date().toISOString(),
        job_order_id: Number(form.job_order_id),
        job_order_number: selectedJob?.job_order_number || null,
        from_station: form.from_station,
        to_station: form.to_station,
        reason: form.reason || null,
      }
      const next = [row, ...rows].slice(0, 300)
      const payload = {
        setting_key: settingKey,
        setting_value: JSON.stringify(next),
        setting_type: 'json',
        category: TASK_ENTRY_CATEGORY,
        description: 'Job transfer to station entries (assembly flow)',
      }
      if (settingId) await systemSettingsApi.update(settingId, payload)
      else await systemSettingsApi.create(payload)
      await loadRows()
      setSuccess('Station transfer saved.')
      setIsAddMode(false)
    } catch (e) {
      console.error(e)
      setError(e?.response?.data?.detail || 'Failed to save station transfer.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Job Transfer To Station</CardTitle>
          <CardDescription>
            Assembly-only flow. Use this when jobs move through line stations from start to finish.
          </CardDescription>
        </CardHeader>
        <div className="px-6 pb-6 space-y-4">
          <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
            This feature may not apply to all garages. It is primarily for assembly-line operations.
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setIsAddMode(true)}>Add New</Button>
            <Button type="button" onClick={onSave} disabled={saving || loading}>{saving ? 'Saving...' : 'Save'}</Button>
            <Button type="button" variant="outline" onClick={onRefresh} disabled={loading}>{loading ? 'Refreshing...' : 'Refresh'}</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="text-sm">
              <span className="text-muted-foreground">Job Order No</span>
              <select className="w-full mt-1 border rounded px-3 py-2" value={form.job_order_id} disabled={!isAddMode}
                onChange={(e) => setForm((p) => ({ ...p, job_order_id: e.target.value }))}>
                <option value="">Select job</option>
                {jobOrders.map((j) => <option key={j.job_order_id} value={j.job_order_id}>{j.job_order_number || `#${j.job_order_id}`}</option>)}
              </select>
            </label>
            <label className="text-sm">
              <span className="text-muted-foreground">Customer</span>
              <input className="w-full mt-1 border rounded px-3 py-2 bg-muted/35" value={selectedJob?.customer_name || ''} readOnly />
            </label>
            <label className="text-sm">
              <span className="text-muted-foreground">From Station</span>
              <input className="w-full mt-1 border rounded px-3 py-2" value={form.from_station} disabled={!isAddMode}
                list="from-stations"
                onChange={(e) => setForm((p) => ({ ...p, from_station: e.target.value }))} />
              <datalist id="from-stations">{stationOptions.map((s) => <option key={`f-${s}`} value={s} />)}</datalist>
            </label>
            <label className="text-sm">
              <span className="text-muted-foreground">To Station</span>
              <input className="w-full mt-1 border rounded px-3 py-2" value={form.to_station} disabled={!isAddMode}
                list="to-stations"
                onChange={(e) => setForm((p) => ({ ...p, to_station: e.target.value }))} />
              <datalist id="to-stations">{stationOptions.map((s) => <option key={`t-${s}`} value={s} />)}</datalist>
            </label>
            <label className="text-sm md:col-span-2">
              <span className="text-muted-foreground">Reason</span>
              <textarea className="w-full mt-1 border rounded px-3 py-2 min-h-[80px]" value={form.reason} disabled={!isAddMode}
                onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))} />
            </label>
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
          {success && <div className="text-sm text-green-600">{success}</div>}
        </div>
      </Card>
    </div>
  )
}

function ChangeJobOrderStationPanel() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isAddMode, setIsAddMode] = useState(false)
  const [settingId, setSettingId] = useState(null)
  const [rows, setRows] = useState([])
  const [jobOrders, setJobOrders] = useState([])
  const [selectedJob, setSelectedJob] = useState(null)
  const [form, setForm] = useState({
    job_order_id: '',
    old_station: '',
    new_station: '',
    change_note: '',
  })

  const settingKey = 'task:change-job-order-station'

  const loadRows = async () => {
    const res = await systemSettingsApi.list({ category: TASK_ENTRY_CATEGORY, limit: 500 })
    const found = (res?.data || []).find((r) => r.setting_key === settingKey)
    setSettingId(found?.setting_id || null)
    const parsed = found?.setting_value ? JSON.parse(found.setting_value) : []
    setRows(Array.isArray(parsed) ? parsed : [])
  }

  const loadBase = async () => {
    setLoading(true)
    setError('')
    try {
      const jobsRes = await jobOrdersApi.list({ limit: 300 })
      setJobOrders(jobsRes?.data || [])
      await loadRows()
    } catch (e) {
      console.error(e)
      setError('Failed to load station change screen.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadBase() }, [])

  useEffect(() => {
    if (!form.job_order_id) return setSelectedJob(null)
    setSelectedJob(jobOrders.find((j) => Number(j.job_order_id) === Number(form.job_order_id)) || null)
  }, [form.job_order_id, jobOrders])

  const onRefresh = async () => {
    setForm({ job_order_id: '', old_station: '', new_station: '', change_note: '' })
    setSelectedJob(null)
    setIsAddMode(false)
    setError('')
    setSuccess('')
    await loadBase()
  }

  const onSave = async () => {
    if (!isAddMode) return setError('Click Add New before saving.')
    if (!form.job_order_id || !form.old_station || !form.new_station) {
      return setError('Job order, old station, and new station are required.')
    }
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const row = {
        entry_id: Date.now(),
        created_at: new Date().toISOString(),
        job_order_id: Number(form.job_order_id),
        job_order_number: selectedJob?.job_order_number || null,
        old_station: form.old_station,
        new_station: form.new_station,
        change_note: form.change_note || null,
      }
      const next = [row, ...rows].slice(0, 300)
      const payload = {
        setting_key: settingKey,
        setting_value: JSON.stringify(next),
        setting_type: 'json',
        category: TASK_ENTRY_CATEGORY,
        description: 'Change job order station entries (assembly flow)',
      }
      if (settingId) await systemSettingsApi.update(settingId, payload)
      else await systemSettingsApi.create(payload)
      await loadRows()
      setSuccess('Station change saved.')
      setIsAddMode(false)
    } catch (e) {
      console.error(e)
      setError(e?.response?.data?.detail || 'Failed to save station change.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Change Job Order Station</CardTitle>
          <CardDescription>
            Assembly-only flow. Record station reassignment when a job needs to move to a different station.
          </CardDescription>
        </CardHeader>
        <div className="px-6 pb-6 space-y-4">
          <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
            This functionality is mainly used in assembly-line businesses and may not be used in all deployments.
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setIsAddMode(true)}>Add New</Button>
            <Button type="button" onClick={onSave} disabled={saving || loading}>{saving ? 'Saving...' : 'Save'}</Button>
            <Button type="button" variant="outline" onClick={onRefresh} disabled={loading}>{loading ? 'Refreshing...' : 'Refresh'}</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="text-sm">
              <span className="text-muted-foreground">Job Order No</span>
              <select className="w-full mt-1 border rounded px-3 py-2" value={form.job_order_id} disabled={!isAddMode}
                onChange={(e) => setForm((p) => ({ ...p, job_order_id: e.target.value }))}>
                <option value="">Select job</option>
                {jobOrders.map((j) => <option key={j.job_order_id} value={j.job_order_id}>{j.job_order_number || `#${j.job_order_id}`}</option>)}
              </select>
            </label>
            <label className="text-sm">
              <span className="text-muted-foreground">Customer</span>
              <input className="w-full mt-1 border rounded px-3 py-2 bg-muted/35" value={selectedJob?.customer_name || ''} readOnly />
            </label>
            <label className="text-sm">
              <span className="text-muted-foreground">Old Station</span>
              <input className="w-full mt-1 border rounded px-3 py-2" value={form.old_station} disabled={!isAddMode}
                onChange={(e) => setForm((p) => ({ ...p, old_station: e.target.value }))} />
            </label>
            <label className="text-sm">
              <span className="text-muted-foreground">New Station</span>
              <input className="w-full mt-1 border rounded px-3 py-2" value={form.new_station} disabled={!isAddMode}
                onChange={(e) => setForm((p) => ({ ...p, new_station: e.target.value }))} />
            </label>
            <label className="text-sm md:col-span-2">
              <span className="text-muted-foreground">Change Note</span>
              <textarea className="w-full mt-1 border rounded px-3 py-2 min-h-[80px]" value={form.change_note} disabled={!isAddMode}
                onChange={(e) => setForm((p) => ({ ...p, change_note: e.target.value }))} />
            </label>
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
          {success && <div className="text-sm text-green-600">{success}</div>}
        </div>
      </Card>
    </div>
  )
}

function InOutEnquiryPanel() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [rows, setRows] = useState([])
  const [jobOrders, setJobOrders] = useState([])
  const [technicians, setTechnicians] = useState([])
  const [tab, setTab] = useState('technician')
  const [filters, setFilters] = useState({
    technician_employee_id: '',
    job_order_id: '',
    sales_job_order_id: '',
    from_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString().slice(0, 10),
    to_date: new Date().toISOString().slice(0, 10),
    include_closed: false,
  })

  const loadLookups = async () => {
    try {
      const [jobsRes, techRes] = await Promise.all([
        jobOrdersApi.list({}),
        employeesApi.getMechanics(),
      ])
      setJobOrders(jobsRes?.data || [])
      setTechnicians(techRes?.data || [])
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadLookups()
  }, [])

  const loadData = async () => {
    if (!filters.from_date || !filters.to_date) {
      setError('From Date and To Date are required.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const payload = {
        from_date: filters.from_date,
        to_date: filters.to_date,
        include_closed: filters.include_closed,
      }
      if (tab === 'technician' && filters.technician_employee_id) {
        payload.technician_employee_id = Number(filters.technician_employee_id)
      }
      if (tab === 'job_order' && filters.job_order_id) {
        payload.job_order_id = Number(filters.job_order_id)
      }
      if (tab === 'sales' && filters.sales_job_order_id) {
        payload.job_order_id = Number(filters.sales_job_order_id)
      }
      const res = await jobOrdersApi.enquiryInOut(payload)
      setRows(res?.data || [])
    } catch (e) {
      console.error(e)
      setError(e?.response?.data?.detail || 'Failed to load in/out enquiry data.')
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  const fmtDate = (v) => (v ? String(v).slice(0, 10) : '')
  const fmtTime = (v) => (v ? String(v).slice(11, 16) : '')
  const timeSpent = (r) => {
    const i = r.clock_in_at ? new Date(r.clock_in_at).getTime() : null
    const o = r.clock_out_at ? new Date(r.clock_out_at).getTime() : null
    if (!i || !o || Number.isNaN(i) || Number.isNaN(o)) return '0.00'
    const h = Math.max(0, (o - i) / 3600000)
    return h.toFixed(2)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">In/Out Enquiry</CardTitle>
          <CardDescription>
            See jobs clocked-in or clocked-out by technician, job order, or sales over a date range.
          </CardDescription>
        </CardHeader>
        <div className="px-6 pb-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant={tab === 'technician' ? 'default' : 'outline'} onClick={() => setTab('technician')}>
              By Technician
            </Button>
            <Button type="button" variant={tab === 'job_order' ? 'default' : 'outline'} onClick={() => setTab('job_order')}>
              By Job Order No
            </Button>
            <Button type="button" variant={tab === 'sales' ? 'default' : 'outline'} onClick={() => setTab('sales')}>
              Sales By Job Order No
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {tab === 'technician' && (
              <label className="text-sm md:col-span-2">
                <span className="text-muted-foreground">Technician</span>
                <select
                  className="w-full mt-1 border rounded px-3 py-2"
                  value={filters.technician_employee_id}
                  onChange={(e) => setFilters((p) => ({ ...p, technician_employee_id: e.target.value }))}
                >
                  <option value="">All technicians</option>
                  {technicians.map((t) => (
                    <option key={t.employee_id} value={t.employee_id}>
                      {t.name || `${t.first_name || ''} ${t.last_name || ''}`.trim() || `#${t.employee_id}`}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {tab === 'job_order' && (
              <label className="text-sm md:col-span-2">
                <span className="text-muted-foreground">Job Order No</span>
                <select
                  className="w-full mt-1 border rounded px-3 py-2"
                  value={filters.job_order_id}
                  onChange={(e) => setFilters((p) => ({ ...p, job_order_id: e.target.value }))}
                >
                  <option value="">All job orders</option>
                  {jobOrders.map((j) => (
                    <option key={j.job_order_id} value={j.job_order_id}>
                      {j.job_order_number || `#${j.job_order_id}`}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {tab === 'sales' && (
              <label className="text-sm md:col-span-2">
                <span className="text-muted-foreground">Sales By Job Order No</span>
                <select
                  className="w-full mt-1 border rounded px-3 py-2"
                  value={filters.sales_job_order_id}
                  onChange={(e) => setFilters((p) => ({ ...p, sales_job_order_id: e.target.value }))}
                >
                  <option value="">All job orders</option>
                  {jobOrders.map((j) => (
                    <option key={j.job_order_id} value={j.job_order_id}>
                      {j.job_order_number || `#${j.job_order_id}`}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="text-sm">
              <span className="text-muted-foreground">From Date</span>
              <input
                type="date"
                className="w-full mt-1 border rounded px-3 py-2"
                value={filters.from_date}
                onChange={(e) => setFilters((p) => ({ ...p, from_date: e.target.value }))}
              />
            </label>
            <label className="text-sm">
              <span className="text-muted-foreground">To Date</span>
              <input
                type="date"
                className="w-full mt-1 border rounded px-3 py-2"
                value={filters.to_date}
                onChange={(e) => setFilters((p) => ({ ...p, to_date: e.target.value }))}
              />
            </label>
            <label className="text-sm flex items-end gap-2 pb-2">
              <input
                type="checkbox"
                checked={filters.include_closed}
                onChange={(e) => setFilters((p) => ({ ...p, include_closed: e.target.checked }))}
              />
              <span className="text-foreground/90">Include Closed Jobs</span>
            </label>
            <div className="flex items-end gap-2">
              <Button type="button" onClick={loadData} disabled={loading}>
                {loading ? 'Loading...' : 'Load Data'}
              </Button>
              <Button type="button" variant="outline" onClick={() => window.print()}>
                Print Preview
              </Button>
            </div>
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}
        </div>
      </Card>

      <Card className="border-dashed bg-muted/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">In/Out Results</CardTitle>
        </CardHeader>
        <div className="px-6 pb-6">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 pr-3">Job No</th>
                  <th className="py-2 pr-3">Clock In Date</th>
                  <th className="py-2 pr-3">Clock In Time</th>
                  <th className="py-2 pr-3">Clock Out Date</th>
                  <th className="py-2 pr-3">Clock Out Time</th>
                  <th className="py-2 pr-3">Technician</th>
                  <th className="py-2 pr-3">Time Spent</th>
                  <th className="py-2 pr-3">Normal Hr</th>
                  <th className="py-2 pr-3">OT Hour</th>
                  <th className="py-2 pr-3">Charge Code</th>
                  <th className="py-2 pr-3">Clock Out Reason</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td className="py-3 text-muted-foreground" colSpan={11}>No data loaded.</td>
                  </tr>
                ) : (
                  rows.map((r, idx) => {
                    const spent = timeSpent(r)
                    return (
                      <tr key={r.job_clock_id || idx} className="border-b">
                        <td className="py-2 pr-3">{r.job_order_number || r.job_order_id}</td>
                        <td className="py-2 pr-3">{fmtDate(r.clock_in_at)}</td>
                        <td className="py-2 pr-3">{fmtTime(r.clock_in_at)}</td>
                        <td className="py-2 pr-3">{fmtDate(r.clock_out_at)}</td>
                        <td className="py-2 pr-3">{fmtTime(r.clock_out_at)}</td>
                        <td className="py-2 pr-3">{r.technician_name || '-'}</td>
                        <td className="py-2 pr-3">{spent}</td>
                        <td className="py-2 pr-3">{spent}</td>
                        <td className="py-2 pr-3">0.00</td>
                        <td className="py-2 pr-3">{r.task_id || '-'}</td>
                        <td className="py-2 pr-3">{r.clock_out_reason || '-'}</td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  )
}

function TechnicianEnquiryPanel() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('free')
  const [section, setSection] = useState('')
  const [freeTechs, setFreeTechs] = useState([])
  const [clockedInJobs, setClockedInJobs] = useState([])
  const [dispatchedJobs, setDispatchedJobs] = useState([])
  const [allTechs, setAllTechs] = useState([])

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const [freeRes, clockedRes, dispatchedRes, mechanicsRes] = await Promise.all([
        jobOrdersApi.enquiryFreeTechnicians(),
        jobOrdersApi.enquiryClockedInJobs(section || undefined),
        jobOrdersApi.enquiryDispatchedJobs(section || undefined),
        employeesApi.getMechanics(),
      ])
      setFreeTechs(freeRes?.data || [])
      setClockedInJobs(clockedRes?.data || [])
      setDispatchedJobs(dispatchedRes?.data || [])
      setAllTechs(mechanicsRes?.data || [])
    } catch (e) {
      console.error(e)
      setError(e?.response?.data?.detail || 'Failed to load technician enquiry.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section])

  const sectionOptions = useMemo(() => {
    const vals = new Set()
    ;[...freeTechs, ...clockedInJobs, ...dispatchedJobs].forEach((r) => {
      const s = r?.section || r?.dispatched_section || r?.received_section
      if (s) vals.add(String(s))
    })
    return Array.from(vals).sort((a, b) => a.localeCompare(b))
  }, [freeTechs, clockedInJobs, dispatchedJobs])

  const freeRows = useMemo(() => {
    if (!section) return freeTechs
    return freeTechs.filter((t) => String(t.section || '').toLowerCase() === section.toLowerCase())
  }, [freeTechs, section])

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Free Technician - Enquiry</CardTitle>
          <CardDescription>
            Enquire technician status: free, clocked-in jobs, dispatched jobs, and all free technicians list.
          </CardDescription>
        </CardHeader>
        <div className="px-6 pb-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant={tab === 'free' ? 'default' : 'outline'} onClick={() => setTab('free')}>
              Free Technician
            </Button>
            <Button type="button" variant={tab === 'clocked' ? 'default' : 'outline'} onClick={() => setTab('clocked')}>
              Clock In Jobs
            </Button>
            <Button type="button" variant={tab === 'dispatched' ? 'default' : 'outline'} onClick={() => setTab('dispatched')}>
              Dispatched Job
            </Button>
            <Button type="button" variant={tab === 'allfree' ? 'default' : 'outline'} onClick={() => setTab('allfree')}>
              All Free Technician
            </Button>
            <div className="ml-auto flex gap-2">
              <Button type="button" variant="outline" onClick={() => window.print()}>Print Preview</Button>
              <Button type="button" variant="outline" onClick={loadData} disabled={loading}>
                {loading ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="text-sm">
              <span className="text-muted-foreground">Section / Unit</span>
              <select
                className="w-full mt-1 border rounded px-3 py-2"
                value={section}
                onChange={(e) => setSection(e.target.value)}
              >
                <option value="">All sections</option>
                {sectionOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}
        </div>
      </Card>

      <Card className="border-dashed bg-muted/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {tab === 'free' && 'Free Technicians by Section/Unit'}
            {tab === 'clocked' && 'Clocked In Jobs'}
            {tab === 'dispatched' && 'Dispatched Jobs'}
            {tab === 'allfree' && 'All Free Technicians'}
          </CardTitle>
        </CardHeader>
        <div className="px-6 pb-6">
          <div className="overflow-x-auto">
            {tab === 'free' && (
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2 pr-3">Tech Code</th>
                    <th className="py-2 pr-3">Tech Name</th>
                    <th className="py-2 pr-3">Section</th>
                    <th className="py-2 pr-3">On Payroll</th>
                    <th className="py-2 pr-3">Is Active</th>
                  </tr>
                </thead>
                <tbody>
                  {freeRows.length === 0 ? (
                    <tr><td colSpan={5} className="py-3 text-muted-foreground">No free technicians.</td></tr>
                  ) : (
                    freeRows.map((r, idx) => (
                      <tr key={r.employee_id || idx} className="border-b">
                        <td className="py-2 pr-3">{r.employee_code || r.employee_id || '-'}</td>
                        <td className="py-2 pr-3">{r.first_name || r.last_name ? `${r.first_name || ''} ${r.last_name || ''}`.trim() : (r.name || '-')}</td>
                        <td className="py-2 pr-3">{r.section || '-'}</td>
                        <td className="py-2 pr-3">{r.on_payroll ? 'Yes' : '-'}</td>
                        <td className="py-2 pr-3">{r.is_active === false ? 'No' : 'Yes'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {tab === 'clocked' && (
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2 pr-3">Tech Code</th>
                    <th className="py-2 pr-3">Tech Name</th>
                    <th className="py-2 pr-3">Job Card No</th>
                    <th className="py-2 pr-3">Clock In Date</th>
                    <th className="py-2 pr-3">Clock In Time</th>
                    <th className="py-2 pr-3">Charge Code</th>
                    <th className="py-2 pr-3">Remark</th>
                  </tr>
                </thead>
                <tbody>
                  {clockedInJobs.length === 0 ? (
                    <tr><td colSpan={7} className="py-3 text-muted-foreground">No clocked-in jobs.</td></tr>
                  ) : (
                    clockedInJobs.map((r, idx) => (
                      <tr key={r.job_clock_id || idx} className="border-b">
                        <td className="py-2 pr-3">{r.technician_employee_id || '-'}</td>
                        <td className="py-2 pr-3">{r.technician_name || '-'}</td>
                        <td className="py-2 pr-3">{r.job_order_number || r.job_order_id || '-'}</td>
                        <td className="py-2 pr-3">{String(r.clock_in_at || '').slice(0, 10)}</td>
                        <td className="py-2 pr-3">{String(r.clock_in_at || '').slice(11, 16)}</td>
                        <td className="py-2 pr-3">{r.task_id || '-'}</td>
                        <td className="py-2 pr-3">{r.clock_in_remark || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {tab === 'dispatched' && (
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2 pr-3">Job Order No</th>
                    <th className="py-2 pr-3">Dispatch Date</th>
                    <th className="py-2 pr-3">Dispatch Time</th>
                    <th className="py-2 pr-3">Job Type</th>
                    <th className="py-2 pr-3">Dispatch Remark</th>
                    <th className="py-2 pr-3">Section</th>
                  </tr>
                </thead>
                <tbody>
                  {dispatchedJobs.length === 0 ? (
                    <tr><td colSpan={6} className="py-3 text-muted-foreground">No dispatched jobs.</td></tr>
                  ) : (
                    dispatchedJobs.map((r, idx) => (
                      <tr key={r.job_order_id || idx} className="border-b">
                        <td className="py-2 pr-3">{r.job_order_number || r.job_order_id || '-'}</td>
                        <td className="py-2 pr-3">{String(r.dispatched_at || '').slice(0, 10)}</td>
                        <td className="py-2 pr-3">{String(r.dispatched_at || '').slice(11, 16)}</td>
                        <td className="py-2 pr-3">{r.job_type || '-'}</td>
                        <td className="py-2 pr-3">{r.dispatch_remark || '-'}</td>
                        <td className="py-2 pr-3">{r.dispatched_section || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {tab === 'allfree' && (
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2 pr-3">Tech Code</th>
                    <th className="py-2 pr-3">Tech Name</th>
                    <th className="py-2 pr-3">Section</th>
                    <th className="py-2 pr-3">On Payroll</th>
                    <th className="py-2 pr-3">Absent Type</th>
                    <th className="py-2 pr-3">Absent Hr</th>
                    <th className="py-2 pr-3">Is Active</th>
                  </tr>
                </thead>
                <tbody>
                  {allTechs.length === 0 ? (
                    <tr><td colSpan={7} className="py-3 text-muted-foreground">No technicians found.</td></tr>
                  ) : (
                    allTechs.map((r, idx) => (
                      <tr key={r.employee_id || idx} className="border-b">
                        <td className="py-2 pr-3">{r.employee_code || r.employee_id || '-'}</td>
                        <td className="py-2 pr-3">{r.name || `${r.first_name || ''} ${r.last_name || ''}`.trim() || '-'}</td>
                        <td className="py-2 pr-3">{r.section || '-'}</td>
                        <td className="py-2 pr-3">{r.on_payroll ? 'Yes' : '-'}</td>
                        <td className="py-2 pr-3">{r.absent_type || '-'}</td>
                        <td className="py-2 pr-3">{r.absent_hr || '-'}</td>
                        <td className="py-2 pr-3">{r.is_active === false ? 'No' : 'Yes'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}

export default function TaskToolPage() {
  const { slug } = useParams()
  const entry = useMemo(() => TASK_MENU.find((t) => t.slug === slug), [slug])
  const redirect = slug ? TASK_REDIRECTS[slug] : null
  const fields = useMemo(() => (slug ? FIELD_CONFIG[slug] || DEFAULT_FIELDS : DEFAULT_FIELDS), [slug])
  const settingKey = slug ? `task:${slug}` : ''
  const [settingId, setSettingId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [rows, setRows] = useState([])
  const [form, setForm] = useState(() => buildEmpty(DEFAULT_FIELDS))

  if (!slug || !entry) {
    return <Navigate to="/tasks" replace />
  }

  if (redirect) {
    return <Navigate to={redirect} replace />
  }

  if (slug === 'customer-notification-entry') {
    return (
      <SetupScreenFrame
        hubTo="/tasks"
        hubLabel="Task"
        title={entry.label}
        subtitle="Record notifications made with the customer. Notice type is selected from maintained notice types."
        relatedLinks={DEFAULT_RELATED}
        relatedSectionDescription="Maintain notice types first so they appear in the notice type selection list."
        reviewSectionDescription="Select the job order, specify notice date and contact, then save."
        reviewPoints={[
          'Notice type should be maintained first in the system.',
          'Pick the correct job order before saving notification.',
          'Use remark for any extra details on the notice.',
        ]}
      >
        <CustomerNotificationEntryPanel />
      </SetupScreenFrame>
    )
  }

  if (slug === 'end-of-working-day-clock-out') {
    return (
      <SetupScreenFrame
        hubTo="/tasks"
        hubLabel="Task"
        title={entry.label}
        subtitle="Used by foreman for end-of-day checkout. Technicians are not required to clock-out manually."
        relatedLinks={DEFAULT_RELATED}
        relatedSectionDescription="Click clock-out all jobs to close all active clocks for the end of working day."
        reviewSectionDescription="Confirm date/time and reason before running bulk checkout."
        reviewPoints={[
          'Use Clock-out all jobs at the end of working day.',
          'Reason is required by backend for end-of-day checkout.',
          'Refresh active list after checkout to verify result.',
        ]}
      >
        <EndOfWorkingDayCheckoutPanel />
      </SetupScreenFrame>
    )
  }

  if (slug === 'dispatch-job-to-section') {
    return (
      <SetupScreenFrame
        hubTo="/tasks"
        hubLabel="Task"
        title={entry.label}
        subtitle="Dispatch open jobs to the section before work begins; clock-in requires dispatch/receive flow."
        relatedLinks={DEFAULT_RELATED}
        relatedSectionDescription="Refresh to clear fields, click Add New, select job order and section, then Save."
        reviewSectionDescription="Dispatch date/time is auto-set to current system time."
        reviewPoints={[
          'Select the job order and verify customer/plate details before dispatch.',
          'Choose the target section (single or multiple options depending on setup).',
          'Save the dispatch entry to enable next workflow steps like receiving and clock-in.',
        ]}
      >
        <DispatchJobToSectionPanel />
      </SetupScreenFrame>
    )
  }

  if (slug === 'receive-dispatched-job') {
    return (
      <SetupScreenFrame
        hubTo="/tasks"
        hubLabel="Task"
        title={entry.label}
        subtitle="Record receiving of dispatched jobs by section before technician clock-in."
        relatedLinks={DEFAULT_RELATED}
        relatedSectionDescription="Refresh to clear, select dispatched job order, set vehicle location, then receive."
        reviewSectionDescription="Received jobs can be clocked-in by section foreman and later closed after completion."
        reviewPoints={[
          'Select the dispatched job order so all related details are shown.',
          'Set vehicle location to help technicians locate the vehicle quickly.',
          'Click Receive Dispatched Job to record section receipt.',
        ]}
      >
        <ReceiveDispatchedJobPanel />
      </SetupScreenFrame>
    )
  }

  if (slug === 'job-clock-in') {
    return (
      <SetupScreenFrame
        hubTo="/tasks"
        hubLabel="Task"
        title={entry.label}
        subtitle="Clock-in a received job for a technician with selected task/charge type."
        relatedLinks={DEFAULT_RELATED}
        relatedSectionDescription="Refresh to clear fields, click Add New, then select job, technician, and task."
        reviewSectionDescription="Only jobs already received by section can be clocked-in."
        reviewPoints={[
          'Select a received job order and verify auto-filled details.',
          'Assign technician (section technicians are prioritized in the list).',
          'Choose task/charge type and save to create the active clock entry.',
        ]}
      >
        <JobClockInPanel />
      </SetupScreenFrame>
    )
  }

  if (slug === 'job-clock-out') {
    return (
      <SetupScreenFrame
        hubTo="/tasks"
        hubLabel="Task"
        title={entry.label}
        subtitle="Record completion/parking of assigned work so technicians can move to the next job."
        relatedLinks={DEFAULT_RELATED}
        relatedSectionDescription="Select job, double click the active clock row, then provide remark and reason."
        reviewSectionDescription="Clock-out reason is mandatory."
        reviewPoints={[
          'Load a job order and review active charge-type rows in the grid.',
          'Double click the row you need to clock-out.',
          'Set reason and click Clock Out to release technician for other work.',
        ]}
      >
        <JobClockOutPanel />
      </SetupScreenFrame>
    )
  }

  if (slug === 'transfer-charge-code-by-tech') {
    return (
      <SetupScreenFrame
        hubTo="/tasks"
        hubLabel="Task"
        title={entry.label}
        subtitle="Allocate charge percentages for technicians across from/to operations of a selected job."
        relatedLinks={DEFAULT_RELATED}
        relatedSectionDescription="Select job, technician, beginning operation, ending operation, then enter charge percentage."
        reviewSectionDescription="Only technicians with clock activity for the selected job are listed."
        reviewPoints={[
          'Select job order first to load relevant technician operation history.',
          'Choose from and to operations worked by selected technician.',
          'Enter transfer percentage and save allocation entry.',
        ]}
      >
        <TransferChargeCodeByTechnicianPanel />
      </SetupScreenFrame>
    )
  }

  if (slug === 'update-last-clock-out-reason') {
    return (
      <SetupScreenFrame
        hubTo="/tasks"
        hubLabel="Task"
        title={entry.label}
        subtitle="Change the last clock-out reason recorded for a selected job order."
        relatedLinks={DEFAULT_RELATED}
        relatedSectionDescription="Refresh, click Add New, select job order, set new reason, then save."
        reviewSectionDescription="Current last reason is shown before update."
        reviewPoints={[
          'Select the job order to load its latest clock-out details.',
          'Review current reason/remark before applying a new reason.',
          'Save to update the backend last clock-out reason record.',
        ]}
      >
        <UpdateLastClockOutReasonPanel />
      </SetupScreenFrame>
    )
  }

  if (slug === 'job-transfer-to-station') {
    return (
      <SetupScreenFrame
        hubTo="/tasks"
        hubLabel="Task"
        title={entry.label}
        subtitle="Assembly-line feature for moving jobs between stations in a line flow."
        relatedLinks={DEFAULT_RELATED}
        relatedSectionDescription="Used mainly when assembly operations are enabled."
        reviewSectionDescription="Record from-station, to-station and reason for movement."
        reviewPoints={[
          'May not be used in non-assembly garages.',
          'Select job order and station movement details before save.',
          'Use refresh to start a fresh station transfer entry.',
        ]}
      >
        <JobTransferToStationPanel />
      </SetupScreenFrame>
    )
  }

  if (slug === 'change-job-order-station') {
    return (
      <SetupScreenFrame
        hubTo="/tasks"
        hubLabel="Task"
        title={entry.label}
        subtitle="Assembly-line feature for changing station assignment of a job order."
        relatedLinks={DEFAULT_RELATED}
        relatedSectionDescription="Used mainly for assembly workflows where stations are sequenced."
        reviewSectionDescription="Capture old station, new station and change note."
        reviewPoints={[
          'May not be used in non-assembly garages.',
          'Choose job order and provide both old/new stations.',
          'Save the change entry for station movement traceability.',
        ]}
      >
        <ChangeJobOrderStationPanel />
      </SetupScreenFrame>
    )
  }

  if (slug === 'in-out-enquiry') {
    return (
      <SetupScreenFrame
        hubTo="/tasks"
        hubLabel="Task"
        title={entry.label}
        subtitle="See jobs clocked-in or clocked-out by technician, job order, or sales over a date range."
        relatedLinks={DEFAULT_RELATED}
        relatedSectionDescription="Specify selections and date ranges, then click Load Data."
        reviewSectionDescription="Include closed jobs when needed to expand enquiry results."
        reviewPoints={[
          'Use tabs to switch between technician, job order, and sales-oriented views.',
          'Set from/to date before loading data.',
          'Tick include closed jobs if you want closed/WIP history in results.',
        ]}
      >
        <InOutEnquiryPanel />
      </SetupScreenFrame>
    )
  }

  if (slug === 'technician-enquiry') {
    return (
      <SetupScreenFrame
        hubTo="/tasks"
        hubLabel="Task"
        title={entry.label}
        subtitle="Enquire technician status: free technicians, clocked-in jobs, dispatched jobs, and all free technicians."
        relatedLinks={DEFAULT_RELATED}
        relatedSectionDescription="Use section or unit filter and switch tabs to review relevant technician/job status."
        reviewSectionDescription="Refresh the enquiry to get latest state before assigning new work."
        reviewPoints={[
          'Free Technician tab shows free technicians by section/unit.',
          'Clock In Jobs and Dispatched Job tabs show active workload details.',
          'All Free Technician tab lists broader technician availability details.',
        ]}
      >
        <TechnicianEnquiryPanel />
      </SetupScreenFrame>
    )
  }

  const load = async () => {
    if (!settingKey) return
    setLoading(true)
    setError('')
    try {
      const res = await systemSettingsApi.list({ category: TASK_ENTRY_CATEGORY, limit: 500 })
      const found = (res?.data || []).find((r) => r.setting_key === settingKey)
      setSettingId(found?.setting_id || null)
      const parsed = found?.setting_value ? JSON.parse(found.setting_value) : []
      setRows(Array.isArray(parsed) ? parsed : [])
    } catch (e) {
      console.error(e)
      setError('Failed to load task entries.')
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setForm(buildEmpty(fields))
    setRows([])
    setSettingId(null)
    if (slug) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, settingKey, fields])

  const update = (k, v) => {
    setForm((prev) => ({ ...prev, [k]: v }))
    setError('')
    setSuccess('')
  }

  const onSave = async () => {
    const payloadRow = { entry_id: Date.now(), created_at: new Date().toISOString(), ...form }
    if (!Object.values(form).some((v) => String(v || '').trim())) {
      setError('Fill at least one field before saving.')
      return
    }
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const nextRows = [payloadRow, ...rows].slice(0, 200)
      const payload = {
        setting_key: settingKey,
        setting_value: JSON.stringify(nextRows),
        setting_type: 'json',
        category: TASK_ENTRY_CATEGORY,
        description: `Task form entries for ${entry?.label || slug}`,
      }
      if (settingId) await systemSettingsApi.update(settingId, payload)
      else await systemSettingsApi.create(payload)
      setForm(buildEmpty(fields))
      await load()
      setSuccess('Task form entry saved.')
    } catch (e) {
      console.error(e)
      setError(e?.response?.data?.detail || 'Failed to save task form entry.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <SetupScreenFrame
      hubTo="/tasks"
      hubLabel="Task"
      relatedSectionDescription="Open related job, appointment, or configuration screens where this task is supported today."
      reviewSectionDescription="Quick checks before using this task in live operations."
      title={entry.label}
      subtitle={`HillMaster-style task screen for “${entry.label}” with a working form and review list. Dedicated APIs can be wired per task incrementally.`}
      reviewPoints={[
        'Confirm the correct job order or technician context before saving time or dispatch changes.',
        'Ensure lookup values (sections, stations, clock-out reasons) exist in Global Parameters where applicable.',
        'After go-live, reconcile this task with payroll and reporting exports.',
      ]}
      relatedLinks={DEFAULT_RELATED}
    >
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{entry.label} Entry Form</CardTitle>
            <CardDescription>
              Save task entries and review recent records from this menu. For live job clocking use{' '}
              <Link to="/task-operations" className="text-primary font-medium hover:underline">
                Task operations
              </Link>
              .
            </CardDescription>
          </CardHeader>
          <div className="px-6 pb-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {fields.map((f) => (
                <label key={f.key} className={`block text-sm ${f.type === 'textarea' ? 'md:col-span-2' : ''}`}>
                  <span className="text-muted-foreground">{f.label}</span>
                  {f.type === 'textarea' ? (
                    <textarea className="w-full mt-1 border rounded px-3 py-2 min-h-[84px]" value={form[f.key] || ''} onChange={(e) => update(f.key, e.target.value)} />
                  ) : f.type === 'select' ? (
                    <select className="w-full mt-1 border rounded px-3 py-2" value={form[f.key] || ''} onChange={(e) => update(f.key, e.target.value)}>
                      <option value="">Select...</option>
                      {(f.options || []).map((op) => (
                        <option key={op} value={op}>
                          {op}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input type={f.type || 'text'} className="w-full mt-1 border rounded px-3 py-2" value={form[f.key] || ''} onChange={(e) => update(f.key, e.target.value)} />
                  )}
                </label>
              ))}
            </div>
            {error && <div className="text-sm text-red-600">{error}</div>}
            {success && <div className="text-sm text-green-600">{success}</div>}
            <div className="flex gap-2">
              <Button type="button" onClick={onSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Entry'}
              </Button>
              <Button type="button" variant="outline" onClick={load} disabled={loading || saving}>
                Reload
              </Button>
            </div>
          </div>
        </Card>

        <Card className="border-dashed bg-muted/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Review Saved Entries</CardTitle>
            <CardDescription>Latest entries for this task menu.</CardDescription>
          </CardHeader>
          <div className="px-6 pb-6">
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : rows.length === 0 ? (
              <div className="text-sm text-muted-foreground">No entries saved yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="py-2 pr-3">Time</th>
                      {fields.slice(0, 4).map((f) => (
                        <th key={f.key} className="py-2 pr-3">
                          {f.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 25).map((r) => (
                      <tr key={r.entry_id} className="border-b">
                        <td className="py-2 pr-3 whitespace-nowrap">{String(r.created_at || '').slice(0, 19).replace('T', ' ')}</td>
                        {fields.slice(0, 4).map((f) => (
                          <td key={f.key} className="py-2 pr-3">{String(r[f.key] ?? '-')}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>
      </div>
    </SetupScreenFrame>
  )
}
