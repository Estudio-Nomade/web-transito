# web-transito

Panel web de tránsito Lifty (Vite + React + TypeScript + Tailwind + shadcn).

## Run

```bash
bun install
cp .env.example .env   # fill VITE_SUPABASE_* as needed
bun run dev            # http://localhost:5173
```

```bash
bun run build          # production build
bun run preview        # preview build
```

## Auth

- Rol requerido: `transit` en `app_metadata.role` (prioridad) o `user_metadata.role`.
- Sin sesión → `/login`. Con sesión pero sin rol → `/unauthorized`.
- **Bypass solo dev:** `VITE_DEV_BYPASS_AUTH=true` y `import.meta.env.DEV`. Sintetiza sesión transit. No usar en producción.
