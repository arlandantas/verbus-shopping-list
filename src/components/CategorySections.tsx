import type { ReactNode } from 'react'
import { groupByCategory, type CategoryLike } from '@/domain/categories'

/** Items grouped under one h2 per non-empty category; the caller supplies the row . */
export function CategorySections<T extends { id: string; categoryId: string | null }>({
  items,
  categories,
  renderItem,
}: {
  items: readonly T[]
  categories: readonly CategoryLike[]
  renderItem: (item: T) => ReactNode
}) {
  return (
    <>
      {groupByCategory(items, categories).map((section) => (
        <section key={section.id ?? 'none'} aria-label={section.name}>
          <h2 className="px-4 pt-4 text-sm font-medium text-gray-700">{section.name}</h2>
          <ul>{section.items.map(renderItem)}</ul>
        </section>
      ))}
    </>
  )
}
