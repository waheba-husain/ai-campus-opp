import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-3 border-primary-500 border-t-transparent" />
      </div>
    )
  }

  if (!user) {
    // Store the attempted location for redirect after login
    return <Navigate to="/auth" state={{ from: location }} replace />
  }

  return children
}