/**
 * Default email suggestions per municipality name (no passwords — never).
 * Ops may change emails; fields stay editable on login.
 * Do NOT hardcode a full municipality catalog here — the selector list comes from the API
 * (districts with a transit operator in admin).
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
