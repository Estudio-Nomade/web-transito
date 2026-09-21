import { useCallback, useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import { getUserRole, isTransitRole } from '@/lib/auth-role'
import { apiFetch, ApiError } from '@/lib/api'
import {
  clearSelectedMunicipio,
  loadSelectedMunicipio,
  saveSelectedMunicipio,
} from '@/lib/municipio-session'
import { useAuthStore } from '@/stores/authStore'

const DEV_BYPASS =
  import.meta.env.DEV && import.meta.env.VITE_DEV_BYPASS_AUTH === 'true'

let devBypassSignedOut = false

type AuthMe = {
  id: string
  role: string
  email?: string | null
  phone?: string | null
  transit_district_id?: string | null
  district_name?: string | null
}

type MeResult =
  | { kind: 'ok'; me: AuthMe }
  | { kind: 'denied' } // 401/403 or role not transit/admin
  | { kind: 'unavailable' } // network / 5xx — do not treat as denied

/** Coalesce concurrent resolveRole for the same access token (signIn + onAuthStateChange). */
const inflightByToken = new Map<string, Promise<boolean>>()

function createDevBypassSession(): Session {
  const now = Math.floor(Date.now() / 1000)
  const user = {
    id: 'dev-bypass-user',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'transito@dev.local',
    email_confirmed_at: new Date().toISOString(),
    phone: '',
    confirmed_at: new Date().toISOString(),
    last_sign_in_at: new Date().toISOString(),
    app_metadata: { provider: 'email', providers: ['email'], role: 'transit' },
    user_metadata: { role: 'transit' },
    identities: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_anonymous: false,
  } as User

  return {
    access_token: 'dev-bypass-access-token',
    refresh_token: 'dev-bypass-refresh-token',
    expires_in: 3600,
    expires_at: now + 3600,
    token_type: 'bearer',
    user,
  }
}

async function fetchMeResult(accessToken?: string | null): Promise<MeResult> {
  try {
    const me = await apiFetch<AuthMe>('/auth/me', { accessToken })
    if (!me || !isTransitRole(me.role)) return { kind: 'denied' }
    return { kind: 'ok', me }
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.status === 401 || err.status === 403) return { kind: 'denied' }
      return { kind: 'unavailable' }
    }
    return { kind: 'unavailable' }
  }
}

function applyMeDistrict(
  me: Pick<AuthMe, 'transit_district_id' | 'district_name'>,
  setDistrict: (id: string | null, name: string | null) => void,
) {
  const id = me.transit_district_id ?? null
  const name = me.district_name ?? null
  setDistrict(id, name)
  if (id && name) {
    saveSelectedMunicipio({ id, name })
  }
}

function applyJwtFallback(
  session: Session,
  setRole: (role: string | null) => void,
  setDistrict: (id: string | null, name: string | null) => void,
): boolean {
  const jwtRole = getUserRole(session.user)
  if (!isTransitRole(jwtRole)) return false
  setRole(jwtRole)
  const sel = loadSelectedMunicipio()
  if (sel?.id) {
    setDistrict(sel.id, sel.name)
  }
  return true
}

export function useAuth() {
  const {
    session,
    user,
    role,
    transitDistrictId,
    districtName,
    initialized,
    roleReady,
    setSession,
    setRole,
    setDistrict,
    setInitialized,
    setRoleReady,
    clear,
  } = useAuthStore()
  const [loading, setLoading] = useState(false)

  const resolveRoleOnce = useCallback(
    async (next: Session | null): Promise<boolean> => {
      setSession(next)
      if (!next) {
        setRole(null)
        setDistrict(null, null)
        setRoleReady(true)
        return false
      }

      setRoleReady(false)

      const result = await fetchMeResult(next.access_token)

      // Session may have been cleared by signOut while we waited.
      const still = useAuthStore.getState().session
      if (!still || still.access_token !== next.access_token) {
        return false
      }

      if (result.kind === 'ok') {
        setRole(result.me.role)
        applyMeDistrict(result.me, setDistrict)
        setRoleReady(true)
        return true
      }

      if (result.kind === 'unavailable') {
        // Transient API failure: keep JWT transit/admin so UI does not flash Acceso denegado.
        const ok = applyJwtFallback(next, setRole, setDistrict)
        if (!ok) {
          setRole(null)
          setDistrict(null, null)
        }
        setRoleReady(true)
        return ok
      }

      // denied
      setRole(null)
      setDistrict(null, null)
      setRoleReady(true)
      return false
    },
    [setSession, setRole, setDistrict, setRoleReady],
  )

  const resolveRole = useCallback(
    async (next: Session | null): Promise<boolean> => {
      if (!next?.access_token) {
        return resolveRoleOnce(next)
      }
      const token = next.access_token
      const existing = inflightByToken.get(token)
      if (existing) return existing

      const promise = resolveRoleOnce(next).finally(() => {
        if (inflightByToken.get(token) === promise) {
          inflightByToken.delete(token)
        }
      })
      inflightByToken.set(token, promise)
      return promise
    },
    [resolveRoleOnce],
  )

  const refreshRole = useCallback(async () => {
    if (DEV_BYPASS) {
      setRole('transit')
      const sel = loadSelectedMunicipio()
      setDistrict(sel?.id ?? null, sel?.name ?? 'Dev')
      setRoleReady(true)
      return true
    }
    return resolveRole(useAuthStore.getState().session)
  }, [setRole, setDistrict, setRoleReady, resolveRole])

  useEffect(() => {
    let mounted = true

    if (DEV_BYPASS) {
      if (!devBypassSignedOut) {
        setSession(createDevBypassSession())
        setRole('transit')
        const sel = loadSelectedMunicipio()
        setDistrict(sel?.id ?? 'dev-district', sel?.name ?? 'Dev')
        setRoleReady(true)
      }
      setInitialized(true)
      return () => {
        mounted = false
      }
    }

    void supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return
      await resolveRole(data.session)
      if (mounted) setInitialized(true)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      void resolveRole(next)
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [setSession, setRole, setDistrict, setInitialized, setRoleReady, resolveRole])

  async function signIn(email: string, password: string) {
    setLoading(true)
    try {
      if (DEV_BYPASS) {
        devBypassSignedOut = false
        const bypass = createDevBypassSession()
        setSession(bypass)
        setRole('transit')
        const sel = loadSelectedMunicipio()
        setDistrict(sel?.id ?? 'dev-district', sel?.name ?? 'Dev')
        setRoleReady(true)
        return { session: bypass, user: bypass.user, isTransit: true }
      }
      if (!isSupabaseConfigured) {
        throw new Error(
          'Supabase no está configurado en este deploy. Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (proyecto Lifty wabdd).',
        )
      }
      const emailNorm = email.trim().toLowerCase()
      const passwordNorm = password.normalize('NFKC').trim()
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailNorm,
        password: passwordNorm,
      })
      if (error) throw error
      if (!data.session) {
        throw new Error('No se pudo iniciar sesión (sin sesión).')
      }

      // Shares inflight with onAuthStateChange(SIGNED_IN) for the same token.
      const ok = await resolveRole(data.session)
      if (!ok) {
        // If store already has transit (another resolve won), treat as success.
        const st = useAuthStore.getState()
        if (st.session && isTransitRole(st.role) && st.roleReady) {
          return { session: data.session, user: data.user, isTransit: true }
        }
        await supabase.auth.signOut()
        clear()
        throw new Error(
          'Tu cuenta no tiene rol tránsito/admin en Lifty (API /auth/me). Si el mail/pass están bien, pedí reset en admin ops.',
        )
      }
      return { session: data.session, user: data.user, isTransit: true }
    } finally {
      setLoading(false)
    }
  }

  async function signOut() {
    setLoading(true)
    try {
      if (DEV_BYPASS) {
        devBypassSignedOut = true
        clear()
        clearSelectedMunicipio()
        setInitialized(true)
        return
      }
      await supabase.auth.signOut()
      clear()
      clearSelectedMunicipio()
    } finally {
      setLoading(false)
    }
  }

  const displayDistrictName = districtName || loadSelectedMunicipio()?.name || null

  return {
    session,
    user,
    role,
    transitDistrictId,
    districtName: displayDistrictName,
    isTransit: isTransitRole(role),
    initialized,
    roleReady,
    loading,
    signIn,
    signOut,
    refreshRole,
  }
}
