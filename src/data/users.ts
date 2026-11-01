import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from '@/data/firebase'
import { userConverter, type UserProfile } from './converters'

export interface AuthUser {
  uid: string
  displayName: string | null
  email: string | null
}

/** Creates `users/{uid}` once; later calls are no-ops. */
export async function ensureUserProfile(user: AuthUser): Promise<void> {
  const ref = doc(db, 'users', user.uid)
  if ((await getDoc(ref)).exists()) return
  await setDoc(ref, {
    displayName: (user.displayName ?? user.email ?? '').slice(0, 60),
    email: user.email ?? '',
    groupIds: [],
    createdAt: serverTimestamp(),
  })
}

export function watchUser(uid: string, cb: (user: UserProfile | null) => void): Unsubscribe {
  return onSnapshot(
    doc(db, 'users', uid).withConverter(userConverter),
    { includeMetadataChanges: true },
    (snap) => cb(snap.exists() ? snap.data({ serverTimestamps: 'estimate' }) : null),
  )
}
