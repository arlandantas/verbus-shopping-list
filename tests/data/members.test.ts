import { doc, getDoc, waitForPendingWrites } from 'firebase/firestore'
import { db } from '@/data/firebase'
import { createFamily, joinFamilyByCode } from '@/data/families'
import { ensureMemberProfile, watchMembers } from '@/data/members'
import { ensureUserProfile } from '@/data/users'
import { clearFirestore, loginAs, logout } from './support'

beforeEach(async () => {
  await logout()
  await clearFirestore()
})

const memberDoc = async (f: string, uid: string) =>
  (await getDoc(doc(db, 'families', f, 'members', uid))).data()

describe('members data', () => {
  it('S-027 AC1: ensureMemberProfile creates the doc (trimmed) and does not rewrite the same name', async () => {
    const user = await loginAs('ana')
    await ensureUserProfile(user)
    const { familyId } = await createFamily('Casa')
    expect(await ensureMemberProfile(familyId, user.uid, '  Ana  ')).toBe(true)
    await waitForPendingWrites(db)
    expect(await memberDoc(familyId, user.uid)).toEqual({ displayName: 'Ana' })
    expect(await ensureMemberProfile(familyId, user.uid, 'Ana')).toBe(false)
    expect(await ensureMemberProfile(familyId, user.uid, 'Ana B')).toBe(true)
    await waitForPendingWrites(db)
    expect(await memberDoc(familyId, user.uid)).toEqual({ displayName: 'Ana B' })
    expect(await ensureMemberProfile(familyId, user.uid, '   ')).toBe(false)
  })

  it('S-027 AC2: watchMembers delivers the names of both members', async () => {
    const ana = await loginAs('ana')
    await ensureUserProfile(ana)
    const { familyId, inviteCode } = await createFamily('Casa')
    await ensureMemberProfile(familyId, ana.uid, 'Ana')
    await waitForPendingWrites(db)
    await logout()
    const bia = await loginAs('bia')
    await ensureUserProfile(bia)
    await joinFamilyByCode(inviteCode)
    await ensureMemberProfile(familyId, bia.uid, 'Bia')
    await waitForPendingWrites(db)
    const names = await new Promise<Record<string, string>>((resolve, reject) => {
      const off = watchMembers(
        familyId,
        (n) => {
          if (Object.keys(n).length === 2) {
            queueMicrotask(() => off())
            resolve(n)
          }
        },
        reject,
      )
    })
    expect(names).toEqual({ [ana.uid]: 'Ana', [bia.uid]: 'Bia' })
  })
})
