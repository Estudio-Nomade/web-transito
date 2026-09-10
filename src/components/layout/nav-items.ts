import { LayoutDashboard, PackageOpen, Users } from 'lucide-react'

export const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/drivers', label: 'Conductores', icon: Users, end: false },
  { to: '/pending', label: 'Retiros pendientes', icon: PackageOpen, end: false },
] as const
