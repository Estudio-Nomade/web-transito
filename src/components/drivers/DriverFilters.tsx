import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { DriversQuery, IdentificationStatus, LiftyStatus } from '@/types/transit'

type DriverFiltersProps = {
  value: DriversQuery
  onChange: (next: DriversQuery) => void
  hideIdentificationFilter?: boolean
}

const ALL = '__all__'

export function DriverFilters({
  value,
  onChange,
  hideIdentificationFilter = false,
}: DriverFiltersProps) {
  const [qInput, setQInput] = useState(value.q ?? '')

  useEffect(() => {
    const t = window.setTimeout(() => {
      const next = qInput.trim()
      if ((value.q ?? '') === next) return
      onChange({ ...value, q: next || undefined, page: 1 })
    }, 300)
    return () => window.clearTimeout(t)
  }, [qInput, onChange, value])

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <Input
        value={qInput}
        onChange={(e) => setQInput(e.target.value)}
        placeholder="Buscar por nombre, DNI, patente o teléfono"
        className="min-h-11 w-full sm:max-w-sm"
        aria-label="Buscar conductores"
      />

      <Select
        value={value.liftyStatus ?? ALL}
        onValueChange={(v) =>
          onChange({
            ...value,
            liftyStatus: v === ALL ? undefined : (v as LiftyStatus),
            page: 1,
          })
        }
      >
        <SelectTrigger className="min-h-11 w-full sm:w-44" aria-label="Estado Lifty">
          <SelectValue placeholder="Estado Lifty" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todos Lifty</SelectItem>
          <SelectItem value="approved">Aprobado</SelectItem>
          <SelectItem value="suspended">Suspendido</SelectItem>
          <SelectItem value="rejected">Rechazado</SelectItem>
          <SelectItem value="pending_review">En revisión</SelectItem>
        </SelectContent>
      </Select>

      {!hideIdentificationFilter ? (
        <Select
          value={value.identificationStatus ?? ALL}
          onValueChange={(v) =>
            onChange({
              ...value,
              identificationStatus: v === ALL ? undefined : (v as IdentificationStatus),
              page: 1,
            })
          }
        >
          <SelectTrigger className="min-h-11 w-full sm:w-48" aria-label="Estado identificación">
            <SelectValue placeholder="Estado identificación" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todas identificaciones</SelectItem>
            <SelectItem value="pending_pickup">Pendiente retiro</SelectItem>
            <SelectItem value="issued">Entregada</SelectItem>
            <SelectItem value="revoked">Revocada</SelectItem>
          </SelectContent>
        </Select>
      ) : null}
    </div>
  )
}
