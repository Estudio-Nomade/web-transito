import { useQuery } from '@tanstack/react-query'
import { getDriver } from '@/lib/api/transit'
import { transitKeys } from '@/lib/query-client'

export function useDriver(id: string) {
  return useQuery({
    queryKey: transitKeys.driver(id),
    queryFn: () => getDriver(id),
    enabled: Boolean(id),
  })
}
