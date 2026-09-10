import { Link } from 'react-router-dom'
import { IdCard, UserCheck, Users, UserX } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { KpiCard } from '@/components/drivers/KpiCard'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useTransitStats } from '@/hooks/useTransitStats'

export function DashboardPage() {
  const { data, isLoading, isError } = useTransitStats()

  return (
    <div className="flex flex-col gap-6">
      <Header title="Dashboard">
        <Button asChild variant="outline" className="min-h-11">
          <Link to="/pending">Pendientes</Link>
        </Button>
        <Button asChild className="min-h-11">
          <Link to="/drivers">Conductores</Link>
        </Button>
      </Header>

      {isError ? (
        <p className="text-sm text-danger">No se pudieron cargar las estadísticas.</p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading || !data ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))
        ) : (
          <>
            <KpiCard
              title="Total conductores del distrito"
              value={data.totalDrivers}
              icon={<Users />}
              accent="primary"
            />
            <KpiCard
              title="Pendientes de retirar identificación"
              value={data.pendingPickup}
              icon={<IdCard />}
              accent="amber"
            />
            <KpiCard
              title="Identificaciones entregadas este mes"
              value={data.issuedThisMonth}
              icon={<UserCheck />}
              accent="success"
            />
            <KpiCard
              title="Conductores suspendidos"
              value={data.suspended}
              icon={<UserX />}
              accent="danger"
            />
          </>
        )}
      </div>
    </div>
  )
}
