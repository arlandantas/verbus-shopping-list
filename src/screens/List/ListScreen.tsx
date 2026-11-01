import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '@/app/AuthProvider'
import { useFamily } from '@/app/FamilyProvider'
import { Snackbar } from '@/components/m3/Snackbar'
import { Icon } from '@/components/m3/Icon'
import { TopAppBar } from '@/components/m3/TopAppBar'
import { CategorySections } from '@/components/CategorySections'
import { CycleNotice } from '@/components/CycleNotice'
import { EditItemSheet } from '@/components/EditItemSheet'
import { useCategories } from '@/hooks/useCategories'
import { useMemberNames } from '@/hooks/useMemberNames'
import type { CatalogEntry, Item } from '@/data/converters'
import { addItem, setItemStatus, toggleItemStatus } from '@/data/items'
import { toNameKey } from '@/domain/nameKey'
import { parseItemText, type ParsedItem } from '@/domain/itemText'
import { strings } from '@/strings/pt-BR'
import { AddItemBar } from './AddItemBar'
import { ItemRow } from './ItemRow'
import { useCatalog } from './useCatalog'
import { useItems } from './useItems'

export function ListScreen() {
  const { family, recurringAdded, dismissRecurringNotice } = useFamily()
  const familyId = family?.id ?? ''
  const items = useItems(familyId)
  const catalog = useCatalog(familyId)
  const categories = useCategories(family?.id)
  const names = useMemberNames(family?.id)
  const uid = useAuth().user?.uid
  const [editingId, setEditingId] = useState<string | null>(null)
  const [undo, setUndo] = useState<{ itemId: string; key: number } | null>(null)
  const pendingKeys = useMemo(
    () => new Set((items ?? []).filter((i) => i.status === 'pending').map((i) => i.nameKey)),
    [items],
  )
  if (!family) return null
  const editing = items?.find((i) => i.id === editingId)

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
  const onToggle = (item: Item) => {
    toggleItemStatus(familyId, item)
    if (item.status === 'pending') setUndo({ itemId: item.id, key: Date.now() + Math.random() })
    else setUndo(null)
  }
  const list = items ?? []
  const done = list.filter((i) => i.status === 'bought').length

  return (
    <main className="mx-auto max-w-md">
      <TopAppBar
        title={family.name}
        subtitle={list.length > 0 ? strings.market.counter(done, list.length) : undefined}
        actions={
          done > 0 ? (
            <Link to="/finalizar" className="m3-top-bar__action">
              <Icon name="shopping_cart_checkout" />
              {strings.checkout.link}
            </Link>
          ) : undefined
        }
      />
      {list.length > 0 && done === list.length && (
        <p className="px-4 pb-2 text-green-800">{strings.market.allDone}</p>
      )}
      <CycleNotice added={recurringAdded} onDismiss={dismissRecurringNotice} />
      <AddItemBar onAdd={onAdd} catalog={catalog} pendingKeys={pendingKeys} onPick={onPick} />
      {items?.length === 0 && <p className="p-4">{strings.list.empty}</p>}
      {items && categories && (
        <CategorySections
          items={items}
          categories={categories}
          renderItem={(item) => (
            <ItemRow
              key={item.id}
              item={item}
              onToggle={onToggle}
              onEdit={(i) => setEditingId(i.id)}
              names={names}
              uid={uid}
            />
          )}
        />
      )}
      {undo && (
        <Snackbar
          key={undo.key}
          message={strings.list.addedToCart}
          actionLabel={strings.list.undo}
          onAction={() => setItemStatus(familyId, undo.itemId, 'pending')}
          onDismiss={() => setUndo(null)}
        />
      )}
      {editing && categories && (
        <EditItemSheet
          familyId={familyId}
          item={editing}
          categories={categories}
          onClose={() => setEditingId(null)}
        />
      )}
    </main>
  )
}
