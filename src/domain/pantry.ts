import type { CatalogEntry, Item } from '@/data/converters'

export type PantryStatus = 'missing' | 'inCart' | 'atHome'

export interface PantryEntry {
  entry: CatalogEntry
  state: PantryStatus
  /** Most recent `pending` item with the entry's nameKey (ADR-0010), else null. */
  pendingId: string | null
}

const time = (d: Date | null) => d?.getTime() ?? 0

/** Derives the Despensa rows from the catalog and the list; no stored state (ADR-0010). */
export function pantryState(catalog: CatalogEntry[], items: Item[]): PantryEntry[] {
  return catalog
    .filter((e) => e.recurring)
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
    .map((entry) => {
      const mine = items.filter((i) => i.nameKey === entry.nameKey)
      const pending = mine
        .filter((i) => i.status === 'pending')
        .reduce<Item | null>(
          (best, i) => (!best || time(i.createdAt) >= time(best.createdAt) ? i : best),
          null,
        )
      const state: PantryStatus = pending ? 'missing' : mine.length > 0 ? 'inCart' : 'atHome'
      return { entry, state, pendingId: pending?.id ?? null }
    })
}
