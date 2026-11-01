import type { PurchaseLine } from '@/data/converters'
import { IconButton } from '@/components/m3/IconButton'
import { ListItem } from '@/components/m3/ListItem'
import { formatBRL } from '@/domain/price'
import { strings } from '@/strings/pt-BR'

interface Props {
  line: PurchaseLine
  /** An item with the same nameKey is already pending on the current list. */
  pending: boolean
  onAdd: (line: PurchaseLine) => void
  /** When set, shows an edit button (purchase view only, ADR-0021). */
  onEdit?: (line: PurchaseLine) => void
}

export function LineRow({ line, pending, onAdd, onEdit }: Props) {
  return (
    <ListItem
      headline={line.name}
      supporting={`${line.quantity} ${line.unit}`}
      trailing={
        <>
          <span>
            {line.priceCents === null ? strings.history.noPrice : formatBRL(line.priceCents)}
          </span>
          {onEdit && (
            <IconButton
              icon="edit"
              label={strings.history.editFor(line.name)}
              onClick={() => onEdit(line)}
            />
          )}
          <IconButton
            icon="add_shopping_cart"
            disabled={pending}
            label={
              pending ? strings.history.inListFor(line.name) : strings.history.readdFor(line.name)
            }
            onClick={() => onAdd(line)}
          />
        </>
      }
    />
  )
}
