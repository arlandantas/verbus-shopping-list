import { Link } from 'react-router'
import { useFamily } from '@/app/FamilyProvider'
import type { Item } from '@/data/converters'
import { addItem, setItemStatus } from '@/data/items'
import { parseItemText } from '@/domain/itemText'
import { strings } from '@/strings/pt-BR'
import { AddItemBar } from './AddItemBar'
import { ItemRow } from './ItemRow'
import { useItems } from './useItems'

function Section({
  title,
  items,
  onToggle,
}: {
  title: string
  items: Item[]
  onToggle: (item: Item) => void
}) {
  if (items.length === 0) return null
  return (
    <section aria-label={title}>
      <h2 className="px-4 pt-4 text-sm font-medium text-gray-700">{title}</h2>
      <ul>
        {items.map((item) => (
          <ItemRow key={item.id} item={item} onToggle={onToggle} />
        ))}
      </ul>
    </section>
  )
}

export function ListScreen() {
  const { family } = useFamily()
  const familyId = family?.id ?? ''
  const items = useItems(familyId)
  if (!family) return null

  const onAdd = (text: string) => {
    const parsed = parseItemText(text)
    if (parsed) void addItem(familyId, parsed)
  }
  const onToggle = (item: Item) =>
    setItemStatus(familyId, item.id, item.status === 'bought' ? 'pending' : 'bought')

  return (
    <main className="mx-auto max-w-md">
      <header className="flex min-h-12 items-center justify-between px-4 pt-2">
        <h1 className="text-xl">{family.name}</h1>
        <Link to="/familia" className="flex min-h-12 items-center underline">
          {strings.family.title}
        </Link>
      </header>
      <AddItemBar onAdd={onAdd} />
      {items?.length === 0 && <p className="p-4">{strings.list.empty}</p>}
      <Section
        title={strings.list.pendingTitle}
        items={(items ?? []).filter((i) => i.status === 'pending')}
        onToggle={onToggle}
      />
      <Section
        title={strings.list.boughtTitle}
        items={(items ?? []).filter((i) => i.status === 'bought')}
        onToggle={onToggle}
      />
    </main>
  )
}
