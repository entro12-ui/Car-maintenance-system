import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import {
  employeesApi,
  fuelLubricantsApi,
  jobOrderCustomerNotificationsApi,
  jobOrderAdditionalChargesApi,
  jobOrderInventoryApi,
  jobOrderLaborApi,
  miscChargeTypesApi,
  jobOrderNoticeTypesApi,
  jobOrdersApi,
  laborTypesApi,
  otherChargeTypesApi,
  partsApi,
  subletWorkSuppliersApi,
  subletWorkTypesApi,
} from '../services/api'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { Card } from '../components/ui/card'

export default function JobOrderDetail() {
  const { id } = useParams()
  const jobOrderId = Number(id)
  const queryClient = useQueryClient()

  const [dispatchSection, setDispatchSection] = useState('')
  const [receiveSection, setReceiveSection] = useState('')
  const [receiveLocation, setReceiveLocation] = useState('')
  const [blockReason, setBlockReason] = useState('')
  const [deliverToName, setDeliverToName] = useState('')
  const [deliverToPhone, setDeliverToPhone] = useState('')

  const [copyCustomerId, setCopyCustomerId] = useState('')
  const [copyTasks, setCopyTasks] = useState(true)
  const [splitCustomerId, setSplitCustomerId] = useState('')
  const [splitTaskIds, setSplitTaskIds] = useState([])
  const [pairOtherJobId, setPairOtherJobId] = useState('')

  const [qcRemarks, setQcRemarks] = useState('')
  const [qcItems, setQcItems] = useState([])
  const [newQcItemName, setNewQcItemName] = useState('')
  const [newQcItemResult, setNewQcItemResult] = useState('')
  const [newQcItemRemark, setNewQcItemRemark] = useState('')

  const [noticeDate, setNoticeDate] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [noticeType, setNoticeType] = useState('')
  const [remark, setRemark] = useState('')

  const [issueRemarks, setIssueRemarks] = useState('')
  const [issueAddPartId, setIssueAddPartId] = useState('')
  const [issueAddQty, setIssueAddQty] = useState('')

  const [returnAuthorityName, setReturnAuthorityName] = useState('')
  const [returnReason, setReturnReason] = useState('')
  const [returnIssueId, setReturnIssueId] = useState('')
  const [returnPartId, setReturnPartId] = useState('')
  const [returnQty, setReturnQty] = useState('')
  const [returnRemark, setReturnRemark] = useState('')
  const [returnItems, setReturnItems] = useState([])

  const [laborTypeId, setLaborTypeId] = useState('')
  const [laborHours, setLaborHours] = useState('')
  const [laborTechnicianId, setLaborTechnicianId] = useState('')
  const [laborChargeRemark, setLaborChargeRemark] = useState('')

  const [miscTypeId, setMiscTypeId] = useState('')
  const [miscRemark, setMiscRemark] = useState('')

  const [fuelItemId, setFuelItemId] = useState('')
  const [fuelQty, setFuelQty] = useState('')
  const [fuelRemark, setFuelRemark] = useState('')

  const [subletTypeId, setSubletTypeId] = useState('')
  const [subletQty, setSubletQty] = useState('')
  const [subletRemark, setSubletRemark] = useState('')

  const [otherChargeTypeId, setOtherChargeTypeId] = useState('')
  const [otherChargeQty, setOtherChargeQty] = useState('')
  const [otherChargeRemark, setOtherChargeRemark] = useState('')

  const { data: jobOrderData, isLoading: isJobOrderLoading, error: jobOrderError } = useQuery({
    queryKey: ['jobOrder', jobOrderId],
    queryFn: () => jobOrdersApi.getById(jobOrderId),
    enabled: Number.isFinite(jobOrderId) && jobOrderId > 0,
  })

  const { data: noticeTypesData } = useQuery({
    queryKey: ['jobOrderNoticeTypes', { active_only: true }],
    queryFn: () => jobOrderNoticeTypesApi.list({ active_only: true }),
  })

  const { data: laborTypesData } = useQuery({
    queryKey: ['laborTypes', { active_only: true }],
    queryFn: () => laborTypesApi.list({ active_only: true }),
  })

  const { data: miscChargeTypesData } = useQuery({
    queryKey: ['miscChargeTypes', { active_only: false }],
    queryFn: () => miscChargeTypesApi.list({ active_only: false }),
  })

  const { data: fuelItemsData } = useQuery({
    queryKey: ['fuelLubricants', { active_only: false }],
    queryFn: () => fuelLubricantsApi.list({ active_only: false }),
  })

  const { data: subletWorkTypesData } = useQuery({
    queryKey: ['subletWorkTypes', { active_only: false }],
    queryFn: () => subletWorkTypesApi.list({ active_only: false }),
  })

  const { data: subletSuppliersData } = useQuery({
    queryKey: ['subletWorkSuppliers', { active_only: false }],
    queryFn: () => subletWorkSuppliersApi.list({ active_only: false }),
  })

  const { data: otherChargeTypesData } = useQuery({
    queryKey: ['otherChargeTypes', { active_only: false }],
    queryFn: () => otherChargeTypesApi.list({ active_only: false }),
  })

  const { data: mechanicsData } = useQuery({
    queryKey: ['mechanics'],
    queryFn: () => employeesApi.getMechanics(),
  })

  const { data: employeesData } = useQuery({
    queryKey: ['employees', { active_only: true }],
    queryFn: () => employeesApi.list(),
  })

  const { data: qcData, isLoading: isQcLoading } = useQuery({
    queryKey: ['jobOrderQc', jobOrderId],
    queryFn: () => jobOrdersApi.getQc(jobOrderId),
    enabled: Number.isFinite(jobOrderId) && jobOrderId > 0,
  })

  const { data: pairingsData } = useQuery({
    queryKey: ['jobOrderPairings', jobOrderId],
    queryFn: () => jobOrdersApi.listPairings(jobOrderId),
    enabled: Number.isFinite(jobOrderId) && jobOrderId > 0,
  })

  const { data: entriesData, isLoading: isEntriesLoading } = useQuery({
    queryKey: ['jobOrderCustomerNotifications', jobOrderId],
    queryFn: () => jobOrderCustomerNotificationsApi.list(jobOrderId),
    enabled: Number.isFinite(jobOrderId) && jobOrderId > 0,
  })

  const { data: partsData } = useQuery({
    queryKey: ['parts'],
    queryFn: async () => {
      const response = await partsApi.getAll()
      return response.data
    },
  })

  const { data: issuesData, isLoading: isIssuesLoading } = useQuery({
    queryKey: ['jobOrderItemIssues', jobOrderId],
    queryFn: () => jobOrderInventoryApi.listIssues(jobOrderId),
    enabled: Number.isFinite(jobOrderId) && jobOrderId > 0,
  })

  const { data: laborChargesData, isLoading: isLaborChargesLoading } = useQuery({
    queryKey: ['jobOrderLaborCharges', jobOrderId],
    queryFn: () => jobOrderLaborApi.listCharges(jobOrderId),
    enabled: Number.isFinite(jobOrderId) && jobOrderId > 0,
  })

  const { data: miscChargesData } = useQuery({
    queryKey: ['jobOrderMiscCharges', jobOrderId],
    queryFn: () => jobOrderAdditionalChargesApi.listMisc(jobOrderId),
    enabled: Number.isFinite(jobOrderId) && jobOrderId > 0,
  })

  const { data: fuelChargesData } = useQuery({
    queryKey: ['jobOrderFuelCharges', jobOrderId],
    queryFn: () => jobOrderAdditionalChargesApi.listFuel(jobOrderId),
    enabled: Number.isFinite(jobOrderId) && jobOrderId > 0,
  })

  const { data: subletChargesData } = useQuery({
    queryKey: ['jobOrderSubletCharges', jobOrderId],
    queryFn: () => jobOrderAdditionalChargesApi.listSublet(jobOrderId),
    enabled: Number.isFinite(jobOrderId) && jobOrderId > 0,
  })

  const { data: otherChargesData } = useQuery({
    queryKey: ['jobOrderOtherCharges', jobOrderId],
    queryFn: () => jobOrderAdditionalChargesApi.listOther(jobOrderId),
    enabled: Number.isFinite(jobOrderId) && jobOrderId > 0,
  })

  const { data: returnRequestsData } = useQuery({
    queryKey: ['jobOrderReturnRequests', jobOrderId],
    queryFn: () => jobOrderInventoryApi.listReturnRequests(),
    enabled: Number.isFinite(jobOrderId) && jobOrderId > 0,
  })

  const jobOrder = jobOrderData?.data
  const noticeTypes = useMemo(() => noticeTypesData?.data || [], [noticeTypesData])
  const laborTypes = useMemo(() => laborTypesData?.data || [], [laborTypesData])
  const miscChargeTypes = useMemo(() => miscChargeTypesData?.data || [], [miscChargeTypesData])
  const fuelItems = useMemo(() => fuelItemsData?.data || [], [fuelItemsData])
  const subletWorkTypes = useMemo(() => subletWorkTypesData?.data || [], [subletWorkTypesData])
  const subletSuppliers = useMemo(() => subletSuppliersData?.data || [], [subletSuppliersData])
  const otherChargeTypes = useMemo(() => otherChargeTypesData?.data || [], [otherChargeTypesData])

  const miscChargeTypesActive = useMemo(() => (miscChargeTypes || []).filter((t) => t.is_active), [miscChargeTypes])
  const fuelItemsActive = useMemo(() => (fuelItems || []).filter((t) => t.is_active), [fuelItems])
  const subletWorkTypesActive = useMemo(() => (subletWorkTypes || []).filter((t) => t.is_active), [subletWorkTypes])
  const otherChargeTypesActive = useMemo(() => (otherChargeTypes || []).filter((t) => t.is_active), [otherChargeTypes])
  const mechanics = useMemo(() => mechanicsData?.data || [], [mechanicsData])
  const employees = useMemo(() => employeesData?.data || [], [employeesData])
  const entries = useMemo(() => entriesData?.data || [], [entriesData])
  const qcSheet = qcData?.data
  const pairings = useMemo(() => pairingsData?.data || [], [pairingsData])

  const employeeNameById = useMemo(() => {
    const map = new Map()
    for (const e of employees || []) {
      const name = `${e.first_name || ''} ${e.last_name || ''}`.trim()
      map.set(Number(e.employee_id), name || e.employee_code || String(e.employee_id))
    }
    return map
  }, [employees])

  const parts = useMemo(() => partsData || [], [partsData])
  const partsById = useMemo(() => {
    const map = new Map()
    for (const p of parts || []) {
      map.set(p.part_id, p)
    }
    return map
  }, [parts])

  const issues = useMemo(() => issuesData?.data || [], [issuesData])
  const returnRequests = useMemo(() => {
    const all = returnRequestsData?.data || []
    return (all || []).filter((r) => Number(r.job_order_id) === Number(jobOrderId))
  }, [returnRequestsData, jobOrderId])

  const finalizedIssues = useMemo(
    () => (issues || []).filter((i) => i.status === 'Finalized'),
    [issues]
  )

  const laborTypeNameById = useMemo(() => {
    const map = new Map()
    for (const lt of laborTypes || []) {
      map.set(Number(lt.labor_type_id), lt.labor_type_name)
    }
    return map
  }, [laborTypes])

  const mechanicNameById = useMemo(() => {
    const map = new Map()
    for (const m of mechanics || []) {
      map.set(Number(m.employee_id), m.name)
    }
    return map
  }, [mechanics])

  const laborCharges = useMemo(() => laborChargesData?.data || [], [laborChargesData])

  const miscCharges = useMemo(() => miscChargesData?.data || [], [miscChargesData])
  const fuelCharges = useMemo(() => fuelChargesData?.data || [], [fuelChargesData])
  const subletCharges = useMemo(() => subletChargesData?.data || [], [subletChargesData])
  const otherCharges = useMemo(() => otherChargesData?.data || [], [otherChargesData])

  const miscNameById = useMemo(() => {
    const map = new Map()
    for (const t of miscChargeTypes || []) map.set(Number(t.misc_charge_type_id), `${t.charge_code} - ${t.description}`)
    return map
  }, [miscChargeTypes])

  const fuelNameById = useMemo(() => {
    const map = new Map()
    for (const t of fuelItems || []) map.set(Number(t.fuel_lubricant_id), `${t.item_code} - ${t.description}`)
    return map
  }, [fuelItems])

  const fuelUomById = useMemo(() => {
    const map = new Map()
    for (const t of fuelItems || []) map.set(Number(t.fuel_lubricant_id), t.unit_of_measure || null)
    return map
  }, [fuelItems])

  const subletNameById = useMemo(() => {
    const map = new Map()
    for (const t of subletWorkTypes || []) map.set(Number(t.sublet_work_type_id), `${t.work_code} - ${t.description}`)
    return map
  }, [subletWorkTypes])

  const subletUomById = useMemo(() => {
    const map = new Map()
    for (const t of subletWorkTypes || []) map.set(Number(t.sublet_work_type_id), t.unit_of_measure || null)
    return map
  }, [subletWorkTypes])

  const subletSupplierNameByWorkTypeId = useMemo(() => {
    const supplierNameById = new Map()
    for (const s of subletSuppliers || []) supplierNameById.set(Number(s.supplier_id), s.supplier_name)

    const map = new Map()
    for (const t of subletWorkTypes || []) {
      const supplierId = t.supplier_id != null ? Number(t.supplier_id) : null
      map.set(
        Number(t.sublet_work_type_id),
        supplierId && supplierNameById.has(supplierId) ? supplierNameById.get(supplierId) : supplierId ? `#${supplierId}` : null
      )
    }
    return map
  }, [subletSuppliers, subletWorkTypes])

  const otherNameById = useMemo(() => {
    const map = new Map()
    for (const t of otherChargeTypes || []) map.set(Number(t.other_charge_type_id), `${t.charge_code} - ${t.description}`)
    return map
  }, [otherChargeTypes])

  const otherUomById = useMemo(() => {
    const map = new Map()
    for (const t of otherChargeTypes || []) map.set(Number(t.other_charge_type_id), t.unit_of_measure || null)
    return map
  }, [otherChargeTypes])

  useEffect(() => {
    if (!qcSheet) return
    setQcRemarks(qcSheet.remarks || '')
    const mapped = (qcSheet.items || []).map((it) => ({
      qc_item_id: it.qc_item_id,
      item_name: it.item_name,
      passed: it.passed === true ? 'pass' : it.passed === false ? 'fail' : '',
      remark: it.remark || '',
      sort_order: typeof it.sort_order === 'number' ? it.sort_order : 0,
      is_mandatory: it.is_mandatory !== false,
    }))
    setQcItems(mapped)
  }, [qcSheet?.qc_sheet_id])

  const createEntryMutation = useMutation({
    mutationFn: (payload) => jobOrderCustomerNotificationsApi.create(jobOrderId, payload),
    onSuccess: async () => {
      setNoticeDate('')
      setContactName('')
      setContactPhone('')
      setNoticeType('')
      setRemark('')
      await queryClient.invalidateQueries({ queryKey: ['jobOrderCustomerNotifications', jobOrderId] })
    },
  })

  const dispatchMutation = useMutation({
    mutationFn: (payload) => jobOrdersApi.dispatch(jobOrderId, payload),
    onSuccess: async () => {
      setDispatchSection('')
      await queryClient.invalidateQueries({ queryKey: ['jobOrder', jobOrderId] })
      await queryClient.invalidateQueries({ queryKey: ['jobOrders'] })
    },
  })

  const receiveMutation = useMutation({
    mutationFn: (payload) => jobOrdersApi.receive(jobOrderId, payload),
    onSuccess: async () => {
      setReceiveSection('')
      setReceiveLocation('')
      await queryClient.invalidateQueries({ queryKey: ['jobOrder', jobOrderId] })
      await queryClient.invalidateQueries({ queryKey: ['jobOrders'] })
    },
  })

  const blockMutation = useMutation({
    mutationFn: (payload) => jobOrdersApi.block(jobOrderId, payload),
    onSuccess: async () => {
      setBlockReason('')
      await queryClient.invalidateQueries({ queryKey: ['jobOrder', jobOrderId] })
      await queryClient.invalidateQueries({ queryKey: ['jobOrders'] })
    },
  })

  const releaseMutation = useMutation({
    mutationFn: () => jobOrdersApi.release(jobOrderId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['jobOrder', jobOrderId] })
      await queryClient.invalidateQueries({ queryKey: ['jobOrders'] })
    },
  })

  const deliverMutation = useMutation({
    mutationFn: (payload) => jobOrdersApi.deliver(jobOrderId, payload),
    onSuccess: async () => {
      setDeliverToName('')
      setDeliverToPhone('')
      await queryClient.invalidateQueries({ queryKey: ['jobOrder', jobOrderId] })
      await queryClient.invalidateQueries({ queryKey: ['jobOrders'] })
    },
  })

  const closeJobMutation = useMutation({
    mutationFn: () => jobOrdersApi.close(jobOrderId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['jobOrder', jobOrderId] })
      await queryClient.invalidateQueries({ queryKey: ['jobOrders'] })
    },
  })

  const reopenJobMutation = useMutation({
    mutationFn: () => jobOrdersApi.reopen(jobOrderId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['jobOrder', jobOrderId] })
      await queryClient.invalidateQueries({ queryKey: ['jobOrders'] })
    },
  })

  const cancelJobMutation = useMutation({
    mutationFn: () => jobOrdersApi.cancel(jobOrderId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['jobOrder', jobOrderId] })
      await queryClient.invalidateQueries({ queryKey: ['jobOrders'] })
    },
  })

  const copyJobMutation = useMutation({
    mutationFn: (payload) => jobOrdersApi.copy(jobOrderId, payload),
    onSuccess: async () => {
      setCopyCustomerId('')
      setCopyTasks(true)
      await queryClient.invalidateQueries({ queryKey: ['jobOrders'] })
    },
  })

  const splitJobMutation = useMutation({
    mutationFn: (payload) => jobOrdersApi.split(jobOrderId, payload),
    onSuccess: async () => {
      setSplitCustomerId('')
      setSplitTaskIds([])
      await queryClient.invalidateQueries({ queryKey: ['jobOrder', jobOrderId] })
      await queryClient.invalidateQueries({ queryKey: ['jobOrders'] })
    },
  })

  const pairJobMutation = useMutation({
    mutationFn: (payload) => jobOrdersApi.pair(payload),
    onSuccess: async () => {
      setPairOtherJobId('')
      await queryClient.invalidateQueries({ queryKey: ['jobOrderPairings', jobOrderId] })
    },
  })

  const unpairJobMutation = useMutation({
    mutationFn: (pairingId) => jobOrdersApi.unpair(pairingId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['jobOrderPairings', jobOrderId] })
    },
  })

  const vrvPrintMutation = useMutation({
    mutationFn: () => jobOrdersApi.vrvPrint(jobOrderId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['jobOrder', jobOrderId] })
    },
  })

  const updateQcMutation = useMutation({
    mutationFn: (payload) => jobOrdersApi.updateQc(jobOrderId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['jobOrderQc', jobOrderId] })
    },
  })

  const createIssueMutation = useMutation({
    mutationFn: (payload) => jobOrderInventoryApi.createIssue(jobOrderId, payload),
    onSuccess: async () => {
      setIssueRemarks('')
      await queryClient.invalidateQueries({ queryKey: ['jobOrderItemIssues', jobOrderId] })
    },
  })

  const addIssueLineMutation = useMutation({
    mutationFn: ({ issueId, payload }) => jobOrderInventoryApi.addIssueLine(issueId, payload),
    onSuccess: async () => {
      setIssueAddPartId('')
      setIssueAddQty('')
      await queryClient.invalidateQueries({ queryKey: ['jobOrderItemIssues', jobOrderId] })
    },
  })

  const finalizeIssueMutation = useMutation({
    mutationFn: (issueId) => jobOrderInventoryApi.finalizeIssue(issueId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['jobOrderItemIssues', jobOrderId] })
      await queryClient.invalidateQueries({ queryKey: ['parts'] })
    },
  })

  const cancelIssueMutation = useMutation({
    mutationFn: (issueId) => jobOrderInventoryApi.cancelIssue(issueId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['jobOrderItemIssues', jobOrderId] })
    },
  })

  const createReturnRequestMutation = useMutation({
    mutationFn: ({ issueId, payload }) => jobOrderInventoryApi.createReturnRequest(issueId, payload),
    onSuccess: async () => {
      setReturnAuthorityName('')
      setReturnReason('')
      setReturnIssueId('')
      setReturnPartId('')
      setReturnQty('')
      setReturnRemark('')
      setReturnItems([])
      await queryClient.invalidateQueries({ queryKey: ['jobOrderReturnRequests', jobOrderId] })
    },
  })

  const approveReturnRequestMutation = useMutation({
    mutationFn: (returnRequestId) => jobOrderInventoryApi.approveReturnRequest(returnRequestId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['jobOrderReturnRequests', jobOrderId] })
      await queryClient.invalidateQueries({ queryKey: ['parts'] })
    },
  })

  const rejectReturnRequestMutation = useMutation({
    mutationFn: (returnRequestId) => jobOrderInventoryApi.rejectReturnRequest(returnRequestId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['jobOrderReturnRequests', jobOrderId] })
    },
  })

  const createLaborChargeMutation = useMutation({
    mutationFn: (payload) => jobOrderLaborApi.createCharge(jobOrderId, payload),
    onSuccess: async () => {
      setLaborTypeId('')
      setLaborHours('')
      setLaborTechnicianId('')
      setLaborChargeRemark('')
      await queryClient.invalidateQueries({ queryKey: ['jobOrderLaborCharges', jobOrderId] })
    },
  })

  const deleteLaborChargeMutation = useMutation({
    mutationFn: (laborChargeId) => jobOrderLaborApi.deleteCharge(jobOrderId, laborChargeId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['jobOrderLaborCharges', jobOrderId] })
    },
  })

  const createMiscChargeMutation = useMutation({
    mutationFn: (payload) => jobOrderAdditionalChargesApi.createMisc(jobOrderId, payload),
    onSuccess: async () => {
      setMiscTypeId('')
      setMiscRemark('')
      await queryClient.invalidateQueries({ queryKey: ['jobOrderMiscCharges', jobOrderId] })
    },
  })

  const deleteMiscChargeMutation = useMutation({
    mutationFn: (entryId) => jobOrderAdditionalChargesApi.deleteMisc(jobOrderId, entryId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['jobOrderMiscCharges', jobOrderId] })
    },
  })

  const createFuelChargeMutation = useMutation({
    mutationFn: (payload) => jobOrderAdditionalChargesApi.createFuel(jobOrderId, payload),
    onSuccess: async () => {
      setFuelItemId('')
      setFuelQty('')
      setFuelRemark('')
      await queryClient.invalidateQueries({ queryKey: ['jobOrderFuelCharges', jobOrderId] })
    },
  })

  const deleteFuelChargeMutation = useMutation({
    mutationFn: (entryId) => jobOrderAdditionalChargesApi.deleteFuel(jobOrderId, entryId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['jobOrderFuelCharges', jobOrderId] })
    },
  })

  const createSubletChargeMutation = useMutation({
    mutationFn: (payload) => jobOrderAdditionalChargesApi.createSublet(jobOrderId, payload),
    onSuccess: async () => {
      setSubletTypeId('')
      setSubletQty('')
      setSubletRemark('')
      await queryClient.invalidateQueries({ queryKey: ['jobOrderSubletCharges', jobOrderId] })
    },
  })

  const deleteSubletChargeMutation = useMutation({
    mutationFn: (entryId) => jobOrderAdditionalChargesApi.deleteSublet(jobOrderId, entryId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['jobOrderSubletCharges', jobOrderId] })
    },
  })

  const createOtherChargeMutation = useMutation({
    mutationFn: (payload) => jobOrderAdditionalChargesApi.createOther(jobOrderId, payload),
    onSuccess: async () => {
      setOtherChargeTypeId('')
      setOtherChargeQty('')
      setOtherChargeRemark('')
      await queryClient.invalidateQueries({ queryKey: ['jobOrderOtherCharges', jobOrderId] })
    },
  })

  const deleteOtherChargeMutation = useMutation({
    mutationFn: (entryId) => jobOrderAdditionalChargesApi.deleteOther(jobOrderId, entryId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['jobOrderOtherCharges', jobOrderId] })
    },
  })

  const canSubmit = (noticeDate || '').trim() && (noticeType || '').trim()

  const canSubmitLabor =
    Number.isFinite(Number(laborTypeId)) && Number(laborTypeId) > 0 && Number.isFinite(Number(laborHours)) && Number(laborHours) > 0

  const canSubmitMisc = Number.isFinite(Number(miscTypeId)) && Number(miscTypeId) > 0
  const canSubmitFuel = Number.isFinite(Number(fuelItemId)) && Number(fuelItemId) > 0 && Number.isFinite(Number(fuelQty)) && Number(fuelQty) > 0
  const canSubmitSublet =
    Number.isFinite(Number(subletTypeId)) && Number(subletTypeId) > 0 && Number.isFinite(Number(subletQty)) && Number(subletQty) > 0
  const canSubmitOther =
    Number.isFinite(Number(otherChargeTypeId)) && Number(otherChargeTypeId) > 0 && Number.isFinite(Number(otherChargeQty)) && Number(otherChargeQty) > 0

  const onSubmit = (e) => {
    e.preventDefault()
    if (!canSubmit) return

    createEntryMutation.mutate({
      notice_date: noticeDate,
      contact_name: (contactName || '').trim() || null,
      contact_phone: (contactPhone || '').trim() || null,
      notice_type: (noticeType || '').trim(),
      remark: (remark || '').trim() || null,
    })
  }

  const onAddLaborCharge = (e) => {
    e.preventDefault()
    if (!canSubmitLabor) return

    const technicianId = Number(laborTechnicianId)

    createLaborChargeMutation.mutate({
      labor_type_id: Number(laborTypeId),
      hours_worked: Number(laborHours),
      technician_employee_id: Number.isFinite(technicianId) && technicianId > 0 ? technicianId : null,
      remark: (laborChargeRemark || '').trim() || null,
    })
  }

  const onAddMiscCharge = (e) => {
    e.preventDefault()
    if (!canSubmitMisc) return
    createMiscChargeMutation.mutate({
      misc_charge_type_id: Number(miscTypeId),
      remark: (miscRemark || '').trim() || null,
    })
  }

  const onAddFuelCharge = (e) => {
    e.preventDefault()
    if (!canSubmitFuel) return
    createFuelChargeMutation.mutate({
      fuel_lubricant_id: Number(fuelItemId),
      quantity: Number(fuelQty),
      remark: (fuelRemark || '').trim() || null,
    })
  }

  const onAddSubletCharge = (e) => {
    e.preventDefault()
    if (!canSubmitSublet) return
    createSubletChargeMutation.mutate({
      sublet_work_type_id: Number(subletTypeId),
      quantity: Number(subletQty),
      remark: (subletRemark || '').trim() || null,
    })
  }

  const onAddOtherCharge = (e) => {
    e.preventDefault()
    if (!canSubmitOther) return
    createOtherChargeMutation.mutate({
      other_charge_type_id: Number(otherChargeTypeId),
      quantity: Number(otherChargeQty),
      remark: (otherChargeRemark || '').trim() || null,
    })
  }

  const onDispatch = (e) => {
    e.preventDefault()
    const section = (dispatchSection || '').trim()
    if (!section) return
    dispatchMutation.mutate({ dispatched_section: section })
  }

  const onReceive = (e) => {
    e.preventDefault()
    const section = (receiveSection || '').trim()
    if (!section) return
    receiveMutation.mutate({
      received_section: section,
      received_vehicle_location: (receiveLocation || '').trim() || null,
    })
  }

  const onBlock = (e) => {
    e.preventDefault()
    blockMutation.mutate({ blocked_reason: (blockReason || '').trim() || null })
  }

  const onDeliver = (e) => {
    e.preventDefault()
    deliverMutation.mutate({
      delivered_to_name: (deliverToName || '').trim() || null,
      delivered_to_phone: (deliverToPhone || '').trim() || null,
    })
  }

  const onCopyJob = (e) => {
    e.preventDefault()
    const custId = (copyCustomerId || '').trim()
    copyJobMutation.mutate({
      customer_id: custId ? Number(custId) : null,
      copy_tasks: !!copyTasks,
    })
  }

  const toggleSplitTask = (taskId) => {
    const idNum = Number(taskId)
    if (!Number.isFinite(idNum)) return
    setSplitTaskIds((prev) => (prev.includes(idNum) ? prev.filter((x) => x !== idNum) : [...prev, idNum]))
  }

  const onSplitJob = (e) => {
    e.preventDefault()
    const custId = (splitCustomerId || '').trim()
    splitJobMutation.mutate({
      customer_id: custId ? Number(custId) : null,
      task_ids: splitTaskIds,
    })
  }

  const onPairJobs = (e) => {
    e.preventDefault()
    const otherId = Number((pairOtherJobId || '').trim())
    if (!Number.isFinite(otherId) || otherId <= 0) return
    pairJobMutation.mutate({ job_order_id_1: jobOrderId, job_order_id_2: otherId })
  }

  const mapPassed = (value) => {
    if (value === 'pass') return true
    if (value === 'fail') return false
    return null
  }

  const onSaveQc = (e) => {
    e.preventDefault()
    updateQcMutation.mutate({
      remarks: (qcRemarks || '').trim() || null,
      items: (qcItems || []).map((it) => ({
        item_name: it.item_name,
        passed: mapPassed(it.passed),
        remark: (it.remark || '').trim() || null,
        sort_order: Number.isFinite(Number(it.sort_order)) ? Number(it.sort_order) : 0,
        is_mandatory: it.is_mandatory !== false,
      })),
    })
  }

  const addQcItem = () => {
    const name = (newQcItemName || '').trim()
    if (!name) return
    setQcItems((prev) => [
      ...prev,
      {
        qc_item_id: `new-${Date.now()}`,
        item_name: name,
        passed: newQcItemResult,
        remark: newQcItemRemark,
        sort_order: prev.length,
        is_mandatory: true,
      },
    ])
    setNewQcItemName('')
    setNewQcItemResult('')
    setNewQcItemRemark('')
  }

  const onCreateIssue = (e) => {
    e.preventDefault()
    createIssueMutation.mutate({ remarks: (issueRemarks || '').trim() || null })
  }

  const onAddLineToIssue = (issueId) => {
    const partId = Number(issueAddPartId)
    const qty = Number(issueAddQty)
    if (!Number.isFinite(partId) || partId <= 0) return
    if (!Number.isFinite(qty) || qty <= 0) return
    addIssueLineMutation.mutate({ issueId, payload: { part_id: partId, quantity: qty } })
  }

  const addReturnItem = () => {
    const issueId = Number(returnIssueId)
    const partId = Number(returnPartId)
    const qty = Number(returnQty)
    if (!Number.isFinite(issueId) || issueId <= 0) return
    if (!Number.isFinite(partId) || partId <= 0) return
    if (!Number.isFinite(qty) || qty <= 0) return

    setReturnItems((prev) => {
      const next = [...prev]
      const existing = next.find((x) => Number(x.part_id) === partId)
      if (existing) {
        existing.quantity = Number(existing.quantity) + qty
        existing.remark = (returnRemark || '').trim() || existing.remark || null
      } else {
        next.push({
          part_id: partId,
          quantity: qty,
          remark: (returnRemark || '').trim() || null,
        })
      }
      return next
    })

    setReturnPartId('')
    setReturnQty('')
    setReturnRemark('')
  }

  const removeReturnItem = (partId) => {
    setReturnItems((prev) => prev.filter((x) => Number(x.part_id) !== Number(partId)))
  }

  const onSubmitReturnRequest = (e) => {
    e.preventDefault()
    const issueId = Number(returnIssueId)
    if (!Number.isFinite(issueId) || issueId <= 0) return
    if (!returnItems.length) return
    createReturnRequestMutation.mutate({
      issueId,
      payload: {
        authority_name: (returnAuthorityName || '').trim() || null,
        reason: (returnReason || '').trim() || null,
        items: returnItems,
      },
    })
  }

  if (isJobOrderLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>
  }

  if (jobOrderError || !jobOrder) {
    return <div className="text-red-600">Job order not found</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{jobOrder.job_order_number}</h1>
          <p className="text-gray-500 text-sm">Job Order #{jobOrder.job_order_id}</p>
        </div>
        <Link to="/job-orders" className="text-primary hover:underline font-medium">
          Back to Job Orders
        </Link>
      </div>

      <Card className="p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Status</span>
            <span className="font-medium">{jobOrder.status}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Invoice</span>
            <span className="font-medium">{jobOrder.invoice_type || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Vehicle</span>
            <span className="font-medium">#{jobOrder.vehicle_id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Customer</span>
            <span className="font-medium">{jobOrder.customer_id ? `#${jobOrder.customer_id}` : '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Opened</span>
            <span className="font-medium">{jobOrder.opened_date || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Blocked</span>
            <span className="font-medium">{jobOrder.is_blocked ? 'Yes' : 'No'}</span>
          </div>
        </div>

        {jobOrder.remarks && (
          <div className="mt-4">
            <div className="text-gray-600 text-sm mb-1">Remarks</div>
            <div className="text-sm font-medium whitespace-pre-wrap">{jobOrder.remarks}</div>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Workflow</h2>

          <form onSubmit={onDispatch} className="space-y-3 mb-4">
            <div className="text-sm font-semibold text-gray-700">Dispatch</div>
            <Input value={dispatchSection} onChange={(e) => setDispatchSection(e.target.value)} placeholder="Dispatched section" />
            <Button type="submit" disabled={dispatchMutation.isPending || !(dispatchSection || '').trim()}>
              {dispatchMutation.isPending ? 'Dispatching...' : 'Dispatch'}
            </Button>
            {dispatchMutation.error && (
              <p className="text-sm text-red-600">{dispatchMutation.error?.response?.data?.detail || 'Dispatch failed'}</p>
            )}
          </form>

          <form onSubmit={onReceive} className="space-y-3 mb-4">
            <div className="text-sm font-semibold text-gray-700">Receive</div>
            <Input value={receiveSection} onChange={(e) => setReceiveSection(e.target.value)} placeholder="Received section" />
            <Input value={receiveLocation} onChange={(e) => setReceiveLocation(e.target.value)} placeholder="Vehicle location (optional)" />
            <Button type="submit" disabled={receiveMutation.isPending || !(receiveSection || '').trim()}>
              {receiveMutation.isPending ? 'Receiving...' : 'Receive'}
            </Button>
            {receiveMutation.error && (
              <p className="text-sm text-red-600">{receiveMutation.error?.response?.data?.detail || 'Receive failed'}</p>
            )}
          </form>

          <div className="space-y-3">
            <div className="text-sm font-semibold text-gray-700">Block / Release</div>
            <form onSubmit={onBlock} className="space-y-3">
              <Input value={blockReason} onChange={(e) => setBlockReason(e.target.value)} placeholder="Block reason (optional)" />
              <div className="flex gap-2">
                <Button type="submit" variant="destructive" disabled={blockMutation.isPending}>
                  {blockMutation.isPending ? 'Blocking...' : 'Block'}
                </Button>
                <Button type="button" variant="outline" onClick={() => releaseMutation.mutate()} disabled={releaseMutation.isPending}>
                  {releaseMutation.isPending ? 'Releasing...' : 'Release'}
                </Button>
              </div>
              {(blockMutation.error || releaseMutation.error) && (
                <p className="text-sm text-red-600">
                  {(blockMutation.error?.response?.data?.detail || releaseMutation.error?.response?.data?.detail) || 'Block/Release failed'}
                </p>
              )}
            </form>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">QC / Delivery</h2>

          <div className="mb-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-700">QC</div>
              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                {isQcLoading ? 'Loading...' : (qcSheet?.overall_status || '-')}
              </span>
            </div>

            <form onSubmit={onSaveQc} className="space-y-3 mt-3">
              <Textarea value={qcRemarks} onChange={(e) => setQcRemarks(e.target.value)} placeholder="QC remarks" />

              <div className="space-y-2">
                {(qcItems || []).map((it, idx) => (
                  <div key={it.qc_item_id} className="grid grid-cols-1 md:grid-cols-5 gap-2">
                    <Input
                      className="md:col-span-2"
                      value={it.item_name}
                      onChange={(e) =>
                        setQcItems((prev) => prev.map((p, i) => (i === idx ? { ...p, item_name: e.target.value } : p)))
                      }
                      placeholder="Item name"
                    />
                    <select
                      value={it.passed}
                      onChange={(e) =>
                        setQcItems((prev) => prev.map((p, i) => (i === idx ? { ...p, passed: e.target.value } : p)))
                      }
                      className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Pending</option>
                      <option value="pass">Pass</option>
                      <option value="fail">Fail</option>
                    </select>
                    <Input
                      value={it.remark}
                      onChange={(e) =>
                        setQcItems((prev) => prev.map((p, i) => (i === idx ? { ...p, remark: e.target.value } : p)))
                      }
                      placeholder="Remark"
                    />
                    <Input
                      value={String(it.sort_order ?? 0)}
                      onChange={(e) =>
                        setQcItems((prev) => prev.map((p, i) => (i === idx ? { ...p, sort_order: e.target.value } : p)))
                      }
                      placeholder="Sort"
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-2 pt-2 border-t">
                <Input
                  className="md:col-span-2"
                  value={newQcItemName}
                  onChange={(e) => setNewQcItemName(e.target.value)}
                  placeholder="New item name"
                />
                <select
                  value={newQcItemResult}
                  onChange={(e) => setNewQcItemResult(e.target.value)}
                  className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Pending</option>
                  <option value="pass">Pass</option>
                  <option value="fail">Fail</option>
                </select>
                <Input
                  value={newQcItemRemark}
                  onChange={(e) => setNewQcItemRemark(e.target.value)}
                  placeholder="Remark"
                />
                <Button type="button" variant="outline" onClick={addQcItem} disabled={!(newQcItemName || '').trim()}>
                  Add
                </Button>
              </div>

              <Button type="submit" disabled={updateQcMutation.isPending}>
                {updateQcMutation.isPending ? 'Saving QC...' : 'Save QC'}
              </Button>

              {updateQcMutation.error && (
                <p className="text-sm text-red-600">{updateQcMutation.error?.response?.data?.detail || 'QC save failed'}</p>
              )}
            </form>
          </div>

          <form onSubmit={onDeliver} className="space-y-3">
            <div className="text-sm font-semibold text-gray-700">Deliver</div>
            <Input value={deliverToName} onChange={(e) => setDeliverToName(e.target.value)} placeholder="Delivered to (name)" />
            <Input value={deliverToPhone} onChange={(e) => setDeliverToPhone(e.target.value)} placeholder="Delivered to (phone)" />
            <Button type="submit" disabled={deliverMutation.isPending}>
              {deliverMutation.isPending ? 'Delivering...' : 'Deliver'}
            </Button>
            {deliverMutation.error && (
              <p className="text-sm text-red-600">{deliverMutation.error?.response?.data?.detail || 'Delivery failed'}</p>
            )}

            <div className="pt-3 border-t">
              <div className="text-sm font-semibold text-gray-700 mb-2">VRV</div>
              <div className="text-sm text-gray-700">
                VRV No: <span className="font-mono">{jobOrder.vrv_number || '-'}</span>
              </div>
              <div className="text-sm text-gray-700 mb-3">
                Printed: <span className="font-medium">{jobOrder.vrv_printed_at ? 'Yes' : 'No'}</span>
              </div>
              <Button type="button" variant="outline" onClick={() => vrvPrintMutation.mutate()} disabled={vrvPrintMutation.isPending}>
                {vrvPrintMutation.isPending ? 'Marking...' : 'Mark VRV Printed'}
              </Button>
              {vrvPrintMutation.error && (
                <p className="text-sm text-red-600 mt-2">{vrvPrintMutation.error?.response?.data?.detail || 'VRV print failed'}</p>
              )}
            </div>
          </form>
        </Card>
      </div>

      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Utilities</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="text-sm font-semibold text-gray-700">Close / Reopen / Cancel</div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={() => closeJobMutation.mutate()} disabled={closeJobMutation.isPending}>
                {closeJobMutation.isPending ? 'Closing...' : 'Close Job Order'}
              </Button>
              <Button type="button" variant="outline" onClick={() => reopenJobMutation.mutate()} disabled={reopenJobMutation.isPending}>
                {reopenJobMutation.isPending ? 'Reopening...' : 'Reopen Job Order'}
              </Button>
              <Button type="button" variant="destructive" onClick={() => cancelJobMutation.mutate()} disabled={cancelJobMutation.isPending}>
                {cancelJobMutation.isPending ? 'Cancelling...' : 'Cancel Job Order'}
              </Button>
            </div>
            {(closeJobMutation.error || reopenJobMutation.error || cancelJobMutation.error) && (
              <p className="text-sm text-red-600">
                {(closeJobMutation.error?.response?.data?.detail ||
                  reopenJobMutation.error?.response?.data?.detail ||
                  cancelJobMutation.error?.response?.data?.detail) ||
                  'Action failed'}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <div className="text-sm font-semibold text-gray-700">Copy Invoiced Job Order</div>
            <form onSubmit={onCopyJob} className="space-y-2">
              <Input value={copyCustomerId} onChange={(e) => setCopyCustomerId(e.target.value)} placeholder="Customer ID (optional)" />
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={copyTasks} onChange={(e) => setCopyTasks(e.target.checked)} />
                Copy tasks
              </label>
              <Button type="submit" variant="outline" disabled={copyJobMutation.isPending}>
                {copyJobMutation.isPending ? 'Copying...' : 'Copy Job'}
              </Button>
              {copyJobMutation.isSuccess && copyJobMutation.data?.data?.job_order_id && (
                <div className="text-sm text-gray-700">
                  Created job #{copyJobMutation.data.data.job_order_id}:{' '}
                  <Link className="text-primary hover:underline" to={`/job-orders/${copyJobMutation.data.data.job_order_id}`}>
                    Open
                  </Link>
                </div>
              )}
              {copyJobMutation.error && (
                <p className="text-sm text-red-600">{copyJobMutation.error?.response?.data?.detail || 'Copy failed'}</p>
              )}
            </form>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-semibold text-gray-700">Split Job Order</div>
            <form onSubmit={onSplitJob} className="space-y-2">
              <Input value={splitCustomerId} onChange={(e) => setSplitCustomerId(e.target.value)} placeholder="New Job Customer ID (optional)" />
              <div className="border rounded-md p-3 max-h-48 overflow-auto">
                {(jobOrder.tasks || []).length === 0 ? (
                  <div className="text-sm text-gray-500">No tasks available to split.</div>
                ) : (
                  <div className="space-y-2">
                    {(jobOrder.tasks || []).map((t) => (
                      <label key={t.task_id} className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={splitTaskIds.includes(Number(t.task_id))}
                          onChange={() => toggleSplitTask(t.task_id)}
                        />
                        <span className="font-mono text-xs">#{t.task_id}</span>
                        <span className="truncate">{t.task_name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <Button type="submit" variant="outline" disabled={splitJobMutation.isPending || splitTaskIds.length === 0}>
                {splitJobMutation.isPending ? 'Splitting...' : 'Split to New Job'}
              </Button>
              {splitJobMutation.error && (
                <p className="text-sm text-red-600">{splitJobMutation.error?.response?.data?.detail || 'Split failed'}</p>
              )}
              {splitJobMutation.isSuccess && splitJobMutation.data?.data?.new_job_order?.job_order_id && (
                <div className="text-sm text-gray-700">
                  New job #{splitJobMutation.data.data.new_job_order.job_order_id}:{' '}
                  <Link
                    className="text-primary hover:underline"
                    to={`/job-orders/${splitJobMutation.data.data.new_job_order.job_order_id}`}
                  >
                    Open
                  </Link>
                </div>
              )}
            </form>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-semibold text-gray-700">Pairing Job Orders</div>
            <form onSubmit={onPairJobs} className="space-y-2">
              <Input value={pairOtherJobId} onChange={(e) => setPairOtherJobId(e.target.value)} placeholder="Other Job Order ID" />
              <Button type="submit" variant="outline" disabled={pairJobMutation.isPending || !(pairOtherJobId || '').trim()}>
                {pairJobMutation.isPending ? 'Pairing...' : 'Pair'}
              </Button>
              {pairJobMutation.error && (
                <p className="text-sm text-red-600">{pairJobMutation.error?.response?.data?.detail || 'Pair failed'}</p>
              )}
            </form>

            <div className="pt-2 border-t">
              <div className="text-sm font-semibold text-gray-700 mb-2">Current Pairings</div>
              {pairings.length === 0 ? (
                <div className="text-sm text-gray-500">No active pairings.</div>
              ) : (
                <div className="space-y-2">
                  {pairings.map((p) => {
                    const otherId = Number(p.job_order_id_a) === jobOrderId ? p.job_order_id_b : p.job_order_id_a
                    return (
                      <div key={p.pairing_id} className="flex items-center justify-between gap-2 text-sm">
                        <div className="text-gray-700">
                          Pairing <span className="font-mono">#{p.pairing_id}</span> with Job <span className="font-mono">#{otherId}</span>
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => unpairJobMutation.mutate(p.pairing_id)}
                          disabled={unpairJobMutation.isPending}
                        >
                          {unpairJobMutation.isPending ? 'Unpairing...' : 'Unpair'}
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}
              {unpairJobMutation.error && (
                <p className="text-sm text-red-600 mt-2">{unpairJobMutation.error?.response?.data?.detail || 'Unpair failed'}</p>
              )}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Add Customer Notification</h2>
          <form onSubmit={onSubmit} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-600">Notice Date *</label>
                <Input type="date" value={noticeDate} onChange={(e) => setNoticeDate(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-gray-600">Notice Type *</label>
                <select
                  value={noticeType}
                  onChange={(e) => setNoticeType(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select notice type</option>
                  {noticeTypes.map((t) => (
                    <option key={t.notice_type_id} value={t.notice_type_name}>
                      {t.notice_type_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-600">Contact Name</label>
                <Input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Name" />
              </div>
              <div>
                <label className="text-xs text-gray-600">Contact Phone</label>
                <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="Phone" />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-600">Remark</label>
              <Textarea value={remark} onChange={(e) => setRemark(e.target.value)} placeholder="Remark" />
            </div>

            <Button type="submit" disabled={createEntryMutation.isPending || !canSubmit}>
              {createEntryMutation.isPending ? 'Saving...' : 'Save Notification'}
            </Button>

            {createEntryMutation.error && (
              <p className="text-sm text-red-600">{createEntryMutation.error?.response?.data?.detail || 'Failed to save notification'}</p>
            )}
          </form>

          {noticeTypes.length === 0 && (
            <p className="text-xs text-gray-500 mt-3">
              No active notice types. Add them in Job Order Notice Types.
            </p>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Customer Notifications</h2>
          {isEntriesLoading ? (
            <div className="flex justify-center items-center h-32">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Date</th>
                    <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Type</th>
                    <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Contact</th>
                    <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Remark</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e) => (
                    <tr key={e.notification_entry_id} className="border-b border-gray-100">
                      <td className="py-2 px-2 text-sm">{e.notice_date}</td>
                      <td className="py-2 px-2 text-sm">{e.notice_type}</td>
                      <td className="py-2 px-2 text-sm">
                        {(e.contact_name || e.contact_phone) ? (
                          <div>
                            <div className="font-medium">{e.contact_name || '-'}</div>
                            <div className="text-xs text-gray-500">{e.contact_phone || '-'}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-2 px-2 text-sm whitespace-pre-wrap">{e.remark || '-'}</td>
                    </tr>
                  ))}
                  {entries.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-6 px-2 text-center text-gray-500">
                        No notifications
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <Card className="p-6 mt-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Labor Charges</h2>

        <form onSubmit={onAddLaborCharge} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-gray-600">Labor Type *</label>
              <select
                value={laborTypeId}
                onChange={(e) => setLaborTypeId(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select labor type</option>
                {laborTypes.map((t) => (
                  <option key={t.labor_type_id} value={String(t.labor_type_id)}>
                    {t.labor_type_name} (ETB {Number(t.hourly_rate ?? 0).toFixed(2)}/hr)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-600">Hours Worked *</label>
              <Input
                value={laborHours}
                onChange={(e) => setLaborHours(e.target.value)}
                placeholder="Hours"
                type="number"
                step="0.01"
                min="0"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600">Technician</label>
              <select
                value={laborTechnicianId}
                onChange={(e) => setLaborTechnicianId(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">(none)</option>
                {mechanics.map((m) => (
                  <option key={m.employee_id} value={String(m.employee_id)}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={createLaborChargeMutation.isPending || !canSubmitLabor}>
                {createLaborChargeMutation.isPending ? 'Adding...' : 'Add Charge'}
              </Button>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-600">Remark</label>
            <Textarea value={laborChargeRemark} onChange={(e) => setLaborChargeRemark(e.target.value)} placeholder="Remark" />
          </div>

          {createLaborChargeMutation.error && (
            <p className="text-sm text-red-600">
              {createLaborChargeMutation.error?.response?.data?.detail || 'Failed to add labor charge'}
            </p>
          )}
        </form>

        <div className="mt-5 overflow-x-auto">
          {isLaborChargesLoading ? (
            <div className="flex justify-center items-center h-24">Loading...</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Time</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Type</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Tech</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Hours</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Rate</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Amount</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Remark</th>
                  <th className="text-right py-2 px-2 text-xs font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {(laborCharges || []).map((c) => {
                  const typeName = laborTypeNameById.get(Number(c.labor_type_id)) || `#${c.labor_type_id}`
                  const techName =
                    c.technician_employee_id != null
                      ? mechanicNameById.get(Number(c.technician_employee_id)) || `#${c.technician_employee_id}`
                      : '-'

                  return (
                    <tr key={c.labor_charge_id} className="border-b border-gray-100">
                      <td className="py-2 px-2 text-sm">
                        {c.created_at ? new Date(c.created_at).toLocaleString() : '-'}
                      </td>
                      <td className="py-2 px-2 text-sm">{typeName}</td>
                      <td className="py-2 px-2 text-sm">{techName}</td>
                      <td className="py-2 px-2 text-sm">{Number(c.hours_worked ?? 0).toFixed(2)}</td>
                      <td className="py-2 px-2 text-sm">ETB {Number(c.hourly_rate ?? 0).toFixed(2)}</td>
                      <td className="py-2 px-2 text-sm">ETB {Number(c.amount ?? 0).toFixed(2)}</td>
                      <td className="py-2 px-2 text-sm whitespace-pre-wrap">{c.remark || '-'}</td>
                      <td className="py-2 px-2 text-sm text-right">
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={() => deleteLaborChargeMutation.mutate(c.labor_charge_id)}
                          disabled={deleteLaborChargeMutation.isPending}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  )
                })}
                {(laborCharges || []).length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-6 px-2 text-center text-gray-500">
                      No labor charges
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {deleteLaborChargeMutation.error && (
            <p className="text-sm text-red-600 mt-2">
              {deleteLaborChargeMutation.error?.response?.data?.detail || 'Failed to delete labor charge'}
            </p>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Misc Charges</h2>
          <form onSubmit={onAddMiscCharge} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="text-xs text-gray-600">Charge Type *</label>
                <select
                  value={miscTypeId}
                  onChange={(e) => setMiscTypeId(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select type</option>
                  {miscChargeTypesActive.map((t) => (
                    <option key={t.misc_charge_type_id} value={String(t.misc_charge_type_id)}>
                      {t.charge_code} - {t.description} (ETB {Number(t.unit_price ?? 0).toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <Button type="submit" disabled={createMiscChargeMutation.isPending || !canSubmitMisc}>
                  {createMiscChargeMutation.isPending ? 'Adding...' : 'Add'}
                </Button>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-600">Remark</label>
              <Textarea value={miscRemark} onChange={(e) => setMiscRemark(e.target.value)} placeholder="Remark" />
            </div>
            {createMiscChargeMutation.error && (
              <p className="text-sm text-red-600">
                {createMiscChargeMutation.error?.response?.data?.detail || 'Failed to add'}
              </p>
            )}
          </form>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Time</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Type</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Unit Price</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Amount</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Remark</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Recorded By</th>
                  <th className="text-right py-2 px-2 text-xs font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {(miscCharges || []).map((c) => (
                  <tr key={c.misc_charge_entry_id} className="border-b border-gray-100">
                    <td className="py-2 px-2 text-sm">{c.created_at ? new Date(c.created_at).toLocaleString() : '-'}</td>
                    <td className="py-2 px-2 text-sm">{miscNameById.get(Number(c.misc_charge_type_id)) || `#${c.misc_charge_type_id}`}</td>
                    <td className="py-2 px-2 text-sm">ETB {Number(c.unit_price ?? 0).toFixed(2)}</td>
                    <td className="py-2 px-2 text-sm">ETB {Number(c.amount ?? 0).toFixed(2)}</td>
                    <td className="py-2 px-2 text-sm whitespace-pre-wrap">{c.remark || '-'}</td>
                    <td className="py-2 px-2 text-sm">
                      {c.recorded_by_employee_id == null
                        ? '-'
                        : employeeNameById.get(Number(c.recorded_by_employee_id)) || String(c.recorded_by_employee_id)}
                    </td>
                    <td className="py-2 px-2 text-sm text-right">
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => deleteMiscChargeMutation.mutate(c.misc_charge_entry_id)}
                        disabled={deleteMiscChargeMutation.isPending}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
                {(miscCharges || []).length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-5 px-2 text-center text-gray-500">No misc charges</td>
                  </tr>
                )}
              </tbody>
            </table>
            {deleteMiscChargeMutation.error && (
              <p className="text-sm text-red-600 mt-2">
                {deleteMiscChargeMutation.error?.response?.data?.detail || 'Failed to delete'}
              </p>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Fuel & Lubricant Charges</h2>
          <form onSubmit={onAddFuelCharge} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="md:col-span-2">
                <label className="text-xs text-gray-600">Item *</label>
                <select
                  value={fuelItemId}
                  onChange={(e) => setFuelItemId(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select item</option>
                  {fuelItemsActive.map((t) => (
                    <option key={t.fuel_lubricant_id} value={String(t.fuel_lubricant_id)}>
                      {t.item_code} - {t.description} (ETB {Number(t.unit_price ?? 0).toFixed(2)}/{t.unit_of_measure || 'unit'})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-600">Quantity *</label>
                <Input value={fuelQty} onChange={(e) => setFuelQty(e.target.value)} type="number" step="0.01" min="0" />
              </div>
              <div className="flex items-end">
                <Button type="submit" disabled={createFuelChargeMutation.isPending || !canSubmitFuel}>
                  {createFuelChargeMutation.isPending ? 'Adding...' : 'Add'}
                </Button>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-600">Remark</label>
              <Textarea value={fuelRemark} onChange={(e) => setFuelRemark(e.target.value)} placeholder="Remark" />
            </div>
            {createFuelChargeMutation.error && (
              <p className="text-sm text-red-600">
                {createFuelChargeMutation.error?.response?.data?.detail || 'Failed to add'}
              </p>
            )}
          </form>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Time</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Item</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Qty</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Unit Price</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Amount</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Remark</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Recorded By</th>
                  <th className="text-right py-2 px-2 text-xs font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {(fuelCharges || []).map((c) => (
                  <tr key={c.fuel_lubricant_entry_id} className="border-b border-gray-100">
                    <td className="py-2 px-2 text-sm">{c.created_at ? new Date(c.created_at).toLocaleString() : '-'}</td>
                    <td className="py-2 px-2 text-sm">{fuelNameById.get(Number(c.fuel_lubricant_id)) || `#${c.fuel_lubricant_id}`}</td>
                    <td className="py-2 px-2 text-sm">
                      {Number(c.quantity ?? 0).toFixed(2)}{fuelUomById.get(Number(c.fuel_lubricant_id)) ? ` ${fuelUomById.get(Number(c.fuel_lubricant_id))}` : ''}
                    </td>
                    <td className="py-2 px-2 text-sm">ETB {Number(c.unit_price ?? 0).toFixed(2)}</td>
                    <td className="py-2 px-2 text-sm">ETB {Number(c.amount ?? 0).toFixed(2)}</td>
                    <td className="py-2 px-2 text-sm whitespace-pre-wrap">{c.remark || '-'}</td>
                    <td className="py-2 px-2 text-sm">
                      {c.recorded_by_employee_id == null
                        ? '-'
                        : employeeNameById.get(Number(c.recorded_by_employee_id)) || String(c.recorded_by_employee_id)}
                    </td>
                    <td className="py-2 px-2 text-sm text-right">
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => deleteFuelChargeMutation.mutate(c.fuel_lubricant_entry_id)}
                        disabled={deleteFuelChargeMutation.isPending}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
                {(fuelCharges || []).length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-5 px-2 text-center text-gray-500">No fuel/lubricant charges</td>
                  </tr>
                )}
              </tbody>
            </table>
            {deleteFuelChargeMutation.error && (
              <p className="text-sm text-red-600 mt-2">
                {deleteFuelChargeMutation.error?.response?.data?.detail || 'Failed to delete'}
              </p>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Sublet Work Charges</h2>
          <form onSubmit={onAddSubletCharge} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="md:col-span-2">
                <label className="text-xs text-gray-600">Work Type *</label>
                <select
                  value={subletTypeId}
                  onChange={(e) => setSubletTypeId(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select work</option>
                  {subletWorkTypesActive.map((t) => (
                    <option key={t.sublet_work_type_id} value={String(t.sublet_work_type_id)}>
                      {t.work_code} - {t.description} (ETB {Number(t.unit_price ?? 0).toFixed(2)}/{t.unit_of_measure || 'unit'})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-600">Quantity *</label>
                <Input value={subletQty} onChange={(e) => setSubletQty(e.target.value)} type="number" step="0.01" min="0" />
              </div>
              <div className="flex items-end">
                <Button type="submit" disabled={createSubletChargeMutation.isPending || !canSubmitSublet}>
                  {createSubletChargeMutation.isPending ? 'Adding...' : 'Add'}
                </Button>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-600">Remark</label>
              <Textarea value={subletRemark} onChange={(e) => setSubletRemark(e.target.value)} placeholder="Remark" />
            </div>
            {createSubletChargeMutation.error && (
              <p className="text-sm text-red-600">
                {createSubletChargeMutation.error?.response?.data?.detail || 'Failed to add'}
              </p>
            )}
          </form>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Time</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Work</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Supplier</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Qty</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Unit Price</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Amount</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Remark</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Recorded By</th>
                  <th className="text-right py-2 px-2 text-xs font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {(subletCharges || []).map((c) => (
                  <tr key={c.sublet_work_entry_id} className="border-b border-gray-100">
                    <td className="py-2 px-2 text-sm">{c.created_at ? new Date(c.created_at).toLocaleString() : '-'}</td>
                    <td className="py-2 px-2 text-sm">{subletNameById.get(Number(c.sublet_work_type_id)) || `#${c.sublet_work_type_id}`}</td>
                    <td className="py-2 px-2 text-sm">{subletSupplierNameByWorkTypeId.get(Number(c.sublet_work_type_id)) || '-'}</td>
                    <td className="py-2 px-2 text-sm">
                      {Number(c.quantity ?? 0).toFixed(2)}{subletUomById.get(Number(c.sublet_work_type_id)) ? ` ${subletUomById.get(Number(c.sublet_work_type_id))}` : ''}
                    </td>
                    <td className="py-2 px-2 text-sm">ETB {Number(c.unit_price ?? 0).toFixed(2)}</td>
                    <td className="py-2 px-2 text-sm">ETB {Number(c.amount ?? 0).toFixed(2)}</td>
                    <td className="py-2 px-2 text-sm whitespace-pre-wrap">{c.remark || '-'}</td>
                    <td className="py-2 px-2 text-sm">
                      {c.recorded_by_employee_id == null
                        ? '-'
                        : employeeNameById.get(Number(c.recorded_by_employee_id)) || String(c.recorded_by_employee_id)}
                    </td>
                    <td className="py-2 px-2 text-sm text-right">
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => deleteSubletChargeMutation.mutate(c.sublet_work_entry_id)}
                        disabled={deleteSubletChargeMutation.isPending}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
                {(subletCharges || []).length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-5 px-2 text-center text-gray-500">No sublet charges</td>
                  </tr>
                )}
              </tbody>
            </table>
            {deleteSubletChargeMutation.error && (
              <p className="text-sm text-red-600 mt-2">
                {deleteSubletChargeMutation.error?.response?.data?.detail || 'Failed to delete'}
              </p>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Other Charges</h2>
          <form onSubmit={onAddOtherCharge} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="md:col-span-2">
                <label className="text-xs text-gray-600">Charge Type *</label>
                <select
                  value={otherChargeTypeId}
                  onChange={(e) => setOtherChargeTypeId(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select type</option>
                  {otherChargeTypesActive.map((t) => (
                    <option key={t.other_charge_type_id} value={String(t.other_charge_type_id)}>
                      {t.charge_code} - {t.description} (ETB {Number(t.unit_price ?? 0).toFixed(2)}/{t.unit_of_measure || 'unit'})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-600">Quantity *</label>
                <Input value={otherChargeQty} onChange={(e) => setOtherChargeQty(e.target.value)} type="number" step="0.01" min="0" />
              </div>
              <div className="flex items-end">
                <Button type="submit" disabled={createOtherChargeMutation.isPending || !canSubmitOther}>
                  {createOtherChargeMutation.isPending ? 'Adding...' : 'Add'}
                </Button>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-600">Remark</label>
              <Textarea value={otherChargeRemark} onChange={(e) => setOtherChargeRemark(e.target.value)} placeholder="Remark" />
            </div>
            {createOtherChargeMutation.error && (
              <p className="text-sm text-red-600">
                {createOtherChargeMutation.error?.response?.data?.detail || 'Failed to add'}
              </p>
            )}
          </form>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Time</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Type</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Qty</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Unit Price</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Amount</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Remark</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Recorded By</th>
                  <th className="text-right py-2 px-2 text-xs font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {(otherCharges || []).map((c) => (
                  <tr key={c.other_charge_entry_id} className="border-b border-gray-100">
                    <td className="py-2 px-2 text-sm">{c.created_at ? new Date(c.created_at).toLocaleString() : '-'}</td>
                    <td className="py-2 px-2 text-sm">{otherNameById.get(Number(c.other_charge_type_id)) || `#${c.other_charge_type_id}`}</td>
                    <td className="py-2 px-2 text-sm">
                      {Number(c.quantity ?? 0).toFixed(2)}{otherUomById.get(Number(c.other_charge_type_id)) ? ` ${otherUomById.get(Number(c.other_charge_type_id))}` : ''}
                    </td>
                    <td className="py-2 px-2 text-sm">ETB {Number(c.unit_price ?? 0).toFixed(2)}</td>
                    <td className="py-2 px-2 text-sm">ETB {Number(c.amount ?? 0).toFixed(2)}</td>
                    <td className="py-2 px-2 text-sm whitespace-pre-wrap">{c.remark || '-'}</td>
                    <td className="py-2 px-2 text-sm">
                      {c.recorded_by_employee_id == null
                        ? '-'
                        : employeeNameById.get(Number(c.recorded_by_employee_id)) || String(c.recorded_by_employee_id)}
                    </td>
                    <td className="py-2 px-2 text-sm text-right">
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => deleteOtherChargeMutation.mutate(c.other_charge_entry_id)}
                        disabled={deleteOtherChargeMutation.isPending}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
                {(otherCharges || []).length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-5 px-2 text-center text-gray-500">No other charges</td>
                  </tr>
                )}
              </tbody>
            </table>
            {deleteOtherChargeMutation.error && (
              <p className="text-sm text-red-600 mt-2">
                {deleteOtherChargeMutation.error?.response?.data?.detail || 'Failed to delete'}
              </p>
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Inventory (MRV Item Issue)</h2>

          <form onSubmit={onCreateIssue} className="space-y-3 mb-5">
            <div>
              <label className="text-xs text-gray-600">Remarks</label>
              <Textarea value={issueRemarks} onChange={(e) => setIssueRemarks(e.target.value)} placeholder="Remarks" />
            </div>
            <Button type="submit" disabled={createIssueMutation.isPending}>
              {createIssueMutation.isPending ? 'Creating...' : 'Create MRV'}
            </Button>
            {createIssueMutation.error && (
              <p className="text-sm text-red-600">
                {createIssueMutation.error?.response?.data?.detail || 'Failed to create MRV'}
              </p>
            )}
            <p className="text-xs text-gray-500">
              Note: backend requires job Received and at least one technician clocked-in.
            </p>
          </form>

          {isIssuesLoading ? (
            <div className="flex justify-center items-center h-24">Loading...</div>
          ) : (
            <div className="space-y-4">
              {(issues || []).map((issue) => {
                const isDraft = issue.status === 'Draft'
                return (
                  <div key={issue.issue_id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="font-mono text-sm">{issue.issue_number}</div>
                        <div className="text-xs text-gray-500">Status: {issue.status}</div>
                      </div>
                      <div className="flex gap-2">
                        {isDraft && (
                          <>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => cancelIssueMutation.mutate(issue.issue_id)}
                              disabled={cancelIssueMutation.isPending}
                            >
                              Cancel
                            </Button>
                            <Button
                              type="button"
                              onClick={() => finalizeIssueMutation.mutate(issue.issue_id)}
                              disabled={finalizeIssueMutation.isPending}
                            >
                              Finalize
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    {issue.remarks && <div className="text-sm mt-2 whitespace-pre-wrap">{issue.remarks}</div>}

                    {isDraft && (
                      <div className="mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="text-xs text-gray-600">Part</label>
                            <select
                              value={issueAddPartId}
                              onChange={(e) => setIssueAddPartId(e.target.value)}
                              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                              <option value="">Select part</option>
                              {(parts || [])
                                .filter((p) => p.is_active)
                                .map((p) => (
                                  <option key={p.part_id} value={String(p.part_id)}>
                                    {p.part_code} - {p.part_name} (stock {p.stock_quantity})
                                  </option>
                                ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs text-gray-600">Quantity</label>
                            <Input
                              value={issueAddQty}
                              onChange={(e) => setIssueAddQty(e.target.value)}
                              placeholder="Qty"
                              inputMode="numeric"
                            />
                          </div>
                          <div className="flex items-end">
                            <Button
                              type="button"
                              onClick={() => onAddLineToIssue(issue.issue_id)}
                              disabled={addIssueLineMutation.isPending}
                            >
                              Add Line
                            </Button>
                          </div>
                        </div>
                        {addIssueLineMutation.error && (
                          <p className="text-sm text-red-600 mt-2">
                            {addIssueLineMutation.error?.response?.data?.detail || 'Failed to add line'}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="mt-4 overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Part</th>
                            <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Qty</th>
                            <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Unit</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(issue.lines || []).map((ln) => {
                            const p = partsById.get(ln.part_id)
                            return (
                              <tr key={ln.issue_line_id} className="border-b border-gray-100">
                                <td className="py-2 px-2 text-sm">
                                  {p ? `${p.part_code} - ${p.part_name}` : `Part #${ln.part_id}`}
                                </td>
                                <td className="py-2 px-2 text-sm">{ln.quantity}</td>
                                <td className="py-2 px-2 text-sm">ETB {parseFloat(ln.unit_price || 0).toLocaleString()}</td>
                              </tr>
                            )
                          })}
                          {(issue.lines || []).length === 0 && (
                            <tr>
                              <td colSpan={3} className="py-3 px-2 text-center text-gray-500 text-sm">
                                No lines
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {finalizeIssueMutation.error && (
                      <p className="text-sm text-red-600 mt-2">
                        {finalizeIssueMutation.error?.response?.data?.detail || 'Failed to finalize'}
                      </p>
                    )}
                    {cancelIssueMutation.error && (
                      <p className="text-sm text-red-600 mt-2">
                        {cancelIssueMutation.error?.response?.data?.detail || 'Failed to cancel'}
                      </p>
                    )}
                  </div>
                )
              })}
              {(issues || []).length === 0 && (
                <div className="text-sm text-gray-500">No MRV issues</div>
              )}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Return Requests</h2>

          <form onSubmit={onSubmitReturnRequest} className="space-y-3 mb-5">
            <div>
              <label className="text-xs text-gray-600">MRV (Finalized) *</label>
              <select
                value={returnIssueId}
                onChange={(e) => {
                  setReturnIssueId(e.target.value)
                  setReturnPartId('')
                  setReturnQty('')
                  setReturnRemark('')
                  setReturnItems([])
                }}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select MRV</option>
                {finalizedIssues.map((iss) => (
                  <option key={iss.issue_id} value={String(iss.issue_id)}>
                    {iss.issue_number}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-600">Authority Name</label>
                <Input value={returnAuthorityName} onChange={(e) => setReturnAuthorityName(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-gray-600">Reason</label>
                <Input value={returnReason} onChange={(e) => setReturnReason(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="md:col-span-2">
                <label className="text-xs text-gray-600">Part *</label>
                <select
                  value={returnPartId}
                  onChange={(e) => setReturnPartId(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  disabled={!returnIssueId}
                >
                  <option value="">Select part</option>
                  {(() => {
                    const selectedIssue = (finalizedIssues || []).find((x) => String(x.issue_id) === String(returnIssueId))
                    const partIds = new Set((selectedIssue?.lines || []).map((l) => l.part_id))
                    const opts = [...partIds].map((pid) => {
                      const p = partsById.get(pid)
                      return { pid, label: p ? `${p.part_code} - ${p.part_name}` : `Part #${pid}` }
                    })
                    return opts.map((o) => (
                      <option key={o.pid} value={String(o.pid)}>
                        {o.label}
                      </option>
                    ))
                  })()}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-600">Qty *</label>
                <Input
                  value={returnQty}
                  onChange={(e) => setReturnQty(e.target.value)}
                  placeholder="Qty"
                  inputMode="numeric"
                  disabled={!returnIssueId}
                />
              </div>
              <div className="flex items-end">
                <Button type="button" onClick={addReturnItem} disabled={!returnIssueId}>
                  Add Item
                </Button>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-600">Item Remark</label>
              <Input value={returnRemark} onChange={(e) => setReturnRemark(e.target.value)} disabled={!returnIssueId} />
            </div>

            <div className="border rounded-lg p-3">
              <div className="text-sm font-medium mb-2">Items</div>
              {(returnItems || []).length === 0 ? (
                <div className="text-sm text-gray-500">No items added</div>
              ) : (
                <div className="space-y-2">
                  {returnItems.map((it) => {
                    const p = partsById.get(it.part_id)
                    return (
                      <div key={it.part_id} className="flex items-center justify-between gap-3">
                        <div className="text-sm">
                          <span className="font-medium">{p ? `${p.part_code} - ${p.part_name}` : `Part #${it.part_id}`}</span>
                          <span className="text-gray-500"> — Qty {it.quantity}</span>
                        </div>
                        <Button type="button" variant="outline" onClick={() => removeReturnItem(it.part_id)}>
                          Remove
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <Button
              type="submit"
              disabled={createReturnRequestMutation.isPending || !returnIssueId || (returnItems || []).length === 0}
            >
              {createReturnRequestMutation.isPending ? 'Submitting...' : 'Submit Return Request'}
            </Button>

            {createReturnRequestMutation.error && (
              <p className="text-sm text-red-600">
                {createReturnRequestMutation.error?.response?.data?.detail || 'Failed to submit return request'}
              </p>
            )}
          </form>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Return No</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">MRV</th>
                  <th className="text-left py-2 px-2 text-xs font-semibold text-gray-700">Status</th>
                  <th className="text-right py-2 px-2 text-xs font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {returnRequests.map((r) => (
                  <tr key={r.return_request_id} className="border-b border-gray-100">
                    <td className="py-2 px-2 text-sm font-mono">{r.return_number}</td>
                    <td className="py-2 px-2 text-sm">#{r.issue_id}</td>
                    <td className="py-2 px-2 text-sm">{r.status}</td>
                    <td className="py-2 px-2 text-right">
                      {r.status === 'Pending' ? (
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => rejectReturnRequestMutation.mutate(r.return_request_id)}
                            disabled={rejectReturnRequestMutation.isPending}
                          >
                            Reject
                          </Button>
                          <Button
                            type="button"
                            onClick={() => approveReturnRequestMutation.mutate(r.return_request_id)}
                            disabled={approveReturnRequestMutation.isPending}
                          >
                            Approve
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500">-</span>
                      )}
                    </td>
                  </tr>
                ))}
                {returnRequests.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 px-2 text-center text-gray-500 text-sm">
                      No return requests
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {(approveReturnRequestMutation.error || rejectReturnRequestMutation.error) && (
            <p className="text-sm text-red-600 mt-2">
              {approveReturnRequestMutation.error?.response?.data?.detail ||
                rejectReturnRequestMutation.error?.response?.data?.detail ||
                'Failed to update return request'}
            </p>
          )}
        </Card>
      </div>
    </div>
  )
}
