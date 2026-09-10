import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function UnauthorizedPage() {
  const { signOut, loading } = useAuth()

  return (
    <div className="flex min-h-dvh items-center justify-center bg-app-bg p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
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
            onClick={() => void signOut()}
          >
            Cerrar sesión
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
