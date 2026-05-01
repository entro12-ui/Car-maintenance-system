import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function ProtectedRoute({ children, requireAdmin = false, requireAccountant = false }) {
  const { isAuthenticated, isAdmin, isAccountant, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-muted-foreground">Checking your session…</p>
      </div>
    )
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

