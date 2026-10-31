import type { Item } from '@/data/converters'
import { formatQuantity } from '@/domain/itemText'
import { strings } from '@/strings/pt-BR'

export function ItemRow({ item, onToggle }: { item: Item; onToggle: (item: Item) => void }) {
  const bought = item.status === 'bought'
  const label = bought ? strings.list.markPending(item.name) : strings.list.markBought(item.name)
  return (
    <li className="flex min-h-12 items-center gap-3 border-b border-gray-200 px-4">
      <input
        type="checkbox"
        checked={bought}
        onChange={() => onToggle(item)}
        aria-label={label}
        className="h-12 w-12 shrink-0 accent-green-700"
      />
      <span className={`flex-1 py-2 text-base ${bought ? 'text-gray-600 line-through' : ''}`}>
        {item.name}
      </span>
      <span className="text-sm text-gray-700">{formatQuantity(item.quantity, item.unit)}</span>
      {item.hasPendingWrites && (
        <span className="text-xs text-amber-800">{strings.list.pendingSync}</span>
      )}
    </li>
  )
}
