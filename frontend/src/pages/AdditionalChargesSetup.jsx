import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  otherChargeTypesApi,
  fuelLubricantsApi,
  miscChargeTypesApi,
  subletWorkSuppliersApi,
  subletWorkTypesApi,
} from '../services/api'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card } from '../components/ui/card'
import { Textarea } from '../components/ui/textarea'

function Checkbox({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  )
}

function SectionHeader({ title, subtitle }) {
  return (
    <div className="mb-3">
      <div className="text-base font-semibold text-gray-800">{title}</div>
      {subtitle ? <div className="text-xs text-gray-500">{subtitle}</div> : null}
    </div>
  )
}

function nextAutoCode(rows, keyName, prefix) {
  const maxSeq = (rows || []).reduce((max, row) => {
    const raw = String(row?.[keyName] || '').trim().toUpperCase()
    if (!raw) return max
    const match = raw.match(/(\d+)\s*$/)
    if (!match) return max
    const n = Number(match[1])
    if (!Number.isFinite(n)) return max
    return Math.max(max, n)
  }, 0)

  return `${prefix}-${String(maxSeq + 1).padStart(4, '0')}`
}

export default function AdditionalChargesSetup() {
  const queryClient = useQueryClient()

  // --- Other charge types
  const [ocCode, setOcCode] = useState('')
  const [ocDesc, setOcDesc] = useState('')
  const [ocTaxable, setOcTaxable] = useState(true)
  const [ocUom, setOcUom] = useState('')
  const [ocPrice, setOcPrice] = useState('')
  const [ocCost, setOcCost] = useState('')
  const [ocJobType, setOcJobType] = useState('')
  const [ocSection, setOcSection] = useState('')
  const [ocSubCat, setOcSubCat] = useState('')

  const [editingOcId, setEditingOcId] = useState(null)
  const [editingOc, setEditingOc] = useState(null)

  const { data: otherChargeTypesData, isLoading: ocLoading } = useQuery({
    queryKey: ['otherChargeTypes', { active_only: false }],
    queryFn: () => otherChargeTypesApi.list({ active_only: false }),
  })

  const otherChargeTypes = useMemo(() => otherChargeTypesData?.data || [], [otherChargeTypesData])
  useEffect(() => {
    setOcCode(nextAutoCode(otherChargeTypes, 'charge_code', 'OC'))
  }, [otherChargeTypes])

  const createOcMutation = useMutation({
    mutationFn: (payload) => otherChargeTypesApi.create(payload),
    onSuccess: async () => {
      setOcDesc('')
      setOcUom('')
      setOcPrice('')
      setOcCost('')
      setOcJobType('')
      setOcSection('')
      setOcSubCat('')
      setOcTaxable(true)
      await queryClient.invalidateQueries({ queryKey: ['otherChargeTypes'] })
    },
  })

  const updateOcMutation = useMutation({
    mutationFn: ({ id, payload }) => otherChargeTypesApi.update(id, payload),
    onSuccess: async () => {
      setEditingOcId(null)
      setEditingOc(null)
      await queryClient.invalidateQueries({ queryKey: ['otherChargeTypes'] })
    },
  })

  const startEditOc = (row) => {
    setEditingOcId(row.other_charge_type_id)
    setEditingOc({
      charge_code: row.charge_code || '',
      description: row.description || '',
      taxable: row.taxable !== false,
      job_type: row.job_type || '',
      section: row.section || '',
      unit_of_measure: row.unit_of_measure || '',
      unit_price: String(row.unit_price ?? ''),
      unit_cost: String(row.unit_cost ?? ''),
      sub_category: row.sub_category || '',
      is_active: row.is_active !== false,
    })
  }

  const cancelEditOc = () => {
    setEditingOcId(null)
    setEditingOc(null)
  }

  const saveEditOc = () => {
    if (!editingOcId || !editingOc) return
    const code = (editingOc.charge_code || '').trim()
    const desc = (editingOc.description || '').trim()
    if (!code || !desc) return
    const unitPrice = Number(editingOc.unit_price)
    const unitCost = Number(editingOc.unit_cost)
    if (!Number.isFinite(unitPrice) || unitPrice < 0) return
    if (!Number.isFinite(unitCost) || unitCost < 0) return

    updateOcMutation.mutate({
      id: editingOcId,
      payload: {
        charge_code: code,
        description: desc,
        taxable: !!editingOc.taxable,
        job_type: (editingOc.job_type || '').trim() || null,
        section: (editingOc.section || '').trim() || null,
        unit_of_measure: (editingOc.unit_of_measure || '').trim() || null,
        unit_price: unitPrice,
        unit_cost: unitCost,
        sub_category: (editingOc.sub_category || '').trim() || null,
        is_active: !!editingOc.is_active,
      },
    })
  }

  const toggleOcActive = (row) => {
    updateOcMutation.mutate({
      id: row.other_charge_type_id,
      payload: { is_active: !row.is_active },
    })
  }

  const onCreateOc = (e) => {
    e.preventDefault()
    const code = (ocCode || '').trim() || nextAutoCode(otherChargeTypes, 'charge_code', 'OC')
    const desc = (ocDesc || '').trim()
    const unitPrice = Number(ocPrice)
    const unitCost = Number(ocCost)
    if (!desc) return
    if (!Number.isFinite(unitPrice) || unitPrice < 0) return
    if (!Number.isFinite(unitCost) || unitCost < 0) return

    createOcMutation.mutate({
      charge_code: code,
      description: desc,
      taxable: ocTaxable,
      job_type: (ocJobType || '').trim() || null,
      section: (ocSection || '').trim() || null,
      unit_of_measure: (ocUom || '').trim() || null,
      unit_price: unitPrice,
      unit_cost: unitCost,
      sub_category: (ocSubCat || '').trim() || null,
    })
  }

  // --- Fuel & lubricants
  const [flCode, setFlCode] = useState('')
  const [flDesc, setFlDesc] = useState('')
  const [flTaxable, setFlTaxable] = useState(true)
  const [flUom, setFlUom] = useState('')
  const [flPrice, setFlPrice] = useState('')
  const [flCost, setFlCost] = useState('')
  const [flSection, setFlSection] = useState('')

  const [editingFlId, setEditingFlId] = useState(null)
  const [editingFl, setEditingFl] = useState(null)

  const { data: fuelItemsData, isLoading: flLoading } = useQuery({
    queryKey: ['fuelLubricants', { active_only: false }],
    queryFn: () => fuelLubricantsApi.list({ active_only: false }),
  })

  const fuelItems = useMemo(() => fuelItemsData?.data || [], [fuelItemsData])
  useEffect(() => {
    setFlCode(nextAutoCode(fuelItems, 'item_code', 'FL'))
  }, [fuelItems])

  const createFlMutation = useMutation({
    mutationFn: (payload) => fuelLubricantsApi.create(payload),
    onSuccess: async () => {
      setFlDesc('')
      setFlTaxable(true)
      setFlUom('')
      setFlPrice('')
      setFlCost('')
      setFlSection('')
      await queryClient.invalidateQueries({ queryKey: ['fuelLubricants'] })
    },
  })

  const updateFlMutation = useMutation({
    mutationFn: ({ id, payload }) => fuelLubricantsApi.update(id, payload),
    onSuccess: async () => {
      setEditingFlId(null)
      setEditingFl(null)
      await queryClient.invalidateQueries({ queryKey: ['fuelLubricants'] })
    },
  })

  const startEditFl = (row) => {
    setEditingFlId(row.fuel_lubricant_id)
    setEditingFl({
      item_code: row.item_code || '',
      description: row.description || '',
      taxable: row.taxable !== false,
      section: row.section || '',
      unit_of_measure: row.unit_of_measure || '',
      unit_price: String(row.unit_price ?? ''),
      unit_cost: String(row.unit_cost ?? ''),
      is_active: row.is_active !== false,
    })
  }

  const cancelEditFl = () => {
    setEditingFlId(null)
    setEditingFl(null)
  }

  const saveEditFl = () => {
    if (!editingFlId || !editingFl) return
    const code = (editingFl.item_code || '').trim()
    const desc = (editingFl.description || '').trim()
    if (!code || !desc) return
    const unitPrice = Number(editingFl.unit_price)
    const unitCost = Number(editingFl.unit_cost)
    if (!Number.isFinite(unitPrice) || unitPrice < 0) return
    if (!Number.isFinite(unitCost) || unitCost < 0) return

    updateFlMutation.mutate({
      id: editingFlId,
      payload: {
        item_code: code,
        description: desc,
        taxable: !!editingFl.taxable,
        section: (editingFl.section || '').trim() || null,
        unit_of_measure: (editingFl.unit_of_measure || '').trim() || null,
        unit_price: unitPrice,
        unit_cost: unitCost,
        is_active: !!editingFl.is_active,
      },
    })
  }

  const toggleFlActive = (row) => {
    updateFlMutation.mutate({
      id: row.fuel_lubricant_id,
      payload: { is_active: !row.is_active },
    })
  }

  const onCreateFl = (e) => {
    e.preventDefault()
    const code = (flCode || '').trim() || nextAutoCode(fuelItems, 'item_code', 'FL')
    const desc = (flDesc || '').trim()
    const unitPrice = Number(flPrice)
    const unitCost = Number(flCost)
    if (!desc) return
    if (!Number.isFinite(unitPrice) || unitPrice < 0) return
    if (!Number.isFinite(unitCost) || unitCost < 0) return

    createFlMutation.mutate({
      item_code: code,
      description: desc,
      taxable: flTaxable,
      section: (flSection || '').trim() || null,
      unit_of_measure: (flUom || '').trim() || null,
      unit_price: unitPrice,
      unit_cost: unitCost,
    })
  }

  // --- Misc charge types
  const [mcCode, setMcCode] = useState('')
  const [mcDesc, setMcDesc] = useState('')
  const [mcTaxable, setMcTaxable] = useState(true)
  const [mcUom, setMcUom] = useState('')
  const [mcPrice, setMcPrice] = useState('')
  const [mcCost, setMcCost] = useState('')
  const [mcJobType, setMcJobType] = useState('')
  const [mcSection, setMcSection] = useState('')
  const [mcSubCat, setMcSubCat] = useState('')

  const [editingMcId, setEditingMcId] = useState(null)
  const [editingMc, setEditingMc] = useState(null)

  const { data: miscChargeTypesData, isLoading: mcLoading } = useQuery({
    queryKey: ['miscChargeTypes', { active_only: false }],
    queryFn: () => miscChargeTypesApi.list({ active_only: false }),
  })

  const miscChargeTypes = useMemo(() => miscChargeTypesData?.data || [], [miscChargeTypesData])
  useEffect(() => {
    setMcCode(nextAutoCode(miscChargeTypes, 'charge_code', 'MC'))
  }, [miscChargeTypes])

  const createMcMutation = useMutation({
    mutationFn: (payload) => miscChargeTypesApi.create(payload),
    onSuccess: async () => {
      setMcDesc('')
      setMcUom('')
      setMcPrice('')
      setMcCost('')
      setMcJobType('')
      setMcSection('')
      setMcSubCat('')
      setMcTaxable(true)
      await queryClient.invalidateQueries({ queryKey: ['miscChargeTypes'] })
    },
  })

  const updateMcMutation = useMutation({
    mutationFn: ({ id, payload }) => miscChargeTypesApi.update(id, payload),
    onSuccess: async () => {
      setEditingMcId(null)
      setEditingMc(null)
      await queryClient.invalidateQueries({ queryKey: ['miscChargeTypes'] })
    },
  })

  const startEditMc = (row) => {
    setEditingMcId(row.misc_charge_type_id)
    setEditingMc({
      charge_code: row.charge_code || '',
      description: row.description || '',
      taxable: row.taxable !== false,
      job_type: row.job_type || '',
      section: row.section || '',
      unit_of_measure: row.unit_of_measure || '',
      unit_price: String(row.unit_price ?? ''),
      unit_cost: String(row.unit_cost ?? ''),
      sub_category: row.sub_category || '',
      is_active: row.is_active !== false,
    })
  }

  const cancelEditMc = () => {
    setEditingMcId(null)
    setEditingMc(null)
  }

  const saveEditMc = () => {
    if (!editingMcId || !editingMc) return
    const code = (editingMc.charge_code || '').trim()
    const desc = (editingMc.description || '').trim()
    if (!code || !desc) return
    const unitPrice = Number(editingMc.unit_price)
    const unitCost = Number(editingMc.unit_cost)
    if (!Number.isFinite(unitPrice) || unitPrice < 0) return
    if (!Number.isFinite(unitCost) || unitCost < 0) return

    updateMcMutation.mutate({
      id: editingMcId,
      payload: {
        charge_code: code,
        description: desc,
        taxable: !!editingMc.taxable,
        job_type: (editingMc.job_type || '').trim() || null,
        section: (editingMc.section || '').trim() || null,
        unit_of_measure: (editingMc.unit_of_measure || '').trim() || null,
        unit_price: unitPrice,
        unit_cost: unitCost,
        sub_category: (editingMc.sub_category || '').trim() || null,
        is_active: !!editingMc.is_active,
      },
    })
  }

  const toggleMcActive = (row) => {
    updateMcMutation.mutate({ id: row.misc_charge_type_id, payload: { is_active: !row.is_active } })
  }

  const onCreateMc = (e) => {
    e.preventDefault()
    const code = (mcCode || '').trim() || nextAutoCode(miscChargeTypes, 'charge_code', 'MC')
    const desc = (mcDesc || '').trim()
    const unitPrice = Number(mcPrice)
    const unitCost = Number(mcCost)
    if (!desc) return
    if (!Number.isFinite(unitPrice) || unitPrice < 0) return
    if (!Number.isFinite(unitCost) || unitCost < 0) return

    createMcMutation.mutate({
      charge_code: code,
      description: desc,
      taxable: mcTaxable,
      job_type: (mcJobType || '').trim() || null,
      section: (mcSection || '').trim() || null,
      unit_of_measure: (mcUom || '').trim() || null,
      unit_price: unitPrice,
      unit_cost: unitCost,
      sub_category: (mcSubCat || '').trim() || null,
    })
  }

  // --- Sublet suppliers
  const [ssName, setSsName] = useState('')
  const [ssPhone, setSsPhone] = useState('')
  const [ssEmail, setSsEmail] = useState('')
  const [ssAddress, setSsAddress] = useState('')

  const [editingSsId, setEditingSsId] = useState(null)
  const [editingSs, setEditingSs] = useState(null)

  const { data: suppliersData, isLoading: ssLoading } = useQuery({
    queryKey: ['subletWorkSuppliers', { active_only: false }],
    queryFn: () => subletWorkSuppliersApi.list({ active_only: false }),
  })

  const suppliers = useMemo(() => suppliersData?.data || [], [suppliersData])

  const createSsMutation = useMutation({
    mutationFn: (payload) => subletWorkSuppliersApi.create(payload),
    onSuccess: async () => {
      setSsName('')
      setSsPhone('')
      setSsEmail('')
      setSsAddress('')
      await queryClient.invalidateQueries({ queryKey: ['subletWorkSuppliers'] })
      await queryClient.invalidateQueries({ queryKey: ['subletWorkTypes'] })
    },
  })

  const updateSsMutation = useMutation({
    mutationFn: ({ id, payload }) => subletWorkSuppliersApi.update(id, payload),
    onSuccess: async () => {
      setEditingSsId(null)
      setEditingSs(null)
      await queryClient.invalidateQueries({ queryKey: ['subletWorkSuppliers'] })
      await queryClient.invalidateQueries({ queryKey: ['subletWorkTypes'] })
    },
  })

  const onCreateSs = (e) => {
    e.preventDefault()
    const name = (ssName || '').trim()
    if (!name) return
    createSsMutation.mutate({
      supplier_name: name,
      phone: (ssPhone || '').trim() || null,
      email: (ssEmail || '').trim() || null,
      address: (ssAddress || '').trim() || null,
    })
  }

  const startEditSs = (row) => {
    setEditingSsId(row.supplier_id)
    setEditingSs({
      supplier_name: row.supplier_name || '',
      phone: row.phone || '',
      email: row.email || '',
      address: row.address || '',
      is_active: row.is_active !== false,
    })
  }

  const cancelEditSs = () => {
    setEditingSsId(null)
    setEditingSs(null)
  }

  const saveEditSs = () => {
    if (!editingSsId || !editingSs) return
    const name = (editingSs.supplier_name || '').trim()
    if (!name) return
    updateSsMutation.mutate({
      id: editingSsId,
      payload: {
        supplier_name: name,
        phone: (editingSs.phone || '').trim() || null,
        email: (editingSs.email || '').trim() || null,
        address: (editingSs.address || '').trim() || null,
        is_active: !!editingSs.is_active,
      },
    })
  }

  const toggleSsActive = (row) => {
    updateSsMutation.mutate({ id: row.supplier_id, payload: { is_active: !row.is_active } })
  }

  // --- Sublet work types
  const [swCode, setSwCode] = useState('')
  const [swDesc, setSwDesc] = useState('')
  const [swTaxable, setSwTaxable] = useState(true)
  const [swUom, setSwUom] = useState('')
  const [swPrice, setSwPrice] = useState('')
  const [swCost, setSwCost] = useState('')
  const [swJobType, setSwJobType] = useState('')
  const [swSection, setSwSection] = useState('')
  const [swSubCat, setSwSubCat] = useState('')
  const [swSupplierId, setSwSupplierId] = useState('')

  const [editingSwId, setEditingSwId] = useState(null)
  const [editingSw, setEditingSw] = useState(null)

  const { data: workTypesData, isLoading: swLoading } = useQuery({
    queryKey: ['subletWorkTypes', { active_only: false }],
    queryFn: () => subletWorkTypesApi.list({ active_only: false }),
  })

  const workTypes = useMemo(() => workTypesData?.data || [], [workTypesData])
  useEffect(() => {
    setSwCode(nextAutoCode(workTypes, 'work_code', 'SW'))
  }, [workTypes])

  const activeSuppliers = useMemo(() => (suppliers || []).filter((s) => s.is_active), [suppliers])

  const suppliersForEditSw = useMemo(() => {
    const selectedId = Number(editingSw?.supplier_id)
    const selected =
      Number.isFinite(selectedId) && selectedId > 0 ? (suppliers || []).find((s) => Number(s.supplier_id) === selectedId) : null

    if (selected && !selected.is_active) return [selected, ...(activeSuppliers || [])]
    return activeSuppliers || []
  }, [activeSuppliers, suppliers, editingSw?.supplier_id])

  const createSwMutation = useMutation({
    mutationFn: (payload) => subletWorkTypesApi.create(payload),
    onSuccess: async () => {
      setSwDesc('')
      setSwTaxable(true)
      setSwUom('')
      setSwPrice('')
      setSwCost('')
      setSwJobType('')
      setSwSection('')
      setSwSubCat('')
      setSwSupplierId('')
      await queryClient.invalidateQueries({ queryKey: ['subletWorkTypes'] })
    },
  })

  const updateSwMutation = useMutation({
    mutationFn: ({ id, payload }) => subletWorkTypesApi.update(id, payload),
    onSuccess: async () => {
      setEditingSwId(null)
      setEditingSw(null)
      await queryClient.invalidateQueries({ queryKey: ['subletWorkTypes'] })
    },
  })

  const onCreateSw = (e) => {
    e.preventDefault()
    const code = (swCode || '').trim() || nextAutoCode(workTypes, 'work_code', 'SW')
    const desc = (swDesc || '').trim()
    const unitPrice = Number(swPrice)
    const unitCost = Number(swCost)
    if (!desc) return
    if (!Number.isFinite(unitPrice) || unitPrice < 0) return
    if (!Number.isFinite(unitCost) || unitCost < 0) return

    const supplierId = Number(swSupplierId)

    createSwMutation.mutate({
      work_code: code,
      description: desc,
      taxable: swTaxable,
      job_type: (swJobType || '').trim() || null,
      section: (swSection || '').trim() || null,
      unit_of_measure: (swUom || '').trim() || null,
      unit_price: unitPrice,
      unit_cost: unitCost,
      sub_category: (swSubCat || '').trim() || null,
      supplier_id: Number.isFinite(supplierId) && supplierId > 0 ? supplierId : null,
    })
  }

  const startEditSw = (row) => {
    setEditingSwId(row.sublet_work_type_id)
    setEditingSw({
      work_code: row.work_code || '',
      description: row.description || '',
      taxable: row.taxable !== false,
      job_type: row.job_type || '',
      section: row.section || '',
      unit_of_measure: row.unit_of_measure || '',
      unit_price: String(row.unit_price ?? ''),
      unit_cost: String(row.unit_cost ?? ''),
      sub_category: row.sub_category || '',
      supplier_id: row.supplier_id != null ? String(row.supplier_id) : '',
      is_active: row.is_active !== false,
    })
  }

  const cancelEditSw = () => {
    setEditingSwId(null)
    setEditingSw(null)
  }

  const saveEditSw = () => {
    if (!editingSwId || !editingSw) return
    const code = (editingSw.work_code || '').trim()
    const desc = (editingSw.description || '').trim()
    if (!code || !desc) return
    const unitPrice = Number(editingSw.unit_price)
    const unitCost = Number(editingSw.unit_cost)
    if (!Number.isFinite(unitPrice) || unitPrice < 0) return
    if (!Number.isFinite(unitCost) || unitCost < 0) return

    const supplierId = Number(editingSw.supplier_id)

    updateSwMutation.mutate({
      id: editingSwId,
      payload: {
        work_code: code,
        description: desc,
        taxable: !!editingSw.taxable,
        job_type: (editingSw.job_type || '').trim() || null,
        section: (editingSw.section || '').trim() || null,
        unit_of_measure: (editingSw.unit_of_measure || '').trim() || null,
        unit_price: unitPrice,
        unit_cost: unitCost,
        sub_category: (editingSw.sub_category || '').trim() || null,
        supplier_id: Number.isFinite(supplierId) && supplierId > 0 ? supplierId : null,
        is_active: !!editingSw.is_active,
      },
    })
  }

  const toggleSwActive = (row) => {
    updateSwMutation.mutate({ id: row.sublet_work_type_id, payload: { is_active: !row.is_active } })
  }

  const supplierNameById = useMemo(() => {
    const map = new Map()
    for (const s of suppliers || []) map.set(Number(s.supplier_id), s.supplier_name)
    return map
  }, [suppliers])

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Additional Charges Setup</h1>

      <div className="space-y-6">
        <Card className="p-6">
          <SectionHeader
            title="Other Charge Types"
            subtitle="Create and maintain other charge codes used in job orders."
          />

          <form onSubmit={onCreateOc} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Input value={ocCode} readOnly className="bg-gray-50" placeholder="Auto Charge Code" />
              <Input value={ocDesc} onChange={(e) => setOcDesc(e.target.value)} placeholder="Description *" />
              <Input value={ocUom} onChange={(e) => setOcUom(e.target.value)} placeholder="Unit of Measure" />
              <div className="flex items-center gap-3">
                <Checkbox checked={ocTaxable} onChange={setOcTaxable} label="Taxable" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <Input value={ocPrice} onChange={(e) => setOcPrice(e.target.value)} placeholder="Unit Price *" type="number" step="0.01" min="0" />
              <Input value={ocCost} onChange={(e) => setOcCost(e.target.value)} placeholder="Unit Cost *" type="number" step="0.01" min="0" />
              <Input value={ocJobType} onChange={(e) => setOcJobType(e.target.value)} placeholder="Job Type" />
              <Input value={ocSection} onChange={(e) => setOcSection(e.target.value)} placeholder="Section" />
              <Input value={ocSubCat} onChange={(e) => setOcSubCat(e.target.value)} placeholder="Sub Category" />
            </div>

            <Button
              type="submit"
              disabled={
                createOcMutation.isPending ||
                !(ocDesc || '').trim() ||
                !Number.isFinite(Number(ocPrice)) ||
                Number(ocPrice) < 0 ||
                !Number.isFinite(Number(ocCost)) ||
                Number(ocCost) < 0
              }
            >
              {createOcMutation.isPending ? 'Adding...' : 'Add'}
            </Button>

            {createOcMutation.error && (
              <p className="text-sm text-red-600">{createOcMutation.error?.response?.data?.detail || 'Failed to add'}</p>
            )}
          </form>

          {editingOc && (
            <div className="mt-5 border rounded-lg p-4">
              <div className="text-sm font-semibold text-gray-700 mb-3">Edit Other Charge Type</div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <Input value={editingOc.charge_code} onChange={(e) => setEditingOc((p) => ({ ...p, charge_code: e.target.value }))} />
                <Input value={editingOc.description} onChange={(e) => setEditingOc((p) => ({ ...p, description: e.target.value }))} />
                <Input value={editingOc.unit_of_measure} onChange={(e) => setEditingOc((p) => ({ ...p, unit_of_measure: e.target.value }))} placeholder="Unit of Measure" />
                <div className="flex items-center justify-between gap-3">
                  <Checkbox checked={editingOc.taxable} onChange={(v) => setEditingOc((p) => ({ ...p, taxable: v }))} label="Taxable" />
                  <Checkbox checked={editingOc.is_active} onChange={(v) => setEditingOc((p) => ({ ...p, is_active: v }))} label="Active" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mt-3">
                <Input value={editingOc.unit_price} onChange={(e) => setEditingOc((p) => ({ ...p, unit_price: e.target.value }))} type="number" step="0.01" min="0" />
                <Input value={editingOc.unit_cost} onChange={(e) => setEditingOc((p) => ({ ...p, unit_cost: e.target.value }))} type="number" step="0.01" min="0" />
                <Input value={editingOc.job_type} onChange={(e) => setEditingOc((p) => ({ ...p, job_type: e.target.value }))} placeholder="Job Type" />
                <Input value={editingOc.section} onChange={(e) => setEditingOc((p) => ({ ...p, section: e.target.value }))} placeholder="Section" />
                <Input value={editingOc.sub_category} onChange={(e) => setEditingOc((p) => ({ ...p, sub_category: e.target.value }))} placeholder="Sub Category" />
              </div>
              <div className="flex gap-2 mt-4">
                <Button type="button" variant="outline" onClick={cancelEditOc}>Cancel</Button>
                <Button type="button" onClick={saveEditOc} disabled={updateOcMutation.isPending}>Save</Button>
              </div>
              {updateOcMutation.error && (
                <p className="text-sm text-red-600 mt-2">{updateOcMutation.error?.response?.data?.detail || 'Failed to update'}</p>
              )}
            </div>
          )}

          <div className="mt-5 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Code</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Description</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Tax</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">UOM</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Price</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Cost</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Job Type</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Section</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Sub Cat</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Status</th>
                  <th className="text-right py-2 px-2 text-xs font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(otherChargeTypes || []).map((row) => (
                  <tr key={row.other_charge_type_id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-2 text-sm font-mono">{row.charge_code}</td>
                    <td className="py-2 px-2 text-sm">{row.description}</td>
                    <td className="py-2 px-2 text-sm">{row.taxable ? 'Yes' : 'No'}</td>
                    <td className="py-2 px-2 text-sm">{row.unit_of_measure || '-'}</td>
                    <td className="py-2 px-2 text-sm">ETB {Number(row.unit_price ?? 0).toFixed(2)}</td>
                    <td className="py-2 px-2 text-sm">ETB {Number(row.unit_cost ?? 0).toFixed(2)}</td>
                    <td className="py-2 px-2 text-sm">{row.job_type || '-'}</td>
                    <td className="py-2 px-2 text-sm">{row.section || '-'}</td>
                    <td className="py-2 px-2 text-sm">{row.sub_category || '-'}</td>
                    <td className="py-2 px-2 text-sm">{row.is_active ? 'Active' : 'Inactive'}</td>
                    <td className="py-2 px-2 text-sm text-right">
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => startEditOc(row)}>Edit</Button>
                        <Button type="button" variant={row.is_active ? 'destructive' : 'default'} onClick={() => toggleOcActive(row)} disabled={updateOcMutation.isPending}>
                          {row.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!ocLoading && (otherChargeTypes || []).length === 0 && (
                  <tr>
                    <td colSpan={11} className="py-5 px-2 text-center text-gray-500">No items</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-6">
          <SectionHeader title="Fuel & Lubricants" subtitle="Maintain fuel/lubricant item codes used in job orders." />

          <form onSubmit={onCreateFl} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Input value={flCode} readOnly className="bg-gray-50" placeholder="Auto Item Code" />
              <Input value={flDesc} onChange={(e) => setFlDesc(e.target.value)} placeholder="Description *" />
              <Input value={flUom} onChange={(e) => setFlUom(e.target.value)} placeholder="Unit of Measure" />
              <div className="flex items-center gap-3">
                <Checkbox checked={flTaxable} onChange={setFlTaxable} label="Taxable" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Input value={flPrice} onChange={(e) => setFlPrice(e.target.value)} placeholder="Unit Price *" type="number" step="0.01" min="0" />
              <Input value={flCost} onChange={(e) => setFlCost(e.target.value)} placeholder="Unit Cost *" type="number" step="0.01" min="0" />
              <Input value={flSection} onChange={(e) => setFlSection(e.target.value)} placeholder="Section" />
              <div className="flex items-end">
                <Button
                  type="submit"
                  disabled={
                    createFlMutation.isPending ||
                    !(flDesc || '').trim() ||
                    !Number.isFinite(Number(flPrice)) ||
                    Number(flPrice) < 0 ||
                    !Number.isFinite(Number(flCost)) ||
                    Number(flCost) < 0
                  }
                >
                  {createFlMutation.isPending ? 'Adding...' : 'Add'}
                </Button>
              </div>
            </div>
            {createFlMutation.error && (
              <p className="text-sm text-red-600">{createFlMutation.error?.response?.data?.detail || 'Failed to add'}</p>
            )}
          </form>

          {editingFl && (
            <div className="mt-5 border rounded-lg p-4">
              <div className="text-sm font-semibold text-gray-700 mb-3">Edit Fuel/Lubricant</div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <Input value={editingFl.item_code} onChange={(e) => setEditingFl((p) => ({ ...p, item_code: e.target.value }))} />
                <Input value={editingFl.description} onChange={(e) => setEditingFl((p) => ({ ...p, description: e.target.value }))} />
                <Input value={editingFl.unit_of_measure} onChange={(e) => setEditingFl((p) => ({ ...p, unit_of_measure: e.target.value }))} placeholder="Unit of Measure" />
                <div className="flex items-center justify-between gap-3">
                  <Checkbox checked={editingFl.taxable} onChange={(v) => setEditingFl((p) => ({ ...p, taxable: v }))} label="Taxable" />
                  <Checkbox checked={editingFl.is_active} onChange={(v) => setEditingFl((p) => ({ ...p, is_active: v }))} label="Active" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-3">
                <Input value={editingFl.unit_price} onChange={(e) => setEditingFl((p) => ({ ...p, unit_price: e.target.value }))} type="number" step="0.01" min="0" />
                <Input value={editingFl.unit_cost} onChange={(e) => setEditingFl((p) => ({ ...p, unit_cost: e.target.value }))} type="number" step="0.01" min="0" />
                <Input value={editingFl.section} onChange={(e) => setEditingFl((p) => ({ ...p, section: e.target.value }))} placeholder="Section" />
                <div className="flex items-end gap-2">
                  <Button type="button" variant="outline" onClick={cancelEditFl}>Cancel</Button>
                  <Button type="button" onClick={saveEditFl} disabled={updateFlMutation.isPending}>Save</Button>
                </div>
              </div>
              {updateFlMutation.error && (
                <p className="text-sm text-red-600 mt-2">{updateFlMutation.error?.response?.data?.detail || 'Failed to update'}</p>
              )}
            </div>
          )}

          <div className="mt-5 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Code</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Description</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Tax</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">UOM</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Price</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Cost</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Section</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Status</th>
                  <th className="text-right py-2 px-2 text-xs font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(fuelItems || []).map((row) => (
                  <tr key={row.fuel_lubricant_id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-2 text-sm font-mono">{row.item_code}</td>
                    <td className="py-2 px-2 text-sm">{row.description}</td>
                    <td className="py-2 px-2 text-sm">{row.taxable ? 'Yes' : 'No'}</td>
                    <td className="py-2 px-2 text-sm">{row.unit_of_measure || '-'}</td>
                    <td className="py-2 px-2 text-sm">ETB {Number(row.unit_price ?? 0).toFixed(2)}</td>
                    <td className="py-2 px-2 text-sm">ETB {Number(row.unit_cost ?? 0).toFixed(2)}</td>
                    <td className="py-2 px-2 text-sm">{row.section || '-'}</td>
                    <td className="py-2 px-2 text-sm">{row.is_active ? 'Active' : 'Inactive'}</td>
                    <td className="py-2 px-2 text-sm text-right">
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => startEditFl(row)}>Edit</Button>
                        <Button type="button" variant={row.is_active ? 'destructive' : 'default'} onClick={() => toggleFlActive(row)} disabled={updateFlMutation.isPending}>
                          {row.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!flLoading && (fuelItems || []).length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-5 px-2 text-center text-gray-500">No items</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-6">
          <SectionHeader title="Misc Charge Types" subtitle="Maintain misc charge codes used in job orders." />

          <form onSubmit={onCreateMc} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Input value={mcCode} readOnly className="bg-gray-50" placeholder="Auto Charge Code" />
              <Input value={mcDesc} onChange={(e) => setMcDesc(e.target.value)} placeholder="Description *" />
              <Input value={mcUom} onChange={(e) => setMcUom(e.target.value)} placeholder="Unit of Measure" />
              <div className="flex items-center gap-3">
                <Checkbox checked={mcTaxable} onChange={setMcTaxable} label="Taxable" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <Input value={mcPrice} onChange={(e) => setMcPrice(e.target.value)} placeholder="Unit Price *" type="number" step="0.01" min="0" />
              <Input value={mcCost} onChange={(e) => setMcCost(e.target.value)} placeholder="Unit Cost *" type="number" step="0.01" min="0" />
              <Input value={mcJobType} onChange={(e) => setMcJobType(e.target.value)} placeholder="Job Type" />
              <Input value={mcSection} onChange={(e) => setMcSection(e.target.value)} placeholder="Section" />
              <Input value={mcSubCat} onChange={(e) => setMcSubCat(e.target.value)} placeholder="Sub Category" />
            </div>

            <Button
              type="submit"
              disabled={
                createMcMutation.isPending ||
                !(mcDesc || '').trim() ||
                !Number.isFinite(Number(mcPrice)) ||
                Number(mcPrice) < 0 ||
                !Number.isFinite(Number(mcCost)) ||
                Number(mcCost) < 0
              }
            >
              {createMcMutation.isPending ? 'Adding...' : 'Add'}
            </Button>

            {createMcMutation.error && (
              <p className="text-sm text-red-600">{createMcMutation.error?.response?.data?.detail || 'Failed to add'}</p>
            )}
          </form>

          {editingMc && (
            <div className="mt-5 border rounded-lg p-4">
              <div className="text-sm font-semibold text-gray-700 mb-3">Edit Misc Charge Type</div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <Input value={editingMc.charge_code} onChange={(e) => setEditingMc((p) => ({ ...p, charge_code: e.target.value }))} />
                <Input value={editingMc.description} onChange={(e) => setEditingMc((p) => ({ ...p, description: e.target.value }))} />
                <Input value={editingMc.unit_of_measure} onChange={(e) => setEditingMc((p) => ({ ...p, unit_of_measure: e.target.value }))} placeholder="Unit of Measure" />
                <div className="flex items-center justify-between gap-3">
                  <Checkbox checked={editingMc.taxable} onChange={(v) => setEditingMc((p) => ({ ...p, taxable: v }))} label="Taxable" />
                  <Checkbox checked={editingMc.is_active} onChange={(v) => setEditingMc((p) => ({ ...p, is_active: v }))} label="Active" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mt-3">
                <Input value={editingMc.unit_price} onChange={(e) => setEditingMc((p) => ({ ...p, unit_price: e.target.value }))} type="number" step="0.01" min="0" />
                <Input value={editingMc.unit_cost} onChange={(e) => setEditingMc((p) => ({ ...p, unit_cost: e.target.value }))} type="number" step="0.01" min="0" />
                <Input value={editingMc.job_type} onChange={(e) => setEditingMc((p) => ({ ...p, job_type: e.target.value }))} placeholder="Job Type" />
                <Input value={editingMc.section} onChange={(e) => setEditingMc((p) => ({ ...p, section: e.target.value }))} placeholder="Section" />
                <Input value={editingMc.sub_category} onChange={(e) => setEditingMc((p) => ({ ...p, sub_category: e.target.value }))} placeholder="Sub Category" />
              </div>
              <div className="flex gap-2 mt-4">
                <Button type="button" variant="outline" onClick={cancelEditMc}>Cancel</Button>
                <Button type="button" onClick={saveEditMc} disabled={updateMcMutation.isPending}>Save</Button>
              </div>
              {updateMcMutation.error && (
                <p className="text-sm text-red-600 mt-2">{updateMcMutation.error?.response?.data?.detail || 'Failed to update'}</p>
              )}
            </div>
          )}

          <div className="mt-5 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Code</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Description</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Tax</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">UOM</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Price</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Cost</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Job Type</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Section</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Sub Cat</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Status</th>
                  <th className="text-right py-2 px-2 text-xs font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(miscChargeTypes || []).map((row) => (
                  <tr key={row.misc_charge_type_id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-2 text-sm font-mono">{row.charge_code}</td>
                    <td className="py-2 px-2 text-sm">{row.description}</td>
                    <td className="py-2 px-2 text-sm">{row.taxable ? 'Yes' : 'No'}</td>
                    <td className="py-2 px-2 text-sm">{row.unit_of_measure || '-'}</td>
                    <td className="py-2 px-2 text-sm">ETB {Number(row.unit_price ?? 0).toFixed(2)}</td>
                    <td className="py-2 px-2 text-sm">ETB {Number(row.unit_cost ?? 0).toFixed(2)}</td>
                    <td className="py-2 px-2 text-sm">{row.job_type || '-'}</td>
                    <td className="py-2 px-2 text-sm">{row.section || '-'}</td>
                    <td className="py-2 px-2 text-sm">{row.sub_category || '-'}</td>
                    <td className="py-2 px-2 text-sm">{row.is_active ? 'Active' : 'Inactive'}</td>
                    <td className="py-2 px-2 text-sm text-right">
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => startEditMc(row)}>Edit</Button>
                        <Button type="button" variant={row.is_active ? 'destructive' : 'default'} onClick={() => toggleMcActive(row)} disabled={updateMcMutation.isPending}>
                          {row.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!mcLoading && (miscChargeTypes || []).length === 0 && (
                  <tr>
                    <td colSpan={11} className="py-5 px-2 text-center text-gray-500">No items</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-6">
          <SectionHeader title="Sublet Work Suppliers" subtitle="Maintain suppliers used for sublet work types." />

          <form onSubmit={onCreateSs} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Input value={ssName} onChange={(e) => setSsName(e.target.value)} placeholder="Supplier Name *" />
              <Input value={ssPhone} onChange={(e) => setSsPhone(e.target.value)} placeholder="Phone" />
              <Input value={ssEmail} onChange={(e) => setSsEmail(e.target.value)} placeholder="Email" />
              <Button type="submit" disabled={createSsMutation.isPending || !(ssName || '').trim()}>
                {createSsMutation.isPending ? 'Adding...' : 'Add'}
              </Button>
            </div>
            <div>
              <Textarea value={ssAddress} onChange={(e) => setSsAddress(e.target.value)} placeholder="Address" />
            </div>
            {createSsMutation.error && (
              <p className="text-sm text-red-600">{createSsMutation.error?.response?.data?.detail || 'Failed to add'}</p>
            )}
          </form>

          {editingSs && (
            <div className="mt-5 border rounded-lg p-4">
              <div className="text-sm font-semibold text-gray-700 mb-3">Edit Supplier</div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <Input value={editingSs.supplier_name} onChange={(e) => setEditingSs((p) => ({ ...p, supplier_name: e.target.value }))} />
                <Input value={editingSs.phone} onChange={(e) => setEditingSs((p) => ({ ...p, phone: e.target.value }))} placeholder="Phone" />
                <Input value={editingSs.email} onChange={(e) => setEditingSs((p) => ({ ...p, email: e.target.value }))} placeholder="Email" />
                <div className="flex items-center justify-between gap-3">
                  <Checkbox checked={editingSs.is_active} onChange={(v) => setEditingSs((p) => ({ ...p, is_active: v }))} label="Active" />
                </div>
              </div>
              <div className="mt-3">
                <Textarea value={editingSs.address} onChange={(e) => setEditingSs((p) => ({ ...p, address: e.target.value }))} placeholder="Address" />
              </div>
              <div className="flex gap-2 mt-4">
                <Button type="button" variant="outline" onClick={cancelEditSs}>Cancel</Button>
                <Button type="button" onClick={saveEditSs} disabled={updateSsMutation.isPending}>Save</Button>
              </div>
              {updateSsMutation.error && (
                <p className="text-sm text-red-600 mt-2">{updateSsMutation.error?.response?.data?.detail || 'Failed to update'}</p>
              )}
            </div>
          )}

          <div className="mt-5 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Name</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Phone</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Email</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Address</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Status</th>
                  <th className="text-right py-2 px-2 text-xs font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(suppliers || []).map((row) => (
                  <tr key={row.supplier_id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-2 text-sm">{row.supplier_name}</td>
                    <td className="py-2 px-2 text-sm">{row.phone || '-'}</td>
                    <td className="py-2 px-2 text-sm">{row.email || '-'}</td>
                    <td className="py-2 px-2 text-sm">{row.address || '-'}</td>
                    <td className="py-2 px-2 text-sm">{row.is_active ? 'Active' : 'Inactive'}</td>
                    <td className="py-2 px-2 text-sm text-right">
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => startEditSs(row)}>Edit</Button>
                        <Button type="button" variant={row.is_active ? 'destructive' : 'default'} onClick={() => toggleSsActive(row)} disabled={updateSsMutation.isPending}>
                          {row.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!ssLoading && (suppliers || []).length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-5 px-2 text-center text-gray-500">No suppliers</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-6">
          <SectionHeader title="Sublet Work Types" subtitle="Maintain sublet work codes used in job orders." />

          <form onSubmit={onCreateSw} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Input value={swCode} readOnly className="bg-gray-50" placeholder="Auto Work Code" />
              <Input value={swDesc} onChange={(e) => setSwDesc(e.target.value)} placeholder="Description *" />
              <Input value={swUom} onChange={(e) => setSwUom(e.target.value)} placeholder="Unit of Measure" />
              <div className="flex items-center gap-3">
                <Checkbox checked={swTaxable} onChange={setSwTaxable} label="Taxable" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
              <Input value={swPrice} onChange={(e) => setSwPrice(e.target.value)} placeholder="Unit Price *" type="number" step="0.01" min="0" />
              <Input value={swCost} onChange={(e) => setSwCost(e.target.value)} placeholder="Unit Cost *" type="number" step="0.01" min="0" />
              <Input value={swJobType} onChange={(e) => setSwJobType(e.target.value)} placeholder="Job Type" />
              <Input value={swSection} onChange={(e) => setSwSection(e.target.value)} placeholder="Section" />
              <Input value={swSubCat} onChange={(e) => setSwSubCat(e.target.value)} placeholder="Sub Category" />
              <select
                value={swSupplierId}
                onChange={(e) => setSwSupplierId(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Supplier (optional)</option>
                {activeSuppliers.map((s) => (
                  <option key={s.supplier_id} value={String(s.supplier_id)}>
                    {s.supplier_name}
                  </option>
                ))}
              </select>
            </div>

            <Button
              type="submit"
              disabled={
                createSwMutation.isPending ||
                !(swDesc || '').trim() ||
                !Number.isFinite(Number(swPrice)) ||
                Number(swPrice) < 0 ||
                !Number.isFinite(Number(swCost)) ||
                Number(swCost) < 0
              }
            >
              {createSwMutation.isPending ? 'Adding...' : 'Add'}
            </Button>

            {createSwMutation.error && (
              <p className="text-sm text-red-600">{createSwMutation.error?.response?.data?.detail || 'Failed to add'}</p>
            )}
          </form>

          {editingSw && (
            <div className="mt-5 border rounded-lg p-4">
              <div className="text-sm font-semibold text-gray-700 mb-3">Edit Sublet Work Type</div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <Input value={editingSw.work_code} onChange={(e) => setEditingSw((p) => ({ ...p, work_code: e.target.value }))} />
                <Input value={editingSw.description} onChange={(e) => setEditingSw((p) => ({ ...p, description: e.target.value }))} />
                <Input value={editingSw.unit_of_measure} onChange={(e) => setEditingSw((p) => ({ ...p, unit_of_measure: e.target.value }))} placeholder="Unit of Measure" />
                <div className="flex items-center justify-between gap-3">
                  <Checkbox checked={editingSw.taxable} onChange={(v) => setEditingSw((p) => ({ ...p, taxable: v }))} label="Taxable" />
                  <Checkbox checked={editingSw.is_active} onChange={(v) => setEditingSw((p) => ({ ...p, is_active: v }))} label="Active" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mt-3">
                <Input value={editingSw.unit_price} onChange={(e) => setEditingSw((p) => ({ ...p, unit_price: e.target.value }))} type="number" step="0.01" min="0" />
                <Input value={editingSw.unit_cost} onChange={(e) => setEditingSw((p) => ({ ...p, unit_cost: e.target.value }))} type="number" step="0.01" min="0" />
                <Input value={editingSw.job_type} onChange={(e) => setEditingSw((p) => ({ ...p, job_type: e.target.value }))} placeholder="Job Type" />
                <Input value={editingSw.section} onChange={(e) => setEditingSw((p) => ({ ...p, section: e.target.value }))} placeholder="Section" />
                <Input value={editingSw.sub_category} onChange={(e) => setEditingSw((p) => ({ ...p, sub_category: e.target.value }))} placeholder="Sub Category" />
                <select
                  value={editingSw.supplier_id}
                  onChange={(e) => setEditingSw((p) => ({ ...p, supplier_id: e.target.value }))}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Supplier (optional)</option>
                  {suppliersForEditSw.map((s) => (
                    <option key={s.supplier_id} value={String(s.supplier_id)}>
                      {s.is_active ? s.supplier_name : `${s.supplier_name} (Inactive)`}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 mt-4">
                <Button type="button" variant="outline" onClick={cancelEditSw}>Cancel</Button>
                <Button type="button" onClick={saveEditSw} disabled={updateSwMutation.isPending}>Save</Button>
              </div>
              {updateSwMutation.error && (
                <p className="text-sm text-red-600 mt-2">{updateSwMutation.error?.response?.data?.detail || 'Failed to update'}</p>
              )}
            </div>
          )}

          <div className="mt-5 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Code</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Description</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Supplier</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Tax</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">UOM</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Price</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Cost</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Job Type</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Section</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Sub Cat</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Status</th>
                  <th className="text-right py-2 px-2 text-xs font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(workTypes || []).map((row) => (
                  <tr key={row.sublet_work_type_id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-2 text-sm font-mono">{row.work_code}</td>
                    <td className="py-2 px-2 text-sm">{row.description}</td>
                    <td className="py-2 px-2 text-sm">{row.supplier_id ? (supplierNameById.get(Number(row.supplier_id)) || `#${row.supplier_id}`) : '-'}</td>
                    <td className="py-2 px-2 text-sm">{row.taxable ? 'Yes' : 'No'}</td>
                    <td className="py-2 px-2 text-sm">{row.unit_of_measure || '-'}</td>
                    <td className="py-2 px-2 text-sm">ETB {Number(row.unit_price ?? 0).toFixed(2)}</td>
                    <td className="py-2 px-2 text-sm">ETB {Number(row.unit_cost ?? 0).toFixed(2)}</td>
                    <td className="py-2 px-2 text-sm">{row.job_type || '-'}</td>
                    <td className="py-2 px-2 text-sm">{row.section || '-'}</td>
                    <td className="py-2 px-2 text-sm">{row.sub_category || '-'}</td>
                    <td className="py-2 px-2 text-sm">{row.is_active ? 'Active' : 'Inactive'}</td>
                    <td className="py-2 px-2 text-sm text-right">
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => startEditSw(row)}>Edit</Button>
                        <Button type="button" variant={row.is_active ? 'destructive' : 'default'} onClick={() => toggleSwActive(row)} disabled={updateSwMutation.isPending}>
                          {row.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!swLoading && (workTypes || []).length === 0 && (
                  <tr>
                    <td colSpan={13} className="py-5 px-2 text-center text-gray-500">No work types</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}
