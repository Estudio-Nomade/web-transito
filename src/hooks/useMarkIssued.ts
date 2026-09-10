import { useMutation, useQueryClient } from '@tanstack/react-query'
import { markIssued } from '@/lib/api/transit'
import { transitKeys } from '@/lib/query-client'
import type { MarkIssuedPayload } from '@/types/transit'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'

export function useMarkIssued() {
  const qc = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: MarkIssuedPayload }) =>
      markIssued(id, payload, {
        id: user?.id ?? 'unknown',
        name: (user?.user_metadata?.full_name as string) || user?.email || 'Tránsito',
      }),
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: transitKeys.all })
      toast.success(`Identificación entregada a ${data.fullName}`)
    },
    onError: () => toast.error('No se pudo marcar como entregado'),
  })
}
