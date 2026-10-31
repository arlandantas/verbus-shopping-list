import type { CatalogEntry } from '@/data/converters'
import { formatQuantity } from '@/domain/itemText'
import { strings } from '@/strings/pt-BR'

export function Suggestions({
  entries,
  onPick,
}: {
  entries: CatalogEntry[]
  onPick: (entry: CatalogEntry) => void
}) {
  if (entries.length === 0) return null
  return (
    <ul
      role="listbox"
      aria-label={strings.list.suggestionsLabel}
      className="absolute inset-x-4 top-full z-20 rounded border border-gray-500 bg-white shadow-md"
    >
      {entries.map((e) => (
        <li
          key={e.nameKey}
          role="option"
          aria-selected={false}
          tabIndex={-1}
          // Keep focus in the field so the tap does not blur it first.
          onMouseDown={(ev) => ev.preventDefault()}
          onClick={() => onPick(e)}
          className="flex min-h-12 cursor-pointer items-center border-b border-gray-200 px-3 text-base last:border-b-0"
        >
          {`${e.name} · ${formatQuantity(e.quantity, e.unit)}`}
        </li>
      ))}
    </ul>
  )
}
