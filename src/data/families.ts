import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore'
import { auth, db } from '@/data/firebase'
import { generateInviteCode, isValidInviteCode, normalizeInviteCode } from '@/domain/inviteCode'
import { familyConverter, type Family } from './converters'

export class InviteNotFound extends Error {
  constructor() {
    super('invite-not-found')
    this.name = 'InviteNotFound'
  }
}

export class AlreadyInFamily extends Error {
  constructor() {
    super('already-in-family')
    this.name = 'AlreadyInFamily'
  }
}

function currentUid(): string {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('not-signed-in')
  return uid
}

const MAX_CODE_ATTEMPTS = 3

async function freshInviteCode(): Promise<string> {
  for (let i = 0; i < MAX_CODE_ATTEMPTS; i++) {
    const code = generateInviteCode()
    if (!(await getDoc(doc(db, 'invites', code))).exists()) return code
  }
  throw new Error('invite-code-collision')
}

/** Single batch: family + invite + profile.familyId. Needs an existing profile (ensureUserProfile). */
export async function createFamily(
  name: string,
): Promise<{ familyId: string; inviteCode: string }> {
  const uid = currentUid()
  const inviteCode = await freshInviteCode()
  const familyRef = doc(collection(db, 'families'))
  const batch = writeBatch(db)
  batch.set(familyRef, {
    name,
    members: [uid],
    ownerId: uid,
    inviteCode,
    createdAt: serverTimestamp(),
  })
  batch.set(doc(db, 'invites', inviteCode), {
    familyId: familyRef.id,
    familyName: name,
    createdBy: uid,
    createdAt: serverTimestamp(),
  })
  batch.update(doc(db, 'users', uid), { familyId: familyRef.id })
  await batch.commit()
  return { familyId: familyRef.id, inviteCode }
}

/** Public preview of an invite (ADR-0007): readable by any signed-in user, member or not. */
export async function getInvitePreview(
  rawCode: string,
): Promise<{ familyId: string; familyName: string }> {
  const code = normalizeInviteCode(rawCode)
  if (!isValidInviteCode(code)) throw new InviteNotFound()
  const invite = await getDoc(doc(db, 'invites', code))
  if (!invite.exists()) throw new InviteNotFound()
  return { familyId: invite.data().familyId, familyName: invite.data().familyName }
}

/** Reads the invite, then one batch (no transaction, ADR-0004) updates family + profile. */
export async function joinFamilyByCode(rawCode: string): Promise<{ familyId: string }> {
  const uid = currentUid()
  const code = normalizeInviteCode(rawCode)
  if (!isValidInviteCode(code)) throw new InviteNotFound()

  const profile = await getDoc(doc(db, 'users', uid))
  if (profile.exists() && profile.data().familyId != null) throw new AlreadyInFamily()

  const invite = await getDoc(doc(db, 'invites', code))
  if (!invite.exists()) throw new InviteNotFound()
  const familyId: string = invite.data().familyId

  const batch = writeBatch(db)
  batch.update(doc(db, 'families', familyId), { members: arrayUnion(uid), joinCode: code })
  batch.update(doc(db, 'users', uid), { familyId })
  await batch.commit()
  return { familyId }
}

const WATCH_RETRIES = 5

/**
 * Live family doc. A listener opened before a pending join/create is accepted server-side is
 * denied (not a member yet) and dies, so errors resubscribe with a short backoff;
 * when retries run out `onError` fires so the caller can surface an error state.
 */
export function watchFamily(
  id: string,
  cb: (family: Family | null) => void,
  onError?: () => void,
): Unsubscribe {
  const ref = doc(db, 'families', id).withConverter(familyConverter)
  let stopped = false
  let attempts = 0
  let off: Unsubscribe | undefined
  let timer: ReturnType<typeof setTimeout> | undefined

  const start = () => {
    off = onSnapshot(
      ref,
      { includeMetadataChanges: true },
      (snap) => {
        attempts = 0
        cb(snap.exists() ? snap.data({ serverTimestamps: 'estimate' }) : null)
      },
      () => {
        if (stopped) return
        if (attempts >= WATCH_RETRIES) {
          onError?.() // retries exhausted: let the UI leave `loading`
          return
        }
        attempts += 1
        timer = setTimeout(start, 300 * attempts)
      },
    )
  }
  start()
  return () => {
    stopped = true
    clearTimeout(timer)
    off?.()
  }
}
