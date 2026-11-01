import { IconButton } from '@/components/m3/IconButton'
import { ListItem } from '@/components/m3/ListItem'
import type { CatalogEntry } from '@/data/converters'
import { strings } from '@/strings/pt-BR'

/** Collapsed list of catalog names not yet recurring, to promote without opening items. */
export function CatalogPicker({
  entries,
  onPromote,
}: {
  entries: CatalogEntry[]
  onPromote: (entry: CatalogEntry) => void
}) {
  if (entries.length === 0) return null
  return (
    <details>
      <summary className="flex min-h-14 cursor-pointer items-center px-4 text-base">
        {strings.pantry.othersTitle}
      </summary>
      <ul aria-label={strings.pantry.othersTitle}>
        {entries.map((entry) => (
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
        ))}
      </ul>
    </details>
  )
}
