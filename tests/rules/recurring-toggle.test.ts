import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { doc, serverTimestamp, updateDoc, writeBatch } from 'firebase/firestore'
import { anon, asUser, seed, setupEnv } from './support'

let env: RulesTestEnvironment

beforeAll(async () => {
  env = await setupEnv('demo-verbus-recurring-toggle')
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
      createdAt: new Date(),
    },
    'users/alice': { displayName: 'A', email: 'a@x.com', groupIds: ['F1'], createdAt: new Date() },
    'users/carol': { displayName: 'C', email: 'c@x.com', groupIds: [], createdAt: new Date() },
  })
})

function create(over: Record<string, unknown> = {}) {
  const db = asUser(env, 'carol')
  const b = writeBatch(db)
  b.set(doc(db, 'families/F3'), {
    name: 'Nova',
    members: ['carol'],
    ownerId: 'carol',
    inviteCode: 'ABCD2345',
    createdAt: serverTimestamp(),
    ...over,
  })
  b.set(doc(db, 'invites/ABCD2345'), {
    familyId: 'F3',
    familyName: 'Nova',
    createdBy: 'carol',
    createdAt: serverTimestamp(),
  })
  b.update(doc(db, 'users/carol'), { groupIds: ['F3'] })
  return b.commit()
}

describe('S-105 AC1: families.recurringEnabled', () => {
  it('creates with the field (true or false) or without it', async () => {
    await assertSucceeds(create({ recurringEnabled: false }))
    await env.clearFirestore()
    await seed(env, {
      'users/carol': { displayName: 'C', email: 'c@x.com', groupIds: [], createdAt: new Date() },
    })
    await assertSucceeds(create({ recurringEnabled: true }))
    await env.clearFirestore()
    await seed(env, {
      'users/carol': { displayName: 'C', email: 'c@x.com', groupIds: [], createdAt: new Date() },
    })
    await assertSucceeds(create())
  })

  it('denies a non-boolean value on create', async () => {
    await assertFails(create({ recurringEnabled: 'yes' }))
    await assertFails(create({ recurringEnabled: 1 }))
    await assertFails(create({ recurringEnabled: null }))
  })

  it('lets a member set it on a legacy group (field absent)', async () => {
    await assertSucceeds(
      updateDoc(doc(asUser(env, 'bob'), 'families/F1'), { recurringEnabled: false }),
    )
    await assertSucceeds(
      updateDoc(doc(asUser(env, 'alice'), 'families/F1'), { recurringEnabled: true }),
    )
  })

  it('denies a non-member and anonymous', async () => {
    await assertFails(
      updateDoc(doc(asUser(env, 'carol'), 'families/F1'), { recurringEnabled: false }),
    )
    await assertFails(updateDoc(doc(anon(env), 'families/F1'), { recurringEnabled: false }))
  })

  it('denies a non-boolean value on update', async () => {
    const ref = doc(asUser(env, 'alice'), 'families/F1')
    await assertFails(updateDoc(ref, { recurringEnabled: 'no' }))
    await assertFails(updateDoc(ref, { recurringEnabled: null }))
    await assertFails(updateDoc(ref, { recurringEnabled: 0 }))
  })

  it('does not widen the update: other keys alongside it are denied', async () => {
    const ref = doc(asUser(env, 'alice'), 'families/F1')
    await assertFails(updateDoc(ref, { recurringEnabled: false, name: 'X' }))
    await assertFails(updateDoc(ref, { recurringEnabled: false, members: ['alice', 'bob', 'eve'] }))
    await assertFails(updateDoc(ref, { recurringEnabled: false, ownerId: 'bob' }))
  })
})
