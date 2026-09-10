import type {
  DriversListResponse,
  DriversQuery,
  MarkIssuedPayload,
  RevokePayload,
  TransitDriver,
  TransitStats,
} from '@/types/transit'
import { matchesDriverSearch } from '@/lib/format'
import { SEED_DRIVERS } from './seed-drivers'

let drivers: TransitDriver[] = structuredClone(SEED_DRIVERS)

function delay(ms = 250) {
  return new Promise((r) => setTimeout(r, ms))
}

function computeStats(list: TransitDriver[]): TransitStats {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  return {
    totalDrivers: list.length,
    pendingPickup: list.filter((d) => d.identificationStatus === 'pending_pickup').length,
    issuedThisMonth: list.filter((d) => {
      if (!d.issuedAt) return false
      const dt = new Date(d.issuedAt)
      return dt.getFullYear() === y && dt.getMonth() === m
    }).length,
    suspended: list.filter((d) => d.liftyStatus === 'suspended').length,
  }
}

export const mockStore = {
  reset() {
    drivers = structuredClone(SEED_DRIVERS)
  },
  async getStats(): Promise<TransitStats> {
    await delay()
    return computeStats(drivers)
  },
  async list(query: DriversQuery = {}): Promise<DriversListResponse> {
    await delay()
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 50
    let filtered = drivers.filter((d) => matchesDriverSearch(d, query.q ?? ''))
    if (query.liftyStatus) filtered = filtered.filter((d) => d.liftyStatus === query.liftyStatus)
    if (query.identificationStatus) {
      filtered = filtered.filter((d) => d.identificationStatus === query.identificationStatus)
    }
    const total = filtered.length
    const start = (page - 1) * pageSize
    const data = filtered.slice(start, start + pageSize)
    return { data, meta: { total, page, pageSize } }
  },
  async get(id: string): Promise<TransitDriver> {
    await delay()
    const d = drivers.find((x) => x.id === id)
    if (!d) {
      const err = new Error('Conductor no encontrado') as Error & { status: number }
      err.status = 404
      throw err
    }
    return structuredClone(d)
  },
  async markIssued(
    id: string,
    payload: MarkIssuedPayload,
    actor: { id: string; name: string },
  ): Promise<TransitDriver> {
    await delay()
    const idx = drivers.findIndex((x) => x.id === id)
    if (idx < 0) {
      const err = new Error('Conductor no encontrado') as Error & { status: number }
      err.status = 404
      throw err
    }
    const now = new Date().toISOString()
    const event = {
      id: crypto.randomUUID(),
      action: 'issued' as const,
      at: now,
      byUserId: actor.id,
      byName: actor.name,
      batch: payload.batch,
      notes: payload.notes,
    }
    const updated: TransitDriver = {
      ...drivers[idx],
      identificationStatus: 'issued',
      issuedAt: now,
      history: [event, ...drivers[idx].history],
    }
    drivers[idx] = updated
    return structuredClone(updated)
  },
  async revoke(
    id: string,
    payload: RevokePayload | undefined,
    actor: { id: string; name: string },
  ): Promise<TransitDriver> {
    await delay()
    const idx = drivers.findIndex((x) => x.id === id)
    if (idx < 0) {
      const err = new Error('Conductor no encontrado') as Error & { status: number }
      err.status = 404
      throw err
    }
    const now = new Date().toISOString()
    const event = {
      id: crypto.randomUUID(),
      action: 'revoked' as const,
      at: now,
      byUserId: actor.id,
      byName: actor.name,
      notes: payload?.notes,
    }
    const updated: TransitDriver = {
      ...drivers[idx],
      identificationStatus: 'revoked',
      history: [event, ...drivers[idx].history],
    }
    drivers[idx] = updated
    return structuredClone(updated)
  },
}
