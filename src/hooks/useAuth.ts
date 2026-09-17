import { useCallback, useEffect, useState } from 'react'
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

async function fetchIsTransit(): Promise<boolean> {
  try {
    const me = await apiFetch<AuthMe>('/auth/me')
    return isTransitRole(me.role)
  } catch (err) {
    if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
      return false
    }
    try {
      await apiFetch('/transit/stats')
      return true
    } catch (e) {
      const status = (e as { status?: number }).status
      if (status === 403 || status === 401) return false
      return false
    }
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
    setSession,
    setRole,
    setDistrict,
    setInitialized,
    clear,
  } = useAuthStore()
  const [loading, setLoading] = useState(false)

  const applyMe = useCallback(
    async (setRoleFn: (r: string | null) => void) => {
      const me = await apiFetch<AuthMe>('/auth/me')
      setRoleFn(me.role)
      applyMeDistrict(me, setDistrict)
      return me
    },
    [setDistrict],
  )

  const refreshRole = useCallback(async () => {
    if (DEV_BYPASS) {
      setRole('transit')
      const sel = loadSelectedMunicipio()
      setDistrict(sel?.id ?? null, sel?.name ?? 'Dev')
      return true
    }
    const ok = await fetchIsTransit()
    if (ok) {
      try {
        await applyMe(setRole)
      } catch {
        setRole('transit')
      }
    } else {
      setRole(null)
      setDistrict(null, null)
    }
    return ok
  }, [setRole, setDistrict, applyMe])

  useEffect(() => {
    let mounted = true

    if (DEV_BYPASS) {
      if (!devBypassSignedOut) {
        setSession(createDevBypassSession())
        setRole('transit')
        const sel = loadSelectedMunicipio()
        setDistrict(sel?.id ?? 'dev-district', sel?.name ?? 'Dev')
      }
      setInitialized(true)
      return () => {
        mounted = false
      }
    }

    void supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return
      setSession(data.session)
      if (data.session) {
        const ok = await fetchIsTransit()
        if (!mounted) return
        if (ok) {
          try {
            await applyMe(setRole)
          } catch {
            if (mounted) setRole('transit')
          }
        } else {
          setRole(null)
        }
      }
      if (mounted) setInitialized(true)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      if (!next) {
        setRole(null)
        setDistrict(null, null)
      } else {
        void fetchIsTransit().then(async (ok) => {
          if (!mounted) return
          if (ok) {
            try {
              await applyMe(setRole)
            } catch {
              if (mounted) setRole('transit')
            }
          } else {
            setRole(null)
          }
        })
      }
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [setSession, setRole, setDistrict, setInitialized, applyMe])

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
        return { session: bypass, user: bypass.user }
      }
      if (!isSupabaseConfigured) {
        throw new Error(
          'Supabase no está configurado en este deploy. Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (proyecto Lifty wabdd).',
        )
      }
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      setSession(data.session)
      const ok = await fetchIsTransit()
      if (!ok) {
        await supabase.auth.signOut()
        clear()
        throw new Error('Tu cuenta no tiene rol tránsito/admin en Lifty.')
      }
      try {
        await applyMe(setRole)
      } catch {
        setRole('transit')
      }
      return data
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
    loading,
    signIn,
    signOut,
    refreshRole,
  }
}
