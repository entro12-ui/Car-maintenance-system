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
      <Route path="/service-checklists" element={
        <ProtectedRoute requireAdmin={true}>
          <Layout>
            <ManageServiceChecklists />
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

