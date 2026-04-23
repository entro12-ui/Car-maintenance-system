import { useEffect, useState } from 'react'
import { employeesApi, jobOrdersApi } from '../services/api'

export default function TaskOperations() {
  const [jobOrders, setJobOrders] = useState([])
  const [mechanics, setMechanics] = useState([])
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const [dispatchForm, setDispatchForm] = useState({ job_order_id: '', dispatched_section: '' })
  const [receiveForm, setReceiveForm] = useState({ job_order_id: '', received_section: '', received_vehicle_location: '' })
  const [clockInForm, setClockInForm] = useState({ job_order_id: '', technician_employee_id: '', task_id: '', clock_in_remark: '' })
  const [clockOutForm, setClockOutForm] = useState({ job_order_id: '', job_clock_id: '', clock_out_reason: '', clock_out_remark: '' })
  const [endDayForm, setEndDayForm] = useState({ section: '', clock_out_reason: 'End of working day', clock_out_remark: '' })

  const [freeTechs, setFreeTechs] = useState([])
  const [clockedInJobs, setClockedInJobs] = useState([])
  const [dispatchedJobs, setDispatchedJobs] = useState([])

  const loadBaseData = async () => {
    setError(null)
    try {
      const [jobsRes, mechanicsRes] = await Promise.all([
        jobOrdersApi.list({}),
        employeesApi.getMechanics(),
      ])
      setJobOrders(jobsRes.data || [])
      setMechanics(mechanicsRes.data || [])
    } catch (err) {
      console.error(err)
      setError('Failed to load task data')
    }
  }

  const loadEnquiries = async () => {
    try {
      const [freeRes, clockedRes, dispatchedRes] = await Promise.all([
        jobOrdersApi.enquiryFreeTechnicians(),
        jobOrdersApi.enquiryClockedInJobs(),
        jobOrdersApi.enquiryDispatchedJobs(),
      ])
      setFreeTechs(freeRes.data || [])
      setClockedInJobs(clockedRes.data || [])
      setDispatchedJobs(dispatchedRes.data || [])
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    loadBaseData()
    loadEnquiries()
  }, [])

  const handleDispatch = async (e) => {
    e.preventDefault()
    setError(null)
    try {
      const res = await jobOrdersApi.dispatch(dispatchForm.job_order_id, {
        dispatched_section: dispatchForm.dispatched_section,
      })
      setResult(res.data)
      await loadBaseData()
      await loadEnquiries()
    } catch (err) {
      setError(err.response?.data?.detail || 'Dispatch failed')
    }
  }

  const handleReceive = async (e) => {
    e.preventDefault()
    setError(null)
    try {
      const res = await jobOrdersApi.receive(receiveForm.job_order_id, {
        received_section: receiveForm.received_section,
        received_vehicle_location: receiveForm.received_vehicle_location || null,
      })
      setResult(res.data)
      await loadBaseData()
      await loadEnquiries()
    } catch (err) {
      setError(err.response?.data?.detail || 'Receive failed')
    }
  }

  const handleClockIn = async (e) => {
    e.preventDefault()
    setError(null)
    try {
      const payload = {
        technician_employee_id: parseInt(clockInForm.technician_employee_id, 10),
        task_id: clockInForm.task_id ? parseInt(clockInForm.task_id, 10) : null,
        clock_in_remark: clockInForm.clock_in_remark || null,
      }
      const res = await jobOrdersApi.clockIn(clockInForm.job_order_id, payload)
      setResult(res.data)
      await loadEnquiries()
    } catch (err) {
      setError(err.response?.data?.detail || 'Clock in failed')
    }
  }

  const handleClockOut = async (e) => {
    e.preventDefault()
    setError(null)
    try {
      const res = await jobOrdersApi.clockOut(clockOutForm.job_order_id, clockOutForm.job_clock_id, {
        clock_out_reason: clockOutForm.clock_out_reason,
        clock_out_remark: clockOutForm.clock_out_remark || null,
      })
      setResult(res.data)
      await loadEnquiries()
    } catch (err) {
      setError(err.response?.data?.detail || 'Clock out failed')
    }
  }

  const handleEndDay = async (e) => {
    e.preventDefault()
    setError(null)
    try {
      const res = await jobOrdersApi.endOfDayCheckout({
        section: endDayForm.section || null,
        clock_out_reason: endDayForm.clock_out_reason,
        clock_out_remark: endDayForm.clock_out_remark || null,
      })
      setResult(res.data)
      await loadEnquiries()
    } catch (err) {
      setError(err.response?.data?.detail || 'End-of-day checkout failed')
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-800">Task Operations</h1>
      <p className="text-sm text-gray-600">
        Manual sections: dispatch/receive job, clock in/out, technician enquiry, end-of-day checkout.
      </p>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded p-3">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <form onSubmit={handleDispatch} className="bg-white shadow rounded-lg p-4 space-y-2">
          <h2 className="font-semibold">Dispatch Job</h2>
          <select value={dispatchForm.job_order_id} onChange={(e) => setDispatchForm({ ...dispatchForm, job_order_id: e.target.value })} className="border rounded px-2 py-1 w-full text-sm">
            <option value="">Select job order</option>
            {jobOrders.map((j) => <option key={j.job_order_id} value={j.job_order_id}>{j.job_order_number} ({j.status})</option>)}
          </select>
          <input value={dispatchForm.dispatched_section} onChange={(e) => setDispatchForm({ ...dispatchForm, dispatched_section: e.target.value })} className="border rounded px-2 py-1 w-full text-sm" placeholder="Dispatched section" />
          <button className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700">Dispatch</button>
        </form>

        <form onSubmit={handleReceive} className="bg-white shadow rounded-lg p-4 space-y-2">
          <h2 className="font-semibold">Receive Dispatched Job</h2>
          <select value={receiveForm.job_order_id} onChange={(e) => setReceiveForm({ ...receiveForm, job_order_id: e.target.value })} className="border rounded px-2 py-1 w-full text-sm">
            <option value="">Select job order</option>
            {jobOrders.map((j) => <option key={j.job_order_id} value={j.job_order_id}>{j.job_order_number} ({j.status})</option>)}
          </select>
          <input value={receiveForm.received_section} onChange={(e) => setReceiveForm({ ...receiveForm, received_section: e.target.value })} className="border rounded px-2 py-1 w-full text-sm" placeholder="Received section" />
          <input value={receiveForm.received_vehicle_location} onChange={(e) => setReceiveForm({ ...receiveForm, received_vehicle_location: e.target.value })} className="border rounded px-2 py-1 w-full text-sm" placeholder="Vehicle location" />
          <button className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700">Receive</button>
        </form>

        <form onSubmit={handleClockIn} className="bg-white shadow rounded-lg p-4 space-y-2">
          <h2 className="font-semibold">Job Clock In</h2>
          <select value={clockInForm.job_order_id} onChange={(e) => setClockInForm({ ...clockInForm, job_order_id: e.target.value })} className="border rounded px-2 py-1 w-full text-sm">
            <option value="">Select job order</option>
            {jobOrders.map((j) => <option key={j.job_order_id} value={j.job_order_id}>{j.job_order_number} ({j.status})</option>)}
          </select>
          <select value={clockInForm.technician_employee_id} onChange={(e) => setClockInForm({ ...clockInForm, technician_employee_id: e.target.value })} className="border rounded px-2 py-1 w-full text-sm">
            <option value="">Select technician</option>
            {mechanics.map((m) => <option key={m.employee_id} value={m.employee_id}>{m.name}</option>)}
          </select>
          <input value={clockInForm.task_id} onChange={(e) => setClockInForm({ ...clockInForm, task_id: e.target.value })} className="border rounded px-2 py-1 w-full text-sm" placeholder="Task ID (optional)" />
          <input value={clockInForm.clock_in_remark} onChange={(e) => setClockInForm({ ...clockInForm, clock_in_remark: e.target.value })} className="border rounded px-2 py-1 w-full text-sm" placeholder="Clock-in remark" />
          <button className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700">Clock In</button>
        </form>

        <form onSubmit={handleClockOut} className="bg-white shadow rounded-lg p-4 space-y-2">
          <h2 className="font-semibold">Job Clock Out</h2>
          <input value={clockOutForm.job_order_id} onChange={(e) => setClockOutForm({ ...clockOutForm, job_order_id: e.target.value })} className="border rounded px-2 py-1 w-full text-sm" placeholder="Job order ID" />
          <input value={clockOutForm.job_clock_id} onChange={(e) => setClockOutForm({ ...clockOutForm, job_clock_id: e.target.value })} className="border rounded px-2 py-1 w-full text-sm" placeholder="Job clock ID" />
          <input value={clockOutForm.clock_out_reason} onChange={(e) => setClockOutForm({ ...clockOutForm, clock_out_reason: e.target.value })} className="border rounded px-2 py-1 w-full text-sm" placeholder="Clock-out reason" />
          <input value={clockOutForm.clock_out_remark} onChange={(e) => setClockOutForm({ ...clockOutForm, clock_out_remark: e.target.value })} className="border rounded px-2 py-1 w-full text-sm" placeholder="Clock-out remark" />
          <button className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700">Clock Out</button>
        </form>
      </div>

      <form onSubmit={handleEndDay} className="bg-white shadow rounded-lg p-4 space-y-2">
        <h2 className="font-semibold">End of Working Day Checkout</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <input value={endDayForm.section} onChange={(e) => setEndDayForm({ ...endDayForm, section: e.target.value })} className="border rounded px-2 py-1 w-full text-sm" placeholder="Section (optional)" />
          <input value={endDayForm.clock_out_reason} onChange={(e) => setEndDayForm({ ...endDayForm, clock_out_reason: e.target.value })} className="border rounded px-2 py-1 w-full text-sm" placeholder="Reason" />
          <input value={endDayForm.clock_out_remark} onChange={(e) => setEndDayForm({ ...endDayForm, clock_out_remark: e.target.value })} className="border rounded px-2 py-1 w-full text-sm" placeholder="Remark" />
        </div>
        <button className="px-3 py-1.5 text-sm bg-amber-600 text-white rounded hover:bg-amber-700">Checkout All Active</button>
      </form>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white shadow rounded-lg p-4">
          <h3 className="font-semibold mb-2">Free Technicians</h3>
          <ul className="text-sm space-y-1">
            {freeTechs.map((t) => <li key={t.employee_id}>{t.employee_code} - {t.first_name} {t.last_name}</li>)}
            {freeTechs.length === 0 && <li className="text-gray-500">None</li>}
          </ul>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <h3 className="font-semibold mb-2">Clocked-in Jobs</h3>
          <ul className="text-sm space-y-1">
            {clockedInJobs.map((j) => <li key={j.job_clock_id}>{j.job_order_number} - {j.technician_name || '-'}</li>)}
            {clockedInJobs.length === 0 && <li className="text-gray-500">None</li>}
          </ul>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <h3 className="font-semibold mb-2">Dispatched Jobs</h3>
          <ul className="text-sm space-y-1">
            {dispatchedJobs.map((j) => <li key={j.job_order_id}>{j.job_order_number} - {j.dispatched_section || '-'}</li>)}
            {dispatchedJobs.length === 0 && <li className="text-gray-500">None</li>}
          </ul>
        </div>
      </div>

      {result && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-xs rounded p-3 overflow-auto">
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}

