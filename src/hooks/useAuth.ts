import { useCallback, useEffect, useRef, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import { isTransitRole } from '@/lib/auth-role'
import { apiFetch, ApiError } from '@/lib/api'
import { clearSelectedMunicipio, loadSelectedMunicipio, saveSelectedMunicipio } from '@/lib/municipio-session'
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

async function fetchMe(accessToken?: string | null): Promise<AuthMe | null> {
  try {
    return await apiFetch<AuthMe>('/auth/me', { accessToken })
  } catch (err) {
    // Do NOT fall back to /transit/stats: 403 can mean "no municipality" with valid role.
    if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
      return null
    }
    return null
  }
}

function applyMeDistrict(
  me: AuthMe,
  setDistrict: (id: string | null, name: string | null) => void,
) {
  const id = me.transit_district_id ?? null
  const name = me.district_name ?? null
  setDistrict(id, name)
  if (id && name) {
    saveSelectedMunicipio({ id, name })
  }
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
  const resolveGen = useRef(0)

  const resolveRole = useCallback(
    async (next: Session | null): Promise<boolean> => {
      const gen = ++resolveGen.current
      setSession(next)
      if (!next) {
        // Only the latest resolve may clear ready state
        if (gen !== resolveGen.current) return false
        setRole(null)
        setDistrict(null, null)
        setRoleReady(true)
        return false
      }
      setRoleReady(false)
      // Use token from the session callback — getSession() races during auth transitions.
      let ok = false
      try {
        const me = await fetchMe(next.access_token)
        // Stale resolve: a newer one is in flight — do not touch roleReady (newer owns it).
        if (gen !== resolveGen.current) return false
        if (!me || !isTransitRole(me.role)) {
          setRole(null)
          setDistrict(null, null)
          ok = false
        } else {
          setRole(me.role)
          applyMeDistrict(me, setDistrict)
          ok = true
        }
      } catch {
        if (gen !== resolveGen.current) return false
        setRole(null)
        setDistrict(null, null)
        ok = false
      }
      if (gen === resolveGen.current) setRoleReady(true)
      return ok
    },
    [setSession, setRole, setDistrict, setRoleReady],
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
      // Fire-and-forget; resolveRole serializes via resolveGen
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
      const ok = await resolveRole(data.session)
      if (!ok) {
        await supabase.auth.signOut()
        clear()
        throw new Error('Tu cuenta no tiene rol tránsito/admin en Lifty.')
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

  const displayDistrictName =
    districtName || loadSelectedMunicipio()?.name || null

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
