import { collection, doc, getDoc, onSnapshot, setDoc, type Unsubscribe } from 'firebase/firestore'
import { db } from '@/data/firebase'
import { memberConverter } from './converters'

const MAX_NAME = 60

/**
 * Publishes the caller's name at families/{F}/members/{uid}. Skips the write when the doc already
 * holds the same name. The rules cannot trim, so trimming happens here. Returns whether a write
 * was issued (not awaited: offline-safe, ADR-0004).
 */
export async function ensureMemberProfile(
  familyId: string,
  uid: string,
  displayName: string,
): Promise<boolean> {
  const name = displayName.trim().slice(0, MAX_NAME).trim()
  if (!name) return false
  const ref = doc(db, 'families', familyId, 'members', uid)
  try {
    const snap = await getDoc(ref)
    if (snap.exists() && snap.data().displayName === name) return false
  } catch {
    return false // offline with nothing cached: try again on the next ready
  }
  void setDoc(ref, { displayName: name })
  return true
}

/** uid -> display name for every member profile of the family, live. */
export function watchMembers(
  familyId: string,
  cb: (names: Record<string, string>) => void,
  onError?: (error: unknown) => void,
): Unsubscribe {
  const ref = collection(db, 'families', familyId, 'members').withConverter(memberConverter)
  return onSnapshot(
    ref,
    { includeMetadataChanges: true },
    (snap) => cb(Object.fromEntries(snap.docs.map((d) => [d.id, d.data().displayName]))),
    onError,
  )
}
