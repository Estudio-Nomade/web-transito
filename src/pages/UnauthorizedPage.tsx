import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LiftyLogo } from '@/components/brand/LiftyLogo'

export function UnauthorizedPage() {
  const { signOut, loading, refreshRole, role, session } = useAuth()
  const navigate = useNavigate()
  const [retrying, setRetrying] = useState(false)

  async function onSignOut() {
    await signOut()
    navigate('/select-municipio', { replace: true })
  }

  async function onRetry() {
    setRetrying(true)
    try {
      const ok = await refreshRole()
      if (ok) {
        navigate('/', { replace: true })
      }
    } finally {
      setRetrying(false)
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-app-bg p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <LiftyLogo size="md" onLightPlate plateClassName="mx-auto mb-3" alt="Lifty" />
          <CardTitle>Acceso denegado</CardTitle>
          <CardDescription>
            No tenés permisos de Tránsito para este panel. El rol lo confirma la API (
            <code className="text-xs">/auth/me</code>), no solo el login de Auth.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {session?.user?.email ? (
            <p className="text-center text-xs text-muted-foreground">
              Sesión: <span className="font-mono">{session.user.email}</span>
              {role ? (
                <>
                  {' '}
                  · rol API: <span className="font-mono">{role}</span>
                </>
              ) : (
                ' · sin rol tránsito/admin'
              )}
            </p>
          ) : null}
          <Button
            type="button"
            className="min-h-11 w-full"
            disabled={loading || retrying || !session}
            onClick={() => void onRetry()}
          >
            {retrying ? 'Reintentando…' : 'Reintentar permisos'}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="min-h-11 w-full"
            disabled={loading}
            onClick={() => void onSignOut()}
          >
            Cerrar sesión
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
