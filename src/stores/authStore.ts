import type { Session, User } from '@supabase/supabase-js'
import { create } from 'zustand'
import { getSessionRole } from '@/lib/auth-role'

type AuthState = {
  session: Session | null
  user: User | null
  role: string | null
  transitDistrictId: string | null
  districtName: string | null
  initialized: boolean
  /** False while session exists but /auth/me role check is still in flight. */
  roleReady: boolean
  setSession: (session: Session | null) => void
  setRole: (role: string | null) => void
  setDistrict: (districtId: string | null, districtName: string | null) => void
  setInitialized: (v: boolean) => void
  setRoleReady: (v: boolean) => void
  clear: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  role: null,
  transitDistrictId: null,
  districtName: null,
  initialized: false,
  roleReady: false,
  setSession: (session) =>
    set({
      session,
      user: session?.user ?? null,
      // provisional from user object or JWT claims until /auth/me finishes
      role: getSessionRole(session),
      roleReady: false,
    }),
  setRole: (role) => set({ role }),
  setDistrict: (transitDistrictId, districtName) => set({ transitDistrictId, districtName }),
  setInitialized: (initialized) => set({ initialized }),
  setRoleReady: (roleReady) => set({ roleReady }),
  clear: () =>
    set({
      session: null,
      user: null,
      role: null,
      transitDistrictId: null,
      districtName: null,
      roleReady: true,
    }),
}))
