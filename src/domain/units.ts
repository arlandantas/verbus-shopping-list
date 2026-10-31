export const UNITS = ['un', 'kg', 'g', 'l', 'ml', 'pct', 'cx', 'dz'] as const

export type Unit = (typeof UNITS)[number]

const SYNONYMS: Record<string, Unit> = {
  un: 'un',
  unidade: 'un',
  unidades: 'un',
  kg: 'kg',
  quilo: 'kg',
  quilos: 'kg',
  kilo: 'kg',
  kilos: 'kg',
  g: 'g',
  grama: 'g',
  gramas: 'g',
  l: 'l',
  litro: 'l',
  litros: 'l',
  ml: 'ml',
  pct: 'pct',
  pacote: 'pct',
  pacotes: 'pct',
  cx: 'cx',
  caixa: 'cx',
  caixas: 'cx',
  dz: 'dz',
  duzia: 'dz',
  duzias: 'dz',
}

export function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/\p{M}/gu, '')
}

/** Maps a pt-BR unit word to a canonical unit; case and accent insensitive. */
export function parseUnit(token: string): Unit | null {
  const key = stripAccents(token.trim()).toLowerCase()
  return Object.hasOwn(SYNONYMS, key) ? SYNONYMS[key]! : null
}
