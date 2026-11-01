import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/data/firebase'
import type { Family, UserProfile } from '@/data/converters'
import {
  AlreadyInFamily,
  InviteNotFound,
  createFamily,
  getInvitePreview,
  joinFamilyByCode,
  rotateInviteCode,
  watchFamily,
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

  it('rejects a user already in a family with AlreadyInFamily', async () => {
    await signUp('fabi')
    const { inviteCode } = await createFamily('Casa')
    await expect(joinFamilyByCode(inviteCode)).rejects.toBeInstanceOf(AlreadyInFamily)
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
