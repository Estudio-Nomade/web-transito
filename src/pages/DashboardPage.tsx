import { Header } from '@/components/layout/Header'

export function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <Header title="Dashboard" />
      <p className="text-sm text-muted-foreground">Dashboard</p>
    </div>
  )
}
