import { IconButton } from '@/components/m3/IconButton'
import { Icon, type IconName } from '@/components/m3/Icon'
import { ListItem } from '@/components/m3/ListItem'
import type { PantryEntry } from '@/domain/pantry'
import { strings } from '@/strings/pt-BR'

const s = strings.pantry

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
  const stateIcon: IconName =
    state === 'missing' ? 'shopping_cart' : state === 'inCart' ? 'shopping_cart_checkout' : 'check'
  const actionIcon: IconName =
    state === 'atHome'
      ? 'shopping_cart'
      : state === 'missing'
        ? 'remove_shopping_cart'
        : 'shopping_cart_checkout'
  const label =
    state === 'atHome'
      ? s.markMissingFor(entry.name)
      : state === 'missing'
        ? s.markAtHomeFor(entry.name)
        : s.inCartFor(entry.name)
  return (
    <ListItem
      headline={entry.name}
      tone={state === 'missing' ? 'primary' : state === 'inCart' ? 'muted' : undefined}
      leading={<Icon name={stateIcon} />}
      supporting={state === 'missing' ? s.missing : state === 'inCart' ? s.inCart : s.atHome}
      trailing={
        <>
          <IconButton
            icon={actionIcon}
            label={label}
            disabled={state === 'inCart'}
            onClick={() => onToggle(row)}
          />
          <IconButton
            icon="delete"
            label={s.removeRecurringFor(entry.name)}
            onClick={() => onRemove(row)}
          />
        </>
      }
    />
  )
}
