import type { ReactNode } from 'react'
import { Icon } from '@/components/m3/Icon'
import { cartCount, groupByCategory, type CategoryLike } from '@/domain/categories'
import { strings } from '@/strings/pt-BR'

/** Items grouped under one collapsible header per non-empty category; the caller supplies the row. */
export function CategorySections<
  T extends { id: string; categoryId: string | null; status: string },
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
      {groupByCategory(items, categories).map((section) => {
        const id = section.id ?? 'none'
        const { done, total } = cartCount(section.items)
        const open = !collapsed.includes(id)
        const visible = hideBought
          ? section.items.filter((i) => i.status !== 'bought')
          : section.items
        return (
          <section key={id} aria-label={section.name}>
            <h2 className="m-0 pt-4 text-sm font-medium text-on-surface">
              <button
                type="button"
                aria-expanded={open}
                onClick={() => onToggleCollapsed(id)}
                className="flex min-h-12 w-full items-center gap-2 px-4 text-left"
              >
                <span className="flex-1">{section.name}</span>
                {done === total && <Icon name="check" />}
                <span>{`${done}/${total}`}</span>
                <Icon name={open ? 'expand_less' : 'expand_more'} />
              </button>
            </h2>
            {open && (
              <>
                <ul>{visible.map(renderItem)}</ul>
                {hideBought && done > 0 && (
                  <p className="px-4 pb-2 text-sm text-on-surface-variant">
                    {strings.market.hiddenCount(done)}
                  </p>
                )}
              </>
            )}
          </section>
        )
      })}
    </>
  )
}
