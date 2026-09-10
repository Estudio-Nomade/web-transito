import type { Session, User } from '@supabase/supabase-js'
import { create } from 'zustand'
import { getUserRole } from '@/lib/auth-role'

type AuthState = {
  session: Session | null
  user: User | null
  role: string | null
  initialized: boolean
  setSession: (session: Session | null) => void
  setInitialized: (v: boolean) => void
  clear: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  role: null,
  initialized: false,
  setSession: (session) =>
    set({
      session,
      user: session?.user ?? null,
      role: getUserRole(session?.user),
    }),
  setInitialized: (initialized) => set({ initialized }),
  clear: () => set({ session: null, user: null, role: null }),
}))
