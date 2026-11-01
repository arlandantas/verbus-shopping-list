import { useState } from 'react'
import { CollapsibleSection } from '@/components/m3/CollapsibleSection'
import { IconButton } from '@/components/m3/IconButton'
import { ListItem } from '@/components/m3/ListItem'
import type { CatalogEntry } from '@/data/converters'
import type { CategoryLike } from '@/domain/categories'
import { groupForPantry } from '@/domain/pantry'
import { strings } from '@/strings/pt-BR'

/** Collapsible section of catalog names not yet recurring, to promote without opening items. */
export function CatalogPicker({
  entries,
  categories,
  onPromote,
}: {
  entries: CatalogEntry[]
  categories: readonly CategoryLike[]
  onPromote: (entry: CatalogEntry) => void
}) {
  const [open, setOpen] = useState(false)
  if (entries.length === 0) return null
  const row = (entry: CatalogEntry) => (
    <ListItem
      key={entry.nameKey}
      headline={entry.name}
      trailing={
        <IconButton
          icon="add"
          label={strings.pantry.makeRecurringFor(entry.name)}
          onClick={() => onPromote(entry)}
        />
      }
    />
  )
  const groups = groupForPantry(entries, categories, (e) => e.categoryId)
  return (
    <CollapsibleSection
      title={strings.pantry.othersTitle}
      count={String(entries.length)}
      open={open}
      onToggle={() => setOpen((o) => !o)}
      listLabel={strings.pantry.othersTitle}
    >
      {groups
        ? groups.map((g) => (
            <li key={g.id ?? 'none'}>
              <h3 className="px-2 pt-2 text-sm font-medium text-on-surface-variant">
                {`${g.name} (${g.items.length})`}
              </h3>
              <ul aria-label={g.name} className="m-0 list-none p-0">
                {g.items.map(row)}
              </ul>
            </li>
          ))
        : entries.map(row)}
    </CollapsibleSection>
  )
}
