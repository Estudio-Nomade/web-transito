import type { User } from '@supabase/supabase-js'

export function getUserRole(user: User | null | undefined): string | null {
  if (!user) return null
  const appRole = user.app_metadata?.role
  if (typeof appRole === 'string' && appRole.length > 0) return appRole
  const userRole = user.user_metadata?.role
  if (typeof userRole === 'string' && userRole.length > 0) return userRole
  return null
}

export function isTransitRole(role: string | null | undefined): boolean {
  return role === 'transit'
}
