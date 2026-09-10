import { Header } from '@/components/layout/Header'

export function PendingPickupPage() {
  return (
    <div className="flex flex-col gap-6">
      <Header title="Retiros pendientes" />
      <p className="text-sm text-muted-foreground">Retiros pendientes</p>
    </div>
  )
}
