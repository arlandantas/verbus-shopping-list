import { Fragment } from 'react'
import type { Item } from '@/data/converters'
import { formatQuantity } from '@/domain/itemText'
import { formatBRL } from '@/domain/price'
import { Checkbox } from '@/components/m3/Checkbox'
import { IconButton } from '@/components/m3/IconButton'
import { ListItem } from '@/components/m3/ListItem'
import { MarkedBy } from '@/components/MarkedBy'
import { strings } from '@/strings/pt-BR'

/** Tapping the row (or its checkbox) toggles; the trailing edit button only opens the sheet. */
export function ItemRow({
  item,
  onToggle,
  onEdit,
  names,
  uid,
}: {
  item: Item
  onToggle: (item: Item) => void
  onEdit: (item: Item) => void
  names: Record<string, string> | null
  uid: string | undefined
}) {
  const bought = item.status === 'bought'
  const parts = [
    <Fragment key="q">{formatQuantity(item.quantity, item.unit)}</Fragment>,
    item.note && <Fragment key="n">{item.note}</Fragment>,
    bought && (
      <MarkedBy key="m" status={item.status} markedBy={item.markedBy} names={names} uid={uid} />
    ),
    item.hasPendingWrites && <Fragment key="p">{strings.list.pendingSync}</Fragment>,
  ].filter(Boolean)
  return (
    <ListItem
      struck={bought}
      onClick={() => onToggle(item)}
      leading={<Checkbox label={item.name} hideLabel checked={bought} onChange={() => undefined} />}
      headline={item.name}
      supporting={parts.map((p, i) => (
        <Fragment key={i}>
          {i > 0 && ' · '}
          {p}
        </Fragment>
      ))}
      trailing={
        <>
          {item.priceCents != null && <span>{formatBRL(item.priceCents)}</span>}
          <IconButton
            icon="edit"
            label={strings.list.edit(item.name)}
            onClick={(e) => {
              e.stopPropagation()
              onEdit(item)
            }}
          />
        </>
      }
    />
  )
}
