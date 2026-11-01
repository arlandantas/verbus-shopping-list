import { collection, onSnapshot, orderBy, query, where, type Unsubscribe } from 'firebase/firestore'
import { db } from '@/data/firebase'
import {
  purchaseConverter,
  purchaseLineConverter,
  type Purchase,
  type PurchaseLine,
} from './converters'

const SNAPSHOT = { includeMetadataChanges: true } as const
const OPTIONS = { serverTimestamps: 'estimate' } as const

/** Live purchases, most recent first (pending ones use the estimated server time). */
export function watchPurchases(
  familyId: string,
  cb: (purchases: Purchase[]) => void,
  onError?: (error: unknown) => void,
): Unsubscribe {
  const q = query(
    collection(db, 'families', familyId, 'purchases').withConverter(purchaseConverter),
    orderBy('purchasedAt', 'desc'),
  )
  return onSnapshot(q, SNAPSHOT, (snap) => cb(snap.docs.map((d) => d.data(OPTIONS))), onError)
}

/** Live purchase lines of one cycle ("2026-11"), most recent first. */
export function watchCycleLines(
  familyId: string,
  cycle: string,
  cb: (lines: PurchaseLine[]) => void,
  onError?: (error: unknown) => void,
): Unsubscribe {
  const q = query(
    collection(db, 'families', familyId, 'purchaseLines').withConverter(purchaseLineConverter),
    where('cycle', '==', cycle),
  )
  return onSnapshot(
    q,
    SNAPSHOT,
    (snap) =>
      cb(
        snap.docs
          .map((d) => d.data(OPTIONS))
          .sort((a, b) => b.purchasedAt.getTime() - a.purchasedAt.getTime()),
      ),
    onError,
  )
}
