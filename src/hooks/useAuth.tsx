import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import { getSessionRole, isTransitRole } from '@/lib/auth-role'
import { apiFetch, ApiError } from '@/lib/api'
import {
  clearSelectedMunicipio,
  loadSelectedMunicipio,
  saveSelectedMunicipio,
} from '@/lib/municipio-session'
import { useAuthStore } from '@/stores/authStore'

const DEV_BYPASS =
  import.meta.env.DEV && import.meta.env.VITE_DEV_BYPASS_AUTH === 'true'

/** /auth/me must not block the panel forever (ProtectedRoute waits on roleReady). */
const ME_TIMEOUT_MS = 8_000

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
  | { kind: 'denied' }
  | { kind: 'unavailable' }

/** Coalesce concurrent resolveRole for the same access token (signIn + onAuthStateChange). */
const inflightByToken = new Map<string, Promise<boolean>>()

type AuthContextValue = {
  session: Session | null
  user: User | null
  role: string | null
  transitDistrictId: string | null
  districtName: string | null
  isTransit: boolean
  initialized: boolean
  roleReady: boolean
  loading: boolean
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ session: Session; user: User | null; isTransit: boolean }>
  signOut: () => Promise<void>
  refreshRole: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextValue | null>(null)

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

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = window.setTimeout(() => reject(new Error('timeout')), ms)
    promise.then(
      (v) => {
        window.clearTimeout(t)
        resolve(v)
      },
      (e) => {
        window.clearTimeout(t)
        reject(e)
      },
    )
  })
}

async function fetchMeResult(accessToken?: string | null): Promise<MeResult> {
  try {
    const me = await withTimeout(
      apiFetch<AuthMe>('/auth/me', { accessToken }),
      ME_TIMEOUT_MS,
    )
    if (!me || !isTransitRole(me.role)) return { kind: 'denied' }
    return { kind: 'ok', me }
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.status === 401 || err.status === 403) return { kind: 'denied' }
      return { kind: 'unavailable' }
    }
    // network / timeout / abort → treat as unavailable (JWT fallback)
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

/**
 * Allow panel access from JWT claims when /auth/me is down, flaky, or returns
 * a non-transit role while Auth app_metadata still says transit (ops reset path).
 */
function applyJwtFallback(
  session: Session,
  setRole: (role: string | null) => void,
  setDistrict: (id: string | null, name: string | null) => void,
): boolean {
  const jwtRole = getSessionRole(session)
  if (!isTransitRole(jwtRole)) return false
  setRole(jwtRole as string)
  const sel = loadSelectedMunicipio()
  if (sel?.id) {
    setDistrict(sel.id, sel.name)
  }
  return true
}

async function resolveRoleOnce(next: Session | null): Promise<boolean> {
  const {
    setSession,
    setRole,
    setDistrict,
    setRoleReady,
  } = useAuthStore.getState()

  const prev = useAuthStore.getState().session
  const sameToken =
    !!next?.access_token && prev?.access_token === next.access_token

  setSession(next)

  if (!next) {
    setRole(null)
    setDistrict(null, null)
    setRoleReady(true)
    return false
  }

  // Provisional from JWT so UI never sits as "sin rol" / infinite Cargando
  // while /auth/me is in flight or hanging.
  const provisional = getSessionRole(next)
  const provisionalOk = isTransitRole(provisional)
  if (provisionalOk) {
    setRole(provisional)
    // Unlock ProtectedRoute immediately — refine district/role from API below.
    setRoleReady(true)
  } else if (!sameToken || !useAuthStore.getState().roleReady) {
    // New session without JWT transit: block until me/fallback settles.
    setRoleReady(false)
  }

  const result = await fetchMeResult(next.access_token)

  const still = useAuthStore.getState().session
  if (!still || still.access_token !== next.access_token) {
    // Superseded — never leave the *current* session stuck if we were the last
    // writer for this token; current owner will finish its own resolve.
    return isTransitRole(useAuthStore.getState().role)
  }

  if (result.kind === 'ok') {
    setRole(result.me.role)
    applyMeDistrict(result.me, setDistrict)
    setRoleReady(true)
    return true
  }

  // API denied or unavailable: if JWT still says transit/admin, allow entry.
  // Hard deny only when neither API nor JWT grants transit.
  const ok = applyJwtFallback(next, setRole, setDistrict)
  if (!ok) {
    // Only clear role on hard deny when API explicitly denied, or JWT empty.
    // If API was unavailable and JWT empty, keep provisional null + ready.
    setRole(null)
    setDistrict(null, null)
  }
  setRoleReady(true)
  return ok
}

async function resolveRole(next: Session | null): Promise<boolean> {
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
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const session = useAuthStore((s) => s.session)
  const user = useAuthStore((s) => s.user)
  const role = useAuthStore((s) => s.role)
  const transitDistrictId = useAuthStore((s) => s.transitDistrictId)
  const districtName = useAuthStore((s) => s.districtName)
  const initialized = useAuthStore((s) => s.initialized)
  const roleReady = useAuthStore((s) => s.roleReady)
  const setSession = useAuthStore((s) => s.setSession)
  const setRole = useAuthStore((s) => s.setRole)
  const setDistrict = useAuthStore((s) => s.setDistrict)
  const setInitialized = useAuthStore((s) => s.setInitialized)
  const setRoleReady = useAuthStore((s) => s.setRoleReady)
  const clear = useAuthStore((s) => s.clear)

  const [loading, setLoading] = useState(false)

  const refreshRole = useCallback(async () => {
    if (DEV_BYPASS) {
      setRole('transit')
      const sel = loadSelectedMunicipio()
      setDistrict(sel?.id ?? null, sel?.name ?? 'Dev')
      setRoleReady(true)
      return true
    }
    const current = useAuthStore.getState().session
    if (!current) return false
    // Bust coalesce cache so retry always hits /auth/me again.
    inflightByToken.delete(current.access_token)
    return resolveRole(current)
  }, [setRole, setDistrict, setRoleReady])

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
    // Single bootstrap — store setters are stable zustand refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const signIn = useCallback(
    async (email: string, password: string) => {
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

        const ok = await resolveRole(data.session)
        if (!ok) {
          const st = useAuthStore.getState()
          if (st.session && isTransitRole(st.role) && st.roleReady) {
            return { session: data.session, user: data.user, isTransit: true }
          }
          // Last chance: JWT claims on the fresh session (do not sign out if transit).
          if (isTransitRole(getSessionRole(data.session))) {
            setRole(getSessionRole(data.session))
            setRoleReady(true)
            return { session: data.session, user: data.user, isTransit: true }
          }
          await supabase.auth.signOut()
          clear()
          throw new Error(
            'Tu cuenta no tiene rol tránsito/admin en Lifty (JWT ni /auth/me). Pedí alta/reset en admin ops.',
          )
        }
        return { session: data.session, user: data.user, isTransit: true }
      } finally {
        setLoading(false)
      }
    },
    [setSession, setRole, setDistrict, setRoleReady, clear],
  )

  const signOut = useCallback(async () => {
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
  }, [clear, setInitialized])

  const displayDistrictName = districtName || loadSelectedMunicipio()?.name || null

  const value = useMemo<AuthContextValue>(
    () => ({
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
    }),
    [
      session,
      user,
      role,
      transitDistrictId,
      displayDistrictName,
      initialized,
      roleReady,
      loading,
      signIn,
      signOut,
      refreshRole,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
