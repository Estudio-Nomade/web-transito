import { useState, type ReactNode } from 'react'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { SidebarNav } from '@/components/layout/SidebarNav'

type HeaderProps = {
  title: string
  children?: ReactNode
}

export function Header({ title, children }: HeaderProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex min-w-0 items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="min-h-11 min-w-11 shrink-0 md:hidden"
            onClick={() => setOpen(true)}
            aria-label="Abrir menú"
          >
            <Menu className="size-5" />
          </Button>
          <h1 className="truncate text-xl font-semibold tracking-tight text-foreground">{title}</h1>
        </div>
        {children ? <div className="flex flex-wrap items-center gap-2">{children}</div> : null}
      </header>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="left"
          className="w-[min(100%,18rem)] border-border bg-transit-navy p-0 sm:max-w-xs"
          showCloseButton
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Menú de navegación</SheetTitle>
            <SheetDescription>Navegación del panel Lifty Tránsito</SheetDescription>
          </SheetHeader>
          <SidebarNav onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  )
}
