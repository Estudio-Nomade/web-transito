import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { AppShell } from './AppShell'

export function ProtectedRoute() {
  const { initialized, roleReady, session, isTransit } = useAuth()
  const location = useLocation()

  if (!initialized || (session && !roleReady)) {
    return (
      <div className="flex h-full min-h-dvh items-center justify-center text-muted-foreground">
        Cargando…
      </div>
    )
  }
  if (!session) {
    return <Navigate to="/select-municipio" replace state={{ from: location }} />
  }
  if (!isTransit) {
    return <Navigate to="/unauthorized" replace />
  }
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}
