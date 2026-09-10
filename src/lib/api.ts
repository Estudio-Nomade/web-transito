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
