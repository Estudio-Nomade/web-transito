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

Users need a Supabase account with `app_metadata.role` or `user_metadata.role` = `transit`.

- Sin sesión → `/login`
- Con sesión pero sin rol `transit` → `/unauthorized`
- **Bypass solo dev:** `VITE_DEV_BYPASS_AUTH=true` y `import.meta.env.DEV`. Sintetiza sesión transit. Nunca en producción.

## API

Mocks in `src/mocks`. Swap `src/lib/api/transit.ts` to real `GET/POST /api/transit/*` when backend exists.

Env: `VITE_API_URL` (default in `.env.example`: `http://localhost:3001/api`).
