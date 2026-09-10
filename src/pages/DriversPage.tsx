import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { DriverFilters } from '@/components/drivers/DriverFilters'
import { DriverTable } from '@/components/drivers/DriverTable'
import { useDrivers } from '@/hooks/useDrivers'
import type { DriversQuery } from '@/types/transit'

export function DriversPage() {
  const [query, setQuery] = useState<DriversQuery>({})
  const { data, isLoading, isError } = useDrivers(query)

  return (
    <div className="flex flex-col gap-6">
      <Header title="Conductores" />
      <DriverFilters value={query} onChange={setQuery} />
      {isError ? (
        <p className="text-sm text-danger">No se pudo cargar el listado de conductores.</p>
      ) : (
        <>
          <DriverTable drivers={data?.data ?? []} isLoading={isLoading} />
          {data?.meta ? (
            <p className="text-xs text-muted-foreground">
              {data.meta.total} conductor{data.meta.total === 1 ? '' : 'es'}
            </p>
          ) : null}
        </>
      )}
    </div>
  )
}
