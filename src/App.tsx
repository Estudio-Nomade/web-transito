import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { LoginPage } from '@/pages/LoginPage'
import { SelectMunicipioPage } from '@/pages/SelectMunicipioPage'
import { UnauthorizedPage } from '@/pages/UnauthorizedPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { DriversPage } from '@/pages/DriversPage'
import { DriverDetailPage } from '@/pages/DriverDetailPage'
import { PendingPickupPage } from '@/pages/PendingPickupPage'

export default function App() {
  return (
    <Routes>
      <Route path="/select-municipio" element={<SelectMunicipioPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/drivers" element={<DriversPage />} />
        <Route path="/drivers/:id" element={<DriverDetailPage />} />
        <Route path="/pending" element={<PendingPickupPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
