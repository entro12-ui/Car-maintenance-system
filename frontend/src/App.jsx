import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Customers from './pages/Customers'
import CustomerCreation from './pages/CustomerCreation'
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
import GarageProformaInvoice from './pages/GarageProformaInvoice'
import GarageDiscountRateEntry from './pages/GarageDiscountRateEntry'
import GarageCancelReturnInvoice from './pages/GarageCancelReturnInvoice'
import GarageClearUncollectedSales from './pages/GarageClearUncollectedSales'
import GarageCancelVrvEntry from './pages/GarageCancelVrvEntry'
import GarageInvoicePrint from './pages/GarageInvoicePrint'
import GarageInvoicesHub from './pages/GarageInvoicesHub'
import GarageEstimationTemplate from './pages/GarageEstimationTemplate'
import SystemSettings from './pages/SystemSettings'
import Technicians from './pages/Technicians'
import GlJournals from './pages/GlJournals'
import GarageSetupHub from './pages/GarageSetupHub'
import TaskOperations from './pages/TaskOperations'
import CreditNoteEntry from './pages/CreditNoteEntry'
import JobEstimation from './pages/JobEstimation'
import AdvancedBooking from './pages/AdvancedBooking'
import GarageReportsHub from './pages/GarageReportsHub'
import GarageListingReports from './pages/GarageListingReports'
import GarageSalesReports from './pages/GarageSalesReports'
import GarageProductivityReports from './pages/GarageProductivityReports'
import GarageOtherReports from './pages/GarageOtherReports'
import GarageReportRun from './pages/GarageReportRun'
import EnterpriseAdmin from './pages/EnterpriseAdmin'
import CompanySetup from './pages/CompanySetup'
import WorkOrderCreation from './pages/WorkOrderCreation'
import GlAccountSetup from './pages/GlAccountSetup'
import GlobalParameters from './pages/GlobalParameters'
import NameValueParameter from './pages/NameValueParameter'
import PlateNumberMaintenance from './pages/PlateNumberMaintenance'
import VehicleModelSetup from './pages/VehicleModelSetup'
import SubletSupplierMaintenance from './pages/SubletSupplierMaintenance'
import JobTypeHourlyRateSetup from './pages/JobTypeHourlyRateSetup'
import ConsumableChargeSetup from './pages/ConsumableChargeSetup'
import BlockReleaseJobOrder from './pages/BlockReleaseJobOrder'
import CanceledJobsRegistry from './pages/CanceledJobsRegistry'
import JobTypeAllowedByUser from './pages/JobTypeAllowedByUser'
import UtilitiesHub from './pages/UtilitiesHub'
import UtilitiesToolPage from './pages/UtilitiesToolPage'
import SetupHub from './pages/SetupHub'
import SetupToolPage from './pages/SetupToolPage'
import TaskHub from './pages/TaskHub'
import TaskToolPage from './pages/TaskToolPage'
import ReportsHub from './pages/ReportsHub'
import ReportsToolPage from './pages/ReportsToolPage'
import TransactionHub from './pages/TransactionHub'
import TransactionToolPage from './pages/TransactionToolPage'
import EnquiryHub from './pages/EnquiryHub'
import EnquiryToolPage from './pages/EnquiryToolPage'
import MaintenanceHub from './pages/MaintenanceHub'
import MaintenanceToolPage from './pages/MaintenanceToolPage'
import FileHub from './pages/FileHub'
import FileToolPage from './pages/FileToolPage'
import CloseJobOrder from './pages/CloseJobOrder'
import JobOrderQualityCheckSheet from './pages/JobOrderQualityCheckSheet'
import ReopenJobOrder from './pages/ReopenJobOrder'
import DeliverJobOrder from './pages/DeliverJobOrder'
import ReceiveAssembledJob from './pages/ReceiveAssembledJob'
import CopyJobOrder from './pages/CopyJobOrder'
import SplitJobOrder from './pages/SplitJobOrder'
import PairingJobOrder from './pages/PairingJobOrder'
import JournalEntryListing from './pages/JournalEntryListing'
import Inventory from './pages/Inventory'

function AppRoutes() {
  const { isAuthenticated, isAdmin, isAccountant, loading } = useAuth()

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="auth-mesh relative flex min-h-screen flex-col items-center justify-center gap-6 px-6">
        <div className="pointer-events-none absolute inset-0 auth-mesh-glow opacity-80" aria-hidden />
        <div className="relative z-10 flex flex-col items-center gap-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 font-display text-xl font-bold text-white shadow-xl shadow-primary/30">
            CS
          </div>
          <div className="relative h-10 w-10">
            <div
              className="absolute inset-0 rounded-full border-2 border-primary/20"
              aria-hidden
            />
            <div className="absolute inset-0 animate-spin-slow rounded-full border-2 border-transparent border-t-primary-600 border-r-primary-500/40" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">Loading your workspace…</p>
        </div>
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
      <Route path="/customers/creation" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <CustomerCreation />
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
      <Route path="/work-order-creation" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <WorkOrderCreation />
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
      <Route path="/job-orders/additional-charges/other-charge-setup" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <AdditionalChargesSetup initialSection="other" />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/job-orders/additional-charges/lubricants-and-fuel" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <AdditionalChargesSetup initialSection="fuel" />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/job-orders/additional-charges/miscellaneous-charges" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <AdditionalChargesSetup initialSection="misc" />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/job-orders/additional-charges/sublet-work-type" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <AdditionalChargesSetup initialSection="sublet" />
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
      <Route path="/garage-invoices/proforma" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <GarageProformaInvoice />
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
      <Route path="/garage-invoices/estimation-template" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <GarageEstimationTemplate />
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
      <Route path="/company-setup" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <CompanySetup />
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
      <Route path="/global-parameters" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <GlobalParameters />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/name-value-parameter" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <NameValueParameter />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/plate-number-maintenance" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <PlateNumberMaintenance />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/vehicle-model-setup" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <VehicleModelSetup />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/job-type-hourly-rate" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <JobTypeHourlyRateSetup />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/sublet-supplier-maintenance" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <SubletSupplierMaintenance />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/consumable-charge-setup" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <ConsumableChargeSetup />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/block-release-job-order" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <BlockReleaseJobOrder />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/canceled-jobs-registry" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <CanceledJobsRegistry />
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
      <Route path="/job-type-allowed-by-user" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <JobTypeAllowedByUser />
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
      <Route path="/garage-reports-hub/listing" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <GarageListingReports />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/garage-reports-hub/sales" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <GarageSalesReports />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/garage-reports-hub/productivity" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <GarageProductivityReports />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/garage-reports-hub/others" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <GarageOtherReports />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/garage-reports/run/:reportId" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <GarageReportRun />
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
      <Route path="/gl-account-setup" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <GlAccountSetup />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/utilities" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <UtilitiesHub />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/utilities/:slug" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <UtilitiesToolPage />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/setup" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <SetupHub />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/setup/:slug" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <SetupToolPage />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/file-hub" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <FileHub />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/file/:slug" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <FileToolPage />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/maintenance-hub" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <MaintenanceHub />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/maintenance/:slug" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <MaintenanceToolPage />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/tasks" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <TaskHub />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/tasks/:slug" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <TaskToolPage />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/transactions-hub" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <TransactionHub />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/transactions/:slug" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <TransactionToolPage />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/enquiries-hub" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <EnquiryHub />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/enquiries/:slug" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <EnquiryToolPage />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/reports-hub" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <ReportsHub />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/reports-hub/:slug" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <ReportsToolPage />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/garage-invoices-hub" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <GarageInvoicesHub />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/close-job-order" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <CloseJobOrder />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/job-order-quality-check-sheet" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <JobOrderQualityCheckSheet />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/reopen-job-order" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <ReopenJobOrder />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/deliver-job-order" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <DeliverJobOrder />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/receive-assembled-job" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <ReceiveAssembledJob />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/copy-job-order" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <CopyJobOrder />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/split-job-order" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <SplitJobOrder />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/pairing-job-order" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <PairingJobOrder />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/journal-entry-listing" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <JournalEntryListing />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/inventory" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <Inventory />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/inventory-count" element={
        <ProtectedRoute requireAdmin={true}>
          <Navigate to="/inventory" replace />
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

