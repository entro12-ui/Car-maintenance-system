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

