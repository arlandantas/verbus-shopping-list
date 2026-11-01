import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  writeBatch,
  type Unsubscribe,
  type WriteBatch,
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
  Pick<
    Item,
    'name' | 'quantity' | 'unit' | 'note' | 'categoryId' | 'recurring' | 'priceCents' | 'status'
  >
>

function currentUid(): string {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('not-signed-in')
  return uid
}

const itemsCol = (familyId: string) => collection(db, 'families', familyId, 'items')
const catalogRef = (familyId: string, nameKey: string) =>
  doc(db, 'families', familyId, 'catalog', nameKey)

/** Queues item + catalog entry on `batch` (merge + `recurring` only when given: ADR-0010). */
function queueItem(batch: WriteBatch, familyId: string, uid: string, input: NewItem): string {
  const name = input.name.trim()
  const nameKey = toNameKey(name)
  const categoryId = input.categoryId ?? null
  const ref = doc(itemsCol(familyId))
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
  return ref.id
}

/** One batch (no transaction, not awaited): item + catalog entry. Returns the new id at once. */
export function addItem(familyId: string, input: NewItem): string {
  return addItems(familyId, [input])[0]!
}

/** Many items in a single batch (2 writes each, ≤100 items), not awaited. Returns the ids. */
export function addItems(familyId: string, inputs: readonly NewItem[]): string[] {
  if (inputs.length === 0) return []
  const uid = currentUid()
  const batch = writeBatch(db)
  const ids = inputs.map((input) => queueItem(batch, familyId, uid, input))
  fireAndForget(batch.commit())
  return ids
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
export type ItemCurrent = Pick<Item, 'name' | 'nameKey' | 'quantity' | 'unit' | 'categoryId'> &
  Partial<Pick<Item, 'recurring'>>

/**
 * Updates only the given fields; catalog follows (same batch). A rename writes the new entry
 * (with the item's `recurring`) and clears `recurring` on the old one (ADR-0020). `status`
 * is written only when given, independent of the price (ADR-0022).
 */
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
  if ('status' in fields) {
    const bought = fields.status === 'bought'
    fields.markedBy = bought ? currentUid() : null
    fields.markedAt = bought ? serverTimestamp() : null
  }
  const nameKey = (fields.nameKey as string | undefined) ?? current.nameKey
  const renamed = nameKey !== current.nameKey
  const touchesCatalog =
    renamed || ['quantity', 'unit', 'categoryId', 'recurring'].some((k) => k in fields)
  const batch = writeBatch(db)
  batch.update(doc(itemsCol(familyId), id), fields)
  if (touchesCatalog) {
    const recurring = (fields.recurring as boolean | undefined) ?? current.recurring ?? false
    batch.set(
      catalogRef(familyId, nameKey),
      {
        name: (fields.name as string | undefined) ?? current.name,
        nameKey,
        quantity: fields.quantity ?? current.quantity,
        unit: fields.unit ?? current.unit,
        categoryId: 'categoryId' in fields ? fields.categoryId : current.categoryId,
        ...('recurring' in fields || renamed ? { recurring } : {}),
        lastUsedAt: serverTimestamp(),
      },
      { merge: true },
    )
    if (renamed && current.recurring)
      batch.set(
        catalogRef(familyId, current.nameKey),
        { recurring: false, lastUsedAt: serverTimestamp() },
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

/** Only status/markedBy/markedAt; the price is independent of the cart (ADR-0022). */
export function setItemStatus(familyId: string, id: string, status: ItemStatus): void {
  const bought = status === 'bought'
  fireAndForget(
    updateDoc(doc(itemsCol(familyId), id), {
      status,
      markedBy: bought ? currentUid() : null,
      markedAt: bought ? serverTimestamp() : null,
    }),
  )
}

/** Only `priceCents`, valid in any status (ADR-0022). */
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
