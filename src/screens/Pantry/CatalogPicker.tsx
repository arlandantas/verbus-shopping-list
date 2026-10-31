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
    <details className="border-t border-gray-200">
      <summary className="flex min-h-12 cursor-pointer items-center px-4 text-base">
        {strings.pantry.othersTitle}
      </summary>
      <ul aria-label={strings.pantry.othersTitle}>
        {entries.map((entry) => (
          <li
            key={entry.nameKey}
            className="flex min-h-12 items-center justify-between gap-3 border-b border-gray-200 px-4"
          >
            <span>{entry.name}</span>
            <button
              type="button"
              onClick={() => onPromote(entry)}
              className="min-h-12 px-2 text-sm underline"
            >
              {strings.pantry.makeRecurring}
            </button>
          </li>
        ))}
      </ul>
    </details>
  )
}
