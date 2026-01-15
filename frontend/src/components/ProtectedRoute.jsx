import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function ProtectedRoute({ children, requireAdmin = false, requireAccountant = false }) {
  const { isAuthenticated, isAdmin, isAccountant, loading } = useAuth()

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to={isAccountant ? "/accountant/dashboard" : "/customer/dashboard"} replace />
  }

  if (requireAccountant && !isAccountant) {
    return <Navigate to={isAdmin ? "/" : "/customer/dashboard"} replace />
  }

  return children
}

