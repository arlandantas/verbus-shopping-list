import { collection, getDocsFromServer, limit, query } from 'firebase/firestore'
import { db } from '@/data/firebase'
import { toNameKey } from '@/domain/nameKey'
import type { ListModel } from '@/domain/listModels'
import { addCategories } from './categories'
import { addItems, type NewItem } from './items'

export interface GroupSnapshot {
  hasItems: boolean
  categories: { id: string; name: string; order: number }[]
}

/** Reads the group from the server (a fresh joiner's cache is empty). Rejects when offline. */
export async function readGroupSnapshot(familyId: string): Promise<GroupSnapshot> {
  const col = (name: string) => collection(db, 'families', familyId, name)
  const [items, cats] = await Promise.all([
    getDocsFromServer(query(col('items'), limit(1))),
    getDocsFromServer(col('categories')),
  ])
  return {
    hasItems: !items.empty,
    categories: cats.docs.map((d) => {
      const x = d.data() as { name: string; order: number }
      return { id: d.id, name: x.name, order: x.order }
    }),
  }
}

/** Adds the chosen item names of `model`: creates the missing categories (reusing same-name ones), then reuses addItems (S-093). */
export function addSuggestedItems(
  familyId: string,
  model: ListModel,
  chosen: ReadonlySet<string>,
  existing: GroupSnapshot['categories'],
): string[] {
  const picked = model.categories
    .map((c) => ({ name: c.name, items: c.items.filter((i) => chosen.has(i)) }))
    .filter((c) => c.items.length > 0)
  const ids = new Map(existing.map((c) => [toNameKey(c.name), c.id]))
  const missing = picked.filter((c) => !ids.has(toNameKey(c.name)))
  const created = addCategories(
    familyId,
    missing.map((c) => c.name),
    existing,
  )
  missing.forEach((c, i) => ids.set(toNameKey(c.name), created[i]!))
  const inputs: NewItem[] = picked.flatMap((c) =>
    c.items.map((name) => ({
      name,
      quantity: 1,
      unit: 'un' as const,
      categoryId: ids.get(toNameKey(c.name)) ?? null,
    })),
  )
  return addItems(familyId, inputs)
}
