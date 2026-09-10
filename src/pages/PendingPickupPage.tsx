import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { DriverTable } from '@/components/drivers/DriverTable'
import { MarkIssuedDialog } from '@/components/drivers/MarkIssuedDialog'
import { Button } from '@/components/ui/button'
import { useDrivers } from '@/hooks/useDrivers'
import type { TransitDriver } from '@/types/transit'

export function PendingPickupPage() {
  const { data, isLoading, isError } = useDrivers({
    identificationStatus: 'pending_pickup',
  })
  const [selected, setSelected] = useState<TransitDriver | null>(null)
  const [open, setOpen] = useState(false)

  return (
    <div className="flex flex-col gap-6">
      <Header title="Retiros pendientes" />
      {isError ? (
        <p className="text-sm text-danger">No se pudo cargar el listado de pendientes.</p>
      ) : null}
      <DriverTable
        drivers={data?.data ?? []}
        isLoading={isLoading}
        emptyMessage="No hay retiros pendientes"
        rowAction={(driver) => (
          <Button
            type="button"
            size="sm"
            className="min-h-11"
            onClick={() => {
              setSelected(driver)
              setOpen(true)
            }}
          >
            Entregar
          </Button>
        )}
      />
      {data?.meta ? (
        <p className="text-xs text-muted-foreground">
          {data.meta.total} pendiente{data.meta.total === 1 ? '' : 's'}
        </p>
      ) : null}
      <MarkIssuedDialog
        driver={selected}
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (!next) setSelected(null)
        }}
      />
    </div>
  )
}
