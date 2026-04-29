import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  customersApi,
  employeesApi,
  jobOrderLaborApi,
  jobOrdersApi,
  laborTypesApi,
  serviceTypesApi,
  systemSettingsApi,
  vehiclesApi,
} from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '@/components/ui/button'

const TABS = ['General Info', 'Other Info', 'Repair Details', 'Inform Client With', 'Job Text/Charge', 'Audit Log']

const LOOKUP_CATEGORIES = {
  garageLocations: 'garage_location',
  jobTypes: 'job_type',
  sections: 'repair_section',
  receivers: 'job_card_receiver',
  vehicleClass: 'vehicle_class',
}

const DEFAULT_NOTIFY = {
  sms_enabled: false,
  sms_phone: '',
  email_enabled: false,
  email_address: '',
  fax_enabled: false,
  fax_number: '',
  phone_enabled: false,
  phone_number: '',
}

const REPAIR_OPTIONS = ['', 'R - Replace', 'I - Inspect', 'A - Adjust', 'M - Minor', 'Other']
const REPAIR_BLOCK_START = '[RepairDetails]'
const REPAIR_BLOCK_END = '[/RepairDetails]'

function fmtDateInput(v) {
  if (!v) return ''
  return String(v).slice(0, 10)
}

function customerName(c) {
  return `${c?.first_name || ''} ${c?.last_name || ''}`.trim() || c?.email || `#${c?.customer_id}`
}

function mergeNotify(raw) {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_NOTIFY }
  return {
    ...DEFAULT_NOTIFY,
    ...raw,
    sms_enabled: Boolean(raw.sms_enabled),
    email_enabled: Boolean(raw.email_enabled),
    fax_enabled: Boolean(raw.fax_enabled),
    phone_enabled: Boolean(raw.phone_enabled),
  }
}

function parseBoolCell(v) {
  if (v == null || v === '') return false
  const s = String(v).trim().toLowerCase()
  return s === '1' || s === 'true' || s === 'yes' || s === 'y'
}

function stripRepairBlock(text) {
  const raw = String(text || '')
  const re = new RegExp(`${REPAIR_BLOCK_START}[\\s\\S]*?${REPAIR_BLOCK_END}`, 'g')
  return raw.replace(re, '').trim()
}

function parseRepairBlock(text) {
  const raw = String(text || '')
  const m = raw.match(new RegExp(`${REPAIR_BLOCK_START}[\\s\\S]*?${REPAIR_BLOCK_END}`))
  if (!m) {
    return {
      complaint: '',
      requested_repair: '',
      diagnosis: '',
      parts_to_check: '',
      urgency: 'Normal',
    }
  }
  const block = m[0]
  const pick = (k) => {
    const mm = block.match(new RegExp(`${k}:\\s*(.*)`))
    return mm?.[1]?.trim() || ''
  }
  return {
    complaint: pick('Complaint'),
    requested_repair: pick('RequestedRepair'),
    diagnosis: pick('Diagnosis'),
    parts_to_check: pick('PartsToCheck'),
    urgency: pick('Urgency') || 'Normal',
  }
}

function buildRepairBlock(details) {
  const d = details || {}
  const lines = [
    REPAIR_BLOCK_START,
    `Complaint: ${(d.complaint || '').trim()}`,
    `RequestedRepair: ${(d.requested_repair || '').trim()}`,
    `Diagnosis: ${(d.diagnosis || '').trim()}`,
    `PartsToCheck: ${(d.parts_to_check || '').trim()}`,
    `Urgency: ${(d.urgency || 'Normal').trim()}`,
    REPAIR_BLOCK_END,
  ]
  return lines.join('\n')
}

/** CSV / text import: header row with labor_type_id, hours_worked, optional columns. */
function parseLaborCsv(text, maxRows) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  if (!lines.length) return []
  const header = lines[0].split(',').map((c) => c.trim().toLowerCase())
  const idx = (name) => header.indexOf(name)
  const iId = idx('labor_type_id')
  const iCode = idx('charge_code')
  if (iId < 0 && iCode < 0) {
    throw new Error('CSV must include a header row with labor_type_id and/or charge_code')
  }
  const rows = []
  for (let r = 1; r < lines.length && rows.length < maxRows; r++) {
    const cells = lines[r].split(',').map((c) => c.trim())
    const labor_type_id = iId >= 0 ? cells[iId] : ''
    const charge_code = iCode >= 0 ? cells[iCode] : ''
    const hours_worked = idx('hours_worked') >= 0 ? cells[idx('hours_worked')] : '0'
    const mfc_hours = idx('mfc_hours') >= 0 ? cells[idx('mfc_hours')] : '0'
    const repair_option = idx('repair_option') >= 0 ? cells[idx('repair_option')] : ''
    const price_list_type = idx('price_list_type') >= 0 ? cells[idx('price_list_type')] : ''
    const is_charged = idx('is_charged') >= 0 ? parseBoolCell(cells[idx('is_charged')]) : false
    const remark = idx('remark') >= 0 ? cells[idx('remark')] : ''
    rows.push({
      labor_type_id: labor_type_id ? Number(labor_type_id) : null,
      charge_code: charge_code || null,
      hours_worked: hours_worked === '' ? 0 : Number(hours_worked),
      mfc_hours: mfc_hours === '' ? 0 : Number(mfc_hours),
      repair_option: repair_option || null,
      price_list_type: price_list_type || null,
      is_charged,
      remark: remark || null,
    })
  }
  return rows
}

export default function WorkOrderCreation() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('General Info')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [customers, setCustomers] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [serviceTypes, setServiceTypes] = useState([])
  const [employees, setEmployees] = useState([])
  const [laborTypes, setLaborTypes] = useState([])
  const [showAllLabor, setShowAllLabor] = useState(false)
  const [laborFilter, setLaborFilter] = useState('')
  const [laborCharges, setLaborCharges] = useState([])
  const [laborLoading, setLaborLoading] = useState(false)
  const [importRowsLimit, setImportRowsLimit] = useState(50)
  const [jtDraft, setJtDraft] = useState({
    labor_type_id: '',
    description: '',
    std_hour: '1',
    mfc_hour: '0',
    repair_option: 'R - Replace',
    pl_type: '',
    is_charged: false,
  })

  const [notifyClient, setNotifyClient] = useState(() => ({ ...DEFAULT_NOTIFY }))
  const [repairDetails, setRepairDetails] = useState({
    complaint: '',
    requested_repair: '',
    diagnosis: '',
    parts_to_check: '',
    urgency: 'Normal',
  })

  const [lookups, setLookups] = useState({
    garageLocations: [],
    jobTypes: [],
    sections: [],
    receivers: [],
    vehicleClass: [],
  })

  const prevVehicleIdForPlateRef = useRef('')

  const [form, setForm] = useState({
    job_order_id: null,
    job_order_number: '',
    vehicle_id: '',
    license_plate: '',
    vin: '',
    customer_id: '',
    service_type_id: '',
    invoice_type: 'Cash',
    opened_date: '',
    expected_finish_date: '',
    mileage_in_km: '',
    remarks: '',
    garage_location: '',
    type_of_job: '',
    opened_for_repair_section: '',
    received_by: '',
    vehicle_class: '',
  })

  const loadLaborTypes = useCallback(async () => {
    const res = await laborTypesApi.list({ active_only: showAllLabor ? false : true })
    setLaborTypes(res.data || [])
  }, [showAllLabor])

  useEffect(() => {
    loadLaborTypes().catch(console.error)
  }, [loadLaborTypes])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const [
          customersRes,
          vehiclesRes,
          serviceTypesRes,
          employeesRes,
          garageLocationsRes,
          jobTypesRes,
          sectionsRes,
          receiversRes,
          vehicleClassRes,
        ] = await Promise.all([
          customersApi.getAll({ limit: 100 }),
          vehiclesApi.getAll({ limit: 100 }),
          serviceTypesApi.getAll(),
          employeesApi.list({ limit: 100 }),
          systemSettingsApi.list({ category: LOOKUP_CATEGORIES.garageLocations, limit: 200 }),
          systemSettingsApi.list({ category: LOOKUP_CATEGORIES.jobTypes, limit: 200 }),
          systemSettingsApi.list({ category: LOOKUP_CATEGORIES.sections, limit: 200 }),
          systemSettingsApi.list({ category: LOOKUP_CATEGORIES.receivers, limit: 200 }),
          systemSettingsApi.list({ category: LOOKUP_CATEGORIES.vehicleClass, limit: 200 }),
        ])

        setCustomers(customersRes.data || [])
        setVehicles(vehiclesRes.data || [])
        setServiceTypes(serviceTypesRes.data || [])
        setEmployees(employeesRes.data || [])
        setLookups({
          garageLocations: garageLocationsRes.data || [],
          jobTypes: jobTypesRes.data || [],
          sections: sectionsRes.data || [],
          receivers: receiversRes.data || [],
          vehicleClass: vehicleClassRes.data || [],
        })
      } catch (e) {
        console.error(e)
        setError('Failed to load master data for work order creation.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const loadLaborCharges = useCallback(async (jobOrderId) => {
    if (!jobOrderId) {
      setLaborCharges([])
      return
    }
    setLaborLoading(true)
    try {
      const res = await jobOrderLaborApi.listCharges(jobOrderId)
      setLaborCharges(res.data || [])
    } catch (e) {
      console.error(e)
      setLaborCharges([])
    } finally {
      setLaborLoading(false)
    }
  }, [])

  useEffect(() => {
    loadLaborCharges(form.job_order_id)
  }, [form.job_order_id, loadLaborCharges])

  const selectedVehicle = useMemo(
    () => vehicles.find((v) => Number(v.vehicle_id) === Number(form.vehicle_id)) || null,
    [vehicles, form.vehicle_id]
  )

  /** When the user picks a different vehicle, copy plate/VIN from master data (not on every vehicles[] refresh). */
  useEffect(() => {
    if (!form.vehicle_id) {
      prevVehicleIdForPlateRef.current = ''
      setForm((prev) => {
        if (prev.license_plate === '' && prev.vin === '') return prev
        return { ...prev, license_plate: '', vin: '' }
      })
      return
    }
    const idStr = String(form.vehicle_id)
    if (prevVehicleIdForPlateRef.current === idStr) return
    const v = vehicles.find((x) => Number(x.vehicle_id) === Number(form.vehicle_id))
    if (!v) return
    prevVehicleIdForPlateRef.current = idStr
    setForm((prev) => ({
      ...prev,
      license_plate: v.license_plate ?? '',
      vin: v.vin ?? '',
    }))
  }, [form.vehicle_id, vehicles])

  const selectedCustomer = useMemo(() => {
    if (form.customer_id) {
      return customers.find((c) => Number(c.customer_id) === Number(form.customer_id)) || null
    }
    if (selectedVehicle?.customer_id) {
      return customers.find((c) => Number(c.customer_id) === Number(selectedVehicle.customer_id)) || null
    }
    return null
  }, [customers, selectedVehicle, form.customer_id])

  const employeeNameById = useMemo(() => {
    const m = new Map()
    for (const e of employees) {
      const n = `${e.first_name || ''} ${e.last_name || ''}`.trim() || e.employee_code || `#${e.employee_id}`
      m.set(Number(e.employee_id), n)
    }
    return m
  }, [employees])

  const filteredLaborTypes = useMemo(() => {
    const q = laborFilter.trim().toLowerCase()
    if (!q) return laborTypes
    return laborTypes.filter((lt) => String(lt.labor_type_name || '').toLowerCase().includes(q))
  }, [laborTypes, laborFilter])

  useEffect(() => {
    if (!form.job_order_id && selectedCustomer?.phone && !notifyClient.sms_phone) {
      setNotifyClient((prev) => ({ ...prev, sms_phone: selectedCustomer.phone || '' }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCustomer?.phone, form.job_order_id])

  const handleChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }))
    setSuccess('')
    setError('')
  }

  const resetNew = () => {
    prevVehicleIdForPlateRef.current = ''
    setForm({
      job_order_id: null,
      job_order_number: '',
      vehicle_id: '',
      license_plate: '',
      vin: '',
      customer_id: '',
      service_type_id: '',
      invoice_type: 'Cash',
      opened_date: '',
      expected_finish_date: '',
      mileage_in_km: '',
      remarks: '',
      garage_location: '',
      type_of_job: '',
      opened_for_repair_section: '',
      received_by: '',
      vehicle_class: '',
    })
    setNotifyClient({ ...DEFAULT_NOTIFY })
    setRepairDetails({
      complaint: '',
      requested_repair: '',
      diagnosis: '',
      parts_to_check: '',
      urgency: 'Normal',
    })
    setLaborCharges([])
    setSuccess('')
    setError('')
  }

  const applyJobOrderToForm = (jo) => {
    prevVehicleIdForPlateRef.current = ''
    const parsedRepair = parseRepairBlock(jo.remarks || '')
    setForm((prev) => ({
      ...prev,
      job_order_id: jo.job_order_id,
      job_order_number: jo.job_order_number || '',
      vehicle_id: jo.vehicle_id ? String(jo.vehicle_id) : '',
      customer_id: jo.customer_id ? String(jo.customer_id) : '',
      service_type_id: jo.service_type_id ? String(jo.service_type_id) : '',
      invoice_type: jo.invoice_type || 'Cash',
      opened_date: fmtDateInput(jo.opened_date),
      expected_finish_date: fmtDateInput(jo.expected_finish_date),
      mileage_in_km: jo.mileage_in_km || '',
      remarks: stripRepairBlock(jo.remarks || ''),
    }))
    setNotifyClient(mergeNotify(jo.notify_client))
    setRepairDetails(parsedRepair)
  }

  const handleRefresh = async () => {
    if (!form.job_order_id) return
    try {
      const res = await jobOrdersApi.getById(form.job_order_id)
      applyJobOrderToForm(res.data)
      await loadLaborCharges(form.job_order_id)
      setSuccess('Refreshed from server.')
    } catch (e) {
      console.error(e)
      setError('Failed to refresh this work order.')
    }
  }

  const handleSave = async () => {
    if (!form.vehicle_id) {
      setError('Vehicle is required.')
      return
    }
    const plateTrim = (form.license_plate || '').trim()
    if (!plateTrim) {
      setError('Plate No. is required.')
      return
    }
    if (form.invoice_type === 'Credit' && !form.customer_id && !selectedVehicle?.customer_id) {
      setError('Customer is required for Credit invoice type.')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')
    const wasEditing = Boolean(form.job_order_id)
    try {
      const vid = Number(form.vehicle_id)
      await vehiclesApi.update(vid, {
        license_plate: plateTrim,
        vin: (form.vin || '').trim() || null,
      })
      const vehiclesRes = await vehiclesApi.getAll({ limit: 100 })
      setVehicles(vehiclesRes.data || [])

      const payload = {
        vehicle_id: vid,
        customer_id: form.customer_id ? Number(form.customer_id) : (selectedVehicle?.customer_id || null),
        service_type_id: form.service_type_id ? Number(form.service_type_id) : null,
        invoice_type: form.invoice_type || 'Cash',
        mileage_in_km: form.mileage_in_km || null,
        opened_date: form.opened_date || null,
        expected_finish_date: form.expected_finish_date || null,
        notify_client: notifyClient,
        remarks: [
          stripRepairBlock(form.remarks?.trim() || ''),
          form.garage_location ? `Garage Location: ${form.garage_location}` : '',
          form.type_of_job ? `Type of Job: ${form.type_of_job}` : '',
          form.opened_for_repair_section ? `Opened For Section: ${form.opened_for_repair_section}` : '',
          form.received_by ? `Received By: ${form.received_by}` : '',
          form.vehicle_class ? `Vehicle Class: ${form.vehicle_class}` : '',
          buildRepairBlock(repairDetails),
        ]
          .filter(Boolean)
          .join('\n'),
      }

      const res = form.job_order_id
        ? await jobOrdersApi.update(form.job_order_id, payload)
        : await jobOrdersApi.create(payload)
      const jo = res.data
      applyJobOrderToForm(jo)
      setSuccess(wasEditing ? 'Work order updated.' : 'Work order created.')
    } catch (e) {
      console.error(e)
      const d = e?.response?.data?.detail
      const msg =
        typeof d === 'string'
          ? d
          : Array.isArray(d)
            ? d.map((x) => x.msg || x).join('; ')
            : d?.message || 'Failed to save work order or vehicle details.'
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  const resolveLaborTypeId = (row, types) => {
    if (row.labor_type_id && types.some((t) => Number(t.labor_type_id) === Number(row.labor_type_id))) {
      return Number(row.labor_type_id)
    }
    if (row.charge_code) {
      const code = String(row.charge_code).trim().toLowerCase()
      const hit = types.find((t) => {
        const name = String(t.labor_type_name || '').trim()
        const first = name.split(/[\s-]/)[0]?.toLowerCase() || ''
        return first === code || name.toLowerCase() === code
      })
      if (hit) return Number(hit.labor_type_id)
    }
    return null
  }

  const handleImportLaborFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !form.job_order_id) {
      setError('Save the work order first, then import labor lines.')
      return
    }
    const text = await file.text()
    let parsed
    try {
      parsed = parseLaborCsv(text, Math.min(Math.max(Number(importRowsLimit) || 50, 1), 500))
    } catch (err) {
      setError(err.message || 'Invalid import file')
      return
    }
    setError('')
    let ok = 0
    for (const row of parsed) {
      const labor_type_id = resolveLaborTypeId(row, laborTypes)
      if (!labor_type_id) continue
      try {
        await jobOrderLaborApi.createCharge(form.job_order_id, {
          labor_type_id,
          hours_worked: Number.isFinite(row.hours_worked) ? row.hours_worked : 0,
          mfc_hours: Number.isFinite(row.mfc_hours) ? row.mfc_hours : 0,
          repair_option: row.repair_option,
          price_list_type: row.price_list_type,
          is_charged: row.is_charged,
          charge_code: row.charge_code,
          remark: row.remark,
        })
        ok += 1
      } catch (err) {
        console.error(err)
      }
    }
    await loadLaborCharges(form.job_order_id)
    setSuccess(`Imported ${ok} labor line(s).`)
  }

  const handleAddLaborLine = async () => {
    if (!form.job_order_id) {
      setError('Save the work order before adding job text / labor charges.')
      return
    }
    const labor_type_id = Number(jtDraft.labor_type_id)
    if (!labor_type_id) {
      setError('Select a charge / labor code.')
      return
    }
    const lt = laborTypes.find((t) => Number(t.labor_type_id) === labor_type_id)
    const code =
      (lt?.labor_type_name || '').split(/[\s-]/)[0]?.trim() || String(labor_type_id)
    try {
      await jobOrderLaborApi.createCharge(form.job_order_id, {
        labor_type_id,
        hours_worked: Number(jtDraft.std_hour) || 0,
        mfc_hours: Number(jtDraft.mfc_hour) || 0,
        repair_option: jtDraft.repair_option || null,
        price_list_type: jtDraft.pl_type || null,
        is_charged: jtDraft.is_charged,
        charge_code: code,
        remark: jtDraft.description?.trim() || null,
      })
      setJtDraft((d) => ({
        ...d,
        labor_type_id: '',
        description: '',
        std_hour: '1',
        mfc_hour: '0',
        pl_type: '',
        is_charged: false,
      }))
      await loadLaborCharges(form.job_order_id)
      setSuccess('Labor line added.')
    } catch (err) {
      console.error(err)
      setError(err?.response?.data?.detail || 'Failed to add labor line.')
    }
  }

  const onLaborTypePick = (idStr) => {
    const id = Number(idStr)
    const lt = laborTypes.find((t) => Number(t.labor_type_id) === id)
    setJtDraft((d) => ({
      ...d,
      labor_type_id: idStr,
      description: lt ? lt.labor_type_name : d.description,
    }))
  }

  const renderGeneralInfo = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="space-y-3">
        <label className="block text-sm">
          <span className="text-gray-600">Job Order No.</span>
          <input className="w-full mt-1 border rounded px-3 py-2 bg-gray-50" value={form.job_order_number || '(auto)'} disabled />
        </label>
        <label className="block text-sm">
          <span className="text-gray-600">Vehicle</span>
          <select className="w-full mt-1 border rounded px-3 py-2" value={form.vehicle_id} onChange={(e) => handleChange('vehicle_id', e.target.value)}>
            <option value="">Select vehicle...</option>
            {vehicles.map((v) => (
              <option key={v.vehicle_id} value={v.vehicle_id}>
                #{v.vehicle_id} - {v.license_plate} ({v.make} {v.model})
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-gray-600">Plate No.</span>
          <input
            className="w-full mt-1 border rounded px-3 py-2"
            value={form.license_plate}
            onChange={(e) => handleChange('license_plate', e.target.value)}
            placeholder="License plate"
            disabled={!form.vehicle_id}
          />
        </label>
        <label className="block text-sm">
          <span className="text-gray-600">Invoice Type</span>
          <select className="w-full mt-1 border rounded px-3 py-2" value={form.invoice_type} onChange={(e) => handleChange('invoice_type', e.target.value)}>
            <option value="Cash">Cash Sales</option>
            <option value="Credit">Credit Sales</option>
            <option value="ITM">ITM</option>
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-gray-600">Customer</span>
          <select className="w-full mt-1 border rounded px-3 py-2" value={form.customer_id} onChange={(e) => handleChange('customer_id', e.target.value)}>
            <option value="">From vehicle / select customer...</option>
            {customers.map((c) => (
              <option key={c.customer_id} value={c.customer_id}>
                #{c.customer_id} - {customerName(c)}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-gray-600">Address</span>
          <input className="w-full mt-1 border rounded px-3 py-2 bg-gray-50" value={selectedCustomer?.address || ''} disabled />
        </label>
      </div>

      <div className="space-y-3">
        <label className="block text-sm">
          <span className="text-gray-600">Chassis/VIN/Frame #</span>
          <input
            className="w-full mt-1 border rounded px-3 py-2"
            value={form.vin}
            onChange={(e) => handleChange('vin', e.target.value)}
            placeholder="VIN / chassis / frame number"
            disabled={!form.vehicle_id}
          />
        </label>
        <label className="block text-sm">
          <span className="text-gray-600">Repair/Service Type</span>
          <select className="w-full mt-1 border rounded px-3 py-2" value={form.service_type_id} onChange={(e) => handleChange('service_type_id', e.target.value)}>
            <option value="">Select service type...</option>
            {serviceTypes.map((s) => (
              <option key={s.service_type_id} value={s.service_type_id}>
                {s.service_name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-gray-600">Mileage in KM</span>
          <input className="w-full mt-1 border rounded px-3 py-2" value={form.mileage_in_km} onChange={(e) => handleChange('mileage_in_km', e.target.value)} />
        </label>
        <label className="block text-sm">
          <span className="text-gray-600">Opening Date</span>
          <input type="date" className="w-full mt-1 border rounded px-3 py-2" value={form.opened_date} onChange={(e) => handleChange('opened_date', e.target.value)} />
        </label>
        <label className="block text-sm">
          <span className="text-gray-600">Exp. Finished Date</span>
          <input type="date" className="w-full mt-1 border rounded px-3 py-2" value={form.expected_finish_date} onChange={(e) => handleChange('expected_finish_date', e.target.value)} />
        </label>
      </div>
    </div>
  )

  const renderOtherInfo = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <label className="block text-sm">
        <span className="text-gray-600">Garage Location</span>
        <select className="w-full mt-1 border rounded px-3 py-2" value={form.garage_location} onChange={(e) => handleChange('garage_location', e.target.value)}>
          <option value="">Select location...</option>
          {lookups.garageLocations.map((s) => (
            <option key={s.setting_id} value={s.setting_value || s.setting_key}>{s.setting_value || s.setting_key}</option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        <span className="text-gray-600">Type of Job</span>
        <select className="w-full mt-1 border rounded px-3 py-2" value={form.type_of_job} onChange={(e) => handleChange('type_of_job', e.target.value)}>
          <option value="">Select type...</option>
          {lookups.jobTypes.map((s) => (
            <option key={s.setting_id} value={s.setting_value || s.setting_key}>{s.setting_value || s.setting_key}</option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        <span className="text-gray-600">Opened For / Repair Section</span>
        <select className="w-full mt-1 border rounded px-3 py-2" value={form.opened_for_repair_section} onChange={(e) => handleChange('opened_for_repair_section', e.target.value)}>
          <option value="">Select section...</option>
          {lookups.sections.map((s) => (
            <option key={s.setting_id} value={s.setting_value || s.setting_key}>{s.setting_value || s.setting_key}</option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        <span className="text-gray-600">Received By</span>
        <select className="w-full mt-1 border rounded px-3 py-2" value={form.received_by} onChange={(e) => handleChange('received_by', e.target.value)}>
          <option value="">Select receiver...</option>
          {lookups.receivers.map((s) => (
            <option key={s.setting_id} value={s.setting_value || s.setting_key}>{s.setting_value || s.setting_key}</option>
          ))}
          {employees.map((e) => (
            <option key={`emp-${e.employee_id}`} value={`${e.first_name || ''} ${e.last_name || ''}`.trim()}>
              {`${e.first_name || ''} ${e.last_name || ''}`.trim() || e.employee_code}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm lg:col-span-2">
        <span className="text-gray-600">Vehicle Class</span>
        <select className="w-full mt-1 border rounded px-3 py-2" value={form.vehicle_class} onChange={(e) => handleChange('vehicle_class', e.target.value)}>
          <option value="">Select class...</option>
          {lookups.vehicleClass.map((s) => (
            <option key={s.setting_id} value={s.setting_value || s.setting_key}>{s.setting_value || s.setting_key}</option>
          ))}
        </select>
      </label>
    </div>
  )

  const renderInformClient = () => (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Tick the selected checkbox, enter the address or number, then use <strong>Save</strong> on the toolbar to persist this work order.
      </p>
      {[
        { key: 'sms', label: 'Through SMS / Text message', field: 'sms_phone', inputLabel: 'Cell phone no.' },
        { key: 'email', label: 'Through Email', field: 'email_address', inputLabel: 'Email address' },
        { key: 'fax', label: 'Through Fax message', field: 'fax_number', inputLabel: 'Fax no.' },
        { key: 'phone', label: 'Through Telephone', field: 'phone_number', inputLabel: 'Telephone no.' },
      ].map((row) => {
        const enabledKey = `${row.key}_enabled`
        const enabled = Boolean(notifyClient[enabledKey])
        return (
          <div key={row.key} className="flex flex-wrap items-center gap-3 border rounded-md p-3 bg-slate-50/60">
            <label className="flex items-center gap-2 min-w-[200px]">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setNotifyClient((p) => ({ ...p, [enabledKey]: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <span className="text-sm font-medium text-gray-800">{row.label}</span>
            </label>
            <label className="flex flex-1 flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 min-w-[240px]">
              <span className="text-xs text-gray-500 w-28 shrink-0">{row.inputLabel}</span>
              <input
                className="flex-1 border rounded px-3 py-2 text-sm disabled:bg-gray-100 disabled:text-gray-400"
                disabled={!enabled}
                value={notifyClient[row.field] || ''}
                onChange={(e) => setNotifyClient((p) => ({ ...p, [row.field]: e.target.value }))}
              />
            </label>
          </div>
        )
      })}
    </div>
  )

  const renderRepairDetails = () => (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Capture customer complaint and repair analysis. Click <strong>Save</strong> on the toolbar to persist with this work order.
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <label className="block text-sm lg:col-span-2">
          <span className="text-gray-600">Customer Complaint</span>
          <textarea
            className="w-full mt-1 border rounded px-3 py-2 min-h-[90px]"
            value={repairDetails.complaint}
            onChange={(e) => setRepairDetails((p) => ({ ...p, complaint: e.target.value }))}
            placeholder="Describe the issue reported by customer..."
          />
        </label>
        <label className="block text-sm lg:col-span-2">
          <span className="text-gray-600">Requested Repair</span>
          <textarea
            className="w-full mt-1 border rounded px-3 py-2 min-h-[80px]"
            value={repairDetails.requested_repair}
            onChange={(e) => setRepairDetails((p) => ({ ...p, requested_repair: e.target.value }))}
            placeholder="Requested operation or work scope..."
          />
        </label>
        <label className="block text-sm">
          <span className="text-gray-600">Urgency</span>
          <select
            className="w-full mt-1 border rounded px-3 py-2"
            value={repairDetails.urgency}
            onChange={(e) => setRepairDetails((p) => ({ ...p, urgency: e.target.value }))}
          >
            <option value="Normal">Normal</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-gray-600">Parts / Area To Check</span>
          <input
            className="w-full mt-1 border rounded px-3 py-2"
            value={repairDetails.parts_to_check}
            onChange={(e) => setRepairDetails((p) => ({ ...p, parts_to_check: e.target.value }))}
            placeholder="e.g. brakes, suspension, AC system"
          />
        </label>
        <label className="block text-sm lg:col-span-2">
          <span className="text-gray-600">Initial Diagnosis / Technician Notes</span>
          <textarea
            className="w-full mt-1 border rounded px-3 py-2 min-h-[100px]"
            value={repairDetails.diagnosis}
            onChange={(e) => setRepairDetails((p) => ({ ...p, diagnosis: e.target.value }))}
            placeholder="Initial findings and probable cause..."
          />
        </label>
      </div>
    </div>
  )

  const renderJobTextCharge = () => (
    <div className="space-y-6">
      <div className="border rounded-lg p-4 bg-slate-50/80">
        <h3 className="text-sm font-semibold text-gray-800 mb-2">Import job text &amp; standard hour from text file</h3>
        <p className="text-xs text-gray-600 mb-3">
          Use a UTF-8 CSV export (Excel &quot;Save As CSV&quot;). Header row example:{' '}
          <code className="bg-white px-1 rounded">labor_type_id,hours_worked,mfc_hours,repair_option,price_list_type,is_charged,remark,charge_code</code>
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="text-gray-600 block mb-1">File</span>
            <input type="file" accept=".csv,.txt,text/csv" onChange={handleImportLaborFile} disabled={!form.job_order_id} className="text-sm" />
          </label>
          <label className="text-sm">
            <span className="text-gray-600 block mb-1">No. of rows (max)</span>
            <input
              type="number"
              min={1}
              max={500}
              className="border rounded px-2 py-1 w-24"
              value={importRowsLimit}
              onChange={(e) => setImportRowsLimit(e.target.value)}
            />
          </label>
        </div>
      </div>

      <div>
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <Button type="button" variant="outline" size="sm" onClick={() => loadLaborCharges(form.job_order_id)} disabled={!form.job_order_id || laborLoading}>
            Refresh
          </Button>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={showAllLabor} onChange={(e) => setShowAllLabor(e.target.checked)} />
            Show all labour charge codes
          </label>
        </div>
        <p className="text-xs text-gray-600 mb-2">
          Select the charge code, adjust standard hours, then click <strong>Add</strong> to append a line to the grid.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-2 items-end border rounded-md p-3 bg-white">
          <label className="text-xs md:col-span-2">
            <span className="text-gray-600">Charge / OP code</span>
            <input
              className="w-full mt-1 border rounded px-2 py-1 text-sm"
              placeholder="Filter…"
              value={laborFilter}
              onChange={(e) => setLaborFilter(e.target.value)}
            />
            <select
              className="w-full mt-1 border rounded px-2 py-1 text-sm max-h-32"
              size={4}
              value={jtDraft.labor_type_id}
              onChange={(e) => onLaborTypePick(e.target.value)}
            >
              <option value="">— pick labor type —</option>
              {filteredLaborTypes.map((lt) => (
                <option key={lt.labor_type_id} value={lt.labor_type_id}>
                  {lt.labor_type_name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs md:col-span-2">
            <span className="text-gray-600">Charge / operation description</span>
            <input className="w-full mt-1 border rounded px-2 py-1 text-sm" value={jtDraft.description} onChange={(e) => setJtDraft((d) => ({ ...d, description: e.target.value }))} />
          </label>
          <label className="text-xs">
            <span className="text-gray-600">Std hour</span>
            <input className="w-full mt-1 border rounded px-2 py-1 text-sm" value={jtDraft.std_hour} onChange={(e) => setJtDraft((d) => ({ ...d, std_hour: e.target.value }))} />
          </label>
          <label className="text-xs">
            <span className="text-gray-600">MFC hour</span>
            <input className="w-full mt-1 border rounded px-2 py-1 text-sm" value={jtDraft.mfc_hour} onChange={(e) => setJtDraft((d) => ({ ...d, mfc_hour: e.target.value }))} />
          </label>
          <label className="text-xs">
            <span className="text-gray-600">Repair option</span>
            <select className="w-full mt-1 border rounded px-2 py-1 text-sm" value={jtDraft.repair_option} onChange={(e) => setJtDraft((d) => ({ ...d, repair_option: e.target.value }))}>
              {REPAIR_OPTIONS.map((o) => (
                <option key={o || 'none'} value={o}>{o || '—'}</option>
              ))}
            </select>
          </label>
          <label className="text-xs">
            <span className="text-gray-600">Price list type</span>
            <input className="w-full mt-1 border rounded px-2 py-1 text-sm" value={jtDraft.pl_type} onChange={(e) => setJtDraft((d) => ({ ...d, pl_type: e.target.value }))} />
          </label>
          <label className="flex items-center gap-2 text-xs pb-1">
            <input type="checkbox" checked={jtDraft.is_charged} onChange={(e) => setJtDraft((d) => ({ ...d, is_charged: e.target.checked }))} />
            Charged?
          </label>
          <Button type="button" className="lg:col-span-1" onClick={handleAddLaborLine} disabled={!form.job_order_id}>
            Add
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto border rounded-md">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 text-left text-xs uppercase text-gray-600">
            <tr>
              <th className="px-2 py-2">Charge code</th>
              <th className="px-2 py-2">Description</th>
              <th className="px-2 py-2">Std hour</th>
              <th className="px-2 py-2">MFC hour</th>
              <th className="px-2 py-2">Option</th>
              <th className="px-2 py-2">PL type</th>
              <th className="px-2 py-2">Charged?</th>
              <th className="px-2 py-2">Created by</th>
            </tr>
          </thead>
          <tbody>
            {laborCharges.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-gray-500">
                  {form.job_order_id ? (laborLoading ? 'Loading…' : 'No labor lines yet.') : 'Save the work order to add lines.'}
                </td>
              </tr>
            ) : (
              laborCharges.map((row) => (
                <tr key={row.labor_charge_id} className="border-t">
                  <td className="px-2 py-2 font-mono">{row.charge_code || '—'}</td>
                  <td className="px-2 py-2">{row.remark || row.labor_type_name || '—'}</td>
                  <td className="px-2 py-2">{row.hours_worked}</td>
                  <td className="px-2 py-2">{row.mfc_hours}</td>
                  <td className="px-2 py-2">{row.repair_option || '—'}</td>
                  <td className="px-2 py-2">{row.price_list_type || '—'}</td>
                  <td className="px-2 py-2">{row.is_charged ? 'Yes' : 'No'}</td>
                  <td className="px-2 py-2">
                    {row.recorded_by_employee_id != null
                      ? employeeNameById.get(Number(row.recorded_by_employee_id)) || `#${row.recorded_by_employee_id}`
                      : user?.username || '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderPlaceholder = (title) => (
    <div className="p-4 border rounded bg-gray-50 text-sm text-gray-700">
      {title} tab: use <strong>Job Order Detail</strong> for full repair / QC / inventory workflows. This screen focuses on opening the order, client contact prefs, and labor job text.
    </div>
  )

  const renderTabContent = () => {
    if (activeTab === 'General Info') return renderGeneralInfo()
    if (activeTab === 'Other Info') return renderOtherInfo()
    if (activeTab === 'Repair Details') return renderRepairDetails()
    if (activeTab === 'Inform Client With') return renderInformClient()
    if (activeTab === 'Job Text/Charge') return renderJobTextCharge()
    if (activeTab === 'Audit Log') {
      return form.job_order_id ? (
        <div className="space-y-2">
          <p className="text-sm text-gray-700">Open the full job order page for operational history and actions.</p>
          <Button type="button" variant="outline" onClick={() => navigate(`/job-orders/${form.job_order_id}`)}>
            Open Job Order Detail
          </Button>
        </div>
      ) : (
        <p className="text-sm text-gray-600">Save the work order first to view activity details.</p>
      )
    }
    return renderPlaceholder(activeTab)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Work Order Creation</h1>
          <p className="text-sm text-gray-600">Manual-style data entry for opening and maintaining job orders.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-blue-700 hidden sm:inline">Ready</span>
          <Button type="button" variant="outline" onClick={resetNew}>New</Button>
          <Button type="button" variant="outline" onClick={handleRefresh} disabled={!form.job_order_id}>Refresh</Button>
          <Button type="button" onClick={handleSave} disabled={saving || loading}>{saving ? 'Saving...' : 'Save'}</Button>
        </div>
      </div>

      {error && <div className="rounded border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">{error}</div>}
      {success && <div className="rounded border border-green-200 bg-green-50 text-green-700 px-3 py-2 text-sm">{success}</div>}

      <div className="bg-white border rounded shadow-sm">
        <div className="border-b px-3 pt-3">
          <div className="flex flex-wrap gap-1">
            {TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-2 text-sm border rounded-t ${
                  activeTab === tab ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-100 border-gray-200 text-gray-600'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
        <div className="p-4">{loading ? <p className="text-sm text-gray-500">Loading...</p> : renderTabContent()}</div>
      </div>
    </div>
  )
}
