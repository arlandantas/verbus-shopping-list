import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { doc, updateDoc, writeBatch } from 'firebase/firestore'
import { asUser, seed, setupEnv } from './support'

let env: RulesTestEnvironment

beforeAll(async () => {
  env = await setupEnv('demo-verbus-rename')
})
afterAll(async () => {
  await env.cleanup()
})
beforeEach(async () => {
  await env.clearFirestore()
  await seed(env, {
    'families/F1': {
      name: 'Casa',
      members: ['alice', 'bob'],
      ownerId: 'alice',
      inviteCode: 'ABCD2345',
      createdAt: new Date(),
    },
    'invites/ABCD2345': {
      familyId: 'F1',
      familyName: 'Casa',
      createdBy: 'alice',
      createdAt: new Date(),
    },
  })
})

function rename(uid: string, name: string, inviteName = name) {
  const db = asUser(env, uid)
  const b = writeBatch(db)
  b.update(doc(db, 'families/F1'), { name })
  b.update(doc(db, 'invites/ABCD2345'), { familyName: inviteName })
  return b.commit()
}

describe('S-118 AC1: only the owner renames the group', () => {
  it('owner renames group and invite in one batch', async () => {
    await assertSucceeds(rename('alice', 'Nossa Casa'))
  })
  it('a non-owner member is denied', async () => {
    await assertFails(rename('bob', 'Casa do Beto'))
    await assertFails(updateDoc(doc(asUser(env, 'bob'), 'families/F1'), { name: 'X' }))
  })
  it('a stranger is denied', async () => {
    await assertFails(updateDoc(doc(asUser(env, 'eve'), 'families/F1'), { name: 'X' }))
  })
  it('rejects empty and over-60-char names', async () => {
    const db = asUser(env, 'alice')
    await assertFails(updateDoc(doc(db, 'families/F1'), { name: '' }))
    await assertFails(updateDoc(doc(db, 'families/F1'), { name: 'x'.repeat(61) }))
    await assertFails(updateDoc(doc(db, 'families/F1'), { name: 42 }))
  })
  it('the owner cannot change other fields together with the name', async () => {
    const db = asUser(env, 'alice')
    await assertFails(updateDoc(doc(db, 'families/F1'), { name: 'Y', ownerId: 'bob' }))
    await assertFails(updateDoc(doc(db, 'families/F1'), { name: 'Y', members: ['alice'] }))
  })
})

describe('S-118 AC2: invite familyName follows the group', () => {
  it('a member cannot set an invite name that differs from the group name', async () => {
    await assertFails(rename('alice', 'Nossa Casa', 'Outro nome'))
    await assertFails(
      updateDoc(doc(asUser(env, 'bob'), 'invites/ABCD2345'), { familyName: 'Hack' }),
    )
  })
  it('invite updates touching other fields or by strangers are denied', async () => {
    const db = asUser(env, 'alice')
    await assertFails(updateDoc(doc(db, 'invites/ABCD2345'), { familyId: 'F2' }))
    await assertFails(updateDoc(doc(db, 'invites/ABCD2345'), { createdBy: 'bob' }))
    await assertFails(
      updateDoc(doc(asUser(env, 'eve'), 'invites/ABCD2345'), { familyName: 'Casa' }),
    )
  })
})
