import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  where,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from '@/data/firebase'
import {
  purchaseConverter,
  purchaseLineConverter,
  type Purchase,
  type PurchaseLine,
} from './converters'
import { fireAndForget } from './writeErrors'

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

export type PurchaseLinePatch = Partial<Pick<PurchaseLine, 'quantity' | 'unit' | 'priceCents'>>

/**
 * Edits quantity/unit/price of an archived line and rewrites the purchase `totalCents` (sum of the
 * prices of the lines of the same purchase, null if none has one) in a single un-awaited batch
 * (ADR-0021). `siblings` are the cached lines; the edited one is matched by id.
 */
export function updatePurchaseLine(
  familyId: string,
  line: PurchaseLine,
  patch: PurchaseLinePatch,
  siblings: PurchaseLine[],
): void {
  const family = ['families', familyId] as const
  const next = { ...line, ...patch }
  const prices = siblings
    .filter((l) => l.purchaseId === line.purchaseId && l.id !== line.id)
    .concat(next)
    .flatMap((l) => (l.priceCents == null ? [] : [l.priceCents]))
  const batch = writeBatch(db)
  batch.update(doc(db, ...family, 'purchaseLines', line.id), patch)
  batch.update(doc(db, ...family, 'purchases', line.purchaseId), {
    totalCents: prices.length ? prices.reduce((a, b) => a + b, 0) : null,
  })
  fireAndForget(batch.commit())
}
