import { beforeEach, describe, expect, test } from 'bun:test'
import type { Session, User } from '@supabase/supabase-js'
import { useAuthStore } from './authStore'

function user(partial: { app?: Record<string, unknown> } = {}): User {
  return {
    id: 'u1',
    aud: 'authenticated',
    role: 'authenticated',
    email: 't@x.com',
    app_metadata: partial.app ?? {},
    user_metadata: {},
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

function session(opts: { token: string; appRole?: string; emptyUserMeta?: boolean }): Session {
  return {
    access_token: opts.token,
    refresh_token: 'r',
    expires_in: 3600,
    token_type: 'bearer',
    user: opts.emptyUserMeta
      ? user({})
      : user({ app: opts.appRole ? { role: opts.appRole } : {} }),
  } as Session
}

describe('authStore setSession roleReady', () => {
  beforeEach(() => {
    useAuthStore.setState({
      session: null,
      user: null,
      role: null,
      transitDistrictId: null,
      districtName: null,
      initialized: false,
      roleReady: false,
    })
  })

  test('JWT transit with empty user meta unlocks roleReady immediately', () => {
    const token = jwtWithAppRole('transit')
    useAuthStore.getState().setSession(
      session({ token, emptyUserMeta: true }),
    )
    const st = useAuthStore.getState()
    expect(st.role).toBe('transit')
    expect(st.roleReady).toBe(true)
  })

  test('same token re-set keeps roleReady true (no spinner loop)', () => {
    const token = jwtWithAppRole('transit')
    const s = session({ token, emptyUserMeta: true })
    useAuthStore.getState().setSession(s)
    useAuthStore.getState().setRoleReady(true)
    useAuthStore.getState().setRole('transit')
    useAuthStore.getState().setSession(s)
    expect(useAuthStore.getState().roleReady).toBe(true)
    expect(useAuthStore.getState().role).toBe('transit')
  })

  test('null session sets roleReady true', () => {
    useAuthStore.getState().setSession(null)
    expect(useAuthStore.getState().roleReady).toBe(true)
    expect(useAuthStore.getState().role).toBe(null)
  })

  test('session without transit role leaves roleReady false', () => {
    const token = jwtWithAppRole('driver')
    useAuthStore.getState().setSession(
      session({ token, appRole: 'driver' }),
    )
    const st = useAuthStore.getState()
    expect(st.role).toBe('driver')
    expect(st.roleReady).toBe(false)
  })
})
