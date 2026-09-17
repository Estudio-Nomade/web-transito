import type { Session, User } from '@supabase/supabase-js'
import { create } from 'zustand'
import { getUserRole } from '@/lib/auth-role'

type AuthState = {
  session: Session | null
  user: User | null
  role: string | null
  transitDistrictId: string | null
  districtName: string | null
  initialized: boolean
  setSession: (session: Session | null) => void
  setRole: (role: string | null) => void
  setDistrict: (districtId: string | null, districtName: string | null) => void
  setInitialized: (v: boolean) => void
  clear: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  role: null,
  transitDistrictId: null,
  districtName: null,
  initialized: false,
  setSession: (session) =>
    set({
      session,
      user: session?.user ?? null,
      // provisional from metadata until API refreshRole / fetchIsTransit
      role: getUserRole(session?.user),
    }),
  setRole: (role) => set({ role }),
  setDistrict: (transitDistrictId, districtName) => set({ transitDistrictId, districtName }),
  setInitialized: (initialized) => set({ initialized }),
  clear: () =>
    set({
      session: null,
      user: null,
      role: null,
      transitDistrictId: null,
      districtName: null,
    }),
}))
