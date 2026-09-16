import { useCallback, useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import { isTransitRole } from '@/lib/auth-role'
import { apiFetch, ApiError } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'

const DEV_BYPASS =
  import.meta.env.DEV && import.meta.env.VITE_DEV_BYPASS_AUTH === 'true'

let devBypassSignedOut = false

type AuthMe = {
  id: string
  role: string
  email?: string | null
  phone?: string | null
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

export function useAuth() {
  const {
    session,
    user,
    role,
    initialized,
    setSession,
    setRole,
    setInitialized,
    clear,
  } = useAuthStore()
  const [loading, setLoading] = useState(false)

  const refreshRole = useCallback(async () => {
    if (DEV_BYPASS) {
      setRole('transit')
      return true
    }
    const ok = await fetchIsTransit()
    if (ok) {
      try {
        const me = await apiFetch<AuthMe>('/auth/me')
        setRole(me.role)
      } catch {
        setRole('transit')
      }
    } else {
      setRole(null)
    }
    return ok
  }, [setRole])

  useEffect(() => {
    let mounted = true

    if (DEV_BYPASS) {
      if (!devBypassSignedOut) {
        setSession(createDevBypassSession())
        setRole('transit')
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
            const me = await apiFetch<AuthMe>('/auth/me')
            if (mounted) setRole(me.role)
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
      } else {
        void fetchIsTransit().then(async (ok) => {
          if (!mounted) return
          if (ok) {
            try {
              const me = await apiFetch<AuthMe>('/auth/me')
              if (mounted) setRole(me.role)
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
  }, [setSession, setRole, setInitialized])

  async function signIn(email: string, password: string) {
    setLoading(true)
    try {
      if (DEV_BYPASS) {
        devBypassSignedOut = false
        const bypass = createDevBypassSession()
        setSession(bypass)
        setRole('transit')
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
        const me = await apiFetch<AuthMe>('/auth/me')
        setRole(me.role)
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
        setInitialized(true)
        return
      }
      await supabase.auth.signOut()
      clear()
    } finally {
      setLoading(false)
    }
  }

  return {
    session,
    user,
    role,
    isTransit: isTransitRole(role),
    initialized,
    loading,
    signIn,
    signOut,
    refreshRole,
  }
}
