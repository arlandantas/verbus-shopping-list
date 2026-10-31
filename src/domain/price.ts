export const MAX_PRICE_CENTS = 10_000_000

export type PriceParse = { ok: true; cents: number | null } | { ok: false; error: 'invalid' }

const INVALID: PriceParse = { ok: false, error: 'invalid' }

/** Parses a BRL price typed by the user into cents. Empty -> null. Never throws. */
export function parsePriceBRL(input: string): PriceParse {
  const text = input.replace(/^\s*R\$\s*/i, '').trim()
  if (text === '') return { ok: true, cents: null }
  let normalized: string
  if (text.includes(',')) {
    if (!/^(\d{1,3}(\.\d{3})+|\d+),\d{1,2}$/.test(text)) return INVALID
    normalized = text.replace(/\./g, '').replace(',', '.')
  } else {
    if (!/^\d+(\.\d{1,2})?$/.test(text)) return INVALID
    normalized = text
  }
  const cents = Math.round(Number(normalized) * 100)
  if (!Number.isFinite(cents) || cents > MAX_PRICE_CENTS) return INVALID
  return { ok: true, cents }
}

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function formatBRL(cents: number): string {
  return brl.format(cents / 100)
}
