import { useEffect, useMemo, useState } from 'react'
import { jobTypeAccessApi } from '../services/api'
import SetupScreenFrame from './SetupScreenFrame'

export default function JobTypeAllowedByUser() {
  const [tab, setTab] = useState('assign')
  const [users, setUsers] = useState([])
  const [jobTypes, setJobTypes] = useState([])
  const [allRows, setAllRows] = useState([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedJobTypes, setSelectedJobTypes] = useState(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadBase = async () => {
    setLoading(true)
    setError('')
    try {
      const [u, j] = await Promise.all([jobTypeAccessApi.listUsers(), jobTypeAccessApi.listJobTypes()])
      setUsers(u.data || [])
      setJobTypes(j.data || [])
      if (!selectedUserId && (u.data || []).length > 0) setSelectedUserId(String(u.data[0].user_id))
    } catch (e) {
      setError('Failed to load users/job types.')
    } finally {
      setLoading(false)
    }
  }

  const loadList = async () => {
    try {
      const res = await jobTypeAccessApi.listAll()
      setAllRows(res.data || [])
    } catch (e) {
      setError('Failed to load access list.')
    }
  }

  useEffect(() => {
    loadBase()
    loadList()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const loadSelection = async () => {
      if (!selectedUserId) {
        setSelectedJobTypes(new Set())
        return
      }
      try {
        const res = await jobTypeAccessApi.getUserAccess(selectedUserId)
        setSelectedJobTypes(new Set((res.data || []).map((x) => Number(x))))
      } catch (e) {
        setError('Failed to load selected user access.')
      }
    }
    loadSelection()
  }, [selectedUserId])

  const userLabel = useMemo(
    () => users.find((u) => String(u.user_id) === String(selectedUserId))?.display_name || '',
    [users, selectedUserId]
  )

  const toggleOne = (settingId) => {
    setSelectedJobTypes((prev) => {
      const next = new Set(prev)
      if (next.has(settingId)) next.delete(settingId)
      else next.add(settingId)
      return next
    })
  }

  const onSave = async () => {
    if (!selectedUserId) {
      setError('Select a user first.')
      return
    }
    setError('')
    setSuccess('')
    try {
      await jobTypeAccessApi.saveUserAccess(selectedUserId, Array.from(selectedJobTypes))
      setSuccess('Saved.')
      await loadList()
    } catch (e) {
      setError(e?.response?.data?.detail || 'Save failed.')
    }
  }

  return (
    <SetupScreenFrame
      title="Job type allowed by user"
      subtitle="Restrict which job types each user may create or work with. Use the assignment grid for maintenance, then review the flat list for audits."
      reviewPoints={[
        'Ensure every job type exists under Global Parameters before assigning access.',
        'Service advisors and parts staff typically need a narrow subset — avoid granting all types by default.',
        'After role changes, open the list tab and confirm rows match the intended policy.',
      ]}
      relatedLinks={[
        { to: '/global-parameters', label: 'Global Parameters' },
        { to: '/technicians', label: 'Technician setup' },
        { to: '/setup', label: 'Setup hub' },
      ]}
    >
    <div className="space-y-4">
      <div className="bg-white border rounded p-2 flex items-center gap-3 text-sm">
        <button type="button" className="hover:text-black text-foreground/90" onClick={() => { setSelectedUserId(''); setSelectedJobTypes(new Set()) }}>Add New</button>
        <button type="button" className="hover:text-black text-foreground/90" onClick={onSave}>Save Data</button>
        <button type="button" className="hover:text-black text-foreground/90" onClick={() => { loadBase(); loadList() }}>Refresh</button>
        <span className="text-blue-700 font-semibold">Ready</span>
      </div>

      {error && <div className="rounded border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">{error}</div>}
      {success && <div className="rounded border border-green-200 bg-green-50 text-green-700 px-3 py-2 text-sm">{success}</div>}

      <div className="bg-white border rounded">
        <div className="border-b flex">
          <button
            type="button"
            onClick={() => setTab('assign')}
            className={`px-4 py-2 text-sm ${tab === 'assign' ? 'bg-muted font-semibold' : 'text-muted-foreground'}`}
          >
            Allowed Job Type By User
          </button>
          <button
            type="button"
            onClick={() => setTab('list')}
            className={`px-4 py-2 text-sm border-l ${tab === 'list' ? 'bg-muted font-semibold' : 'text-muted-foreground'}`}
          >
            Job Type Allowed By User List
          </button>
        </div>

        {tab === 'assign' ? (
          <div className="p-3 space-y-3">
            <label className="block text-sm">
              <span className="text-foreground/90">User:</span>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full mt-1 border rounded px-2 py-1.5"
                disabled={loading}
              >
                <option value="">Select user...</option>
                {users.map((u) => (
                  <option key={u.user_id} value={u.user_id}>
                    {u.display_name}
                  </option>
                ))}
              </select>
            </label>

            <div className="border rounded overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-muted/35">
                  <tr>
                    <th className="px-3 py-2 text-left w-10">
                      <input
                        type="checkbox"
                        checked={jobTypes.length > 0 && selectedJobTypes.size === jobTypes.length}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedJobTypes(new Set(jobTypes.map((j) => j.setting_id)))
                          else setSelectedJobTypes(new Set())
                        }}
                      />
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Job Type</th>
                  </tr>
                </thead>
                <tbody>
                  {jobTypes.map((jt) => (
                    <tr key={jt.setting_id} className="border-t">
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={selectedJobTypes.has(jt.setting_id)}
                          onChange={() => toggleOne(jt.setting_id)}
                        />
                      </td>
                      <td className="px-3 py-2">
                        {(jt.label || jt.setting_key)} - {jt.setting_key}
                      </td>
                    </tr>
                  ))}
                  {jobTypes.length === 0 && (
                    <tr>
                      <td colSpan={2} className="px-3 py-4 text-center text-muted-foreground">
                        No job types found. Setup `job_type` values first in Global Parameters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {userLabel && <div className="text-xs text-muted-foreground">Selected: {userLabel}</div>}
          </div>
        ) : (
          <div className="p-3 overflow-x-auto">
            <table className="min-w-full text-sm border">
              <thead className="bg-muted/35">
                <tr>
                  <th className="px-3 py-2 text-left">User Name</th>
                  <th className="px-3 py-2 text-left">Job Type</th>
                  <th className="px-3 py-2 text-left">Created By</th>
                  <th className="px-3 py-2 text-left">Created On</th>
                  <th className="px-3 py-2 text-left">Created WS</th>
                </tr>
              </thead>
              <tbody>
                {allRows.map((r) => (
                  <tr key={r.access_id} className="border-t">
                    <td className="px-3 py-2">{r.user_name}</td>
                    <td className="px-3 py-2">{r.job_type}</td>
                    <td className="px-3 py-2">{r.created_by || '-'}</td>
                    <td className="px-3 py-2">{r.created_on}</td>
                    <td className="px-3 py-2">{r.created_ws || '-'}</td>
                  </tr>
                ))}
                {allRows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-4 text-center text-muted-foreground">
                      No access records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
    </SetupScreenFrame>
  )
}

