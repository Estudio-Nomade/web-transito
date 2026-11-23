const KEY = 'lifty_transit_municipio'

/** Synthetic picker entry: Lifty ops (transito@) sees all municipalities. */
export const LIFTY_OPS_MUNICIPIO_ID = 'lifty-ops'
export const LIFTY_OPS_MUNICIPIO_NAME = 'Lifty · todos los municipios'

export type SelectedMunicipio = {
  id: string
  name: string
  province?: string
}

export function isLiftyOpsMunicipio(m: Pick<SelectedMunicipio, 'id'> | null | undefined): boolean {
  return m?.id === LIFTY_OPS_MUNICIPIO_ID
}

export function loadSelectedMunicipio(): SelectedMunicipio | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as SelectedMunicipio
    if (!parsed?.id || !parsed?.name) return null
    return parsed
  } catch {
    return null
  }
}

export function saveSelectedMunicipio(m: SelectedMunicipio): void {
  sessionStorage.setItem(KEY, JSON.stringify(m))
}

export function clearSelectedMunicipio(): void {
  sessionStorage.removeItem(KEY)
}
