import { stripAccents } from './units'

interface PurchaseLike {
  cycle: string
  market: string | null
  itemCount: number
  totalCents: number | null
  purchasedAt: Date
}

export interface CycleSummary {
  cycle: string
  totalCents: number
  purchaseCount: number
  itemCount: number
}

/**
 * Distinct months, newest first. Quick overview only: it sums `totalCents`, which the rules do not
 * tie to the lines (ADR-0016). Detail screens must use `cycleTotalCents` over the lines.
 */
export function cyclesFrom(purchases: readonly PurchaseLike[]): CycleSummary[] {
  const byCycle = new Map<string, CycleSummary>()
  for (const p of purchases) {
    const s = byCycle.get(p.cycle) ?? {
      cycle: p.cycle,
      totalCents: 0,
      purchaseCount: 0,
      itemCount: 0,
    }
    s.totalCents += p.totalCents ?? 0
    s.purchaseCount += 1
    s.itemCount += p.itemCount
    byCycle.set(p.cycle, s)
  }
  return [...byCycle.values()].sort((a, b) => b.cycle.localeCompare(a.cycle))
}

/** Authoritative total: sum of the informed line prices (ADR-0016). */
export function cycleTotalCents(lines: readonly { priceCents: number | null }[]): number {
  return lines.reduce((sum, l) => sum + (l.priceCents ?? 0), 0)
}

const marketKey = (name: string) => stripAccents(name).toLowerCase().trim().replace(/\s+/g, ' ')

/** Distinct market names (case/accent-insensitive), most recently used first, no nulls. */
export function knownMarkets(purchases: readonly PurchaseLike[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  const sorted = [...purchases].sort((a, b) => b.purchasedAt.getTime() - a.purchasedAt.getTime())
  for (const { market } of sorted) {
    const name = market?.trim()
    if (!name) continue
    const key = marketKey(name)
    if (seen.has(key)) continue
    seen.add(key)
    out.push(name)
  }
  return out
}
