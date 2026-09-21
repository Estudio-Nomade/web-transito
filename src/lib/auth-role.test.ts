import { describe, expect, test } from 'bun:test'
import type { Session, User } from '@supabase/supabase-js'
import {
  getRoleFromAccessToken,
  getSessionRole,
  getUserRole,
  isTransitRole,
} from './auth-role'

function user(partial: {
  app?: Record<string, unknown>
  meta?: Record<string, unknown>
}): User {
  return {
    id: 'u1',
    aud: 'authenticated',
    role: 'authenticated',
    email: 't@x.com',
    app_metadata: partial.app ?? {},
    user_metadata: partial.meta ?? {},
    created_at: '',
  } as User
}

function jwtWithAppRole(role: string): string {
  const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }))
  const payload = btoa(
    JSON.stringify({
      sub: 'u1',
      app_metadata: { role },
      user_metadata: {},
    }),
  )
  return `${header}.${payload}.sig`
}

describe('isTransitRole', () => {
  test('accepts transit and admin', () => {
    expect(isTransitRole('transit')).toBe(true)
    expect(isTransitRole('admin')).toBe(true)
  })

  test('rejects driver/passenger/null', () => {
    expect(isTransitRole('driver')).toBe(false)
    expect(isTransitRole('passenger')).toBe(false)
    expect(isTransitRole(null)).toBe(false)
    expect(isTransitRole(undefined)).toBe(false)
  })
})

describe('getUserRole', () => {
  test('prefers app_metadata over user_metadata', () => {
    expect(
      getUserRole(
        user({ app: { role: 'transit' }, meta: { role: 'driver' } }),
      ),
    ).toBe('transit')
  })

  test('falls back to user_metadata', () => {
    expect(getUserRole(user({ meta: { role: 'admin' } }))).toBe('admin')
  })

  test('null when missing', () => {
    expect(getUserRole(user({}))).toBe(null)
    expect(getUserRole(null)).toBe(null)
  })
})

describe('getRoleFromAccessToken', () => {
  test('reads app_metadata.role from JWT payload', () => {
    expect(getRoleFromAccessToken(jwtWithAppRole('transit'))).toBe('transit')
  })

  test('null on garbage', () => {
    expect(getRoleFromAccessToken('not-a-jwt')).toBe(null)
    expect(getRoleFromAccessToken(null)).toBe(null)
  })
})

describe('getSessionRole', () => {
  test('uses JWT when user object has no role metadata', () => {
    const session = {
      access_token: jwtWithAppRole('transit'),
      user: user({}),
    } as Session
    expect(getUserRole(session.user)).toBe(null)
    expect(getSessionRole(session)).toBe('transit')
  })
})
