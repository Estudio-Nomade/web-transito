import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useMarkIssued } from '@/hooks/useMarkIssued'
import type { TransitDriver } from '@/types/transit'

type MarkIssuedDialogProps = {
  driver: TransitDriver | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MarkIssuedDialog({ driver, open, onOpenChange }: MarkIssuedDialogProps) {
  const markIssued = useMarkIssued()
  const [batch, setBatch] = useState('')
  const [notes, setNotes] = useState('')

  function handleOpenChange(next: boolean) {
    if (!next) {
      setBatch('')
      setNotes('')
    }
    onOpenChange(next)
  }

  async function handleConfirm() {
    if (!driver) return
    try {
      await markIssued.mutateAsync({
        id: driver.id,
        payload: {
          batch: batch.trim() || undefined,
          notes: notes.trim() || undefined,
        },
      })
      setBatch('')
      setNotes('')
      onOpenChange(false)
    } catch {
      // toast handled in hook
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton={!markIssued.isPending}>
        <DialogHeader>
          <DialogTitle>Marcar como entregado</DialogTitle>
          <DialogDescription>
            {driver
              ? `Registrar entrega de identificación a ${driver.fullName}.`
              : 'Registrar entrega de identificación.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="batch">Lote (opcional)</Label>
            <Input
              id="batch"
              value={batch}
              onChange={(e) => setBatch(e.target.value)}
              placeholder="Ej. LOTE-09-A"
              disabled={markIssued.isPending}
              className="min-h-11"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">Observaciones (opcional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value.slice(0, 500))}
              maxLength={500}
              placeholder="Notas del retiro"
              disabled={markIssued.isPending}
              className="min-h-24"
            />
            <p className="text-xs text-muted-foreground">{notes.length}/500</p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            disabled={markIssued.isPending}
            onClick={() => handleOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            className="min-h-11"
            disabled={!driver || markIssued.isPending}
            onClick={() => void handleConfirm()}
          >
            {markIssued.isPending ? 'Guardando…' : 'Confirmar entrega'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
