import { useParams } from 'react-router-dom'
import { Header } from '@/components/layout/Header'

export function DriverDetailPage() {
  const { id } = useParams()

  return (
    <div className="flex flex-col gap-6">
      <Header title="Detalle de conductor" />
      <p className="text-sm text-muted-foreground">Conductor {id}</p>
    </div>
  )
}
