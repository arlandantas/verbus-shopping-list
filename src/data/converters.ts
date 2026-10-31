import type { FirestoreDataConverter } from 'firebase/firestore'

export interface UserProfile {
  displayName: string
  email: string
  familyId: string | null
  createdAt: Date
}

export interface Family {
  id: string
  name: string
  members: string[]
  ownerId: string
  inviteCode: string
  createdAt: Date
}

// Reads go through converters (callers pass `serverTimestamps: 'estimate'` so a pending
// serverTimestamp() is readable); writes build their payloads explicitly.

export const userConverter: FirestoreDataConverter<UserProfile> = {
  toFirestore: (u) => ({ ...u }),
  fromFirestore(snap, options) {
    const d = snap.data(options)
    return {
      displayName: d.displayName,
      email: d.email,
      familyId: d.familyId ?? null,
      createdAt: d.createdAt.toDate(),
    }
  },
}

export const familyConverter: FirestoreDataConverter<Family> = {
  toFirestore: (f) => ({
    name: f.name,
    members: f.members,
    ownerId: f.ownerId,
    inviteCode: f.inviteCode,
    createdAt: f.createdAt,
  }),
  fromFirestore(snap, options) {
    const d = snap.data(options)
    return {
      id: snap.id,
      name: d.name,
      members: d.members,
      ownerId: d.ownerId,
      inviteCode: d.inviteCode,
      createdAt: d.createdAt.toDate(),
    }
  },
}
