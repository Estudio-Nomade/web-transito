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

