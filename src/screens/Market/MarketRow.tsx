import type { Item } from '@/data/converters'
import { formatQuantity } from '@/domain/itemText'
import { MarkedBy } from '@/components/MarkedBy'
import { strings } from '@/strings/pt-BR'

/** Whole row is the tap target (>=64px): check/uncheck, no detail link, no form (ADR-0011). */
export function MarketRow({
  item,
  onToggle,
  names,
  uid,
}: {
  item: Item
  onToggle: (item: Item) => void
  names: Record<string, string>
  uid: string | undefined
}) {
  const bought = item.status === 'bought'
  return (
    <li className="border-b border-gray-200">
      <button
        type="button"
        aria-pressed={bought}
        onClick={() => onToggle(item)}
        className={`flex min-h-16 w-full items-center gap-3 px-4 text-left text-xl ${bought ? 'bg-gray-100 text-gray-600' : ''}`}
      >
        <span className={`flex-1 ${bought ? 'line-through' : ''}`}>{item.name}</span>
        <MarkedBy status={item.status} markedBy={item.markedBy} names={names} uid={uid} />
        <span className="text-base text-gray-700">{formatQuantity(item.quantity, item.unit)}</span>
        {item.hasPendingWrites && (
          <span className="text-xs text-amber-800">{strings.list.pendingSync}</span>
        )}
      </button>
    </li>
  )
}
