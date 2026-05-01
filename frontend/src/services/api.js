import axios from 'axios'

// Determine API base URL based on environment
// For local development: use localhost
// For deployment: use VITE_API_URL from environment (set in Render)
// Fallback to localhost if VITE_API_URL is not set
const getApiBaseUrl = () => {
  // Check if we're in development mode
  const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost'
  
  // If VITE_API_URL is explicitly set, use it (for deployment)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }
  
  // For local development, use localhost
  if (isDevelopment) {
    return 'http://localhost:8000/api'
  }
  
  // Fallback (shouldn't happen in production)
  return 'http://localhost:8000/api'
}

const API_BASE_URL = getApiBaseUrl()

console.log('API Base URL:', API_BASE_URL) // Debug log - remove in production

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Customers
export const customersApi = {
  getAll: (params) => api.get('/customers', { params }),
  getById: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
  glAccountLookup: (params) => api.get('/customers/gl-account-lookup', { params }),
  auditLog: (id, params) => api.get(`/customers/${id}/audit-log`, { params }),
  getVehicles: (id) => api.get(`/customers/${id}/vehicles`),
  getHistory: (id) => api.get(`/customers/${id}/history`),
  getPendingApproval: () => api.get('/customers/pending-approval'),
}

// Vehicles
export const vehiclesApi = {
  getAll: (params) => api.get('/vehicles', { params }),
  getById: (id) => api.get(`/vehicles/${id}`),
  create: (data) => api.post('/vehicles', data),
  update: (id, data) => api.put(`/vehicles/${id}`, data),
  getServices: (id) => api.get(`/vehicles/${id}/services`),
}

// Appointments
export const appointmentsApi = {
  getAll: (params) => api.get('/appointments', { params }),
  getToday: () => api.get('/appointments/today'),
  getById: (id) => api.get(`/appointments/${id}`),
  create: (data) => api.post('/appointments', data),
  update: (id, data) => api.put(`/appointments/${id}`, data),
  start: (id) => api.post(`/appointments/${id}/start`),
  complete: (id) => api.post(`/appointments/${id}/complete`),
}

// Services
export const servicesApi = {
  getAll: (params) => api.get('/services', { params }),
  getById: (id) => api.get(`/services/${id}`),
  create: (data) => api.post('/services', data),
  update: (id, data) => api.put(`/services/${id}`, data),
  calculateBill: (id) => api.post(`/services/${id}/calculate-bill`),
}

// Service Types
export const serviceTypesApi = {
  getAll: () => api.get('/service-types'),
  getById: (id) => api.get(`/service-types/${id}`),
  getWithChecklist: (id) => api.get(`/service-types/${id}/with-checklist`),
  getChecklistItems: (serviceTypeId) => api.get(`/service-types/${serviceTypeId}/checklist`),
  createChecklistItem: (serviceTypeId, data) => api.post(`/service-types/${serviceTypeId}/checklist`, data),
  updateChecklistItem: (checklistId, data) => api.put(`/service-types/checklist/${checklistId}`, data),
  deleteChecklistItem: (checklistId) => api.delete(`/service-types/checklist/${checklistId}`),
}

// Parts
export const partsApi = {
  getAll: (params) => api.get('/parts', { params }),
  getLowStock: () => api.get('/parts/low-stock'),
  getById: (id) => api.get(`/parts/${id}`),
  create: (data) => api.post('/parts', data),
  update: (id, data) => api.put(`/parts/${id}`, data),
}

// Loyalty
export const loyaltyApi = {
  getPrograms: () => api.get('/loyalty/programs'),
  getStatus: (customerId) => api.get(`/loyalty/status/${customerId}`),
  applyFreeService: (customerId, serviceId) => 
    api.post(`/loyalty/${customerId}/apply-free-service`, { service_id: serviceId }),
}

// Dashboard
export const dashboardApi = {
  getStats: () => api.get('/dashboard'),
}

// Reports
export const reportsApi = {
  getDaily: (date) => api.get('/reports/daily', { params: { report_date: date } }),
  getMonthly: (month, year) => api.get('/reports/monthly', { params: { month, year } }),
  getCustomersDue: (days) => api.get('/reports/customers-due', { params: { days } }),
}

// System Settings (admin-maintained lookups)
export const systemSettingsApi = {
  list: (params) => api.get('/settings', { params }),
  create: (data) => api.post('/settings', data),
  update: (id, data) => api.put(`/settings/${id}`, data),
  remove: (id) => api.delete(`/settings/${id}`),
}

// Company Setup (tabbed HillMaster-style; backed by cs.* system settings)
export const companySetupApi = {
  get: () => api.get('/company-setup'),
  update: (data) => api.put('/company-setup', data),
  auditLog: (params) => api.get('/company-setup/audit-log', { params }),
}

// Authentication
export const authApi = {
  login: (formData) => api.post('/auth/login', formData, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  }),
  register: (data) => api.post('/auth/register', data),
  registerAccountant: (data) => api.post('/auth/register-accountant', data),
  getMe: () => api.get('/auth/me'),
  approveCustomer: (customerId) => api.post(`/auth/approve/${customerId}`),
  approveAccountant: (accountantId) => api.post(`/auth/approve-accountant/${accountantId}`),
}

// Customer Dashboard
export const customerApi = {
  getVehicles: () => api.get('/customer/vehicles'),
  createVehicle: (data) => api.post('/customer/vehicles', data),
  getServices: () => api.get('/customer/services'),
  getSummary: () => api.get('/customer/summary'),
  getAppointments: () => api.get('/customer/appointments'),
}

// Admin Customer Management
export const adminCustomersApi = {
  getFullDetails: (customerId) => api.get(`/admin/customers/${customerId}/full-details`),
  addService: (customerId, serviceData) => api.post(`/admin/customers/${customerId}/add-service`, serviceData),
  getServiceChecklist: (customerId, serviceTypeId) => 
    api.get(`/admin/customers/${customerId}/service-checklist/${serviceTypeId}`),
  getServiceDetails: (customerId, serviceId) => 
    api.get(`/admin/customers/${customerId}/service/${serviceId}`),
}

// Accountant
export const accountantApi = {
  register: (data) => api.post('/auth/register-accountant', data),
  getPayments: (params) => api.get('/accountant/payments', { params }),
  updatePaymentStatus: (serviceId, data) => api.put(`/accountant/payments/${serviceId}`, data),
  getPaymentSummary: (params) => api.get('/accountant/payments/summary', { params }),
  getPendingApprovals: () => api.get('/accountant/pending-approval'),
}

// General Ledger (Accounts + Journals)
export const glApi = {
  // Accounts
  listAccounts: (params) => api.get('/gl/accounts', { params }),
  createAccount: (data) => api.post('/gl/accounts', data),
  updateAccount: (accountId, data) => api.put(`/gl/accounts/${accountId}`, data),

  // Journals
  listJournals: (params) => api.get('/gl/journals', { params }),
  createJournal: (data) => api.post('/gl/journals', data),
  postJournal: (journalId) => api.post(`/gl/journals/${journalId}/post`),
}

// GL Account Setup By Section and Repair Type
export const glAccountSetupApi = {
  options: () => api.get('/gl-account-setup/options'),
  list: (params) => api.get('/gl-account-setup', { params }),
  create: (data) => api.post('/gl-account-setup', data),
  update: (setupId, data) => api.put(`/gl-account-setup/${setupId}`, data),
}

// Enterprise Admin
export const enterpriseAdminApi = {
  // Memo / letter templates
  listMemoTemplates: (params) => api.get('/admin/memo-templates', { params }),
  createMemoTemplate: (data) => api.post('/admin/memo-templates', data),
  updateMemoTemplate: (id, data) => api.put(`/admin/memo-templates/${id}`, data),

  // User-defined reports
  listUserDefinedReports: (params) => api.get('/admin/user-defined-reports', { params }),
  createUserDefinedReport: (data) => api.post('/admin/user-defined-reports', data),
  updateUserDefinedReport: (id, data) => api.put(`/admin/user-defined-reports/${id}`, data),

  // GL auto-posting rules
  listGlPostingRules: (params) => api.get('/admin/gl-posting-rules', { params }),
  createGlPostingRule: (data) => api.post('/admin/gl-posting-rules', data),
  updateGlPostingRule: (id, data) => api.put(`/admin/gl-posting-rules/${id}`, data),
}

// Proformas
export const proformasApi = {
  getAll: (params) => api.get('/proformas', { params }),
  getById: (id) => api.get(`/proformas/${id}`),
  create: (data) => api.post('/proformas', data),
  update: (id, data) => api.put(`/proformas/${id}`, data),
  delete: (id) => api.delete(`/proformas/${id}`),
  addItem: (id, data) => api.post(`/proformas/${id}/items`, data),
  updateItem: (id, itemId, data) => api.put(`/proformas/${id}/items/${itemId}`, data),
  deleteItem: (id, itemId) => api.delete(`/proformas/${id}/items/${itemId}`),
  addMarketPrice: (id, itemId, data) => api.post(`/proformas/${id}/items/${itemId}/market-prices`, data),
  updateMarketPrice: (id, itemId, marketPriceId, data) => api.put(`/proformas/${id}/items/${itemId}/market-prices/${marketPriceId}`, data),
  deleteMarketPrice: (id, itemId, marketPriceId) => api.delete(`/proformas/${id}/items/${itemId}/market-prices/${marketPriceId}`),
  markPrinted: (id) => api.post(`/proformas/${id}/print`),
  convert: (id) => api.post(`/proformas/${id}/convert`),
}

// Job Orders
export const jobOrdersApi = {
  list: (params) => api.get('/job-orders', { params: params || {} }),
  getById: (id) => api.get(`/job-orders/${id}`),
  create: (data) => api.post('/job-orders', data),
  update: (id, data) => api.put(`/job-orders/${id}`, data),
  dispatch: (id, data) => api.post(`/job-orders/${id}/dispatch`, data),
  receive: (id, data) => api.post(`/job-orders/${id}/receive`, data),
  clockIn: (id, data) => api.post(`/job-orders/${id}/clock-in`, data),
  listClocks: (id) => api.get(`/job-orders/${id}/clocks`),
  clockOut: (id, clockId, data) => api.post(`/job-orders/${id}/clock-out/${clockId}`, data),
  updateLastClockOutReason: (id, data) => api.post(`/job-orders/${id}/clocks/last/reason`, data),
  block: (id, data) => api.post(`/job-orders/${id}/block`, data),
  release: (id) => api.post(`/job-orders/${id}/release`),
  deliver: (id, data) => api.post(`/job-orders/${id}/deliver`, data),
  getQc: (id) => api.get(`/job-orders/${id}/qc`),
  updateQc: (id, data) => api.put(`/job-orders/${id}/qc`, data),
  vrvPrint: (id) => api.post(`/job-orders/${id}/vrv/print`),
  vrvCancel: (id, data) => api.post(`/job-orders/${id}/vrv/cancel`, data),

  // Utilities
  close: (id, data) =>
    data != null ? api.post(`/job-orders/${id}/close`, data) : api.post(`/job-orders/${id}/close`),
  reopen: (id) => api.post(`/job-orders/${id}/reopen`),
  cancel: (id) => api.post(`/job-orders/${id}/cancel`),
  copy: (id, data) => api.post(`/job-orders/${id}/copy`, data),
  split: (id, data) => api.post(`/job-orders/${id}/split`, data),
  pair: (data) => api.post('/job-orders/pair', data),
  unpair: (pairingId) => api.post(`/job-orders/unpair/${pairingId}`),
  listPairings: (id) => api.get(`/job-orders/${id}/pairings`),
  assemblyLineReceive: (data) => api.post('/job-orders/assembly-line-receive', data),

  // Task enquiries
  enquiryFreeTechnicians: () => api.get('/job-orders/enquiry/free-technicians'),
  enquiryClockedInJobs: (section) => api.get('/job-orders/enquiry/clocked-in-jobs', { params: { section } }),
  enquiryDispatchedJobs: (section) => api.get('/job-orders/enquiry/dispatched-jobs', { params: { section } }),
  enquiryInOut: (params) => api.get('/job-orders/enquiry/in-out', { params }),
  endOfDayCheckout: (data) => api.post('/job-orders/enquiry/end-of-day-checkout', data),
}

// Garage Invoices (Cash/Credit/ITM + Discount + Cancel/Return + Uncollected Clearing)
export const garageInvoicesApi = {
  listEligibleJobs: (invoiceType) => api.get('/garage-invoices/eligible-jobs', { params: { invoice_type: invoiceType } }),
  proformaPreview: (jobOrderId, invoiceType) =>
    api.get(`/garage-invoices/proforma-preview/${jobOrderId}`, { params: { invoice_type: invoiceType } }),
  create: (data) => api.post('/garage-invoices', data),
  list: (params) => api.get('/garage-invoices', { params }),
  getById: (id) => api.get(`/garage-invoices/${id}`),
  cancel: (id, data) => api.post(`/garage-invoices/${id}/cancel`, data),
  returnInvoice: (id, data) => api.post(`/garage-invoices/${id}/return`, data),
  print: (id) => api.get(`/garage-invoices/${id}/print`),

  listUncollected: (startDate, endDate) => api.get('/garage-invoices/uncollected', { params: { start_date: startDate, end_date: endDate } }),
  clearUncollected: (startDate, endDate, data) => api.post('/garage-invoices/uncollected/clear', data, { params: { start_date: startDate, end_date: endDate } }),

  createDiscountRate: (data) => api.post('/garage-invoices/discount-rates', data),
  listDiscountRates: (params) => api.get('/garage-invoices/discount-rates', { params }),
}

// Job Order Notice Types
export const jobOrderNoticeTypesApi = {
  list: (params) => api.get('/job-orders/notice-types', { params }),
  create: (data) => api.post('/job-orders/notice-types', data),
  update: (id, data) => api.put(`/job-orders/notice-types/${id}`, data),
}

// Job Order Customer Notifications
export const jobOrderCustomerNotificationsApi = {
  list: (jobOrderId) => api.get(`/job-orders/${jobOrderId}/customer-notifications`),
  create: (jobOrderId, data) => api.post(`/job-orders/${jobOrderId}/customer-notifications`, data),
}

// Job Order Inventory (MRV + Returns)
export const jobOrderInventoryApi = {
  // MRV
  createIssue: (jobOrderId, data) => api.post(`/job-orders/${jobOrderId}/item-issues`, data),
  listIssues: (jobOrderId) => api.get(`/job-orders/${jobOrderId}/item-issues`),
  getIssue: (issueId) => api.get(`/job-orders/item-issues/${issueId}`),
  addIssueLine: (issueId, data) => api.post(`/job-orders/item-issues/${issueId}/lines`, data),
  finalizeIssue: (issueId) => api.post(`/job-orders/item-issues/${issueId}/finalize`),
  cancelIssue: (issueId) => api.post(`/job-orders/item-issues/${issueId}/cancel`),

  // Returns
  createReturnRequest: (issueId, data) => api.post(`/job-orders/item-issues/${issueId}/return-requests`, data),
  listReturnRequests: (params) => api.get('/job-orders/return-requests', { params }),
  approveReturnRequest: (returnRequestId) => api.post(`/job-orders/return-requests/${returnRequestId}/approve`),
  rejectReturnRequest: (returnRequestId) => api.post(`/job-orders/return-requests/${returnRequestId}/reject`),
}

// Labor Types + Job Order Labor Charges
export const laborTypesApi = {
  list: (params) => api.get('/job-orders/labor-types', { params }),
  create: (data) => api.post('/job-orders/labor-types', data),
  update: (id, data) => api.put(`/job-orders/labor-types/${id}`, data),
  listModelGroupRates: (laborTypeId) => api.get(`/job-orders/labor-types/${laborTypeId}/model-group-rates`),
  createModelGroupRate: (laborTypeId, data) => api.post(`/job-orders/labor-types/${laborTypeId}/model-group-rates`, data),
  updateModelGroupRate: (laborTypeId, rateId, data) =>
    api.put(`/job-orders/labor-types/${laborTypeId}/model-group-rates/${rateId}`, data),
  deleteModelGroupRate: (laborTypeId, rateId) =>
    api.delete(`/job-orders/labor-types/${laborTypeId}/model-group-rates/${rateId}`),
  applyAllModelGroups: (laborTypeId, data) =>
    api.post(`/job-orders/labor-types/${laborTypeId}/model-group-rates/apply-all`, data),
}

export const laborPriceListsApi = {
  list: (params) => api.get('/job-orders/labor-price-lists', { params }),
  create: (data) => api.post('/job-orders/labor-price-lists', data),
  update: (id, data) => api.put(`/job-orders/labor-price-lists/${id}`, data),
}

export const jobOrderLaborApi = {
  listCharges: (jobOrderId) => api.get(`/job-orders/${jobOrderId}/labor-charges`),
  createCharge: (jobOrderId, data) => api.post(`/job-orders/${jobOrderId}/labor-charges`, data),
  deleteCharge: (jobOrderId, laborChargeId) =>
    api.delete(`/job-orders/${jobOrderId}/labor-charges/${laborChargeId}`),
}

// Employees
export const employeesApi = {
  getMechanics: () => api.get('/employees/mechanics'),
  list: (params) => api.get('/employees', { params }),
  create: (data) => api.post('/employees', data),
  update: (employeeId, data) => api.put(`/employees/${employeeId}`, data),
  remove: (employeeId) => api.delete(`/employees/${employeeId}`),
}

export const jobTypeAccessApi = {
  listUsers: () => api.get('/job-type-access/users'),
  listJobTypes: () => api.get('/job-type-access/job-types'),
  getUserAccess: (userId) => api.get(`/job-type-access/users/${userId}`),
  saveUserAccess: (userId, jobTypeSettingIds) =>
    api.put(`/job-type-access/users/${userId}`, { job_type_setting_ids: jobTypeSettingIds }),
  listAll: () => api.get('/job-type-access/list'),
}

// Job Order Additional Charges (Setup + Entry)
export const otherChargeTypesApi = {
  list: (params) => api.get('/job-orders/other-charge-types', { params }),
  create: (data) => api.post('/job-orders/other-charge-types', data),
  update: (id, data) => api.put(`/job-orders/other-charge-types/${id}`, data),
}

export const fuelLubricantsApi = {
  list: (params) => api.get('/job-orders/fuel-lubricants', { params }),
  create: (data) => api.post('/job-orders/fuel-lubricants', data),
  update: (id, data) => api.put(`/job-orders/fuel-lubricants/${id}`, data),
}

export const miscChargeTypesApi = {
  list: (params) => api.get('/job-orders/misc-charge-types', { params }),
  create: (data) => api.post('/job-orders/misc-charge-types', data),
  update: (id, data) => api.put(`/job-orders/misc-charge-types/${id}`, data),
}

export const subletWorkSuppliersApi = {
  list: (params) => api.get('/job-orders/sublet-work-suppliers', { params }),
  create: (data) => api.post('/job-orders/sublet-work-suppliers', data),
  update: (id, data) => api.put(`/job-orders/sublet-work-suppliers/${id}`, data),
}

export const subletWorkTypesApi = {
  list: (params) => api.get('/job-orders/sublet-work-types', { params }),
  create: (data) => api.post('/job-orders/sublet-work-types', data),
  update: (id, data) => api.put(`/job-orders/sublet-work-types/${id}`, data),
}

export const jobOrderAdditionalChargesApi = {
  // Misc
  listMisc: (jobOrderId) => api.get(`/job-orders/${jobOrderId}/misc-charges`),
  createMisc: (jobOrderId, data) => api.post(`/job-orders/${jobOrderId}/misc-charges`, data),
  deleteMisc: (jobOrderId, entryId) => api.delete(`/job-orders/${jobOrderId}/misc-charges/${entryId}`),

  // Fuel & Lubricant
  listFuel: (jobOrderId) => api.get(`/job-orders/${jobOrderId}/fuel-lubricant-charges`),
  createFuel: (jobOrderId, data) => api.post(`/job-orders/${jobOrderId}/fuel-lubricant-charges`, data),
  deleteFuel: (jobOrderId, entryId) => api.delete(`/job-orders/${jobOrderId}/fuel-lubricant-charges/${entryId}`),

  // Sublet
  listSublet: (jobOrderId) => api.get(`/job-orders/${jobOrderId}/sublet-work-charges`),
  createSublet: (jobOrderId, data) => api.post(`/job-orders/${jobOrderId}/sublet-work-charges`, data),
  deleteSublet: (jobOrderId, entryId) => api.delete(`/job-orders/${jobOrderId}/sublet-work-charges/${entryId}`),

  // Other
  listOther: (jobOrderId) => api.get(`/job-orders/${jobOrderId}/other-charges`),
  createOther: (jobOrderId, data) => api.post(`/job-orders/${jobOrderId}/other-charges`, data),
  deleteOther: (jobOrderId, entryId) => api.delete(`/job-orders/${jobOrderId}/other-charges/${entryId}`),
}

// AI customer support (authenticated; requires OPENAI_API_KEY on backend)
export const supportApi = {
  chat: (messages) => api.post('/support/chat', { messages }),
}

// Job Order Sublet Orders (Entry + Approval + Receiving)
export const jobOrderSubletOrdersApi = {
  // Entry (by job)
  create: (jobOrderId, data) => api.post(`/job-orders/${jobOrderId}/sublet-orders`, data),
  listForJob: (jobOrderId) => api.get(`/job-orders/${jobOrderId}/sublet-orders`),
  finishForJob: (jobOrderId) => api.post(`/job-orders/${jobOrderId}/sublet-orders/finish`),

  // Generic
  update: (subletOrderId, data) => api.put(`/job-orders/sublet-orders/${subletOrderId}`, data),
  list: (params) => api.get('/job-orders/sublet-orders', { params }),
  getById: (subletOrderId) => api.get(`/job-orders/sublet-orders/${subletOrderId}`),

  // Approval
  approve: (subletOrderId, data) => api.post(`/job-orders/sublet-orders/${subletOrderId}/approve`, data),
  returnToRequester: (subletOrderId, data) => api.post(`/job-orders/sublet-orders/${subletOrderId}/return`, data),
  reject: (subletOrderId, data) => api.post(`/job-orders/sublet-orders/${subletOrderId}/reject`, data),
  cancel: (subletOrderId, data) => api.post(`/job-orders/sublet-orders/${subletOrderId}/cancel`, data),

  // Receiving
  receive: (subletOrderId, data) => api.post(`/job-orders/sublet-orders/${subletOrderId}/receive`, data),
}

// Set up axios interceptor for token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api

