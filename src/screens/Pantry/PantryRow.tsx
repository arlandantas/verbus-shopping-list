import type { PantryEntry } from '@/domain/pantry'
import { strings } from '@/strings/pt-BR'

const labels = {
  atHome: strings.pantry.atHome,
  missing: strings.pantry.missing,
  inCart: strings.pantry.inCart,
} as const

export function PantryRow({
  row,
  onToggle,
  onRemove,
}: {
  row: PantryEntry
  onToggle: (row: PantryEntry) => void
  onRemove: (row: PantryEntry) => void
}) {
  const { entry, state } = row
  const tone =
    state === 'missing'
      ? 'bg-amber-100 text-amber-900'
      : state === 'inCart'
        ? 'bg-gray-100 text-gray-700'
        : 'text-gray-900'
  return (
    <li className="flex items-stretch border-b border-gray-200">
      <button
        type="button"
        aria-pressed={state === 'missing'}
        disabled={state === 'inCart'}
        onClick={() => onToggle(row)}
        className={`flex min-h-12 flex-1 items-center justify-between gap-3 px-4 py-2 text-left text-base ${tone}`}
      >
        <span>{entry.name}</span>
        <span className="text-sm font-medium">{labels[state]}</span>
      </button>
      <button
        type="button"
        aria-label={strings.pantry.removeRecurringFor(entry.name)}
        onClick={() => onRemove(row)}
        className="min-h-12 px-3 text-sm text-gray-700 underline"
      >
        {strings.pantry.removeRecurring}
      </button>
    </li>
  )
}
