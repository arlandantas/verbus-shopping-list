import type { ReactNode } from 'react'
import { CollapsibleSection } from '@/components/m3/CollapsibleSection'
import { cartCount, groupByCategory, sortByName, type CategoryLike } from '@/domain/categories'
import { strings } from '@/strings/pt-BR'

/** Items grouped under one collapsible header per non-empty category; the caller supplies the row. */
export function CategorySections<
  T extends { id: string; name: string; categoryId: string | null; status: string },
>({
  items,
  categories,
  renderItem,
  collapsed,
  onToggleCollapsed,
  hideBought,
}: {
  items: readonly T[]
  categories: readonly CategoryLike[]
  renderItem: (item: T) => ReactNode
  /** Category ids (`'none'` for "Sem categoria") currently collapsed. */
  collapsed: readonly string[]
  onToggleCollapsed: (id: string) => void
  hideBought: boolean
}) {
  return (
    <>
      {groupByCategory(
        // Alphabetical, bought ones stay at the end of their section (S-028).
        [...sortByName(items)].sort(
          (a, b) => Number(a.status === 'bought') - Number(b.status === 'bought'),
        ),
        categories,
      ).map((section) => {
        const id = section.id ?? 'none'
        const { done, total } = cartCount(section.items)
        const open = !collapsed.includes(id)
        const visible = hideBought
          ? section.items.filter((i) => i.status !== 'bought')
          : section.items
        return (
          <CollapsibleSection
            key={id}
            title={section.name}
            count={`${done}/${total}`}
            done={done === total}
            open={open}
            onToggle={() => onToggleCollapsed(id)}
            footer={
              hideBought && done > 0 ? (
                <p className="mt-2 px-4 pt-2 pb-3 text-sm text-on-surface-variant">
                  {strings.market.hiddenCount(done)}
                </p>
              ) : undefined
            }
          >
            {visible.map(renderItem)}
          </CollapsibleSection>
        )
      })}
    </>
  )
}
