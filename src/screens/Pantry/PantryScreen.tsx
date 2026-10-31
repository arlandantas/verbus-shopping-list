import { useMemo } from 'react'
import { Link } from 'react-router'
import { useFamily } from '@/app/FamilyProvider'
import { addItem, deleteItem, setRecurring } from '@/data/items'
import type { CatalogEntry } from '@/data/converters'
import { pantryState, type PantryEntry } from '@/domain/pantry'
import { useCatalog } from '@/screens/List/useCatalog'
import { useItems } from '@/screens/List/useItems'
import { strings } from '@/strings/pt-BR'
import { CatalogPicker } from './CatalogPicker'
import { PantryRow } from './PantryRow'

export function PantryScreen() {
  const { family } = useFamily()
  const familyId = family?.id ?? ''
  const items = useItems(familyId)
  const catalog = useCatalog(familyId)
  const rows = useMemo(() => pantryState(catalog, items ?? []), [catalog, items])
  if (!family) return null

  const onToggle = ({ entry, state, pendingId }: PantryEntry) => {
    if (state === 'atHome')
      addItem(familyId, {
        name: entry.name,
        quantity: entry.quantity,
        unit: entry.unit,
        categoryId: entry.categoryId,
        recurring: true,
      })
    else if (state === 'missing' && pendingId) deleteItem(familyId, pendingId)
  }

  const onRemove = ({ entry }: PantryEntry) =>
    setRecurring(familyId, entry.nameKey, false, items ?? [])
  const onPromote = (entry: CatalogEntry) =>
    setRecurring(familyId, entry.nameKey, true, items ?? [])
  const others = catalog
    .filter((e) => !e.recurring)
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))

  return (
    <main className="mx-auto max-w-md">
      <header className="flex min-h-12 items-center justify-between px-4 pt-2">
        <h1 className="text-xl">{strings.pantry.title}</h1>
        <Link to="/" className="flex min-h-12 items-center underline">
          {strings.pantry.back}
        </Link>
      </header>
      {items !== null && rows.length === 0 && <p className="p-4">{strings.pantry.empty}</p>}
      <ul aria-label={strings.pantry.listLabel}>
        {rows.map((row) => (
          <PantryRow key={row.entry.nameKey} row={row} onToggle={onToggle} onRemove={onRemove} />
        ))}
      </ul>
      <CatalogPicker entries={others} onPromote={onPromote} />
    </main>
  )
}
