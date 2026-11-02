import {
  collection,
  doc,
  getDocFromServer,
  getDocsFromServer,
  query,
  serverTimestamp,
  where,
  writeBatch,
  type FirestoreError,
} from 'firebase/firestore'
import { auth, db } from '@/data/firebase'
import { pantryState } from '@/domain/pantry'
import { catalogConverter, itemConverter } from './converters'

/** Marker + items must stay under the 500-write batch limit; the rules cap the count too (ADR-0013). */
export const MAX_RECURRING_PER_CYCLE = 400

export interface OpenCycleResult {
  added: number
  /** True when nothing was decided: the month was already open, or there is no network. */
  skipped?: boolean
}

const code = (e: unknown) => (e as Partial<FirestoreError> | null)?.code

/**
 * First online open of a month (ADR-0013): creates the create-only `cycles/{cycle}` marker and
 * re-adds the `atHome` recurring entries as pending items in ONE batch. Decides only from server
 * reads (offline -> skipped, never from a cache). If another device wins the race the marker
 * create is denied and the whole batch fails: that `permission-denied` is swallowed, no duplicates.
 * Awaiting is fine here: this runs in the background, never on a UI path.
 */
export async function openCycleIfNeeded(
  familyId: string,
  cycle: string,
  recurringEnabled = true,
): Promise<OpenCycleResult> {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('not-signed-in')
  const family = ['families', familyId] as const
  const markerRef = doc(db, ...family, 'cycles', cycle)

  let catalog, items
  try {
    if ((await getDocFromServer(markerRef)).exists()) return { added: 0, skipped: true }
    const [catalogSnap, itemsSnap] = await Promise.all([
      getDocsFromServer(
        query(
          collection(db, ...family, 'catalog').withConverter(catalogConverter),
          where('recurring', '==', true),
        ),
      ),
      getDocsFromServer(collection(db, ...family, 'items').withConverter(itemConverter)),
    ])
    catalog = catalogSnap.docs.map((d) => d.data())
    items = itemsSnap.docs.map((d) => d.data())
  } catch (e) {
    if (code(e) === 'unavailable') return { added: 0, skipped: true }
    throw e
  }

  // ADR-0028: with recurrence off the month still opens (marker) but nothing returns.
  const returning = recurringEnabled
    ? pantryState(catalog, items)
        .filter((p) => p.state === 'atHome')
        .slice(0, MAX_RECURRING_PER_CYCLE)
    : []

  const batch = writeBatch(db)
  batch.set(markerRef, {
    openedBy: uid,
    openedAt: serverTimestamp(),
    recurringAdded: returning.length,
  })
  for (const { entry } of returning) {
    batch.set(doc(collection(db, ...family, 'items')), {
      name: entry.name,
      nameKey: entry.nameKey,
      quantity: entry.quantity,
      unit: entry.unit,
      note: null,
      categoryId: entry.categoryId,
      recurring: true,
      status: 'pending',
      markedBy: null,
      markedAt: null,
      priceCents: null,
      createdBy: uid,
      createdAt: serverTimestamp(),
    })
  }
  try {
    await batch.commit()
  } catch (e) {
    // Lost the race: another device created the marker first and this whole batch was denied.
    if (code(e) === 'permission-denied') return { added: 0, skipped: true }
    throw e
  }
  return { added: returning.length }
}
