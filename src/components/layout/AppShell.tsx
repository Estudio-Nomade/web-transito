import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'

type AppShellProps = {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex h-full min-h-dvh w-full bg-app-bg">
      <Sidebar />
      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto p-4 sm:p-6">
        {children}
      </main>
    </div>
  )
}
