/**
 * Default email suggestions per municipality name (no passwords — never).
 * Ops may change emails; fields stay editable on login.
 */
const SLUG_BY_NAME: Record<string, string> = {
  'Villa Dolores': 'villadolores',
  'Villa de las Rosas': 'villadelasrosas',
  'Villa Sarmiento': 'villasarmiento',
  'Mina Clavero': 'minaclavero',
  'San Javier': 'sanjavier',
  Nono: 'nono',
  'Las Calles': 'lascalles',
}

const EMAIL_DOMAIN = 'liftyviajes.com'

/** Fallback list when API is unreachable (DEV / offline). */
export const FALLBACK_MUNICIPIOS: Array<{ id: string; name: string; province: string }> = [
  { id: 'fallback-villa-dolores', name: 'Villa Dolores', province: 'Córdoba' },
  { id: 'fallback-villa-de-las-rosas', name: 'Villa de las Rosas', province: 'Córdoba' },
  { id: 'fallback-villa-sarmiento', name: 'Villa Sarmiento', province: 'Córdoba' },
  { id: 'fallback-mina-clavero', name: 'Mina Clavero', province: 'Córdoba' },
  { id: 'fallback-san-javier', name: 'San Javier', province: 'Córdoba' },
  { id: 'fallback-nono', name: 'Nono', province: 'Córdoba' },
  { id: 'fallback-las-calles', name: 'Las Calles', province: 'Córdoba' },
]

export function slugForMunicipioName(name: string): string | null {
  if (SLUG_BY_NAME[name]) return SLUG_BY_NAME[name]
  const normalized = name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
  return normalized || null
}

export function defaultEmailForMunicipio(name: string): string {
  const slug = slugForMunicipioName(name) ?? 'transito'
  return `${slug}@${EMAIL_DOMAIN}`
}
