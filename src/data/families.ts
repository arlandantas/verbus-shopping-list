import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore'
import { auth, db } from '@/data/firebase'
import { generateInviteCode, isValidInviteCode, normalizeInviteCode } from '@/domain/inviteCode'
import { addMemberProfileToBatch } from './members'
import { familyConverter, type Family } from './converters'

export class InviteNotFound extends Error {
  constructor() {
    super('invite-not-found')
    this.name = 'InviteNotFound'
  }
}

/** Already a member of the invite's group: nothing is written; the client switches to `familyId`. */
export class AlreadyMember extends Error {
  readonly familyId: string
  constructor(familyId: string) {
    super('already-member')
    this.name = 'AlreadyMember'
    this.familyId = familyId
  }
}

export class GroupLimitReached extends Error {
  constructor() {
    super('group-limit-reached')
    this.name = 'GroupLimitReached'
  }
}

export const MAX_GROUPS_PER_USER = 10

function currentUid(): string {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('not-signed-in')
  return uid
}

/** Group ledger of a stored profile (ADR-0024): groupIds, else the legacy familyId, else empty. */
function ledgerOf(data: Record<string, unknown> | undefined): string[] {
  if (Array.isArray(data?.groupIds)) return data.groupIds as string[]
  return typeof data?.familyId === 'string' ? [data.familyId] : []
}

const MAX_CODE_ATTEMPTS = 3

async function freshInviteCode(): Promise<string> {
  for (let i = 0; i < MAX_CODE_ATTEMPTS; i++) {
    const code = generateInviteCode()
    if (!(await getDoc(doc(db, 'invites', code))).exists()) return code
  }
  throw new Error('invite-code-collision')
}

/** Single batch: family + invite + profile.groupIds; no categories (S-092). Needs an existing profile (ensureUserProfile). */
export async function createFamily(
  name: string,
  recurringEnabled = true,
): Promise<{ familyId: string; inviteCode: string }> {
  const uid = currentUid()
  const inviteCode = await freshInviteCode()
  const familyRef = doc(collection(db, 'families'))
  const profile = await getDoc(doc(db, 'users', uid))
  if (ledgerOf(profile.data()).length >= MAX_GROUPS_PER_USER) throw new GroupLimitReached()
  const batch = writeBatch(db)
  batch.set(familyRef, {
    name,
    members: [uid],
    ownerId: uid,
    inviteCode,
    recurringEnabled,
    createdAt: serverTimestamp(),
  })
  batch.set(doc(db, 'invites', inviteCode), {
    familyId: familyRef.id,
    familyName: name,
    createdBy: uid,
    createdAt: serverTimestamp(),
  })
  batch.update(doc(db, 'users', uid), {
    groupIds: [...ledgerOf(profile.data()), familyRef.id],
  })
  addMemberProfileToBatch(batch, familyRef.id, uid, profile.data()?.displayName ?? '')
  await batch.commit()
  return { familyId: familyRef.id, inviteCode }
}

/** Turns the pantry/recurring feature on or off for the group (ADR-0028). Optimistic; never awaited by the UI. */
export function setRecurringEnabled(familyId: string, enabled: boolean): Promise<void> {
  return updateDoc(doc(db, 'families', familyId), { recurringEnabled: enabled })
}

/** One batch (no transaction, ADR-0004): new invite + family.inviteCode + old invite deleted. Returns the new code. */
export async function rotateInviteCode(familyId: string): Promise<string> {
  const uid = currentUid()
  const familyRef = doc(db, 'families', familyId)
  const family = await getDoc(familyRef)
  if (!family.exists()) throw new Error('family-not-found')
  const oldCode: string | undefined = family.data().inviteCode
  const inviteCode = await freshInviteCode()
  const batch = writeBatch(db)
  batch.set(doc(db, 'invites', inviteCode), {
    familyId,
    familyName: family.data().name,
    createdBy: uid,
    createdAt: serverTimestamp(),
  })
  batch.update(familyRef, { inviteCode })
  if (oldCode) batch.delete(doc(db, 'invites', oldCode))
  await batch.commit()
  return inviteCode
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
  const invite = await getDoc(doc(db, 'invites', code))
  if (!invite.exists()) throw new InviteNotFound()
  const familyId: string = invite.data().familyId
  const base = ledgerOf(profile.data())
  if (base.includes(familyId)) throw new AlreadyMember(familyId)
  if (base.length >= MAX_GROUPS_PER_USER) throw new GroupLimitReached()

  const batch = writeBatch(db)
  batch.update(doc(db, 'families', familyId), { members: arrayUnion(uid), joinCode: code })
  batch.update(doc(db, 'users', uid), { groupIds: [...base, familyId] })
  addMemberProfileToBatch(batch, familyId, uid, profile.data()?.displayName ?? '')
  await batch.commit()
  return { familyId }
}

/**
 * Live list of the user's groups (`members array-contains uid`), oldest first. Sorted on the
 * client: array-contains + orderBy would need a composite index.
 */
export function watchMyGroups(
  uid: string,
  cb: (groups: Family[]) => void,
  onError?: () => void,
): Unsubscribe {
  const q = query(
    collection(db, 'families').withConverter(familyConverter),
    where('members', 'array-contains', uid),
  )
  const accepted = new Set<string>()
  return onSnapshot(
    q,
    { includeMetadataChanges: true },
    (snap) => {
      const groups = snap.docs
        .filter((d) => {
          // A new group stays hidden until the server accepts it; once accepted, later local edits
          // (e.g. the recurring toggle, ADR-0028) must not hide it again.
          if (!d.metadata.hasPendingWrites) accepted.add(d.id)
          return accepted.has(d.id)
        })
        .map((d) => d.data({ serverTimestamps: 'estimate' }))
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      cb(groups)
    },
    () => onError?.(),
  )
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
        // A local-only family (create/join still in flight) is not usable yet: the list's
        // listeners and writes would reach the server before it knows the membership and be denied.
        if (snap.exists() && snap.metadata.hasPendingWrites) return
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
