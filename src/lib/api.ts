import { supabase } from './supabase'

const DEFAULT_API = 'http://localhost:3001/api'

export function getApiBase(): string {
  const raw = (import.meta.env.VITE_API_URL || DEFAULT_API).replace(/\/$/, '')
  return raw.endsWith('/api') ? raw : `${raw}/api`
}

export class ApiError extends Error {
  status: number
  code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

type ApiFetchOptions = RequestInit & {
  /** When true, skip session requirement (public endpoints e.g. /transit/districts). */
  optionalAuth?: boolean
}

export async function apiFetch<T>(path: string, init: ApiFetchOptions = {}): Promise<T> {
  const { optionalAuth, ...fetchInit } = init
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const token = session?.access_token
  if (!token && !optionalAuth) {
    throw new ApiError(401, 'TOKEN_REQUIRED', 'Sesión requerida')
  }

  const headers = new Headers(fetchInit.headers)
  if (!headers.has('Content-Type') && fetchInit.body) {
    headers.set('Content-Type', 'application/json')
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const res = await fetch(`${getApiBase()}${path.startsWith('/') ? path : `/${path}`}`, {
    ...fetchInit,
    headers,
  })

  const text = await res.text()
  let body: unknown = null
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = text
  }

  if (!res.ok) {
    const errObj =
      body && typeof body === 'object' && body !== null && 'error' in body
        ? (body as { error: { code?: string; message?: string } | string }).error
        : null
    const code =
      typeof errObj === 'object' && errObj?.code
        ? errObj.code
        : res.status === 403
          ? 'FORBIDDEN'
          : 'ERROR'
    const message =
      typeof errObj === 'object' && errObj?.message
        ? errObj.message
        : typeof errObj === 'string'
          ? errObj
          : `Error ${res.status}`
    throw new ApiError(res.status, code, message)
  }

  return body as T
}
