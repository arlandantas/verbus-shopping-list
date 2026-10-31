import { collection, doc, serverTimestamp, writeBatch } from 'firebase/firestore'
import { auth, db } from '@/data/firebase'
import { cycleOf } from '@/domain/cycle'
import type { Category, Item } from './converters'
import { fireAndForget } from './writeErrors'

/** 1 purchase + 200 lines + 200 deletes = 401 writes, under the 500 batch limit (ADR-0012). */
export const CHECKOUT_CHUNK = 200

export interface CheckoutOptions {
  market: string | null
  categories: Pick<Category, 'id' | 'name'>[]
  /** Overridable clock; defaults to the device's current time. */
  now?: Date
}

type BoughtItem = Pick<
  Item,
  'id' | 'name' | 'nameKey' | 'quantity' | 'unit' | 'categoryId' | 'priceCents' | 'markedBy'
>

/**
 * Archives bought items (already in memory) into purchases + purchaseLines and removes them from
 * `items`, in independent atomic batches of up to CHECKOUT_CHUNK. Not awaited, no transaction
 * (ADR-0004/0012). Lines are create-only keyed by item id: re-sending an already archived chunk is
 * denied whole by the rules, so a retry never duplicates; chunks that never committed go through.
 */
export function checkout(familyId: string, bought: BoughtItem[], options: CheckoutOptions): void {
  if (bought.length === 0) return
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('not-signed-in')
  const market = options.market?.trim() || null
  const cycle = cycleOf(options.now ?? new Date())
  const names = new Map(options.categories.map((c) => [c.id, c.name]))
  const family = ['families', familyId] as const

  for (let start = 0; start < bought.length; start += CHECKOUT_CHUNK) {
    const chunk = bought.slice(start, start + CHECKOUT_CHUNK)
    const purchaseRef = doc(collection(db, ...family, 'purchases'))
    const prices = chunk.flatMap((i) => (i.priceCents == null ? [] : [i.priceCents]))
    const batch = writeBatch(db)
    batch.set(purchaseRef, {
      cycle,
      market,
      itemCount: chunk.length,
      totalCents: prices.length ? prices.reduce((a, b) => a + b, 0) : null,
      createdBy: uid,
      purchasedAt: serverTimestamp(),
    })
    for (const i of chunk) {
      batch.set(doc(db, ...family, 'purchaseLines', i.id), {
        purchaseId: purchaseRef.id,
        cycle,
        name: i.name,
        nameKey: i.nameKey,
        quantity: i.quantity,
        unit: i.unit,
        categoryId: i.categoryId,
        categoryName: (i.categoryId && names.get(i.categoryId)) || null,
        priceCents: i.priceCents,
        market,
        markedBy: i.markedBy,
        purchasedAt: serverTimestamp(),
      })
      batch.delete(doc(db, ...family, 'items', i.id))
    }
    fireAndForget(batch.commit())
  }
}
