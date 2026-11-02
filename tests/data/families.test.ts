import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/data/firebase'
import type { Family, UserProfile } from '@/data/converters'
import {
  AlreadyMember,
  GroupLimitReached,
  MAX_GROUPS_PER_USER,
  InviteNotFound,
  createFamily,
  getInvitePreview,
  joinFamilyByCode,
  renameFamily,
  rotateInviteCode,
  watchFamily,
  watchMyGroups,
} from '@/data/families'
import { ensureUserProfile, watchUser } from '@/data/users'
import { isValidInviteCode } from '@/domain/inviteCode'
import { clearFirestore, loginAs, logout } from './support'

beforeEach(async () => {
  await logout()
  await clearFirestore()
})

async function signUp(name: string) {
  const user = await loginAs(name)
  await ensureUserProfile(user)
  return user
}

/** Replaces users/{uid} through the emulator admin bypass (shapes the rules refuse to create). */
async function adminSetProfile(uid: string, extra: Record<string, unknown>) {
  const enc = (v: unknown): unknown =>
    Array.isArray(v) ? { arrayValue: { values: v.map(enc) } } : { stringValue: v as string }
  const fields: Record<string, unknown> = {
    displayName: { stringValue: 'X' },
    email: { stringValue: `${uid}@example.test` },
    createdAt: { timestampValue: new Date().toISOString() },
  }
  for (const [k, v] of Object.entries(extra)) fields[k] = enc(v)
  const res = await fetch(
    `http://127.0.0.1:8080/v1/projects/demo-verbus/databases/(default)/documents/users/${uid}`,
    {
      method: 'PATCH',
      headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields }),
    },
  )
  expect(res.ok).toBe(true)
}

const groupsOf = (uid: string, want: number) =>
  new Promise<Family[]>((resolve) => {
    const off = watchMyGroups(uid, (g) => {
      if (g.length === want) {
        off()
        resolve(g)
      }
    })
  })

const profileOf = async (uid: string) => (await getDoc(doc(db, 'users', uid))).data()

describe('S-009 AC2: ensureUserProfile', () => {
  it('creates users/{uid} once and is idempotent', async () => {
    const user = await loginAs('ana')
    await ensureUserProfile(user)
    const first = await profileOf(user.uid)
    expect(first).toMatchObject({ email: 'ana@example.test', groupIds: [] })
    await ensureUserProfile(user)
    expect((await profileOf(user.uid))?.createdAt).toEqual(first?.createdAt)
  })
})

describe('S-009 AC3: createFamily', () => {
  it('creates family, invite and profile.familyId in one batch', async () => {
    const user = await signUp('bia')
    const { familyId, inviteCode } = await createFamily('Casa')
    expect(isValidInviteCode(inviteCode)).toBe(true)
    const family = (await getDoc(doc(db, 'families', familyId))).data()
    expect(family).toMatchObject({
      name: 'Casa',
      members: [user.uid],
      ownerId: user.uid,
      inviteCode,
    })
    expect((await getDoc(doc(db, 'invites', inviteCode))).data()).toMatchObject({
      familyId,
      familyName: 'Casa',
      createdBy: user.uid,
    })
    expect((await profileOf(user.uid))?.groupIds).toEqual([familyId])
  })
})

describe('S-009 AC4: joinFamilyByCode', () => {
  it('adds the user for a valid code (normalized)', async () => {
    await signUp('caio')
    const { familyId, inviteCode } = await createFamily('Casa')
    await logout()
    const dani = await signUp('dani')
    const lower = ` ${inviteCode.slice(0, 4).toLowerCase()}-${inviteCode.slice(4)} `
    await expect(joinFamilyByCode(lower)).resolves.toEqual({ familyId })
    expect((await profileOf(dani.uid))?.groupIds).toEqual([familyId])
    const members = await new Promise<string[]>((resolve) => {
      const off = watchFamily(familyId, (f) => {
        if (f?.members.includes(dani.uid)) {
          off()
          resolve(f.members)
        }
      })
    })
    expect(members).toHaveLength(2)
  })

  it('rejects an unknown code with InviteNotFound', async () => {
    await signUp('eva')
    await expect(joinFamilyByCode('ZZZZ2222')).rejects.toBeInstanceOf(InviteNotFound)
    await expect(joinFamilyByCode('0000')).rejects.toBeInstanceOf(InviteNotFound)
  })

  it('S-088 AC3: joins while in another group; AlreadyMember writes nothing', async () => {
    await signUp('fabi')
    const { familyId, inviteCode } = await createFamily('Casa')
    await expect(joinFamilyByCode(inviteCode)).rejects.toMatchObject({
      name: 'AlreadyMember',
      familyId,
    })
    await expect(joinFamilyByCode(inviteCode)).rejects.toBeInstanceOf(AlreadyMember)
    await logout()
    const gil = await signUp('gil')
    const own = await createFamily('Outra')
    await expect(joinFamilyByCode(inviteCode)).resolves.toEqual({ familyId })
    expect((await profileOf(gil.uid))?.groupIds).toEqual([own.familyId, familyId])
  })
})

describe('S-088: multi-group create, limit and watchMyGroups', () => {
  it('AC2: createFamily appends to the ledger for 0, 1 and more groups, no familyId', async () => {
    const u = await signUp('hana')
    const a = await createFamily('A')
    const b = await createFamily('B')
    const c = await createFamily('C')
    const p = await profileOf(u.uid)
    expect(p?.groupIds).toEqual([a.familyId, b.familyId, c.familyId])
    expect(p).not.toHaveProperty('familyId')
  })

  it('AC4: with 10 groups, create and join throw GroupLimitReached before writing', async () => {
    await signUp('ivo')
    const other = await createFamily('Alvo')
    await logout()
    const u = await signUp('jaci')
    const ids = Array.from({ length: MAX_GROUPS_PER_USER }, (_, i) => `G${i}`)
    await adminSetProfile(u.uid, { groupIds: ids })
    await expect(createFamily('Nova')).rejects.toBeInstanceOf(GroupLimitReached)
    await expect(joinFamilyByCode(other.inviteCode)).rejects.toBeInstanceOf(GroupLimitReached)
    expect((await profileOf(u.uid))?.groupIds).toEqual(ids)
  })

  it('AC5: watchMyGroups lists groups by createdAt and updates on create and join', async () => {
    await signUp('kika')
    const first = await createFamily('Primeira')
    await logout()
    const u = await signUp('leo')
    const seen: string[][] = []
    const off = watchMyGroups(u.uid, (g) => seen.push(g.map((x) => x.id)))
    const mine = await createFamily('Minha')
    await vi.waitFor(() => expect(seen.at(-1)).toEqual([mine.familyId]))
    await joinFamilyByCode(first.inviteCode)
    await vi.waitFor(() => expect(seen.at(-1)).toEqual([first.familyId, mine.familyId]))
    off()
  })

  it('AC6: a legacy profile (familyId, no groupIds) sees its group and can join a second', async () => {
    const u = await signUp('mel')
    const old = await createFamily('Antiga')
    await adminSetProfile(u.uid, { familyId: old.familyId })
    expect(await groupsOf(u.uid, 1)).toMatchObject([{ id: old.familyId }])
    await logout()
    await signUp('nuno')
    const other = await createFamily('Nova')
    await logout()
    await loginAs('mel')
    await joinFamilyByCode(other.inviteCode)
    const p = await profileOf(u.uid)
    expect(p?.groupIds).toEqual([old.familyId, other.familyId])
    expect(p?.familyId).toBe(old.familyId)
    expect((await groupsOf(u.uid, 2)).map((g) => g.id)).toEqual([old.familyId, other.familyId])
  })
})

describe('S-012: watchFamily across a join', () => {
  it('recovers when the listener starts before the join is accepted server-side', async () => {
    await signUp('kaue')
    const { familyId, inviteCode } = await createFamily('Casa')
    await logout()
    const lia = await signUp('lia')
    const seen = new Promise<string[]>((resolve) => {
      const off = watchFamily(familyId, (f) => {
        if (f?.members.includes(lia.uid)) {
          off()
          resolve(f.members)
        }
      })
    })
    await joinFamilyByCode(inviteCode)
    expect(await seen).toHaveLength(2)
  })
})

describe('S-012: getInvitePreview', () => {
  it('returns familyId and familyName for a non-member, normalizing the code', async () => {
    await signUp('hugo')
    const { familyId, inviteCode } = await createFamily('Casa Hugo')
    await logout()
    await signUp('iara')
    const lower = `${inviteCode.slice(0, 4).toLowerCase()}-${inviteCode.slice(4)}`
    await expect(getInvitePreview(lower)).resolves.toEqual({ familyId, familyName: 'Casa Hugo' })
  })

  it('rejects unknown or malformed codes with InviteNotFound', async () => {
    await signUp('jose')
    await expect(getInvitePreview('ZZZZ2222')).rejects.toBeInstanceOf(InviteNotFound)
    await expect(getInvitePreview('0')).rejects.toBeInstanceOf(InviteNotFound)
  })
})

describe('S-009 AC5: watchers', () => {
  it('delivers typed user and family objects and unsubscribes', async () => {
    const user = await signUp('gabi')
    const { familyId } = await createFamily('Casa')

    const profile = await new Promise<UserProfile | null>((resolve) => {
      const off = watchUser(user.uid, (u) => {
        if (u?.familyId === familyId) {
          off()
          resolve(u)
        }
      })
    })
    expect(profile?.createdAt).toBeInstanceOf(Date)

    const calls: (Family | null)[] = []
    const off = watchFamily(familyId, (f) => calls.push(f))
    await vi.waitFor(() => expect(calls.length).toBeGreaterThan(0))
    expect(calls.at(-1)).toMatchObject({ id: familyId, name: 'Casa', members: [user.uid] })
    expect(typeof off).toBe('function')
    off()
  })
})

describe('S-077 AC4: rotateInviteCode', () => {
  it('creates the new invite, updates the family and deletes the old invite', async () => {
    const user = await signUp('rita')
    const { familyId, inviteCode } = await createFamily('Casa')
    const next = await rotateInviteCode(familyId)
    expect(next).not.toBe(inviteCode)
    expect(isValidInviteCode(next)).toBe(true)
    expect((await getDoc(doc(db, 'families', familyId))).data()?.inviteCode).toBe(next)
    expect((await getDoc(doc(db, 'invites', next))).data()).toMatchObject({
      familyId,
      familyName: 'Casa',
      createdBy: user.uid,
    })
    expect((await getDoc(doc(db, 'invites', inviteCode))).exists()).toBe(false)
  })
})

describe('S-118 AC3: renameFamily', () => {
  it('writes the group and its invite in one batch; non-owner is denied', async () => {
    const owner = await signUp('Ana')
    const { familyId, inviteCode } = await createFamily('Casa')
    await renameFamily(familyId, inviteCode, 'Nossa Casa')
    expect((await getDoc(doc(db, 'families', familyId))).data()?.name).toBe('Nossa Casa')
    expect((await getInvitePreview(inviteCode))?.familyName).toBe('Nossa Casa')
    expect(owner.uid).toBeTruthy()

    await logout()
    const other = await signUp('Beto')
    await joinFamilyByCode(inviteCode)
    expect(other.uid).not.toBe(owner.uid)
    await expect(renameFamily(familyId, inviteCode, 'Do Beto')).rejects.toMatchObject({
      code: 'permission-denied',
    })
  })
})
