import type {
  DriversListResponse,
  DriversQuery,
  MarkIssuedPayload,
  RevokePayload,
  TransitDriver,
  TransitStats,
} from '@/types/transit'
import { mockStore } from '@/mocks/mock-store'

// Swap body of these functions to apiFetch('/transit/...') when backend exists.
// Keep function names and signatures stable for hooks.

export async function getTransitStats(): Promise<TransitStats> {
  return mockStore.getStats()
}

export async function listDrivers(query: DriversQuery = {}): Promise<DriversListResponse> {
  return mockStore.list(query)
}

export async function getDriver(id: string): Promise<TransitDriver> {
  return mockStore.get(id)
}

export async function markIssued(
  id: string,
  payload: MarkIssuedPayload,
  actor: { id: string; name: string },
): Promise<TransitDriver> {
  return mockStore.markIssued(id, payload, actor)
}

export async function revokeIdentification(
  id: string,
  payload: RevokePayload | undefined,
  actor: { id: string; name: string },
): Promise<TransitDriver> {
  return mockStore.revoke(id, payload, actor)
}
