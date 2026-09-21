import type {
  DriversListResponse,
  DriversQuery,
  IdentificationStatus,
  LiftyStatus,
  MarkIssuedPayload,
  RevokePayload,
  TransitDriver,
  TransitStats,
  VehicleType,
} from '@/types/transit'
import { apiFetch } from '@/lib/api'
import { mockStore } from '@/mocks/mock-store'

const USE_MOCKS =
  import.meta.env.DEV && import.meta.env.VITE_USE_TRANSIT_MOCKS === 'true'

type BackendDriver = {
  id: string
  full_name?: string | null
  phone?: string | null
  document_number_last4?: string | null
  identification_status?: string | null
  identification_issued_at?: string | null
  identification_external_ref?: string | null
  lifty_status?: string | null
  district_id?: string | null
  district_name?: string | null
  plate?: string | null
  vehicle_type?: string | null
  vehicle_brand?: string | null
  vehicle_model?: string | null
  vehicle_color?: string | null
  vehicle?: {
    type?: string
    plate?: string
    brand?: string | null
    model?: string | null
    color?: string | null
  } | null
  history?: unknown[]
}

type BackendList = {
  items: BackendDriver[]
  total: number
  page: number
  page_size: number
}

type BackendStats = {
  total_drivers: number
  pending_pickup: number
  issued_this_month: number
  suspended: number
}

function mapLiftyStatus(raw: string | null | undefined): LiftyStatus {
  if (raw === 'suspended' || raw === 'rejected' || raw === 'pending_review' || raw === 'approved') {
    return raw
  }
  return 'approved'
}

function mapIdentification(raw: string | null | undefined): IdentificationStatus {
  if (raw === 'issued' || raw === 'revoked' || raw === 'pending_pickup') return raw
  return 'pending_pickup'
}

function mapVehicleType(raw: string | null | undefined): VehicleType {
  return raw === 'moto' ? 'moto' : 'car'
}

function adaptDriver(row: BackendDriver): TransitDriver {
  const vehicle = row.vehicle
  return {
    id: row.id,
    fullName: row.full_name?.trim() || 'Sin nombre',
    dniLast4: row.document_number_last4 || '----',
    phone: row.phone ?? undefined,
    vehicle: {
      type: mapVehicleType(vehicle?.type ?? row.vehicle_type),
      plate: vehicle?.plate || row.plate || '—',
      brand: vehicle?.brand ?? row.vehicle_brand ?? undefined,
      model: vehicle?.model ?? row.vehicle_model ?? undefined,
      color: vehicle?.color ?? row.vehicle_color ?? undefined,
    },
    liftyStatus: mapLiftyStatus(row.lifty_status),
    identificationStatus: mapIdentification(row.identification_status),
    issuedAt: row.identification_issued_at ?? undefined,
    districtId: row.district_id || '',
    districtName: row.district_name || '—',
    history: Array.isArray(row.history)
      ? (row.history as TransitDriver['history'])
      : [],
  }
}

function toQuery(query: DriversQuery): string {
  const sp = new URLSearchParams()
  if (query.q) sp.set('q', query.q)
  if (query.identificationStatus) sp.set('identification_status', query.identificationStatus)
  if (query.page) sp.set('page', String(query.page))
  if (query.pageSize) sp.set('page_size', String(query.pageSize))
  const s = sp.toString()
  return s ? `?${s}` : ''
}

export type TransitDistrict = {
  id: string
  name: string
  province: string
  status?: string
}

export async function listTransitDistricts(): Promise<{ items: TransitDistrict[] }> {
  // Mocks only when explicitly enabled — single sample district (mirrors ops-with-operator shape).
  if (USE_MOCKS) {
    return {
      items: [{ id: 'mock-vd', name: 'Villa Dolores', province: 'Córdoba', status: 'active' }],
    }
  }
  const raw = await apiFetch<{ items: TransitDistrict[] }>('/transit/districts', {
    optionalAuth: true,
  })
  return { items: raw.items ?? [] }
}

export async function getTransitStats(): Promise<TransitStats> {
  if (USE_MOCKS) return mockStore.getStats()
  const raw = await apiFetch<BackendStats>('/transit/stats')
  return {
    totalDrivers: raw.total_drivers,
    pendingPickup: raw.pending_pickup,
    issuedThisMonth: raw.issued_this_month,
    suspended: raw.suspended,
  }
}

export async function listDrivers(query: DriversQuery = {}): Promise<DriversListResponse> {
  if (USE_MOCKS) return mockStore.list(query)
  const raw = await apiFetch<BackendList>(`/transit/drivers${toQuery(query)}`)
  return {
    data: (raw.items ?? []).map(adaptDriver),
    meta: {
      total: raw.total ?? 0,
      page: raw.page ?? query.page ?? 1,
      pageSize: raw.page_size ?? query.pageSize ?? 50,
    },
  }
}

export async function getDriver(id: string): Promise<TransitDriver> {
  if (USE_MOCKS) return mockStore.get(id)
  const raw = await apiFetch<BackendDriver>(`/transit/drivers/${id}`)
  return adaptDriver(raw)
}

export async function markIssued(
  id: string,
  payload: MarkIssuedPayload,
  _actor: { id: string; name: string },
): Promise<TransitDriver> {
  if (USE_MOCKS) return mockStore.markIssued(id, payload, _actor)
  await apiFetch(`/transit/drivers/${id}/identification/issue`, {
    method: 'POST',
    body: JSON.stringify({
      batch: payload.batch,
      external_ref: payload.batch,
      notes: payload.notes,
    }),
  })
  return getDriver(id)
}

export async function revokeIdentification(
  id: string,
  payload: RevokePayload | undefined,
  actor: { id: string; name: string },
): Promise<TransitDriver> {
  if (USE_MOCKS) return mockStore.revoke(id, payload, actor)
  // Backend revoke deferred MVP — surface clear error
  throw new Error('Revoke no disponible aún en API; contactá ops Lifty')
}
