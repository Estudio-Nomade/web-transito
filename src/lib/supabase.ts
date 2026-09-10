import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL?.trim()
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

/** True when Vite baked real Supabase env into the bundle (required for login). */
export const isSupabaseConfigured = Boolean(url && anon)

if (!isSupabaseConfigured) {
  console.error(
    '[supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Set them in .env (local) or Vercel Project Settings → Environment Variables, then redeploy.',
  )
}

// Placeholder client only so imports don't crash; auth will fail with a clear error.
export const supabase: SupabaseClient = createClient(
  url || 'https://example.supabase.co',
  anon || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder',
)
