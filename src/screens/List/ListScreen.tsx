import { useMemo } from 'react'
import { Link } from 'react-router'
import { useAuth } from '@/app/AuthProvider'
import { useFamily } from '@/app/FamilyProvider'
import { useMemberNames } from '@/hooks/useMemberNames'
import type { CatalogEntry, Item } from '@/data/converters'
import { addItem, toggleItemStatus } from '@/data/items'
import { toNameKey } from '@/domain/nameKey'
import { parseItemText, type ParsedItem } from '@/domain/itemText'
import { strings } from '@/strings/pt-BR'
import { AddItemBar } from './AddItemBar'
import { ItemRow } from './ItemRow'
import { useCatalog } from './useCatalog'
import { useItems } from './useItems'

function Section({
  title,
  items,
  onToggle,
  names,
  uid,
}: {
  title: string
  items: Item[]
  onToggle: (item: Item) => void
  names: Record<string, string>
  uid: string | undefined
}) {
  if (items.length === 0) return null
  return (
    <section aria-label={title}>
      <h2 className="px-4 pt-4 text-sm font-medium text-gray-700">{title}</h2>
      <ul>
        {items.map((item) => (
          <ItemRow key={item.id} item={item} onToggle={onToggle} names={names} uid={uid} />
        ))}
      </ul>
    </section>
  )
}

export function ListScreen() {
  const { family } = useFamily()
  const familyId = family?.id ?? ''
  const items = useItems(familyId)
  const catalog = useCatalog(familyId)
  const names = useMemberNames(family?.id)
  const uid = useAuth().user?.uid
  const pendingKeys = useMemo(
    () => new Set((items ?? []).filter((i) => i.status === 'pending').map((i) => i.nameKey)),
    [items],
  )
  if (!family) return null

  const onAdd = (text: string) => {
    const parsed = parseItemText(text)
    if (!parsed) return
    const known = catalog.find((e) => e.nameKey === toNameKey(parsed.name))
    addItem(familyId, known ? { ...parsed, recurring: known.recurring } : parsed)
  }
  const onPick = (entry: CatalogEntry, typed: ParsedItem | null) => {
    addItem(familyId, {
      name: entry.name,
      quantity: typed?.quantity ?? entry.quantity,
      unit: typed?.unit ?? entry.unit,
      categoryId: entry.categoryId,
      recurring: entry.recurring,
    })
  }
  const onToggle = (item: Item) => toggleItemStatus(familyId, item)

  return (
    <main className="mx-auto max-w-md">
      <header className="flex min-h-12 items-center justify-between px-4 pt-2">
        <h1 className="text-xl">{family.name}</h1>
        <nav className="flex gap-4">
          <Link to="/mercado" className="flex min-h-12 items-center underline">
            {strings.market.enter}
          </Link>
          <Link to="/despensa" className="flex min-h-12 items-center underline">
            {strings.pantry.link}
          </Link>
          <Link to="/familia" className="flex min-h-12 items-center underline">
            {strings.family.title}
          </Link>
        </nav>
      </header>
      <AddItemBar onAdd={onAdd} catalog={catalog} pendingKeys={pendingKeys} onPick={onPick} />
      {items?.length === 0 && <p className="p-4">{strings.list.empty}</p>}
      <Section
        title={strings.list.pendingTitle}
        items={(items ?? []).filter((i) => i.status === 'pending')}
        onToggle={onToggle}
        names={names}
        uid={uid}
      />
      <Section
        title={strings.list.boughtTitle}
        items={(items ?? []).filter((i) => i.status === 'bought')}
        onToggle={onToggle}
        names={names}
        uid={uid}
      />
    </main>
  )
}
