# Design: web-transito (panel Tránsito Villa Dolores)

**Fecha:** 2026-09-10  
**Estado:** aprobado para plan de implementación  
**Repo:** `/home/marti/Documentos/LIfty/web-transito` (independiente de `software-lifty`)  
**Contexto previo:** `software-lifty/docs/brainstorms/2026-04-02-admin-panel-y-transito-logos.md`

## 1. Problem / Goal

Herramienta interna para personal de **Tránsito de Villa Dolores**. No es un panel de conductores online en tiempo real.

Es un **registro de conductores habilitados por Lifty** para que inspectores verifiquen rápido:

1. Si el conductor tiene papeles en regla (estado Lifty).
2. Si ya retiró stickers/logos de identificación comercial (estado identificación).

## 2. Decisions locked

| Tema | Decisión |
|------|----------|
| Ubicación | Repo separado en `web-transito`, no monorepo |
| Enfoque | SPA Vite “oficial” desde cero (no template admin, no shared package con backend) |
| Package manager | Bun |
| Auth | Supabase Auth directo (email + password); JWT Bearer al backend Lifty |
| Rol | Solo `role === 'transit'` (app_metadata o user_metadata) |
| Datos MVP | Mocks tipados + hooks TanStack Query listos para API real |
| Package manager scripts | `bun dev` / `bun install` |
| Tema | Dark mode por defecto |
| Distrito MVP | Villa Dolores (single-district; sin switcher multi-municipio) |

## 3. Stack

- Vite + React 19 + TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Query v5
- Supabase JS (`@supabase/supabase-js`) — auth (+ client listo por si hace falta DB directa después)
- React Router v7 (o v6 estable según scaffold Vite)
- Lucide React
- date-fns
- Zustand (sesión UI / auth gate)
- Bun

## 4. Architecture

```
Browser (tablet/notebook)
  └─ web-transito (Vite SPA)
       ├─ Supabase Auth  → session + role gate
       └─ HTTP Bearer    → Lifty API (VITE_API_URL)
                            hoy: mocks en src/mocks/
                            mañana: GET/POST /api/transit/*
```

### Folder structure

```
src/
  components/
    layout/          # AppShell, Sidebar, Header, ProtectedRoute
    drivers/         # DriverTable, DriverFilters, StatusBadges, MarkIssuedDialog
    ui/              # shadcn primitives
  pages/
    LoginPage.tsx
    DashboardPage.tsx
    DriversPage.tsx
    DriverDetailPage.tsx
    PendingPickupPage.tsx
    UnauthorizedPage.tsx
  hooks/
    useAuth.ts
    useTransitStats.ts
    useDrivers.ts
    useDriver.ts
    useMarkIssued.ts
    useRevokeIdentification.ts
  lib/
    supabase.ts
    api.ts           # fetch wrapper + Bearer
    query-client.ts
    utils.ts         # cn(), mask helpers
  stores/
    authStore.ts
  types/
    transit.ts
  mocks/
    drivers.ts
    stats.ts
    mock-store.ts    # in-memory mutations for MVP
  App.tsx
  main.tsx
  index.css
```

### Auth flow

1. `signInWithPassword({ email, password })` via Supabase.
2. Zustand `authStore` + `onAuthStateChange` keep session.
3. `ProtectedRoute`:
   - no session → `/login`
   - session but role ≠ `transit` → `/unauthorized`
   - ok → app shell
4. API client attaches `Authorization: Bearer <access_token>`.
5. Logout: `supabase.auth.signOut()` + clear store.

Role source (configurable helper, try in order):

1. `user.app_metadata.role`
2. `user.user_metadata.role`

### Routing

| Path | Page | Auth |
|------|------|------|
| `/login` | Login | public |
| `/unauthorized` | Sin acceso | session required |
| `/` | Dashboard | transit |
| `/drivers` | Lista | transit |
| `/drivers/:id` | Detalle | transit |
| `/pending` | Pendientes retiro | transit |

## 5. UX / Visual

### Brand tokens

| Token | Hex | Uso |
|-------|-----|-----|
| Lifty turquoise | `#00C2B3` | primary CTA, accents, active nav |
| Transit navy | `#0F2A44` | sidebar, cards elevated |
| App bg | `#0B1220` | page background |
| Success | `#22C55E` | issued / approved |
| Danger | `#EF4444` | revoked / suspended |
| Muted text | slate-400 | secondary labels |

Dark mode only in MVP (no light toggle).

### Layout shell

- Fixed left sidebar ~260px: logo “Lifty Tránsito”, subtitle “Villa Dolores”, nav items (Dashboard, Conductores, Pendientes), user email + logout at bottom.
- Main: header with page title; content scrollable.
- Touch targets ≥ 44px (street tablet use).
- Breakpoint: below ~768px sidebar collapses to icon rail or drawer (implement simple drawer).

### Screens

**Login** — centered card, email/password, turquoise submit, Spanish error messages. No shell.

**Dashboard** — 4 KPI cards:

1. Total conductores del distrito  
2. Pendientes de retirar identificación  
3. Identificaciones entregadas este mes  
4. Conductores suspendidos  

Quick links to Pending and All drivers.

**Drivers list (main)** — search (name, DNI last4, plate, phone) + chips for Lifty status / identification status. Table columns:

- Nombre  
- DNI (last 4 only, display `****1234`)  
- Patente  
- Tipo vehículo (Auto / Moto)  
- Estado Lifty  
- Estado identificación  
- Fecha entrega logos  
- Acciones → Ver detalle  

Narrow viewports: card list instead of table.

**Driver detail** — photo/avatar, name, badges; sections for personal (minimal PII), vehicle, Lifty status, identification history (who, when, batch, notes). Actions:

- Marcar como Entregado → dialog (batch optional, notes optional)  
- Suspender identificación → confirm dialog  
- Document links if present  

**Pending pickup** — same list filtered `identification_status = 'pending_pickup'`; row action opens Mark Issued dialog.

### Loading / empty / error

- Table/detail skeletons  
- Spanish empty states  
- Toasts (sonner or shadcn toast) on mutation success/failure  

## 6. Data model (frontend contract)

```ts
type LiftyStatus = 'approved' | 'suspended' | 'rejected' | 'pending_review'
type IdentificationStatus = 'pending_pickup' | 'issued' | 'revoked'
type VehicleType = 'car' | 'moto'

type IdentificationEvent = {
  id: string
  action: 'issued' | 'revoked' | 'reissued'
  at: string // ISO
  byUserId: string
  byName: string
  batch?: string
  notes?: string
}

type TransitDriver = {
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

type TransitStats = {
  totalDrivers: number
  pendingPickup: number
  issuedThisMonth: number
  suspended: number
}

type MarkIssuedPayload = {
  batch?: string
  notes?: string
}

type RevokePayload = {
  notes?: string
}

type DriversQuery = {
  q?: string
  liftyStatus?: LiftyStatus
  identificationStatus?: IdentificationStatus
  page?: number
  pageSize?: number
}

type DriversListResponse = {
  data: TransitDriver[]
  meta: { total: number; page: number; pageSize: number }
}
```

PII rule: **never** show full DNI in UI; only `dniLast4`.

## 7. API contract (future backend; mock today)

Base: `VITE_API_URL` default `http://localhost:3001/api`

| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | `/transit/stats` | — | `{ data: TransitStats }` |
| GET | `/transit/drivers` | query `DriversQuery` | `DriversListResponse` |
| GET | `/transit/drivers/:id` | — | `{ data: TransitDriver }` |
| POST | `/transit/drivers/:id/mark-issued` | `MarkIssuedPayload` | `{ data: TransitDriver }` |
| POST | `/transit/drivers/:id/revoke-identification` | `RevokePayload?` | `{ data: TransitDriver }` |

### Mock strategy

- `src/mocks/drivers.ts`: 12–15 Villa Dolores drivers, mixed statuses.  
- `src/mocks/mock-store.ts`: in-memory copy; mutations update store and return new entities.  
- `src/lib/api/transit.ts`: functions that call mock store **with the same signatures** as future `fetch`.  
- Swap path: replace mock implementations inside `api/transit.ts` only; hooks/pages unchanged.  
- Artificial latency ~200–400ms optional for realistic skeletons.

### TanStack Query keys

```ts
['transit', 'stats']
['transit', 'drivers', query]
['transit', 'drivers', id]
```

Mutations invalidate stats + drivers list + detail.

## 8. Env

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_URL=http://localhost:3001/api
```

`.env.example` committed; `.env` gitignored.  
Without real Supabase credentials, document a **dev bypass** only if needed for UI review: prefer real Supabase project with a test `transit` user. If bypass is added, it must be `import.meta.env.DEV`-gated and never shippable as default production behavior.

## 9. Error handling

| Case | Behavior |
|------|----------|
| 401 | sign out, redirect `/login` |
| 403 / wrong role | `/unauthorized` |
| 404 driver | empty detail + link back |
| Network / 5xx | toast + Query retry |
| Validation (notes length) | inline form errors |

## 10. Testing (MVP)

- Unit: `maskDni` / search filter pure helpers if extracted  
- Manual smoke: login gate, list search, detail, mark-issued, revoke, pending filter  
- No E2E required in v1  

## 11. Out of scope (v1)

- Live map / online drivers  
- Multi-district switcher  
- CSV export  
- QR / pickup code flow  
- Hard-gate online in driver app  
- Admin Lifty ops panel  
- Backend `/api/transit/*` implementation (separate work in software-lifty)  
- Light theme  
- Mobile native app for tránsito  

## 12. Definition of done

1. `bun install && bun dev` starts the app  
2. Five screens usable in dark theme, tablet-friendly  
3. shadcn components wired; layout shell complete  
4. TanStack Query hooks + mock data for all four endpoint families  
5. Supabase auth + `transit` role gate  
6. Conventional commits throughout scaffolding  
7. README with setup and run instructions  

## 13. Implementation notes for planning

Order of work:

1. Scaffold Vite + Tailwind + shadcn + deps  
2. Theme tokens + layout shell  
3. Types + mocks + api layer + Query provider  
4. Auth (Supabase + store + ProtectedRoute)  
5. Pages: Login → Dashboard → Drivers → Detail → Pending  
6. Mutations + dialogs  
7. README + polish responsive  
8. Commits at each logical milestone  

Commits must follow Conventional Commits (`feat:`, `chore:`, `fix:`, `docs:`).
