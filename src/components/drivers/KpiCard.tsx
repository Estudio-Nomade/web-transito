import type { ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type KpiCardProps = {
  title: string
  value: string | number
  icon?: ReactNode
  accent?: 'default' | 'amber' | 'success' | 'danger' | 'primary'
  className?: string
}

const ACCENT: Record<NonNullable<KpiCardProps['accent']>, string> = {
  default: 'text-foreground',
  amber: 'text-amber-400',
  success: 'text-success',
  danger: 'text-danger',
  primary: 'text-primary',
}

export function KpiCard({ title, value, icon, accent = 'default', className }: KpiCardProps) {
  return (
    <Card className={cn('bg-card', className)}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon ? <div className="text-muted-foreground [&_svg]:size-5">{icon}</div> : null}
      </CardHeader>
      <CardContent>
        <p className={cn('text-3xl font-semibold tracking-tight', ACCENT[accent])}>{value}</p>
      </CardContent>
    </Card>
  )
}
