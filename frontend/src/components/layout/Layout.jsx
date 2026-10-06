import { Outlet } from 'react-router-dom'
import NavBar from './NavBar'
import { RequireAuth } from '../auth/RequireAuth'

/**
 * Protected layout wrapper - all children require authentication
 */
export function ProtectedLayout() {
  return (
    <RequireAuth>
      <div className="min-h-screen bg-slate-50">
        <NavBar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Outlet />
        </main>
      </div>
    </RequireAuth>
  )
}

/**
 * Public layout wrapper - no auth required
 */
export function PublicLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50">
      {children}
    </div>
  )
}