const KEY = 'lifty_transit_municipio'

export type SelectedMunicipio = {
  id: string
  name: string
  province?: string
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
