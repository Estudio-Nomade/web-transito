import { useMemo, useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { isTransitRole } from '@/lib/auth-role'
import { useAuthStore } from '@/stores/authStore'
import { defaultEmailForMunicipio } from '@/lib/municipio-credentials'
import {
  clearSelectedMunicipio,
  loadSelectedMunicipio,
  saveSelectedMunicipio,
} from '@/lib/municipio-session'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LiftyLogo } from '@/components/brand/LiftyLogo'

type LocationState = {
  from?: { pathname?: string }
  districtId?: string
  districtName?: string
}

export function LoginPage() {
  const { session, isTransit, initialized, loading, signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const state = location.state as LocationState | null

  const selected = useMemo(() => {
    const fromStore = loadSelectedMunicipio()
    const id = state?.districtId || searchParams.get('district') || fromStore?.id
    const name = state?.districtName || fromStore?.name
    if (id && name) {
      saveSelectedMunicipio({ id, name, province: fromStore?.province })
      return { id, name }
    }
    if (fromStore) return fromStore
    return null
  }, [state?.districtId, state?.districtName, searchParams])

  const [email, setEmail] = useState(() =>
    selected?.name ? defaultEmailForMunicipio(selected.name) : '',
  )
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (initialized && !selected) {
    return <Navigate to="/select-municipio" replace />
  }

  if (initialized && session) {
    if (isTransit) {
      const from = state?.from?.pathname
      return <Navigate to={from && from !== '/login' ? from : '/'} replace />
    }
    return <Navigate to="/unauthorized" replace />
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      const data = await signIn(email.trim(), password)
      if (!data.user) {
        setError('No se pudo iniciar sesión (sin usuario).')
        return
      }
      // SoT is /auth/me (store.role), not JWT app_metadata — Auth UI often omits role claim
      const roleAfter = useAuthStore.getState().role
      if (!isTransitRole(roleAfter)) {
        navigate('/unauthorized', { replace: true })
        return
      }
      const from = state?.from?.pathname
      navigate(from && from !== '/login' ? from : '/', { replace: true })
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      if (/invalid login credentials/i.test(msg)) {
        setError('Credenciales inválidas')
      } else if (/supabase no está configurado/i.test(msg)) {
        setError(msg)
      } else if (msg) {
        setError(msg)
      } else {
        setError('No se pudo iniciar sesión. Revisá red y configuración.')
      }
    }
  }

  if (!initialized) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-muted-foreground">
        Cargando…
      </div>
    )
  }

  const municipioLabel = selected?.name ?? 'Municipio'

  return (
    <div className="flex min-h-dvh items-center justify-center bg-app-bg p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <LiftyLogo size="lg" onLightPlate plateClassName="mx-auto mb-3" alt="Lifty" />
          <CardTitle>Tránsito · {municipioLabel}</CardTitle>
          <CardDescription>Ingresá con la cuenta de este municipio</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={(e) => void onSubmit(e)}>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="min-h-11"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="min-h-11"
              />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit" className="min-h-11 w-full" disabled={loading}>
              {loading ? 'Ingresando…' : 'Ingresar'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="min-h-11 w-full"
              asChild
            >
              <Link
                to="/select-municipio"
                onClick={() => clearSelectedMunicipio()}
              >
                Cambiar municipio
              </Link>
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
