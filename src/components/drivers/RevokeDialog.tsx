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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useRevokeIdentification } from '@/hooks/useRevokeIdentification'
import type { TransitDriver } from '@/types/transit'

type RevokeDialogProps = {
  driver: TransitDriver | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RevokeDialog({ driver, open, onOpenChange }: RevokeDialogProps) {
  const revoke = useRevokeIdentification()
  const [notes, setNotes] = useState('')

  function handleOpenChange(next: boolean) {
    if (!next) setNotes('')
    onOpenChange(next)
  }

  async function handleConfirm() {
    if (!driver) return
    try {
      await revoke.mutateAsync({
        id: driver.id,
        payload: {
          notes: notes.trim() || undefined,
        },
      })
      setNotes('')
      onOpenChange(false)
    } catch {
      // toast handled in hook
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton={!revoke.isPending}>
        <DialogHeader>
          <DialogTitle>Suspender identificación</DialogTitle>
          <DialogDescription>
            {driver
              ? `¿Confirmás revocar la identificación de ${driver.fullName}? Esta acción queda registrada en el historial.`
              : '¿Confirmás revocar la identificación?'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <Label htmlFor="revoke-notes">Observaciones (opcional)</Label>
          <Textarea
            id="revoke-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value.slice(0, 500))}
            maxLength={500}
            placeholder="Motivo de la suspensión"
            disabled={revoke.isPending}
            className="min-h-24"
          />
          <p className="text-xs text-muted-foreground">{notes.length}/500</p>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            disabled={revoke.isPending}
            onClick={() => handleOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="min-h-11"
            disabled={!driver || revoke.isPending}
            onClick={() => void handleConfirm()}
          >
            {revoke.isPending ? 'Revocando…' : 'Confirmar suspensión'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
