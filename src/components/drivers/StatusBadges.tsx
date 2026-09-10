import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { IdentificationStatus, LiftyStatus } from '@/types/transit'

const LIFTY_LABELS: Record<LiftyStatus, string> = {
  approved: 'Aprobado',
  suspended: 'Suspendido',
  rejected: 'Rechazado',
  pending_review: 'En revisión',
}

const LIFTY_CLASS: Record<LiftyStatus, string> = {
  approved: 'border-transparent bg-success/15 text-success',
  suspended: 'border-transparent bg-danger/15 text-danger',
  rejected: 'border-transparent bg-danger/15 text-danger',
  pending_review: 'border-transparent bg-amber-500/15 text-amber-400',
}

const ID_LABELS: Record<IdentificationStatus, string> = {
  pending_pickup: 'Pendiente retiro',
  issued: 'Entregada',
  revoked: 'Revocada',
}

const ID_CLASS: Record<IdentificationStatus, string> = {
  pending_pickup: 'border-transparent bg-amber-500/15 text-amber-400',
  issued: 'border-transparent bg-success/15 text-success',
  revoked: 'border-transparent bg-danger/15 text-danger',
}

export function LiftyStatusBadge({ status }: { status: LiftyStatus }) {
  return (
    <Badge variant="outline" className={cn(LIFTY_CLASS[status])}>
      {LIFTY_LABELS[status]}
    </Badge>
  )
}

export function IdentificationStatusBadge({ status }: { status: IdentificationStatus }) {
  return (
    <Badge variant="outline" className={cn(ID_CLASS[status])}>
      {ID_LABELS[status]}
    </Badge>
  )
}
