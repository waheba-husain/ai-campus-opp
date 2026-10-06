import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedLayout, PublicLayout } from './components/layout/Layout'

// Pages
import Landing from './pages/Landing'
import AuthPage from './pages/AuthPage'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import OpportunityDetail from './pages/OpportunityDetail'
import Pipeline from './pages/Pipeline'

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<PublicLayout><Landing /></PublicLayout>} />
      <Route path="/auth" element={<PublicLayout><AuthPage /></PublicLayout>} />

      {/* Protected routes */}
      <Route element={<ProtectedLayout />}>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/opportunities/:id" element={<OpportunityDetail />} />
        <Route path="/pipeline" element={<Pipeline />} />
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}