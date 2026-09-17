import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { listTransitDistricts, type TransitDistrict } from '@/lib/api/transit'
import { FALLBACK_MUNICIPIOS } from '@/lib/municipio-credentials'
import { saveSelectedMunicipio } from '@/lib/municipio-session'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LiftyLogo } from '@/components/brand/LiftyLogo'

export function SelectMunicipioPage() {
  const { session, isTransit, initialized, districtName } = useAuth()
  const navigate = useNavigate()
  const [items, setItems] = useState<TransitDistrict[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    void (async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await listTransitDistricts()
        if (!mounted) return
        setItems(res.items.length > 0 ? res.items : FALLBACK_MUNICIPIOS)
      } catch {
        if (!mounted) return
        setItems(FALLBACK_MUNICIPIOS)
        setError('No se pudo cargar la lista desde el servidor; mostrando municipios conocidos.')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  if (initialized && session && isTransit) {
    return <Navigate to="/" replace />
  }

  function onSelect(d: TransitDistrict) {
    saveSelectedMunicipio({ id: d.id, name: d.name, province: d.province })
    navigate(`/login?district=${encodeURIComponent(d.id)}`, {
      state: { districtId: d.id, districtName: d.name },
    })
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-app-bg p-4 sm:p-6">
      <Card className="w-full max-w-lg">
        <CardHeader className="items-center text-center">
          <LiftyLogo size="lg" onLightPlate plateClassName="mx-auto mb-3" alt="Lifty" />
          <CardTitle>Elegí tu municipio</CardTitle>
          <CardDescription>
            Panel de Tránsito Lifty. Seleccioná el municipio para ingresar con la cuenta local.
            {districtName ? ` (última sesión: ${districtName})` : null}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Cargando municipios…</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {items.map((d) => (
                <li key={d.id}>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-auto min-h-12 w-full justify-start gap-3 px-4 py-3 text-left"
                    onClick={() => onSelect(d)}
                  >
                    <MapPin className="size-5 shrink-0 text-primary" aria-hidden />
                    <span className="flex min-w-0 flex-col">
                      <span className="font-medium text-foreground">{d.name}</span>
                      {d.province ? (
                        <span className="text-xs text-muted-foreground">{d.province}</span>
                      ) : null}
                    </span>
                  </Button>
                </li>
              ))}
            </ul>
          )}
          {error ? <p className="mt-3 text-xs text-muted-foreground">{error}</p> : null}
        </CardContent>
      </Card>
    </div>
  )
}
