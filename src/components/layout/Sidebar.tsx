import { SidebarNav } from '@/components/layout/SidebarNav'

export function Sidebar() {
  return (
    <aside className="hidden h-full w-60 shrink-0 flex-col border-r border-border bg-transit-navy md:flex">
      <SidebarNav />
    </aside>
  )
}
