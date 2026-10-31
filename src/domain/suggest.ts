import type { CatalogEntry } from '@/data/converters'
import { toNameKey } from './nameKey'

/** Catalog suggestions for a typed query (ADR-0009): name-start first, then most recent. */
export function suggest(
  entries: CatalogEntry[],
  query: string,
  pendingKeys: ReadonlySet<string>,
  limit = 5,
): CatalogEntry[] {
  const q = toNameKey(query)
  if (q.length < 2) return []
  const ranked: { entry: CatalogEntry; rank: number }[] = []
  for (const entry of entries) {
    if (pendingKeys.has(entry.nameKey)) continue
    if (entry.nameKey.startsWith(q)) ranked.push({ entry, rank: 0 })
    else if (` ${entry.nameKey}`.includes(` ${q}`)) ranked.push({ entry, rank: 1 })
  }
  ranked.sort(
    (a, b) => a.rank - b.rank || b.entry.lastUsedAt.getTime() - a.entry.lastUsedAt.getTime(),
  )
  return ranked.slice(0, limit).map((r) => r.entry)
}
