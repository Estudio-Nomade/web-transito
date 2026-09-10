import { NavLink } from 'react-router-dom'
import { LayoutDashboard, LogOut, PackageOpen, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/drivers', label: 'Conductores', icon: Users, end: false },
  { to: '/pending', label: 'Retiros pendientes', icon: PackageOpen, end: false },
] as const

export function Sidebar() {
  const { user, signOut, loading } = useAuth()

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-border bg-transit-navy">
      <div className="border-b border-border px-4 py-5">
        <p className="text-base font-semibold tracking-tight text-foreground">Lifty Tránsito</p>
        <p className="mt-0.5 text-xs text-muted-foreground">Villa Dolores</p>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex min-h-11 items-center gap-2.5 rounded-lg px-3 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
              )
            }
          >
            <Icon className="size-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-border p-3">
        <p className="mb-2 truncate px-1 text-xs text-muted-foreground" title={user?.email ?? undefined}>
          {user?.email ?? '—'}
        </p>
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full min-h-11 justify-start gap-2"
          disabled={loading}
          onClick={() => void signOut()}
        >
          <LogOut className="size-4" />
          Cerrar sesión
        </Button>
      </div>
    </aside>
  )
}
