import { useMutation, useQueryClient } from '@tanstack/react-query'
import { markIssued } from '@/lib/api/transit'
import { ApiError } from '@/lib/api'
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
    onError: (err) => {
      if (err instanceof ApiError) {
        const msg =
          err.code === 'PLATFORM_NOT_APPROVED'
            ? 'El conductor aún no está aprobado por plataforma Lifty'
            : err.code === 'NOT_FOUND'
              ? 'Conductor no encontrado'
              : err.code === 'TOKEN_REQUIRED' || err.status === 401
                ? 'Sesión expirada; volvé a iniciar sesión'
                : err.message || `Error ${err.status}`
        toast.error(msg)
        return
      }
      toast.error(err instanceof Error ? err.message : 'No se pudo marcar como entregado')
    },
  })
}
