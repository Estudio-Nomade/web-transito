import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LiftyLogo } from '@/components/brand/LiftyLogo'

export function UnauthorizedPage() {
  const { signOut, loading } = useAuth()
  const navigate = useNavigate()

  async function onSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-app-bg p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <LiftyLogo size="md" className="mb-2 max-h-10" alt="Lifty" />
          <CardTitle>Acceso denegado</CardTitle>
          <CardDescription>
            No tenés permisos de Tránsito para este panel.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
