import { useMemo, useState } from 'react'
import { Button } from '@/components/m3/Button'
import { Dialog } from '@/components/m3/Dialog'
import { TopAppBar } from '@/components/m3/TopAppBar'
import { useFamily } from '@/app/FamilyProvider'
import { addItem, deleteItem, setRecurring } from '@/data/items'
import type { CatalogEntry } from '@/data/converters'
import { groupForPantry, pantryState, type PantryEntry } from '@/domain/pantry'
import { useCategories } from '@/hooks/useCategories'
import { useLocalPref } from '@/hooks/useLocalPref'
import { CollapsibleSection } from '@/components/m3/CollapsibleSection'
import { useCatalog } from '@/screens/List/useCatalog'
import { useItems } from '@/screens/List/useItems'
import { strings } from '@/strings/pt-BR'
import { CatalogPicker } from './CatalogPicker'
import { PantryRow } from './PantryRow'

const isStrings = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((x) => typeof x === 'string')

export function PantryScreen() {
  const { family } = useFamily()
  const familyId = family?.id ?? ''
  const items = useItems(familyId)
  const catalog = useCatalog(familyId)
  const categories = useCategories(family?.id) ?? []
  const [collapsed, setCollapsed] = useLocalPref<string[]>(
    'verbus.ui.pantryCollapsed',
    [],
    isStrings,
  )
  const [helpOpen, setHelpOpen] = useState(false)
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
  const toggleCollapsed = (id: string) =>
    setCollapsed(collapsed.includes(id) ? collapsed.filter((c) => c !== id) : [...collapsed, id])
  const groups = groupForPantry(rows, categories, (r) => r.entry.categoryId)
  const renderRow = (row: PantryEntry) => (
    <PantryRow key={row.entry.nameKey} row={row} onToggle={onToggle} onRemove={onRemove} />
  )
  const others = catalog
    .filter((e) => !e.recurring)
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))

  return (
    <main className="mx-auto max-w-md">
      <TopAppBar title={strings.pantry.title} />
      <div className="px-4 pb-2">
        <p className="text-sm">{strings.pantry.intro}</p>
        <Button variant="text" icon="info" onClick={() => setHelpOpen(true)}>
          {strings.pantry.learnMore}
        </Button>
      </div>
      <Dialog
        open={helpOpen}
        title={strings.pantry.helpTitle}
        onClose={() => setHelpOpen(false)}
        actions={
          <Button variant="text" onClick={() => setHelpOpen(false)}>
            {strings.pantry.helpClose}
          </Button>
        }
      >
        {strings.pantry.help.map((p) => (
          <p key={p} className="mb-2">
            {p}
          </p>
        ))}
      </Dialog>
      {items !== null && rows.length === 0 && <p className="p-4">{strings.pantry.empty}</p>}
      {groups ? (
        groups.map((g) => {
          const id = g.id ?? 'none'
          return (
            <CollapsibleSection
              key={id}
              title={g.name}
              count={String(g.items.length)}
              open={!collapsed.includes(id)}
              onToggle={() => toggleCollapsed(id)}
              listLabel={g.name}
            >
              {g.items.map(renderRow)}
            </CollapsibleSection>
          )
        })
      ) : (
        <ul aria-label={strings.pantry.listLabel}>{rows.map(renderRow)}</ul>
      )}
      <CatalogPicker entries={others} categories={categories} onPromote={onPromote} />
    </main>
  )
}
