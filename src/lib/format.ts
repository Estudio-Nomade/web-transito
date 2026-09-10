import { format, parseISO, isValid } from 'date-fns'
import type { TransitDriver } from '@/types/transit'

export function formatDniLast4(last4: string): string {
  return `****${last4}`
}

export function formatPlate(plate: string): string {
  return plate.trim().toUpperCase()
}

export function formatDate(iso?: string): string {
  if (!iso) return '—'
  const d = parseISO(iso)
  if (!isValid(d)) return '—'
  return format(d, 'dd/MM/yyyy')
}

export function formatDateTime(iso?: string): string {
  if (!iso) return '—'
  const d = parseISO(iso)
  if (!isValid(d)) return '—'
  return format(d, 'dd/MM/yyyy HH:mm')
}

export function vehicleTypeLabel(type: TransitDriver['vehicle']['type']): string {
  return type === 'moto' ? 'Moto' : 'Auto'
}

function normalizeSearch(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
}

export function matchesDriverSearch(driver: TransitDriver, q: string): boolean {
  const needle = normalizeSearch(q)
  if (!needle) return true
  const hay = normalizeSearch(
    [driver.fullName, driver.dniLast4, driver.phone ?? '', driver.vehicle.plate].join(' '),
  )
  return hay.includes(needle)
}
