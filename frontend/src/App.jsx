import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Customers from './pages/Customers'
import Vehicles from './pages/Vehicles'
import Appointments from './pages/Appointments'
import Services from './pages/Services'
import Parts from './pages/Parts'
import Loyalty from './pages/Loyalty'
import Reports from './pages/Reports'
import CustomerDashboard from './pages/CustomerDashboard'
import CustomerServices from './pages/CustomerServices'
import CustomerVehicles from './pages/CustomerVehicles'
import CustomerAppointments from './pages/CustomerAppointments'
import PendingApprovals from './pages/PendingApprovals'
import AdminCustomerDetails from './pages/AdminCustomerDetails'
import AddServiceForCustomer from './pages/AddServiceForCustomer'
import ManageServiceChecklists from './pages/ManageServiceChecklists'
import RegisterAccountant from './pages/RegisterAccountant'
import AccountantDashboard from './pages/AccountantDashboard'
import Proformas from './pages/Proformas'
import ProformaForm from './pages/ProformaForm'
import ProformaPrint from './pages/ProformaPrint'
import JobOrders from './pages/JobOrders'
import JobOrderDetail from './pages/JobOrderDetail'
import JobOrderNoticeTypes from './pages/JobOrderNoticeTypes'
import LaborTypes from './pages/LaborTypes'
import AdditionalChargesSetup from './pages/AdditionalChargesSetup'
import SubletOrderEntry from './pages/SubletOrderEntry'
import SubletOrderApproval from './pages/SubletOrderApproval'
import SubletOrderReceiving from './pages/SubletOrderReceiving'
import GarageCashInvoice from './pages/GarageCashInvoice'
import GarageCreditInvoice from './pages/GarageCreditInvoice'
import GarageItmInvoice from './pages/GarageItmInvoice'
import GarageDiscountRateEntry from './pages/GarageDiscountRateEntry'
import GarageCancelReturnInvoice from './pages/GarageCancelReturnInvoice'
import GarageClearUncollectedSales from './pages/GarageClearUncollectedSales'
import GarageCancelVrvEntry from './pages/GarageCancelVrvEntry'
import GarageInvoicePrint from './pages/GarageInvoicePrint'
import SystemSettings from './pages/SystemSettings'
import Technicians from './pages/Technicians'
import GlJournals from './pages/GlJournals'
import GarageSetupHub from './pages/GarageSetupHub'
import TaskOperations from './pages/TaskOperations'
import CreditNoteEntry from './pages/CreditNoteEntry'
import JobEstimation from './pages/JobEstimation'
import AdvancedBooking from './pages/AdvancedBooking'
import GarageReportsHub from './pages/GarageReportsHub'
import EnterpriseAdmin from './pages/EnterpriseAdmin'

function AppRoutes() {
  const { isAuthenticated, isAdmin, isAccountant, loading } = useAuth()

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to={isAdmin ? "/" : (isAccountant ? "/accountant/dashboard" : "/customer/dashboard")} />} />
      <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to={isAdmin ? "/" : (isAccountant ? "/accountant/dashboard" : "/customer/dashboard")} />} />
      <Route path="/register-accountant" element={!isAuthenticated ? <RegisterAccountant /> : <Navigate to={isAdmin ? "/" : (isAccountant ? "/accountant/dashboard" : "/customer/dashboard")} />} />

      {/* Admin routes */}
      <Route path="/" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <Dashboard />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/customers" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <Customers />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/pending-approvals" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <PendingApprovals />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/vehicles" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <Vehicles />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/appointments" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <Appointments />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/services" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <Services />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/parts" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <Parts />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/loyalty" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <Loyalty />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/reports" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <Reports />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/job-orders" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <JobOrders />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/job-orders/:id" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <JobOrderDetail />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/job-orders/notice-types" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <JobOrderNoticeTypes />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/job-orders/labor-types" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <LaborTypes />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/job-orders/additional-charges" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <AdditionalChargesSetup />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/job-orders/sublet-orders/entry" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <SubletOrderEntry />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/job-orders/sublet-orders/approval" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <SubletOrderApproval />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/job-orders/sublet-orders/receiving" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <SubletOrderReceiving />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/garage-invoices/cash" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <GarageCashInvoice />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/garage-invoices/credit" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <GarageCreditInvoice />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/garage-invoices/itm" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <GarageItmInvoice />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/garage-invoices/discount-rate" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <GarageDiscountRateEntry />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/garage-invoices/cancel-return" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <GarageCancelReturnInvoice />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/garage-invoices/clear-uncollected" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <GarageClearUncollectedSales />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/garage-invoices/cancel-vrv" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <GarageCancelVrvEntry />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/garage-invoices/:id/print" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <GarageInvoicePrint />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/service-checklists" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <ManageServiceChecklists />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/system-settings" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <SystemSettings />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/setup-hub" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <GarageSetupHub />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/technicians" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <Technicians />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/task-operations" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <TaskOperations />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/garage-invoices/credit-note" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <CreditNoteEntry />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/garage-invoices/job-estimation" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <JobEstimation />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/garage-invoices/advanced-booking" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <AdvancedBooking />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/garage-reports-hub" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <GarageReportsHub />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/enterprise-admin" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <EnterpriseAdmin />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/gl/journals" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <GlJournals />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/proformas" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <Proformas />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/proformas/new" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <ProformaForm />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/proformas/:id/edit" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <ProformaForm />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/proformas/:id" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <ProformaPrint />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/proformas/:id/print" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <ProformaPrint />
          </Layout>
        </ProtectedRoute>
      } />

      {/* Customer routes */}
      <Route path="/customer/dashboard" element={
        <ProtectedRoute>
          <Layout>
            <CustomerDashboard />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/customer/services" element={
        <ProtectedRoute>
          <Layout>
            <CustomerServices />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/customer/vehicles" element={
        <ProtectedRoute>
          <Layout>
            <CustomerVehicles />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/customer/appointments" element={
        <ProtectedRoute>
          <Layout>
            <CustomerAppointments />
          </Layout>
        </ProtectedRoute>
      } />

      {/* Admin Customer Management */}
      <Route path="/admin/customers/:id" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <AdminCustomerDetails />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/admin/customers/:id/add-service" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <AddServiceForCustomer />
          </Layout>
        </ProtectedRoute>
      } />

      {/* Accountant routes */}
      <Route path="/accountant/dashboard" element={
        <ProtectedRoute requireAccountant={true}>
          <Layout>
            <AccountantDashboard />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/accountant/payments" element={
        <ProtectedRoute requireAccountant={true}>
          <Layout>
            <AccountantDashboard />
          </Layout>
        </ProtectedRoute>
      } />

      {/* Default redirect */}
      <Route 
        path="*" 
        element={
          <Navigate 
            to={
              loading 
                ? "/login" 
                : isAuthenticated 
                  ? (isAdmin ? "/" : (isAccountant ? "/accountant/dashboard" : "/customer/dashboard"))
                  : "/login"
            } 
            replace 
          />
        } 
      />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App

