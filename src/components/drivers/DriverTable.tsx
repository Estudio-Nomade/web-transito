import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  IdentificationStatusBadge,
  LiftyStatusBadge,
} from '@/components/drivers/StatusBadges'
import {
  formatDate,
  formatDniLast4,
  formatPlate,
  vehicleTypeLabel,
} from '@/lib/format'
import type { TransitDriver } from '@/types/transit'

type DriverTableProps = {
  drivers: TransitDriver[]
  isLoading?: boolean
  emptyMessage?: string
  rowAction?: (driver: TransitDriver) => ReactNode
}

function DriverRowActions({
  driver,
  rowAction,
}: {
  driver: TransitDriver
  rowAction?: (driver: TransitDriver) => ReactNode
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button asChild variant="outline" size="sm" className="min-h-11 min-w-11 px-3">
        <Link to={`/drivers/${driver.id}`}>Ver</Link>
      </Button>
      {rowAction?.(driver)}
    </div>
  )
}

function DriverCards({
  drivers,
  rowAction,
}: {
  drivers: TransitDriver[]
  rowAction?: (driver: TransitDriver) => ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 md:hidden">
      {drivers.map((d) => (
        <Card key={d.id} size="sm">
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium text-foreground">{d.fullName}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDniLast4(d.dniLast4)} · {formatPlate(d.vehicle.plate)} ·{' '}
                  {vehicleTypeLabel(d.vehicle.type)}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <LiftyStatusBadge status={d.liftyStatus} />
              <IdentificationStatusBadge status={d.identificationStatus} />
            </div>
            <p className="text-xs text-muted-foreground">
              Entrega: {formatDate(d.issuedAt)}
            </p>
            <DriverRowActions driver={d} rowAction={rowAction} />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function LoadingState() {
  return (
    <>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>DNI</TableHead>
              <TableHead>Patente</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Estado Lifty</TableHead>
              <TableHead>Identificación</TableHead>
              <TableHead>Entrega</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 8 }).map((__, j) => (
                  <TableCell key={j}>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-col gap-3 md:hidden">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} size="sm">
            <CardContent className="flex flex-col gap-3">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-8 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  )
}

export function DriverTable({
  drivers,
  isLoading,
  emptyMessage = 'No hay conductores',
  rowAction,
}: DriverTableProps) {
  if (isLoading) return <LoadingState />

  if (drivers.length === 0) {
    return (
      <p className="rounded-xl border border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    )
  }

  return (
    <>
      <div className="hidden md:block rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>DNI</TableHead>
              <TableHead>Patente</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Estado Lifty</TableHead>
              <TableHead>Identificación</TableHead>
              <TableHead>Entrega</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {drivers.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-medium">{d.fullName}</TableCell>
                <TableCell className="font-mono text-muted-foreground">
                  {formatDniLast4(d.dniLast4)}
                </TableCell>
                <TableCell className="font-mono">{formatPlate(d.vehicle.plate)}</TableCell>
                <TableCell>{vehicleTypeLabel(d.vehicle.type)}</TableCell>
                <TableCell>
                  <LiftyStatusBadge status={d.liftyStatus} />
                </TableCell>
                <TableCell>
                  <IdentificationStatusBadge status={d.identificationStatus} />
                </TableCell>
                <TableCell className="text-muted-foreground">{formatDate(d.issuedAt)}</TableCell>
                <TableCell>
                  <DriverRowActions driver={d} rowAction={rowAction} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <DriverCards drivers={drivers} rowAction={rowAction} />
    </>
  )
}
