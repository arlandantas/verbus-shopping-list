import type { FirestoreDataConverter } from 'firebase/firestore'
import type { Unit } from '@/domain/units'

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

export interface MemberProfile {
  displayName: string
}

export const memberConverter: FirestoreDataConverter<MemberProfile> = {
  toFirestore: (m) => ({ displayName: m.displayName }),
  fromFirestore: (snap, options) => ({ displayName: snap.data(options).displayName }),
}

export type ItemStatus = 'pending' | 'bought'

export interface Item {
  id: string
  name: string
  nameKey: string
  quantity: number
  unit: Unit
  note: string | null
  categoryId: string | null
  recurring: boolean
  status: ItemStatus
  markedBy: string | null
  markedAt: Date | null
  priceCents: number | null
  createdBy: string
  createdAt: Date
  hasPendingWrites: boolean
}

export interface CatalogEntry {
  name: string
  nameKey: string
  quantity: number
  unit: Unit
  categoryId: string | null
  recurring: boolean
  lastUsedAt: Date
}

const toDate = (v: { toDate(): Date } | null | undefined): Date | null => (v ? v.toDate() : null)

export const itemConverter: FirestoreDataConverter<Item> = {
  // Writes build explicit payloads (items.ts); `id`/`hasPendingWrites` are read-only.
  toFirestore: () => {
    throw new Error('itemConverter is read-only')
  },
  fromFirestore(snap, options) {
    const d = snap.data(options)
    return {
      id: snap.id,
      name: d.name,
      nameKey: d.nameKey,
      quantity: d.quantity,
      unit: d.unit,
      note: d.note ?? null,
      categoryId: d.categoryId ?? null,
      recurring: d.recurring === true,
      status: d.status,
      markedBy: d.markedBy ?? null,
      markedAt: toDate(d.markedAt),
      priceCents: d.priceCents ?? null,
      createdBy: d.createdBy,
      createdAt: toDate(d.createdAt) ?? new Date(),
      hasPendingWrites: snap.metadata.hasPendingWrites,
    }
  },
}

export const catalogConverter: FirestoreDataConverter<CatalogEntry> = {
  toFirestore: () => {
    throw new Error('catalogConverter is read-only')
  },
  fromFirestore(snap, options) {
    const d = snap.data(options)
    return {
      name: d.name,
      nameKey: d.nameKey,
      quantity: d.quantity,
      unit: d.unit,
      categoryId: d.categoryId ?? null,
      recurring: d.recurring === true,
      lastUsedAt: toDate(d.lastUsedAt) ?? new Date(),
    }
  },
}
