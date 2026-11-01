import { useMemo } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '@/app/AuthProvider'
import { useFamily } from '@/app/FamilyProvider'
import { IconButton } from '@/components/m3/IconButton'
import { TopAppBar } from '@/components/m3/TopAppBar'
import { CategorySections } from '@/components/CategorySections'
import { CycleNotice } from '@/components/CycleNotice'
import { CheckoutLink } from '@/components/CheckoutLink'
import { useCategories } from '@/hooks/useCategories'
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

export function ListScreen() {
  const { family, recurringAdded, dismissRecurringNotice } = useFamily()
  const familyId = family?.id ?? ''
  const items = useItems(familyId)
  const catalog = useCatalog(familyId)
  const categories = useCategories(family?.id)
  const names = useMemberNames(family?.id)
  const uid = useAuth().user?.uid
  const navigate = useNavigate()
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
      <TopAppBar
        title={family.name}
        actions={
          <IconButton
            icon="shopping_cart"
            label={strings.market.enter}
            onClick={() => void navigate('/mercado')}
          />
        }
      />
      <CycleNotice added={recurringAdded} onDismiss={dismissRecurringNotice} />
      <AddItemBar onAdd={onAdd} catalog={catalog} pendingKeys={pendingKeys} onPick={onPick} />
      {items?.some((i) => i.status === 'bought') && (
        <div className="px-4 pb-2">
          <CheckoutLink />
        </div>
      )}
      {items?.length === 0 && <p className="p-4">{strings.list.empty}</p>}
      {items && categories && (
        <CategorySections
          items={items}
          categories={categories}
          renderItem={(item) => (
            <ItemRow key={item.id} item={item} onToggle={onToggle} names={names} uid={uid} />
          )}
        />
      )}
    </main>
  )
}
