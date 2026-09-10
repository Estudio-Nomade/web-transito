import { describe, expect, test } from 'bun:test'
import { formatDniLast4, matchesDriverSearch } from './format'
import type { TransitDriver } from '@/types/transit'

describe('formatDniLast4', () => {
  test('masks last4', () => {
    expect(formatDniLast4('1234')).toBe('****1234')
  })
})

describe('matchesDriverSearch', () => {
  const driver = {
    id: '1',
    fullName: 'Juan Pérez',
    dniLast4: '5678',
    phone: '3515551234',
    vehicle: { type: 'car', plate: 'AB123CD' },
    liftyStatus: 'approved',
    identificationStatus: 'pending_pickup',
    districtId: 'vd',
    districtName: 'Villa Dolores',
    history: [],
  } as TransitDriver

  test('matches name case-insensitive', () => {
    expect(matchesDriverSearch(driver, 'perez')).toBe(true)
  })

  test('matches plate', () => {
    expect(matchesDriverSearch(driver, 'ab123')).toBe(true)
  })

  test('matches dni last4', () => {
    expect(matchesDriverSearch(driver, '5678')).toBe(true)
  })

  test('empty query matches all', () => {
    expect(matchesDriverSearch(driver, '')).toBe(true)
  })
})
