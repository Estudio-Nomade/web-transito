import { useQuery } from '@tanstack/react-query'
import { getTransitStats } from '@/lib/api/transit'
import { transitKeys } from '@/lib/query-client'

export function useTransitStats() {
  return useQuery({ queryKey: transitKeys.stats(), queryFn: getTransitStats })
}
