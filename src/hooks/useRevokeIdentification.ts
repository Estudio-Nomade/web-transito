import { useMutation, useQueryClient } from '@tanstack/react-query'
import { revokeIdentification } from '@/lib/api/transit'
import { transitKeys } from '@/lib/query-client'
import type { RevokePayload } from '@/types/transit'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'

export function useRevokeIdentification() {
  const qc = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload?: RevokePayload }) =>
      revokeIdentification(id, payload, {
        id: user?.id ?? 'unknown',
        name: (user?.user_metadata?.full_name as string) || user?.email || 'Tránsito',
      }),
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: transitKeys.all })
      toast.error(`Identificación revocada de ${data.fullName}`)
    },
    onError: () => toast.error('No se pudo revocar la identificación'),
  })
}
