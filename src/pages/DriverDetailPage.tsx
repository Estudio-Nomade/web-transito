import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { MarkIssuedDialog } from '@/components/drivers/MarkIssuedDialog'
import { RevokeDialog } from '@/components/drivers/RevokeDialog'
import {
  IdentificationStatusBadge,
  LiftyStatusBadge,
} from '@/components/drivers/StatusBadges'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useDriver } from '@/hooks/useDriver'
import {
  formatDateTime,
  formatDniLast4,
  formatPlate,
  vehicleTypeLabel,
} from '@/lib/format'
import type { IdentificationEvent, TransitDriver } from '@/types/transit'

const ACTION_LABELS: Record<IdentificationEvent['action'], string> = {
  issued: 'Entregada',
  revoked: 'Revocada',
  reissued: 'Reemitida',
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase()
}

function vehicleSummary(vehicle: TransitDriver['vehicle']): string {
  const bits = [vehicle.brand, vehicle.model, vehicle.color].filter(Boolean)
  return bits.length > 0 ? bits.join(' · ') : '—'
}

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Skeleton className="size-16 rounded-full" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-5 w-32" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  )
}

export function DriverDetailPage() {
  const { id = '' } = useParams()
  const { data: driver, isLoading, isError, error } = useDriver(id)
  const [markOpen, setMarkOpen] = useState(false)
  const [revokeOpen, setRevokeOpen] = useState(false)

  const notFound =
    isError &&
    ((error as Error & { status?: number })?.status === 404 ||
      error?.message === 'Conductor no encontrado')

  const canMarkIssued =
    driver?.identificationStatus === 'pending_pickup' ||
    driver?.identificationStatus === 'revoked'
  const canRevoke = driver?.identificationStatus === 'issued'

  return (
    <div className="flex flex-col gap-6">
      <Header title="Detalle de conductor">
        <Button asChild variant="outline" className="min-h-11">
          <Link to="/drivers">Volver</Link>
        </Button>
      </Header>

      {isLoading ? <DetailSkeleton /> : null}

      {!isLoading && (notFound || (!driver && isError)) ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">Conductor no encontrado</p>
          <Button asChild className="min-h-11">
            <Link to="/drivers">Volver a conductores</Link>
          </Button>
        </div>
      ) : null}

      {!isLoading && isError && !notFound ? (
        <p className="text-sm text-danger">No se pudo cargar el detalle del conductor.</p>
      ) : null}

      {!isLoading && driver ? (
        <>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <Avatar size="lg" className="size-16 data-[size=lg]:size-16">
                {driver.photoUrl ? (
                  <AvatarImage src={driver.photoUrl} alt={driver.fullName} />
                ) : null}
                <AvatarFallback className="bg-primary/15 text-base font-semibold text-primary">
                  {initialsFromName(driver.fullName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h2 className="truncate text-2xl font-semibold tracking-tight text-foreground">
                  {driver.fullName}
                </h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  <LiftyStatusBadge status={driver.liftyStatus} />
                  <IdentificationStatusBadge status={driver.identificationStatus} />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                className="min-h-11"
                disabled={!canMarkIssued}
                onClick={() => setMarkOpen(true)}
              >
                Marcar como Entregado
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="min-h-11"
                disabled={!canRevoke}
                onClick={() => setRevokeOpen(true)}
              >
                Suspender identificación
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Card className="bg-card">
              <CardHeader>
                <CardTitle>Datos</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Teléfono</p>
                  <p className="font-medium text-foreground">{driver.phone ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">DNI</p>
                  <p className="font-mono font-medium text-foreground">
                    {formatDniLast4(driver.dniLast4)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Distrito</p>
                  <p className="font-medium text-foreground">{driver.districtName}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardHeader>
                <CardTitle>Vehículo</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Tipo</p>
                  <p className="font-medium text-foreground">
                    {vehicleTypeLabel(driver.vehicle.type)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Patente</p>
                  <p className="font-mono font-medium text-foreground">
                    {formatPlate(driver.vehicle.plate)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Marca / modelo / color</p>
                  <p className="font-medium text-foreground">{vehicleSummary(driver.vehicle)}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card md:col-span-2 xl:col-span-1">
              <CardHeader>
                <CardTitle>Estado Lifty</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 text-sm">
                <div className="flex flex-wrap gap-2">
                  <LiftyStatusBadge status={driver.liftyStatus} />
                  <IdentificationStatusBadge status={driver.identificationStatus} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Última entrega</p>
                  <p className="font-medium text-foreground">{formatDateTime(driver.issuedAt)}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {driver.documentLinks && driver.documentLinks.length > 0 ? (
            <Card className="bg-card">
              <CardHeader>
                <CardTitle>Documentos</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {driver.documentLinks.map((doc) => (
                  <Button key={doc.url} asChild variant="outline" className="min-h-11 gap-2">
                    <a href={doc.url} target="_blank" rel="noreferrer">
                      {doc.label}
                      <ExternalLink className="size-4" />
                    </a>
                  </Button>
                ))}
              </CardContent>
            </Card>
          ) : null}

          <Card className="bg-card">
            <CardHeader>
              <CardTitle>Historial de identificación</CardTitle>
            </CardHeader>
            <CardContent>
              {driver.history.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin eventos registrados</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {driver.history.map((evt) => (
                    <li
                      key={evt.id}
                      className="rounded-lg border border-border bg-muted/30 px-4 py-3"
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="font-medium text-foreground">
                          {ACTION_LABELS[evt.action]}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(evt.at)}
                        </p>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Por {evt.byName}
                        {evt.batch ? ` · Lote ${evt.batch}` : ''}
                      </p>
                      {evt.notes ? (
                        <p className="mt-1 text-sm text-foreground">{evt.notes}</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <MarkIssuedDialog driver={driver} open={markOpen} onOpenChange={setMarkOpen} />
          <RevokeDialog driver={driver} open={revokeOpen} onOpenChange={setRevokeOpen} />
        </>
      ) : null}
    </div>
  )
}
