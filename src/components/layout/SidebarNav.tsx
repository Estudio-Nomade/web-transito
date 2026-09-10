import { NavLink } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { navItems } from '@/components/layout/nav-items'
import { LiftyLogo } from '@/components/brand/LiftyLogo'

type SidebarNavProps = {
  onNavigate?: () => void
  className?: string
}

export function SidebarNav({ onNavigate, className }: SidebarNavProps) {
  const { user, signOut, loading } = useAuth()

  return (
    <div className={cn('flex h-full flex-col', className)}>
      <div className="border-b border-border px-4 py-5">
        <LiftyLogo size="sm" onLightPlate plateClassName="mb-2" alt="Lifty" />
        <p className="text-sm font-semibold tracking-tight text-foreground">Tránsito</p>
        <p className="mt-0.5 text-xs text-muted-foreground">Villa Dolores</p>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
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
    </div>
  )
}
