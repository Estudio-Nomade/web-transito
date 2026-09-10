import { useQuery } from '@tanstack/react-query'
import { listDrivers } from '@/lib/api/transit'
import { transitKeys } from '@/lib/query-client'
import type { DriversQuery } from '@/types/transit'

export function useDrivers(query: DriversQuery) {
  return useQuery({
    queryKey: transitKeys.drivers(query),
    queryFn: () => listDrivers(query),
  })
}
