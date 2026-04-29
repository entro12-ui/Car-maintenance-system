import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import SetupScreenFrame from './SetupScreenFrame'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { systemSettingsApi } from '../services/api'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const DAY_ROWS = [
  { id: 'mwh', label: 'Morning Working Hour' },
  { id: 'tea1', label: 'Tea Break' },
  { id: 'after_tea1', label: 'After Tea Working Hour' },
  { id: 'lunch', label: 'Lunch Break' },
  { id: 'aft_wh', label: 'Afternoon Working Hour' },
  { id: 'tea2', label: 'Tea Break' },
  { id: 'after_tea2', label: 'After Tea Working Hour' },
]
const WORKING_HOURS_CATEGORY = 'working_hours_setup'
const WORKING_HOURS_KEY = 'default'
const WORKING_CAL_CATEGORY = 'working_calendar_setup'
const WORKING_CAL_KEY = 'default'

const DEFAULT_DAY_TEMPLATE = {
  mwh_start: '08:30',
  mwh_end: '10:15',
  tea1_start: '10:15',
  tea1_end: '10:30',
  after_tea1_start: '10:30',
  after_tea1_end: '12:30',
  lunch_start: '12:30',
  lunch_end: '13:30',
  aft_wh_start: '13:30',
  aft_wh_end: '15:15',
  tea2_start: '15:15',
  tea2_end: '15:30',
  after_tea2_start: '15:30',
  after_tea2_end: '17:30',
}

function hhmmToMinutes(v) {
  if (!v || !String(v).includes(':')) return 0
  const [h, m] = String(v).split(':').map((x) => Number(x))
  if (!Number.isFinite(h) || !Number.isFinite(m)) return 0
  return h * 60 + m
}

function minutesToHours(v) {
  return (Math.max(0, v) / 60).toFixed(2)
}

function WorkingHoursSetupPanel() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [settingId, setSettingId] = useState(null)
  const [selectedDay, setSelectedDay] = useState('Monday')
  const [dayData, setDayData] = useState({
    Monday: { ...DEFAULT_DAY_TEMPLATE },
    Tuesday: { ...DEFAULT_DAY_TEMPLATE },
    Wednesday: { ...DEFAULT_DAY_TEMPLATE },
    Thursday: { ...DEFAULT_DAY_TEMPLATE },
    Friday: { ...DEFAULT_DAY_TEMPLATE },
    Saturday: { ...DEFAULT_DAY_TEMPLATE, mwh_start: '00:00', mwh_end: '00:00', after_tea1_start: '00:00', after_tea1_end: '00:00', aft_wh_start: '00:00', aft_wh_end: '00:00', after_tea2_start: '00:00', after_tea2_end: '00:00' },
    Sunday: { ...DEFAULT_DAY_TEMPLATE, mwh_start: '00:00', mwh_end: '00:00', after_tea1_start: '00:00', after_tea1_end: '00:00', aft_wh_start: '00:00', aft_wh_end: '00:00', after_tea2_start: '00:00', after_tea2_end: '00:00' },
  })

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await systemSettingsApi.list({ category: WORKING_HOURS_CATEGORY, limit: 50 })
      const found = (res?.data || []).find((r) => r.setting_key === WORKING_HOURS_KEY)
      setSettingId(found?.setting_id || null)
      if (found?.setting_value) {
        const parsed = JSON.parse(found.setting_value)
        setDayData((prev) => ({ ...prev, ...(parsed || {}) }))
      }
    } catch (e) {
      console.error(e)
      setError('Failed to load working hour setup.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const onNew = () => {
    setDayData((prev) => ({ ...prev, [selectedDay]: { ...DEFAULT_DAY_TEMPLATE } }))
    setSuccess('')
    setError('')
  }

  const onSave = async () => {
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const payload = {
        setting_key: WORKING_HOURS_KEY,
        setting_value: JSON.stringify(dayData),
        setting_type: 'json',
        category: WORKING_HOURS_CATEGORY,
        description: 'Working hour setup by weekday',
      }
      if (settingId) await systemSettingsApi.update(settingId, payload)
      else await systemSettingsApi.create(payload)
      await load()
      setSuccess('Working hours saved.')
    } catch (e) {
      console.error(e)
      setError(e?.response?.data?.detail || 'Failed to save working hours.')
    } finally {
      setSaving(false)
    }
  }

  const updateTime = (rowId, pos, val) => {
    setDayData((prev) => ({
      ...prev,
      [selectedDay]: {
        ...(prev[selectedDay] || {}),
        [`${rowId}_${pos}`]: val,
      },
    }))
  }

  const totalHoursByDay = useMemo(() => {
    const out = {}
    for (const day of Object.keys(dayData)) {
      const d = dayData[day] || {}
      const mins =
        (hhmmToMinutes(d.mwh_end) - hhmmToMinutes(d.mwh_start)) +
        (hhmmToMinutes(d.after_tea1_end) - hhmmToMinutes(d.after_tea1_start)) +
        (hhmmToMinutes(d.aft_wh_end) - hhmmToMinutes(d.aft_wh_start)) +
        (hhmmToMinutes(d.after_tea2_end) - hhmmToMinutes(d.after_tea2_start))
      out[day] = minutesToHours(mins)
    }
    return out
  }, [dayData])

  const d = dayData[selectedDay] || DEFAULT_DAY_TEMPLATE

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Working Days Setup</CardTitle>
          <CardDescription>Define day-wise periods. Effective working hours are calculated from working periods.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onNew}>Add New</Button>
            <Button type="button" onClick={onSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
            <Button type="button" variant="outline" onClick={load} disabled={loading}>{loading ? 'Refreshing...' : 'Refresh'}</Button>
          </div>
          <label className="text-sm block max-w-sm">
            <span className="text-gray-600">Working Day</span>
            <select className="w-full mt-1 border rounded px-3 py-2" value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)}>
              {Object.keys(dayData).map((day, i) => <option key={day} value={day}>{day} - {i + 1}</option>)}
            </select>
          </label>

          <div className="overflow-x-auto">
            <table className="min-w-[680px] text-sm border rounded">
              <thead>
                <tr className="bg-muted/30">
                  <th className="px-2 py-2 text-left"> </th>
                  <th className="px-2 py-2 text-left">Starting From</th>
                  <th className="px-2 py-2 text-left">Up To</th>
                </tr>
              </thead>
              <tbody>
                {DAY_ROWS.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="px-2 py-2">{r.label}</td>
                    <td className="px-2 py-2"><input type="time" className="border rounded px-2 py-1 w-40" value={d[`${r.id}_start`] || '00:00'} onChange={(e) => updateTime(r.id, 'start', e.target.value)} /></td>
                    <td className="px-2 py-2"><input type="time" className="border rounded px-2 py-1 w-40" value={d[`${r.id}_end`] || '00:00'} onChange={(e) => updateTime(r.id, 'end', e.target.value)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
          {success && <div className="text-sm text-green-600">{success}</div>}
        </CardContent>
      </Card>

      <Card className="border-dashed bg-muted/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Effective Working Hours Per Day</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="min-w-[520px] text-sm">
            <thead><tr className="border-b text-left"><th className="py-2 pr-3">Day</th><th className="py-2 pr-3">Hours</th></tr></thead>
            <tbody>
              {Object.keys(totalHoursByDay).map((day) => (
                <tr key={day} className="border-b"><td className="py-2 pr-3">{day}</td><td className="py-2 pr-3 font-mono">{totalHoursByDay[day]}</td></tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}

function WorkingCalendarSetupPanel() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [settingId, setSettingId] = useState(null)
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [data, setData] = useState({ holidays: [] })
  const [hoursSetting, setHoursSetting] = useState(null)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await systemSettingsApi.list({ limit: 1000 })
      const rows = res?.data || []
      const cal = rows.find((r) => r.category === WORKING_CAL_CATEGORY && r.setting_key === WORKING_CAL_KEY)
      const hrs = rows.find((r) => r.category === WORKING_HOURS_CATEGORY && r.setting_key === WORKING_HOURS_KEY)
      setSettingId(cal?.setting_id || null)
      setData(cal?.setting_value ? JSON.parse(cal.setting_value) : { holidays: [] })
      setHoursSetting(hrs?.setting_value ? JSON.parse(hrs.setting_value) : null)
    } catch (e) {
      console.error(e)
      setError('Failed to load working calendar setup.')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  const save = async (nextData) => {
    const payload = {
      setting_key: WORKING_CAL_KEY,
      setting_value: JSON.stringify(nextData),
      setting_type: 'json',
      category: WORKING_CAL_CATEGORY,
      description: 'Working calendar setup (holidays/off days)',
    }
    if (settingId) await systemSettingsApi.update(settingId, payload)
    else await systemSettingsApi.create(payload)
  }

  const toggleHoliday = async (dateIso) => {
    const set = new Set(data.holidays || [])
    if (set.has(dateIso)) set.delete(dateIso)
    else set.add(dateIso)
    const next = { ...data, holidays: Array.from(set).sort() }
    setData(next)
    try {
      await save(next)
      setSuccess('Calendar updated.')
      setError('')
    } catch (e) {
      console.error(e)
      setError('Failed to update calendar.')
    }
  }

  const daysInMonth = new Date(year, month, 0).getDate()
  const startWeekDay = new Date(year, month - 1, 1).getDay()
  const cells = []
  for (let i = 0; i < startWeekDay; i += 1) cells.push(null)
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(d)

  const effectiveMonthlyHours = useMemo(() => {
    const weekdayHours = { 0: 0, 1: 8, 2: 8, 3: 8, 4: 8, 5: 8, 6: 0 }
    if (hoursSetting) {
      const mapDay = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 }
      for (const [k, v] of Object.entries(hoursSetting)) {
        const idx = mapDay[k]
        if (idx == null) continue
        const mins =
          (hhmmToMinutes(v.mwh_end) - hhmmToMinutes(v.mwh_start)) +
          (hhmmToMinutes(v.after_tea1_end) - hhmmToMinutes(v.after_tea1_start)) +
          (hhmmToMinutes(v.aft_wh_end) - hhmmToMinutes(v.aft_wh_start)) +
          (hhmmToMinutes(v.after_tea2_end) - hhmmToMinutes(v.after_tea2_start))
        weekdayHours[idx] = Math.max(0, mins / 60)
      }
    }
    let total = 0
    for (let d = 1; d <= daysInMonth; d += 1) {
      const date = new Date(year, month - 1, d)
      const iso = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      if ((data.holidays || []).includes(iso)) continue
      total += weekdayHours[date.getDay()] || 0
    }
    return total.toFixed(3)
  }, [year, month, daysInMonth, data.holidays, hoursSetting])

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Working Calendar Setup</CardTitle>
          <CardDescription>Refresh and calculate month/year effective working hours. Click a date to toggle holiday/off day.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={load} disabled={loading}>{loading ? 'Refreshing...' : 'Refresh'}</Button>
            <Button type="button" variant="outline" onClick={() => setSuccess(`Effective Working Hour - Month: ${effectiveMonthlyHours}`)}>Calculate Working Hour - Month</Button>
            <Button type="button" variant="outline" onClick={() => setSuccess(`Effective Working Hour - Year view based on monthly setup for ${year}`)}>Calculate Working Hour - Year</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="text-sm"><span className="text-gray-600">Fiscal Year</span><input type="number" className="w-full mt-1 border rounded px-3 py-2" value={year} onChange={(e) => setYear(Number(e.target.value) || year)} /></label>
            <label className="text-sm">
              <span className="text-gray-600">Month</span>
              <select className="w-full mt-1 border rounded px-3 py-2" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                {Array.from({ length: 12 }).map((_, i) => <option key={i + 1} value={i + 1}>{new Date(2000, i, 1).toLocaleString('default', { month: 'long' })}</option>)}
              </select>
            </label>
          </div>

          <div className="border rounded p-3">
            <div className="text-center text-2xl font-semibold mb-2">{new Date(year, month - 1, 1).toLocaleString('default', { month: 'long' })} {year}</div>
            <div className="grid grid-cols-7 gap-1 text-sm font-semibold mb-1">
              {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((d) => <div key={d} className="text-center">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((day, idx) => {
                if (!day) return <div key={`e-${idx}`} className="h-10" />
                const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                const holiday = (data.holidays || []).includes(iso)
                const dow = new Date(year, month - 1, day).getDay()
                const weekend = dow === 0 || dow === 6
                return (
                  <button key={iso} type="button" onClick={() => toggleHoliday(iso)}
                    className={`h-10 rounded border text-sm ${holiday ? 'bg-red-500 text-white' : weekend ? 'bg-muted text-muted-foreground' : 'bg-white'}`}>
                    {day}
                  </button>
                )
              })}
            </div>
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
          {success && <div className="text-sm text-green-700">{success}</div>}
          <div className="text-lg font-semibold">Effective Working Hours: {effectiveMonthlyHours}</div>
        </CardContent>
      </Card>
    </div>
  )
}

function WorkingHoursPreview() {
  const rows = [
    { day: 'Mon', open: '08:00', close: '18:00', note: 'Shop floor' },
    { day: 'Tue', open: '08:00', close: '18:00', note: 'Shop floor' },
    { day: 'Wed', open: '08:00', close: '18:00', note: 'Shop floor' },
    { day: 'Thu', open: '08:00', close: '18:00', note: 'Shop floor' },
    { day: 'Fri', open: '08:00', close: '17:00', note: 'Early close' },
    { day: 'Sat', open: '09:00', close: '13:00', note: 'Service only' },
    { day: 'Sun', open: '—', close: '—', note: 'Closed' },
  ]
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Sample weekly display</CardTitle>
        <CardDescription>
          Illustrative grid only — connect your rules engine later to persist real shop hours per location.
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-sm border rounded-md overflow-hidden">
          <thead>
            <tr className="bg-muted/50 text-left text-muted-foreground">
              <th className="px-3 py-2 font-medium">Day</th>
              <th className="px-3 py-2 font-medium">Open</th>
              <th className="px-3 py-2 font-medium">Close</th>
              <th className="px-3 py-2 font-medium">Notes</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.day} className="border-t border-border/80">
                <td className="px-3 py-2 font-medium">{r.day}</td>
                <td className="px-3 py-2 font-mono text-xs">{r.open}</td>
                <td className="px-3 py-2 font-mono text-xs">{r.close}</td>
                <td className="px-3 py-2 text-muted-foreground">{r.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}

function WorkingCalendarPreview() {
  const week1 = ['', '', '1', '2', '3', '4', '5']
  const week2 = ['8', '9', '10', '11', '12', '13', '14']
  const week3 = ['15', '16', '17', '18', '19', '20', '21']
  const week4 = ['22', '23', '24', '25', '26', '27', '28']
  const week5 = ['29', '30', '', '', '', '', '']
  const weeks = [week1, week2, week3, week4, week5]
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Sample calendar month</CardTitle>
        <CardDescription>
          Shaded cells show weekend pattern for capacity planning. Holidays and exceptions would appear as badges in a
          full implementation.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="inline-block rounded-lg border bg-card p-3 shadow-sm">
          <div className="text-center text-sm font-semibold mb-3 text-foreground">April 2026 (preview)</div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground mb-1">
            {DAYS.map((d) => (
              <div key={d} className="w-9 py-1">
                {d}
              </div>
            ))}
          </div>
          {weeks.map((w, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-1">
              {w.map((cell, ci) => {
                const isWeekend = cell && (ci >= 5)
                const empty = !cell
                return (
                  <div
                    key={`${wi}-${ci}`}
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-md text-sm',
                      empty && 'invisible',
                      !empty && !isWeekend && 'bg-primary/5 text-foreground font-medium',
                      !empty && isWeekend && 'bg-muted text-muted-foreground line-through decoration-muted-foreground/50'
                    )}
                  >
                    {cell}
                  </div>
                )
              })}
            </div>
          ))}
          <p className="mt-3 text-xs text-muted-foreground max-w-md">
            Weekend styling is for review only. Production calendar would load from API and respect location holidays.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function WorkGroupSetupPanel() {
  const [activeTab, setActiveTab] = useState('work-group')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [settingId, setSettingId] = useState(null)
  const [store, setStore] = useState({ workGroups: [], assemblyStations: [] })
  const [workForm, setWorkForm] = useState({ id: null, name: '', group_type: 'Department', parent_id: '' })
  const [stationForm, setStationForm] = useState({ id: null, station_name: '', line_name: '', description: '' })

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await systemSettingsApi.list({ category: 'work_group_setup', limit: 50 })
      const row = (res?.data || []).find((r) => r.setting_key === 'default')
      setSettingId(row?.setting_id || null)
      if (row?.setting_value) {
        const parsed = JSON.parse(row.setting_value)
        setStore({
          workGroups: Array.isArray(parsed?.workGroups) ? parsed.workGroups : [],
          assemblyStations: Array.isArray(parsed?.assemblyStations) ? parsed.assemblyStations : [],
        })
      } else {
        setStore({ workGroups: [], assemblyStations: [] })
      }
    } catch (e) {
      console.error(e)
      setError('Failed to load workgroup setup.')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  const persist = async (nextStore) => {
    const payload = {
      setting_key: 'default',
      setting_value: JSON.stringify(nextStore),
      setting_type: 'json',
      category: 'work_group_setup',
      description: 'Work group and assembly station setup',
    }
    if (settingId) await systemSettingsApi.update(settingId, payload)
    else await systemSettingsApi.create(payload)
  }

  const onNew = () => {
    setError('')
    setSuccess('')
    if (activeTab === 'work-group') setWorkForm({ id: null, name: '', group_type: 'Department', parent_id: '' })
    else setStationForm({ id: null, station_name: '', line_name: '', description: '' })
  }

  const onSave = async () => {
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      let next = { ...store }
      if (activeTab === 'work-group') {
        if (!workForm.name.trim()) throw new Error('Work group name is required.')
        const id = workForm.id || Date.now()
        const row = {
          id,
          name: workForm.name.trim(),
          group_type: workForm.group_type || 'Department',
          parent_id: workForm.parent_id ? Number(workForm.parent_id) : null,
        }
        next.workGroups = [row, ...next.workGroups.filter((x) => Number(x.id) !== Number(id))]
      } else {
        if (!stationForm.station_name.trim()) throw new Error('Station name is required.')
        const id = stationForm.id || Date.now()
        const row = {
          id,
          station_name: stationForm.station_name.trim(),
          line_name: stationForm.line_name.trim() || null,
          description: stationForm.description.trim() || null,
        }
        next.assemblyStations = [row, ...next.assemblyStations.filter((x) => Number(x.id) !== Number(id))]
      }
      await persist(next)
      setStore(next)
      setSuccess('Saved.')
      onNew()
      await load()
    } catch (e) {
      setError(e?.message || e?.response?.data?.detail || 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  const onDelete = async () => {
    if (activeTab === 'work-group' && !workForm.id) return
    if (activeTab === 'assembly-station' && !stationForm.id) return
    if (!window.confirm('Delete selected record?')) return
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const next = { ...store }
      if (activeTab === 'work-group') next.workGroups = next.workGroups.filter((x) => Number(x.id) !== Number(workForm.id))
      else next.assemblyStations = next.assemblyStations.filter((x) => Number(x.id) !== Number(stationForm.id))
      await persist(next)
      setStore(next)
      setSuccess('Deleted.')
      onNew()
      await load()
    } catch (e) {
      console.error(e)
      setError('Delete failed.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Application Parameter Setup</CardTitle>
          <CardDescription>
            Setup segmentation by department/section/unit and define assembly stations for line flow operations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={onNew}>Add New</Button>
            <Button type="button" onClick={onSave} disabled={saving}>{saving ? 'Saving...' : 'Save Data'}</Button>
            <Button type="button" variant="destructive" onClick={onDelete} disabled={saving}>Delete</Button>
            <Button type="button" variant="outline" onClick={load} disabled={loading}>{loading ? 'Refreshing...' : 'Refresh'}</Button>
          </div>

          <div className="flex gap-2 border-b">
            <button type="button" className={`px-3 py-1.5 text-sm ${activeTab === 'work-group' ? 'border-b-2 border-primary font-medium' : ''}`} onClick={() => setActiveTab('work-group')}>Work Group</button>
            <button type="button" className={`px-3 py-1.5 text-sm ${activeTab === 'assembly-station' ? 'border-b-2 border-primary font-medium' : ''}`} onClick={() => setActiveTab('assembly-station')}>Assembly Station</button>
          </div>

          {activeTab === 'work-group' ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="text-sm"><span className="text-gray-600">Work Group Name</span>
                  <input className="w-full mt-1 border rounded px-3 py-2" value={workForm.name} onChange={(e) => setWorkForm((p) => ({ ...p, name: e.target.value }))} />
                </label>
                <label className="text-sm"><span className="text-gray-600">Work Group Type</span>
                  <select className="w-full mt-1 border rounded px-3 py-2" value={workForm.group_type} onChange={(e) => setWorkForm((p) => ({ ...p, group_type: e.target.value }))}>
                    <option>Department</option>
                    <option>Section</option>
                    <option>Unit</option>
                  </select>
                </label>
                <label className="text-sm md:col-span-2"><span className="text-gray-600">Reports To</span>
                  <select className="w-full mt-1 border rounded px-3 py-2" value={workForm.parent_id} onChange={(e) => setWorkForm((p) => ({ ...p, parent_id: e.target.value }))}>
                    <option value="">None</option>
                    {store.workGroups.filter((g) => Number(g.id) !== Number(workForm.id)).map((g) => (
                      <option key={g.id} value={g.id}>{g.name} ({g.group_type})</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="overflow-x-auto border rounded">
                <table className="min-w-full text-sm">
                  <thead className="bg-muted/40"><tr><th className="px-2 py-2 text-left">Id</th><th className="px-2 py-2 text-left">Name</th><th className="px-2 py-2 text-left">Type</th><th className="px-2 py-2 text-left">Reports To</th></tr></thead>
                  <tbody>
                    {store.workGroups.length === 0 ? <tr><td colSpan={4} className="px-3 py-4 text-center text-gray-500">No work groups yet.</td></tr> : store.workGroups.map((g) => (
                      <tr key={g.id} className="border-t cursor-pointer hover:bg-muted/20" onDoubleClick={() => setWorkForm({ id: g.id, name: g.name || '', group_type: g.group_type || 'Department', parent_id: g.parent_id || '' })}>
                        <td className="px-2 py-2">{g.id}</td><td className="px-2 py-2">{g.name}</td><td className="px-2 py-2">{g.group_type}</td><td className="px-2 py-2">{store.workGroups.find((x) => Number(x.id) === Number(g.parent_id))?.name || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="text-sm"><span className="text-gray-600">Station Name</span>
                  <input className="w-full mt-1 border rounded px-3 py-2" value={stationForm.station_name} onChange={(e) => setStationForm((p) => ({ ...p, station_name: e.target.value }))} />
                </label>
                <label className="text-sm"><span className="text-gray-600">Line Name</span>
                  <input className="w-full mt-1 border rounded px-3 py-2" value={stationForm.line_name} onChange={(e) => setStationForm((p) => ({ ...p, line_name: e.target.value }))} />
                </label>
                <label className="text-sm md:col-span-2"><span className="text-gray-600">Description</span>
                  <textarea className="w-full mt-1 border rounded px-3 py-2 min-h-[80px]" value={stationForm.description} onChange={(e) => setStationForm((p) => ({ ...p, description: e.target.value }))} />
                </label>
              </div>
              <div className="overflow-x-auto border rounded">
                <table className="min-w-full text-sm">
                  <thead className="bg-muted/40"><tr><th className="px-2 py-2 text-left">Id</th><th className="px-2 py-2 text-left">Station</th><th className="px-2 py-2 text-left">Line</th><th className="px-2 py-2 text-left">Description</th></tr></thead>
                  <tbody>
                    {store.assemblyStations.length === 0 ? <tr><td colSpan={4} className="px-3 py-4 text-center text-gray-500">No assembly stations yet.</td></tr> : store.assemblyStations.map((s) => (
                      <tr key={s.id} className="border-t cursor-pointer hover:bg-muted/20" onDoubleClick={() => setStationForm({ id: s.id, station_name: s.station_name || '', line_name: s.line_name || '', description: s.description || '' })}>
                        <td className="px-2 py-2">{s.id}</td><td className="px-2 py-2">{s.station_name}</td><td className="px-2 py-2">{s.line_name || '-'}</td><td className="px-2 py-2">{s.description || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {error && <div className="text-sm text-red-600">{error}</div>}
          {success && <div className="text-sm text-green-600">{success}</div>}
        </CardContent>
      </Card>
    </div>
  )
}

const SLUG_CONFIG = {}

export default function SetupToolPage() {
  const { slug } = useParams()
  const config = useMemo(() => (slug ? SLUG_CONFIG[slug] : null), [slug])

  if (!slug) {
    return <Navigate to="/setup" replace />
  }

  if (slug === 'working-hours') {
    return (
      <SetupScreenFrame
        title="Working hours setup"
        subtitle="Set up standard working hours for morning/tea/lunch/afternoon periods by day."
        reviewPoints={[
          'Use Add New to reset selected day to default template.',
          'Save after editing period start/end time values.',
          'Effective working hours per day are calculated from working periods.',
        ]}
        relatedLinks={[
          { to: '/setup/working-calendar', label: 'Working calendar setup' },
          { to: '/setup', label: 'Setup hub' },
        ]}
      >
        <WorkingHoursSetupPanel />
      </SetupScreenFrame>
    )
  }

  if (slug === 'working-calendar') {
    return (
      <SetupScreenFrame
        title="Working calendar setup"
        subtitle="Manage monthly calendar and calculate effective working hours from hour setup and holiday/off-day marks."
        reviewPoints={[
          'Use Refresh to reload saved calendar values.',
          'Click dates to toggle holiday/off-day.',
          'Use calculate actions to review month/year effective hour totals.',
        ]}
        relatedLinks={[
          { to: '/setup/working-hours', label: 'Working hours setup' },
          { to: '/setup', label: 'Setup hub' },
        ]}
      >
        <WorkingCalendarSetupPanel />
      </SetupScreenFrame>
    )
  }

  if (slug === 'work-groups') {
    return (
      <SetupScreenFrame
        title="Work group setup"
        subtitle="Two-tab setup: operation segmentation by department/section/unit and assembly stations for line operation."
        reviewPoints={[
          'Use Work Group tab for hierarchy (Department -> Section -> Unit).',
          'Use Assembly Station tab for line stations used in assembly operations.',
          'Double click a row to edit and use Save/Delete actions.',
        ]}
        relatedLinks={[
          { to: '/setup', label: 'Setup hub' },
          { to: '/technicians', label: 'Technician setup' },
        ]}
      >
        <WorkGroupSetupPanel />
      </SetupScreenFrame>
    )
  }

  if (!config) return <Navigate to="/setup" replace />

  const { title, subtitle, reviewPoints, relatedLinks, Preview } = config

  return (
    <SetupScreenFrame title={title} subtitle={subtitle} reviewPoints={reviewPoints} relatedLinks={relatedLinks}>
      <div className="space-y-4">
        <Card className="border-dashed bg-muted/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Implementation status</CardTitle>
            <CardDescription>
              This entry matches the HillMaster <strong>Setup</strong> menu. Persistence and APIs for this screen can be
              added incrementally; use{' '}
              <Link to="/system-settings" className="text-primary font-medium hover:underline">
                System settings
              </Link>{' '}
              and related setup pages for data that already exists in this application.
            </CardDescription>
          </CardHeader>
        </Card>
        <Preview />
      </div>
    </SetupScreenFrame>
  )
}
