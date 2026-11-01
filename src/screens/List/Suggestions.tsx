import type { CatalogEntry } from '@/data/converters'
import { formatQuantity } from '@/domain/itemText'
import { strings } from '@/strings/pt-BR'

export function Suggestions({
  id,
  entries,
  active,
  onPick,
}: {
  id: string
  entries: CatalogEntry[]
  active: number
  onPick: (entry: CatalogEntry) => void
}) {
  if (entries.length === 0) return null
  return (
    <ul
      id={id}
      role="listbox"
      aria-label={strings.list.suggestionsLabel}
      className="absolute inset-x-4 bottom-full z-20 mb-1 max-h-[40vh] overflow-y-auto rounded border border-outline bg-surface-container-high text-on-surface shadow-md"
    >
      {entries.map((e, i) => (
        <li
          id={`${id}-${i}`}
          key={e.nameKey}
          role="option"
          aria-selected={i === active}
          tabIndex={-1}
          // Keep focus in the field so the tap does not blur it first.
          onMouseDown={(ev) => ev.preventDefault()}
          onClick={() => onPick(e)}
          className={`flex min-h-12 cursor-pointer items-center border-b border-outline-variant px-3 text-base last:border-b-0 ${i === active ? 'bg-secondary-container text-on-secondary-container' : ''}`}
        >
          {`${e.name} · ${formatQuantity(e.quantity, e.unit)}`}
        </li>
      ))}
    </ul>
  )
}
