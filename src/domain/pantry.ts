import type { CatalogEntry, Item } from '@/data/converters'
import { groupByCategory, type CategoryLike, type CategorySection } from './categories'

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

/**
 * Pantry rows grouped by category (ADR-0014 order, "Sem categoria" last, empty ones omitted).
 * Returns null (flat list) when no entry has a known category, e.g. a group without categories.
 */
export function groupForPantry<T>(
  items: readonly T[],
  categories: readonly CategoryLike[],
  categoryIdOf: (item: T) => string | null,
): CategorySection<T>[] | null {
  const known = new Set(categories.map((c) => c.id))
  if (!items.some((i) => known.has(categoryIdOf(i) ?? ''))) return null
  const wrapped = items.map((item) => ({ item, categoryId: categoryIdOf(item) }))
  return groupByCategory(wrapped, categories).map((s) => ({
    ...s,
    items: s.items.map((w) => w.item),
  }))
}
