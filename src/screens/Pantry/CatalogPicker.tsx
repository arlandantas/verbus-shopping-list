import { useState } from 'react'
import { CollapsibleSection } from '@/components/m3/CollapsibleSection'
import { IconButton } from '@/components/m3/IconButton'
import { ListItem } from '@/components/m3/ListItem'
import type { CatalogEntry } from '@/data/converters'
import { strings } from '@/strings/pt-BR'

/** Collapsible section of catalog names not yet recurring, to promote without opening items. */
export function CatalogPicker({
  entries,
  onPromote,
}: {
  entries: CatalogEntry[]
  onPromote: (entry: CatalogEntry) => void
}) {
  const [open, setOpen] = useState(false)
  if (entries.length === 0) return null
  return (
    <CollapsibleSection
      title={strings.pantry.othersTitle}
      count={String(entries.length)}
      open={open}
      onToggle={() => setOpen((o) => !o)}
      listLabel={strings.pantry.othersTitle}
    >
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
    </CollapsibleSection>
  )
}
