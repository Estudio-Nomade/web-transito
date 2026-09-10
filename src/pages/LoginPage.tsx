import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { getUserRole, isTransitRole } from '@/lib/auth-role'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LiftyLogo } from '@/components/brand/LiftyLogo'

type LocationState = {
  from?: { pathname?: string }
}

export function LoginPage() {
  const { session, isTransit, initialized, loading, signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (initialized && session) {
    if (isTransit) {
      const from = (location.state as LocationState | null)?.from?.pathname
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
      if (!isTransitRole(getUserRole(data.user))) {
        navigate('/unauthorized', { replace: true })
        return
      }
      const from = (location.state as LocationState | null)?.from?.pathname
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

  return (
    <div className="flex min-h-dvh items-center justify-center bg-app-bg p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <LiftyLogo size="lg" className="mb-2 max-h-14" alt="Lifty" />
          <CardTitle>Tránsito · Villa Dolores</CardTitle>
          <CardDescription>Ingresá con tu cuenta de Tránsito</CardDescription>
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
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
