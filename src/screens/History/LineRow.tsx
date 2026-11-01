import type { PurchaseLine } from '@/data/converters'
import { formatBRL } from '@/domain/price'
import { strings } from '@/strings/pt-BR'

interface Props {
  line: PurchaseLine
  /** An item with the same nameKey is already pending on the current list. */
  pending: boolean
  onAdd: (line: PurchaseLine) => void
}

export function LineRow({ line, pending, onAdd }: Props) {
  return (
    <li className="flex min-h-12 items-center justify-between gap-2">
      <span className="flex-1">{line.name}</span>
      <span>{line.priceCents === null ? strings.history.noPrice : formatBRL(line.priceCents)}</span>
      <button
        type="button"
        disabled={pending}
        aria-label={
          pending ? strings.history.inListFor(line.name) : strings.history.addToListFor(line.name)
        }
        onClick={() => onAdd(line)}
        className="min-h-12 min-w-12 rounded border px-3 underline disabled:no-underline disabled:opacity-60"
      >
        {pending ? strings.history.inList : strings.history.addToList}
      </button>
    </li>
  )
}
