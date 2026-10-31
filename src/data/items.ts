import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore'
import { auth, db } from '@/data/firebase'
import { toNameKey } from '@/domain/nameKey'
import type { Unit } from '@/domain/units'
import { itemConverter, type Item, type ItemStatus } from './converters'
import { fireAndForget } from './writeErrors'

export interface NewItem {
  name: string
  quantity: number
  unit: Unit
  note?: string | null
  categoryId?: string | null
  recurring?: boolean
}

export type ItemPatch = Partial<
  Pick<Item, 'name' | 'quantity' | 'unit' | 'note' | 'categoryId' | 'recurring'>
>

function currentUid(): string {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('not-signed-in')
  return uid
}

const itemsCol = (familyId: string) => collection(db, 'families', familyId, 'items')
const catalogRef = (familyId: string, nameKey: string) =>
  doc(db, 'families', familyId, 'catalog', nameKey)

/** One batch (no transaction, not awaited): item + catalog entry. Returns the new id at once. */
export function addItem(familyId: string, input: NewItem): string {
  const uid = currentUid()
  const name = input.name.trim()
  const nameKey = toNameKey(name)
  const categoryId = input.categoryId ?? null
  const ref = doc(itemsCol(familyId))
  const batch = writeBatch(db)
  batch.set(ref, {
    name,
    nameKey,
    quantity: input.quantity,
    unit: input.unit,
    note: input.note ?? null,
    categoryId,
    recurring: input.recurring ?? false,
    status: 'pending',
    markedBy: null,
    markedAt: null,
    priceCents: null,
    createdBy: uid,
    createdAt: serverTimestamp(),
  })
  // merge + `recurring` only when given: re-adding by free text must not erase the mark (ADR-0010)
  batch.set(
    catalogRef(familyId, nameKey),
    {
      name,
      nameKey,
      quantity: input.quantity,
      unit: input.unit,
      categoryId,
      ...(input.recurring === undefined ? {} : { recurring: input.recurring }),
      lastUsedAt: serverTimestamp(),
    },
    { merge: true },
  )
  fireAndForget(batch.commit())
  return ref.id
}

const time = (d: Date | null) => d?.getTime() ?? 0

/** Pending first (by createdAt), then bought (by markedAt). */
export function sortItems(items: Item[]): Item[] {
  const pending = items.filter((i) => i.status === 'pending')
  const bought = items.filter((i) => i.status === 'bought')
  pending.sort((a, b) => time(a.createdAt) - time(b.createdAt))
  bought.sort((a, b) => time(a.markedAt) - time(b.markedAt))
  return [...pending, ...bought]
}

export function watchItems(
  familyId: string,
  cb: (items: Item[]) => void,
  onError?: (error: unknown) => void,
): Unsubscribe {
  return onSnapshot(
    itemsCol(familyId).withConverter(itemConverter),
    { includeMetadataChanges: true },
    (snap) => cb(sortItems(snap.docs.map((d) => d.data({ serverTimestamps: 'estimate' })))),
    onError,
  )
}

/** What the caller already knows about the item; lets the catalog follow without any read. */
export type ItemCurrent = Pick<Item, 'name' | 'nameKey' | 'quantity' | 'unit' | 'categoryId'>

/** Updates only the given fields; catalog follows (same batch) when quantity/unit/category change. */
export function updateItemDetails(
  familyId: string,
  id: string,
  patch: ItemPatch,
  current: ItemCurrent,
): void {
  const fields: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(patch)) if (v !== undefined) fields[k] = v
  if (typeof fields.name === 'string') {
    const name = fields.name.trim()
    fields.name = name
    fields.nameKey = toNameKey(name)
  }
  const touchesCatalog = ['quantity', 'unit', 'categoryId', 'recurring'].some((k) => k in fields)
  const batch = writeBatch(db)
  batch.update(doc(itemsCol(familyId), id), fields)
  if (touchesCatalog) {
    const name = (fields.name as string | undefined) ?? current.name
    const nameKey = (fields.nameKey as string | undefined) ?? current.nameKey
    batch.set(
      catalogRef(familyId, nameKey),
      {
        name,
        nameKey,
        quantity: fields.quantity ?? current.quantity,
        unit: fields.unit ?? current.unit,
        categoryId: 'categoryId' in fields ? fields.categoryId : current.categoryId,
        ...('recurring' in fields ? { recurring: fields.recurring } : {}),
        lastUsedAt: serverTimestamp(),
      },
      { merge: true },
    )
  }
  fireAndForget(batch.commit())
}

/** One batch: catalog.recurring plus the mirror on every item with this nameKey (ADR-0010). */
export function setRecurring(
  familyId: string,
  nameKey: string,
  recurring: boolean,
  items: Pick<Item, 'id' | 'nameKey'>[],
): void {
  const batch = writeBatch(db)
  batch.set(
    catalogRef(familyId, nameKey),
    { recurring, lastUsedAt: serverTimestamp() },
    { merge: true },
  )
  for (const i of items)
    if (i.nameKey === nameKey) batch.update(doc(itemsCol(familyId), i.id), { recurring })
  fireAndForget(batch.commit())
}

/** Marking leaves the price alone; unmarking clears it in the same update (ADR-0015). */
export function setItemStatus(familyId: string, id: string, status: ItemStatus): void {
  const bought = status === 'bought'
  fireAndForget(
    updateDoc(doc(itemsCol(familyId), id), {
      status,
      markedBy: bought ? currentUid() : null,
      markedAt: bought ? serverTimestamp() : null,
      ...(bought ? {} : { priceCents: null }),
    }),
  )
}

/** Only `priceCents`; rules accept it solely on bought items (ADR-0015). */
export function setItemPrice(familyId: string, id: string, cents: number | null): void {
  fireAndForget(updateDoc(doc(itemsCol(familyId), id), { priceCents: cents }))
}

/** The single status flip shared by List and Mercado (ADR-0011): writes the inverse status. */
export function toggleItemStatus(familyId: string, item: Pick<Item, 'id' | 'status'>): void {
  setItemStatus(familyId, item.id, item.status === 'bought' ? 'pending' : 'bought')
}

export function deleteItem(familyId: string, id: string): void {
  fireAndForget(deleteDoc(doc(itemsCol(familyId), id)))
}
