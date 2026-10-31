import { collection, onSnapshot, type Unsubscribe } from 'firebase/firestore'
import { db } from '@/data/firebase'
import { catalogConverter, type CatalogEntry } from './converters'

/** Whole family catalog, live (ADR-0009); suggestions are filtered client-side. */
export function watchCatalog(
  familyId: string,
  cb: (entries: CatalogEntry[]) => void,
  onError?: (error: unknown) => void,
): Unsubscribe {
  const ref = collection(db, 'families', familyId, 'catalog').withConverter(catalogConverter)
  return onSnapshot(
    ref,
    { includeMetadataChanges: true },
    (snap) => cb(snap.docs.map((d) => d.data({ serverTimestamps: 'estimate' }))),
    onError,
  )
}
