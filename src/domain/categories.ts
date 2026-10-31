import { strings } from '../strings/pt-BR'

export interface CategoryLike {
  id: string
  name: string
  order: number
}

export const DEFAULT_CATEGORIES: readonly CategoryLike[] = [
  { id: 'mercearia', name: 'Mercearia', order: 0 },
  { id: 'hortifruti', name: 'Hortifrúti', order: 1 },
  { id: 'carnes', name: 'Carnes', order: 2 },
  { id: 'laticinios', name: 'Laticínios', order: 3 },
  { id: 'limpeza', name: 'Limpeza', order: 4 },
  { id: 'higiene', name: 'Higiene pessoal', order: 5 },
]

export const MAX_CATEGORY_ORDER = 999

export interface CategorySection<T> {
  /** null = "Sem categoria" */
  id: string | null
  name: string
  items: T[]
}

/** Sections by (order, name); null or unknown categoryId goes last; empty sections omitted. */
export function groupByCategory<T extends { categoryId: string | null }>(
  items: readonly T[],
  categories: readonly CategoryLike[],
): CategorySection<T>[] {
  const sorted = [...categories].sort(
    (a, b) => a.order - b.order || a.name.localeCompare(b.name, 'pt-BR'),
  )
  const known = new Set(sorted.map((c) => c.id))
  const sections: CategorySection<T>[] = sorted.map((c) => ({
    id: c.id,
    name: c.name,
    items: items.filter((i) => i.categoryId === c.id),
  }))
  sections.push({
    id: null,
    name: strings.noCategory,
    items: items.filter((i) => i.categoryId === null || !known.has(i.categoryId)),
  })
  return sections.filter((s) => s.items.length > 0)
}

export function nextCategoryOrder(categories: readonly { order: number }[]): number {
  if (categories.length === 0) return 0
  return Math.min(Math.max(...categories.map((c) => c.order)) + 1, MAX_CATEGORY_ORDER)
}

export interface CategorySum {
  name: string
  totalCents: number
}

export interface CategorySums {
  rows: CategorySum[]
  totalCents: number
  unpricedCount: number
}

export function sumByCategory(
  lines: readonly { categoryName: string | null; priceCents: number | null }[],
): CategorySums {
  const byName = new Map<string, number>()
  let totalCents = 0
  let unpricedCount = 0
  for (const line of lines) {
    const name = line.categoryName ?? strings.noCategory
    const current = byName.get(name) ?? 0
    if (line.priceCents === null) {
      unpricedCount++
      byName.set(name, current)
    } else {
      totalCents += line.priceCents
      byName.set(name, current + line.priceCents)
    }
  }
  const rows = [...byName].map(([name, total]) => ({ name, totalCents: total }))
  rows.sort((a, b) => b.totalCents - a.totalCents || a.name.localeCompare(b.name, 'pt-BR'))
  return { rows, totalCents, unpricedCount }
}
