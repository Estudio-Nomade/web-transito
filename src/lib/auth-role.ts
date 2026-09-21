import type { Session, User } from '@supabase/supabase-js'

export function getUserRole(user: User | null | undefined): string | null {
  if (!user) return null
  const appRole = user.app_metadata?.role
  if (typeof appRole === 'string' && appRole.length > 0) return appRole
  const userRole = user.user_metadata?.role
  if (typeof userRole === 'string' && userRole.length > 0) return userRole
  return null
}

/**
 * Role from JWT access_token claims. session.user.app_metadata is often empty
 * after storage rehydrate even when the token carries app_metadata.role=transit.
 */
export function getRoleFromAccessToken(accessToken: string | null | undefined): string | null {
  if (!accessToken) return null
  try {
    const parts = accessToken.split('.')
    if (parts.length < 2) return null
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4))
    const json = atob(b64 + pad)
    const payload = JSON.parse(json) as {
      app_metadata?: { role?: unknown }
      user_metadata?: { role?: unknown }
      role?: unknown
    }
    const appRole = payload.app_metadata?.role
    if (typeof appRole === 'string' && appRole.length > 0) return appRole
    const userRole = payload.user_metadata?.role
    if (typeof userRole === 'string' && userRole.length > 0) return userRole
    return null
  } catch {
    return null
  }
}

/** Prefer API/user object; fall back to JWT claims on the access token. */
export function getSessionRole(session: Session | null | undefined): string | null {
  if (!session) return null
  return getUserRole(session.user) ?? getRoleFromAccessToken(session.access_token)
}

/** Transit panel: municipal transit role or Lifty admin support. */
export function isTransitRole(role: string | null | undefined): boolean {
  return role === 'transit' || role === 'admin'
}
