import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocFromCache,
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
  batch.set(catalogRef(familyId, nameKey), {
    name,
    nameKey,
    quantity: input.quantity,
    unit: input.unit,
    categoryId,
    lastUsedAt: serverTimestamp(),
  })
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

async function readCurrent(familyId: string, id: string): Promise<Item | null> {
  const ref = doc(itemsCol(familyId), id).withConverter(itemConverter)
  try {
    return (await getDocFromCache(ref)).data({ serverTimestamps: 'estimate' }) ?? null
  } catch {
    const snap = await getDoc(ref)
    return snap.exists() ? snap.data({ serverTimestamps: 'estimate' }) : null
  }
}

/** Updates only the given fields; catalog follows (same batch) when quantity/unit/category change. */
export async function updateItemDetails(
  familyId: string,
  id: string,
  patch: ItemPatch,
): Promise<void> {
  const fields: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(patch)) if (v !== undefined) fields[k] = v
  if (typeof fields.name === 'string') {
    const name = fields.name.trim()
    fields.name = name
    fields.nameKey = toNameKey(name)
  }
  const touchesCatalog = ['quantity', 'unit', 'categoryId'].some((k) => k in fields)
  const batch = writeBatch(db)
  batch.update(doc(itemsCol(familyId), id), fields)
  if (touchesCatalog) {
    const cur = await readCurrent(familyId, id)
    if (cur) {
      const name = (fields.name as string | undefined) ?? cur.name
      const nameKey = (fields.nameKey as string | undefined) ?? cur.nameKey
      batch.set(catalogRef(familyId, nameKey), {
        name,
        nameKey,
        quantity: fields.quantity ?? cur.quantity,
        unit: fields.unit ?? cur.unit,
        categoryId: 'categoryId' in fields ? fields.categoryId : cur.categoryId,
        lastUsedAt: serverTimestamp(),
      })
    }
  }
  fireAndForget(batch.commit())
}

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

export function deleteItem(familyId: string, id: string): void {
  fireAndForget(deleteDoc(doc(itemsCol(familyId), id)))
}
