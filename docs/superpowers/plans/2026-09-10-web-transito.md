# web-transito Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Lifty Tránsito Villa Dolores internal web panel (login, dashboard KPIs, driver list/detail, pending pickup) with dark theme, Supabase auth role gate, and TanStack Query hooks backed by typed mocks ready to swap to `/api/transit/*`.

**Architecture:** Standalone Vite SPA. Supabase Auth for session; Zustand holds session + role. All data via `src/lib/api/transit.ts` (mock store today, real fetch later). React Router for pages; AppShell sidebar layout for authenticated routes. shadcn/ui + Tailwind dark tokens.

**Tech Stack:** Bun, Vite, React 19, TypeScript, Tailwind CSS v4 or v3 (whatever `shadcn` init picks), shadcn/ui, TanStack Query v5, @supabase/supabase-js, React Router, Zustand, Lucide, date-fns, sonner (toasts).

**Spec:** `docs/superpowers/specs/2026-09-10-web-transito-design.md`

## Global Constraints

- Package manager: **Bun only** (`bun install`, `bun dev`, `bun run build`)
- Repo path: `/home/marti/Documentos/LIfty/web-transito`
- Commits: Conventional Commits (`feat:`, `chore:`, `fix:`, `docs:`)
- Theme: dark mode default; brand colors exact — turquoise `#00C2B3`, navy `#0F2A44`, bg `#0B1220`, success `#22C55E`, danger `#EF4444`
- PII: never show full DNI; only `dniLast4` as `****XXXX`
- Role gate: `role === 'transit'` from `app_metadata.role` then `user_metadata.role`
- API base env: `VITE_API_URL` default `http://localhost:3001/api`
- Spanish UI copy throughout
- Touch targets ≥ 44px
- No monorepo coupling to software-lifty
- No live map, multi-district, CSV, QR, light theme, E2E in v1

## File map (create)

```
package.json, bun.lock, tsconfig*.json, vite.config.ts, index.html
components.json, .env.example, .gitignore, README.md
src/main.tsx
src/App.tsx
src/index.css
src/vite-env.d.ts
src/types/transit.ts
src/lib/utils.ts
src/lib/supabase.ts
src/lib/query-client.ts
src/lib/api.ts
src/lib/api/transit.ts
src/lib/auth-role.ts
src/lib/format.ts
src/mocks/seed-drivers.ts
src/mocks/mock-store.ts
src/stores/authStore.ts
src/hooks/useAuth.ts
src/hooks/useTransitStats.ts
src/hooks/useDrivers.ts
src/hooks/useDriver.ts
src/hooks/useMarkIssued.ts
src/hooks/useRevokeIdentification.ts
src/components/ui/*          # via shadcn
src/components/layout/AppShell.tsx
src/components/layout/Sidebar.tsx
src/components/layout/Header.tsx
src/components/layout/ProtectedRoute.tsx
src/components/drivers/StatusBadges.tsx
src/components/drivers/DriverTable.tsx
src/components/drivers/DriverFilters.tsx
src/components/drivers/MarkIssuedDialog.tsx
src/components/drivers/RevokeDialog.tsx
src/components/drivers/KpiCard.tsx
src/pages/LoginPage.tsx
src/pages/UnauthorizedPage.tsx
src/pages/DashboardPage.tsx
src/pages/DriversPage.tsx
src/pages/DriverDetailPage.tsx
src/pages/PendingPickupPage.tsx
src/lib/format.test.ts       # bun:test pure helpers
```

---

### Task 1: Scaffold Vite + Tailwind + shadcn + core deps

**Files:**
- Create: project root scaffold via CLI
- Create: `.gitignore`, `.env.example`, `README.md` (minimal run section; expand in Task 8)
- Produce: runnable empty app on `bun dev`

**Interfaces:**
- Consumes: none
- Produces: Vite React-TS app with path alias `@/`, Tailwind, shadcn base, deps installed

- [ ] **Step 1: Scaffold Vite React TypeScript with Bun**

```bash
cd /home/marti/Documentos/LIfty
# web-transito already exists with docs/ + .git — scaffold into temp then merge, OR use create in place carefully.
# Preferred: create vite app in place without wiping docs:
cd /home/marti/Documentos/LIfty/web-transito
bun create vite . --template react-ts
# If CLI refuses non-empty dir, scaffold to /tmp/web-transito-scaffold and copy package.json, vite.config.ts, tsconfig*, index.html, src/* into web-transito preserving docs/ and .git
```

Expected: `package.json` with `"dev": "vite"`, `src/App.tsx`, `index.html`.

- [ ] **Step 2: Install runtime + UI deps**

```bash
cd /home/marti/Documentos/LIfty/web-transito
bun add @tanstack/react-query@^5 @supabase/supabase-js zustand react-router-dom lucide-react date-fns sonner clsx tailwind-merge class-variance-authority
bun add -d tailwindcss @tailwindcss/vite @types/node
```

- [ ] **Step 3: Configure Vite path alias and Tailwind**

`vite.config.ts`:

```ts
import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
})
```

Ensure `tsconfig.app.json` / `tsconfig.json` has:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  }
}
```

`src/index.css`:

```css
@import 'tailwindcss';

@theme {
  --color-lifty: #00c2b3;
  --color-transit-navy: #0f2a44;
  --color-app-bg: #0b1220;
  --color-success: #22c55e;
  --color-danger: #ef4444;
  --color-background: #0b1220;
  --color-foreground: #f8fafc;
  --color-card: #0f2a44;
  --color-card-foreground: #f8fafc;
  --color-primary: #00c2b3;
  --color-primary-foreground: #042f2e;
  --color-muted: #1e293b;
  --color-muted-foreground: #94a3b8;
  --color-border: #1e3a5f;
  --color-input: #1e3a5f;
  --color-ring: #00c2b3;
  --color-destructive: #ef4444;
  --color-accent: #134e4a;
  --color-accent-foreground: #f8fafc;
  --color-secondary: #1e293b;
  --color-secondary-foreground: #f8fafc;
  --radius-lg: 0.75rem;
  --radius-md: 0.5rem;
  --radius-sm: 0.375rem;
}

html,
body,
#root {
  height: 100%;
}

body {
  margin: 0;
  background: var(--color-app-bg);
  color: var(--color-foreground);
  font-family:
    ui-sans-serif,
    system-ui,
    -apple-system,
    Segoe UI,
    Roboto,
    sans-serif;
}
```

- [ ] **Step 4: Init shadcn and add required components**

```bash
cd /home/marti/Documentos/LIfty/web-transito
bunx --bun shadcn@latest init -y -b neutral -t neutral
# If interactive prompts appear: TypeScript yes, style default, base color slate/neutral, CSS src/index.css, aliases @/
bunx --bun shadcn@latest add button card input label table badge dialog sheet dropdown-menu separator avatar skeleton scroll-area sonner tooltip select textarea
```

If shadcn overwrites CSS tokens, re-apply brand `@theme` colors from Step 3 after init.

Create `src/lib/utils.ts` if missing:

```ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

- [ ] **Step 5: Env example + gitignore**

`.env.example`:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_URL=http://localhost:3001/api
```

`.gitignore` must include: `node_modules`, `dist`, `.env`, `.env.local`, `*.local`.

- [ ] **Step 6: Smoke run**

```bash
cd /home/marti/Documentos/LIfty/web-transito
bun install
bun run dev
```

Expected: Vite serves on `http://localhost:5173` without errors.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: scaffold vite react-ts tailwind shadcn"
```

---

### Task 2: Types, format helpers, mock store, API layer

**Files:**
- Create: `src/types/transit.ts`
- Create: `src/lib/format.ts`
- Create: `src/lib/format.test.ts`
- Create: `src/lib/api.ts`
- Create: `src/lib/api/transit.ts`
- Create: `src/lib/query-client.ts`
- Create: `src/mocks/seed-drivers.ts`
- Create: `src/mocks/mock-store.ts`
- Create: `src/vite-env.d.ts`

**Interfaces:**
- Consumes: none from UI
- Produces:
  - Types: `TransitDriver`, `TransitStats`, `DriversQuery`, `MarkIssuedPayload`, `RevokePayload`, `DriversListResponse`, `LiftyStatus`, `IdentificationStatus`
  - `formatDniLast4(last4: string): string` → `****${last4}`
  - `formatPlate(plate: string): string`
  - `formatDate(iso?: string): string` (date-fns `dd/MM/yyyy`, es locale or plain)
  - `getTransitStats(): Promise<TransitStats>`
  - `listDrivers(query: DriversQuery): Promise<DriversListResponse>`
  - `getDriver(id: string): Promise<TransitDriver>`
  - `markIssued(id: string, payload: MarkIssuedPayload, actor: { id: string; name: string }): Promise<TransitDriver>`
  - `revokeIdentification(id: string, payload: RevokePayload | undefined, actor: { id: string; name: string }): Promise<TransitDriver>`

- [ ] **Step 1: Write failing tests for format helpers**

`src/lib/format.test.ts`:

```ts
import { describe, expect, test } from 'bun:test'
import { formatDniLast4, matchesDriverSearch } from './format'
import type { TransitDriver } from '@/types/transit'

describe('formatDniLast4', () => {
  test('masks last4', () => {
    expect(formatDniLast4('1234')).toBe('****1234')
  })
})

describe('matchesDriverSearch', () => {
  const driver = {
    id: '1',
    fullName: 'Juan Pérez',
    dniLast4: '5678',
    phone: '3515551234',
    vehicle: { type: 'car', plate: 'AB123CD' },
    liftyStatus: 'approved',
    identificationStatus: 'pending_pickup',
    districtId: 'vd',
    districtName: 'Villa Dolores',
    history: [],
  } as TransitDriver

  test('matches name case-insensitive', () => {
    expect(matchesDriverSearch(driver, 'perez')).toBe(true)
  })

  test('matches plate', () => {
    expect(matchesDriverSearch(driver, 'ab123')).toBe(true)
  })

  test('matches dni last4', () => {
    expect(matchesDriverSearch(driver, '5678')).toBe(true)
  })

  test('empty query matches all', () => {
    expect(matchesDriverSearch(driver, '')).toBe(true)
  })
})
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
cd /home/marti/Documentos/LIfty/web-transito
bun test src/lib/format.test.ts
```

Expected: FAIL module not found / exports missing.

- [ ] **Step 3: Implement types**

`src/types/transit.ts` — exact unions and shapes from spec section 6:

```ts
export type LiftyStatus = 'approved' | 'suspended' | 'rejected' | 'pending_review'
export type IdentificationStatus = 'pending_pickup' | 'issued' | 'revoked'
export type VehicleType = 'car' | 'moto'

export type IdentificationEvent = {
  id: string
  action: 'issued' | 'revoked' | 'reissued'
  at: string
  byUserId: string
  byName: string
  batch?: string
  notes?: string
}

export type TransitDriver = {
  id: string
  fullName: string
  dniLast4: string
  phone?: string
  photoUrl?: string
  vehicle: {
    type: VehicleType
    plate: string
    brand?: string
    model?: string
    color?: string
  }
  liftyStatus: LiftyStatus
  identificationStatus: IdentificationStatus
  issuedAt?: string
  districtId: string
  districtName: string
  documentLinks?: { label: string; url: string }[]
  history: IdentificationEvent[]
}

export type TransitStats = {
  totalDrivers: number
  pendingPickup: number
  issuedThisMonth: number
  suspended: number
}

export type MarkIssuedPayload = {
  batch?: string
  notes?: string
}

export type RevokePayload = {
  notes?: string
}

export type DriversQuery = {
  q?: string
  liftyStatus?: LiftyStatus
  identificationStatus?: IdentificationStatus
  page?: number
  pageSize?: number
}

export type DriversListResponse = {
  data: TransitDriver[]
  meta: { total: number; page: number; pageSize: number }
}
```

- [ ] **Step 4: Implement format helpers**

`src/lib/format.ts`:

```ts
import { format, parseISO, isValid } from 'date-fns'
import type { TransitDriver } from '@/types/transit'

export function formatDniLast4(last4: string): string {
  return `****${last4}`
}

export function formatPlate(plate: string): string {
  return plate.trim().toUpperCase()
}

export function formatDate(iso?: string): string {
  if (!iso) return '—'
  const d = parseISO(iso)
  if (!isValid(d)) return '—'
  return format(d, 'dd/MM/yyyy')
}

export function formatDateTime(iso?: string): string {
  if (!iso) return '—'
  const d = parseISO(iso)
  if (!isValid(d)) return '—'
  return format(d, 'dd/MM/yyyy HH:mm')
}

export function vehicleTypeLabel(type: TransitDriver['vehicle']['type']): string {
  return type === 'moto' ? 'Moto' : 'Auto'
}

export function matchesDriverSearch(driver: TransitDriver, q: string): boolean {
  const needle = q.trim().toLowerCase()
  if (!needle) return true
  const hay = [
    driver.fullName,
    driver.dniLast4,
    driver.phone ?? '',
    driver.vehicle.plate,
  ]
    .join(' ')
    .toLowerCase()
  return hay.includes(needle)
}
```

- [ ] **Step 5: Run format tests — expect PASS**

```bash
bun test src/lib/format.test.ts
```

Expected: all PASS.

- [ ] **Step 6: Seed data + mock store**

`src/mocks/seed-drivers.ts`: export `SEED_DRIVERS: TransitDriver[]` with **at least 12** Villa Dolores drivers:

- Mix `liftyStatus`: mostly `approved`, some `suspended`
- Mix `identificationStatus`: `pending_pickup`, `issued`, `revoked`
- Some with `history` entries and `issuedAt` in current month
- Realistic Spanish names, plates AR-style, dniLast4 4 digits
- `districtId: 'villa-dolores'`, `districtName: 'Villa Dolores'`

`src/mocks/mock-store.ts`:

```ts
import type {
  DriversListResponse,
  DriversQuery,
  MarkIssuedPayload,
  RevokePayload,
  TransitDriver,
  TransitStats,
} from '@/types/transit'
import { matchesDriverSearch } from '@/lib/format'
import { SEED_DRIVERS } from './seed-drivers'

let drivers: TransitDriver[] = structuredClone(SEED_DRIVERS)

function delay(ms = 250) {
  return new Promise((r) => setTimeout(r, ms))
}

function computeStats(list: TransitDriver[]): TransitStats {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  return {
    totalDrivers: list.length,
    pendingPickup: list.filter((d) => d.identificationStatus === 'pending_pickup').length,
    issuedThisMonth: list.filter((d) => {
      if (!d.issuedAt) return false
      const dt = new Date(d.issuedAt)
      return dt.getFullYear() === y && dt.getMonth() === m
    }).length,
    suspended: list.filter((d) => d.liftyStatus === 'suspended').length,
  }
}

export const mockStore = {
  reset() {
    drivers = structuredClone(SEED_DRIVERS)
  },
  async getStats(): Promise<TransitStats> {
    await delay()
    return computeStats(drivers)
  },
  async list(query: DriversQuery = {}): Promise<DriversListResponse> {
    await delay()
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 50
    let filtered = drivers.filter((d) => matchesDriverSearch(d, query.q ?? ''))
    if (query.liftyStatus) filtered = filtered.filter((d) => d.liftyStatus === query.liftyStatus)
    if (query.identificationStatus) {
      filtered = filtered.filter((d) => d.identificationStatus === query.identificationStatus)
    }
    const total = filtered.length
    const start = (page - 1) * pageSize
    const data = filtered.slice(start, start + pageSize)
    return { data, meta: { total, page, pageSize } }
  },
  async get(id: string): Promise<TransitDriver> {
    await delay()
    const d = drivers.find((x) => x.id === id)
    if (!d) {
      const err = new Error('Conductor no encontrado') as Error & { status: number }
      err.status = 404
      throw err
    }
    return structuredClone(d)
  },
  async markIssued(
    id: string,
    payload: MarkIssuedPayload,
    actor: { id: string; name: string },
  ): Promise<TransitDriver> {
    await delay()
    const idx = drivers.findIndex((x) => x.id === id)
    if (idx < 0) {
      const err = new Error('Conductor no encontrado') as Error & { status: number }
      err.status = 404
      throw err
    }
    const now = new Date().toISOString()
    const event = {
      id: crypto.randomUUID(),
      action: 'issued' as const,
      at: now,
      byUserId: actor.id,
      byName: actor.name,
      batch: payload.batch,
      notes: payload.notes,
    }
    const updated: TransitDriver = {
      ...drivers[idx],
      identificationStatus: 'issued',
      issuedAt: now,
      history: [event, ...drivers[idx].history],
    }
    drivers[idx] = updated
    return structuredClone(updated)
  },
  async revoke(
    id: string,
    payload: RevokePayload | undefined,
    actor: { id: string; name: string },
  ): Promise<TransitDriver> {
    await delay()
    const idx = drivers.findIndex((x) => x.id === id)
    if (idx < 0) {
      const err = new Error('Conductor no encontrado') as Error & { status: number }
      err.status = 404
      throw err
    }
    const now = new Date().toISOString()
    const event = {
      id: crypto.randomUUID(),
      action: 'revoked' as const,
      at: now,
      byUserId: actor.id,
      byName: actor.name,
      notes: payload?.notes,
    }
    const updated: TransitDriver = {
      ...drivers[idx],
      identificationStatus: 'revoked',
      history: [event, ...drivers[idx].history],
    }
    drivers[idx] = updated
    return structuredClone(updated)
  },
}
```

- [ ] **Step 7: API client + transit module**

`src/vite-env.d.ts`:

```ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

`src/lib/api.ts`:

```ts
const DEFAULT_API = 'http://localhost:3001/api'

export function getApiBase(): string {
  return import.meta.env.VITE_API_URL || DEFAULT_API
}

/** Real HTTP helper for future swap. Unused by mock path. */
export async function apiFetch<T>(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, ...init } = options
  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const res = await fetch(`${getApiBase()}${path}`, { ...init, headers })
  if (!res.ok) {
    const err = new Error(`API ${res.status}`) as Error & { status: number }
    err.status = res.status
    throw err
  }
  return res.json() as Promise<T>
}
```

`src/lib/api/transit.ts` — **mock implementations with production signatures**:

```ts
import type {
  DriversListResponse,
  DriversQuery,
  MarkIssuedPayload,
  RevokePayload,
  TransitDriver,
  TransitStats,
} from '@/types/transit'
import { mockStore } from '@/mocks/mock-store'

// Swap body of these functions to apiFetch('/transit/...') when backend exists.
// Keep function names and signatures stable for hooks.

export async function getTransitStats(): Promise<TransitStats> {
  return mockStore.getStats()
}

export async function listDrivers(query: DriversQuery = {}): Promise<DriversListResponse> {
  return mockStore.list(query)
}

export async function getDriver(id: string): Promise<TransitDriver> {
  return mockStore.get(id)
}

export async function markIssued(
  id: string,
  payload: MarkIssuedPayload,
  actor: { id: string; name: string },
): Promise<TransitDriver> {
  return mockStore.markIssued(id, payload, actor)
}

export async function revokeIdentification(
  id: string,
  payload: RevokePayload | undefined,
  actor: { id: string; name: string },
): Promise<TransitDriver> {
  return mockStore.revoke(id, payload, actor)
}
```

`src/lib/query-client.ts`:

```ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

export const transitKeys = {
  all: ['transit'] as const,
  stats: () => [...transitKeys.all, 'stats'] as const,
  drivers: (query: unknown) => [...transitKeys.all, 'drivers', query] as const,
  driver: (id: string) => [...transitKeys.all, 'drivers', id] as const,
}
```

- [ ] **Step 8: Commit**

```bash
git add src/types src/lib src/mocks src/vite-env.d.ts
git commit -m "feat: add transit types mocks and api layer"
```

---

### Task 3: Supabase auth, Zustand store, role gate, providers, routing shell

**Files:**
- Create: `src/lib/supabase.ts`
- Create: `src/lib/auth-role.ts`
- Create: `src/stores/authStore.ts`
- Create: `src/hooks/useAuth.ts`
- Create: `src/components/layout/ProtectedRoute.tsx`
- Create: `src/components/layout/AppShell.tsx`
- Create: `src/components/layout/Sidebar.tsx`
- Create: `src/components/layout/Header.tsx`
- Create: `src/pages/LoginPage.tsx`
- Create: `src/pages/UnauthorizedPage.tsx`
- Modify: `src/main.tsx`, `src/App.tsx`

**Interfaces:**
- Consumes: supabase env vars
- Produces:
  - `getUserRole(user): string | null`
  - `useAuthStore` with `{ session, user, role, initialized, setSession, signOut }`
  - `useAuth()` → `{ session, user, role, isTransit, initialized, signIn, signOut, loading }`
  - Routes wired; unauthenticated users see login

- [ ] **Step 1: Supabase client + role helper**

`src/lib/supabase.ts`:

```ts
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anon) {
  console.warn('[supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
}

export const supabase = createClient(url || 'http://localhost', anon || 'public-anon-key')
```

`src/lib/auth-role.ts`:

```ts
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
```

- [ ] **Step 2: Zustand auth store + useAuth**

`src/stores/authStore.ts`:

```ts
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
```

`src/hooks/useAuth.ts`:

```ts
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { isTransitRole } from '@/lib/auth-role'
import { useAuthStore } from '@/stores/authStore'

export function useAuth() {
  const { session, user, role, initialized, setSession, setInitialized, clear } = useAuthStore()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession(data.session)
      setInitialized(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
    })
    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [setSession, setInitialized])

  async function signIn(email: string, password: string) {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      setSession(data.session)
      return data
    } finally {
      setLoading(false)
    }
  }

  async function signOut() {
    setLoading(true)
    try {
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
  }
}
```

**Dev-only auth bypass (optional but recommended for UI without Supabase):**  
If `import.meta.env.DEV && import.meta.env.VITE_DEV_BYPASS_AUTH === 'true'`, `useAuth` may synthesize a fake transit session. Document in README; never enable by default without the env flag. Prefer real Supabase test user when credentials exist.

- [ ] **Step 3: Layout components**

`Sidebar.tsx`: fixed left, logo text “Lifty Tránsito”, subtitle “Villa Dolores”, nav links with Lucide icons (`LayoutDashboard`, `Users`, `PackageOpen`), active state turquoise, bottom user email + logout button min-h-11.

`Header.tsx`: receives `title: string`, optional `children` for actions.

`AppShell.tsx`: flex row sidebar + main (`bg-app-bg`), outlet area with padding.

`ProtectedRoute.tsx`:

```tsx
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { AppShell } from './AppShell'

export function ProtectedRoute() {
  const { initialized, session, isTransit } = useAuth()
  const location = useLocation()

  if (!initialized) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Cargando…
      </div>
    )
  }
  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  if (!isTransit) {
    return <Navigate to="/unauthorized" replace />
  }
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}
```

- [ ] **Step 4: Login + Unauthorized pages**

`LoginPage.tsx`: card centered; fields email/password; submit calls `signIn`; on success navigate to `/` or `state.from`; show Spanish errors (`Credenciales inválidas`). If already session+transit → redirect `/`.

`UnauthorizedPage.tsx`: message “No tenés permisos de Tránsito para este panel.” + botón cerrar sesión.

- [ ] **Step 5: Wire App + main**

`src/main.tsx`:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { queryClient } from '@/lib/query-client'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster theme="dark" richColors position="top-right" />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
```

`src/App.tsx`:

```tsx
import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { LoginPage } from '@/pages/LoginPage'
import { UnauthorizedPage } from '@/pages/UnauthorizedPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { DriversPage } from '@/pages/DriversPage'
import { DriverDetailPage } from '@/pages/DriverDetailPage'
import { PendingPickupPage } from '@/pages/PendingPickupPage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/drivers" element={<DriversPage />} />
        <Route path="/drivers/:id" element={<DriverDetailPage />} />
        <Route path="/pending" element={<PendingPickupPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
```

Stub pages temporarily if needed so build passes:

```tsx
export function DashboardPage() {
  return <div>Dashboard</div>
}
// same pattern for Drivers, Detail, Pending until Task 4–5
```

- [ ] **Step 6: Manual verify routing**

```bash
bun run dev
```

Expected: `/login` renders; protected routes redirect to login without session.

- [ ] **Step 7: Commit**

```bash
git add src
git commit -m "feat: add supabase auth gate and app shell routing"
```

---

### Task 4: Query hooks + Dashboard + Drivers list + Pending

**Files:**
- Create: `src/hooks/useTransitStats.ts`, `useDrivers.ts`, `useDriver.ts`, `useMarkIssued.ts`, `useRevokeIdentification.ts`
- Create: `src/components/drivers/KpiCard.tsx`, `StatusBadges.tsx`, `DriverFilters.tsx`, `DriverTable.tsx`, `MarkIssuedDialog.tsx`
- Create/Replace: `src/pages/DashboardPage.tsx`, `DriversPage.tsx`, `PendingPickupPage.tsx`

**Interfaces:**
- Consumes: `getTransitStats`, `listDrivers`, `transitKeys`, auth actor for mutations
- Produces: working list/search/filter/KPI UI

- [ ] **Step 1: Hooks**

```ts
// useTransitStats.ts
import { useQuery } from '@tanstack/react-query'
import { getTransitStats } from '@/lib/api/transit'
import { transitKeys } from '@/lib/query-client'

export function useTransitStats() {
  return useQuery({ queryKey: transitKeys.stats(), queryFn: getTransitStats })
}

// useDrivers.ts
import { useQuery } from '@tanstack/react-query'
import { listDrivers } from '@/lib/api/transit'
import { transitKeys } from '@/lib/query-client'
import type { DriversQuery } from '@/types/transit'

export function useDrivers(query: DriversQuery) {
  return useQuery({
    queryKey: transitKeys.drivers(query),
    queryFn: () => listDrivers(query),
  })
}

// useDriver.ts
import { useQuery } from '@tanstack/react-query'
import { getDriver } from '@/lib/api/transit'
import { transitKeys } from '@/lib/query-client'

export function useDriver(id: string) {
  return useQuery({
    queryKey: transitKeys.driver(id),
    queryFn: () => getDriver(id),
    enabled: Boolean(id),
  })
}

// useMarkIssued.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { markIssued } from '@/lib/api/transit'
import { transitKeys } from '@/lib/query-client'
import type { MarkIssuedPayload } from '@/types/transit'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'

export function useMarkIssued() {
  const qc = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: MarkIssuedPayload }) =>
      markIssued(id, payload, {
        id: user?.id ?? 'unknown',
        name: (user?.user_metadata?.full_name as string) || user?.email || 'Tránsito',
      }),
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: transitKeys.all })
      toast.success(`Identificación entregada a ${data.fullName}`)
    },
    onError: () => toast.error('No se pudo marcar como entregado'),
  })
}

// useRevokeIdentification.ts — mirror markIssued with revokeIdentification + danger toast
```

- [ ] **Step 2: StatusBadges + KpiCard + DriverFilters + DriverTable**

- `StatusBadges`: Badge variants for Lifty (`approved` green, `suspended` red, etc.) and ID (`pending_pickup` amber, `issued` green, `revoked` red). Spanish labels: Aprobado, Suspendido, Pendiente retiro, Entregada, Revocada.
- `KpiCard`: title, value, icon, optional accent.
- `DriverFilters`: controlled `q` input (debounce 300ms optional), select chips/selects for lifty + identification.
- `DriverTable`: shadcn Table; columns per spec; DNI via `formatDniLast4`; action Link/Button “Ver” → `/drivers/:id`. Loading → Skeleton rows. Empty → “No hay conductores”. On narrow screens (`md` down) render card list with same data.

- [ ] **Step 3: DashboardPage**

Four KPIs from `useTransitStats`; links to `/pending` and `/drivers`. Skeletons while loading.

- [ ] **Step 4: DriversPage**

State for `DriversQuery`; `useDrivers`; `DriverFilters` + `DriverTable`. Header title “Conductores”.

- [ ] **Step 5: PendingPickupPage**

`useDrivers({ identificationStatus: 'pending_pickup' })`; table; optional row button opens `MarkIssuedDialog`.

- [ ] **Step 6: MarkIssuedDialog**

Dialog: fields lote (`batch`), observaciones (`notes` textarea max 500); Confirm calls `useMarkIssued`; disables while pending; closes on success.

- [ ] **Step 7: Manual smoke with DEV bypass or mocks visible after auth**

Verify KPIs numbers match seed; search filters list; pending only pending_pickup.

- [ ] **Step 8: Commit**

```bash
git add src
git commit -m "feat: add dashboard drivers list and pending pickup"
```

---

### Task 5: Driver detail + revoke + polish responsive

**Files:**
- Create: `src/components/drivers/RevokeDialog.tsx`
- Create/Replace: `src/pages/DriverDetailPage.tsx`
- Modify: layout polish if needed (mobile drawer)

**Interfaces:**
- Consumes: `useDriver`, `useMarkIssued`, `useRevokeIdentification`
- Produces: full detail page with history and actions

- [ ] **Step 1: DriverDetailPage**

- `useParams().id` → `useDriver(id)`
- Loading skeleton; 404 empty “Conductor no encontrado” + link back
- Header: avatar (photoUrl or initials), fullName, status badges
- Cards: Datos (phone, DNI masked, district), Vehículo (type label, plate, brand/model/color), Estado Lifty
- History list chronological (already newest-first from mock): date, action, byName, batch, notes
- documentLinks as external anchors `target="_blank" rel="noreferrer"`
- Buttons min-h-11: “Marcar como Entregado” (disabled if already issued unless reissue desired — MVP: enable only if `pending_pickup` or `revoked`), “Suspender identificación” (enable if `issued`)

- [ ] **Step 2: RevokeDialog**

Confirm + optional notes; calls `useRevokeIdentification`.

- [ ] **Step 3: Responsive sidebar**

Below `md`: hamburger in Header opens Sheet with same nav as Sidebar; desktop keeps fixed sidebar.

- [ ] **Step 4: Visual pass**

Ensure bg `#0B1220`, cards navy, primary turquoise buttons, consistent spacing, table readable on tablet width ~768–1024.

- [ ] **Step 5: Commit**

```bash
git add src
git commit -m "feat: add driver detail mark-issued and revoke flows"
```

---

### Task 6: README, build check, final commit + push

**Files:**
- Create/Replace: `README.md`
- Modify: `.env.example` if bypass flag documented

- [ ] **Step 1: README**

Must include:

```markdown
# web-transito

Panel interno Tránsito Villa Dolores (Lifty).

## Stack
Vite, React 19, TypeScript, Tailwind, shadcn/ui, TanStack Query, Supabase Auth, Zustand.

## Setup
```bash
bun install
cp .env.example .env
# fill VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
# optional DEV: VITE_DEV_BYPASS_AUTH=true
bun dev
```

## Scripts
- `bun dev` — http://localhost:5173
- `bun run build`
- `bun run preview`
- `bun test`

## Auth
Users need Supabase account with `app_metadata.role` or `user_metadata.role` = `transit`.

## API
Mocks in `src/mocks`. Swap `src/lib/api/transit.ts` to real `GET/POST /api/transit/*` when backend exists.
```

- [ ] **Step 2: Typecheck + build + tests**

```bash
cd /home/marti/Documentos/LIfty/web-transito
bun test
bun run build
```

Expected: tests pass; `tsc`/vite build succeed with zero errors.

- [ ] **Step 3: Commit and push**

```bash
git add README.md .env.example
git commit -m "docs: add README and finalize web-transito MVP"
git push -u origin HEAD
```

---

## Spec coverage checklist (self-review)

| Spec requirement | Task |
|------------------|------|
| Vite+React19+TS+Tailwind+shadcn | 1 |
| Bun | 1, global |
| Supabase auth + transit role | 3 |
| Folder structure | 1–5 |
| Dark brand tokens | 1, 5 |
| Sidebar shell | 3, 5 |
| Login | 3 |
| Dashboard KPIs | 4 |
| Drivers list search/table | 4 |
| Driver detail + history + actions | 5 |
| Pending pickup | 4 |
| TanStack Query hooks | 4 |
| Mock + swap-ready API | 2 |
| mark-issued / revoke | 4–5 |
| PII DNI last4 | 2, 4–5 |
| Tablet responsive | 4–5 |
| Conventional commits | each task |
| README run instructions | 6 |
| Out of scope excluded | — |

## Type consistency notes

- Query key factory: `transitKeys.stats | drivers | driver`
- API actor always `{ id: string; name: string }`
- Identification statuses only: `pending_pickup | issued | revoked`
- Lifty statuses only: `approved | suspended | rejected | pending_review`
