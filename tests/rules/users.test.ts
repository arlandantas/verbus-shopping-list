import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { doc, getDoc, serverTimestamp, setDoc, updateDoc, writeBatch } from 'firebase/firestore'
import { anon, asUser, seed, setupEnv } from './support'

let env: RulesTestEnvironment

beforeAll(async () => {
  env = await setupEnv('demo-verbus-users')
})
afterAll(async () => {
  await env.cleanup()
})
beforeEach(async () => {
  await env.clearFirestore()
})

const profile = () => ({
  displayName: 'Alice',
  email: 'a@x.com',
  familyId: null,
  createdAt: serverTimestamp(),
})

describe('S-007 AC1: users/{uid} access', () => {
  it('lets a user create, read and update their own profile', async () => {
    const db = asUser(env, 'alice')
    await assertSucceeds(setDoc(doc(db, 'users/alice'), profile()))
    await assertSucceeds(getDoc(doc(db, 'users/alice')))
    await assertSucceeds(updateDoc(doc(db, 'users/alice'), { displayName: 'Ali' }))
  })

  it('denies reading or writing another user', async () => {
    await seed(env, { 'users/bob': { ...profile(), createdAt: new Date() } })
    const db = asUser(env, 'alice')
    await assertFails(getDoc(doc(db, 'users/bob')))
    await assertFails(setDoc(doc(db, 'users/bob'), profile()))
    await assertFails(updateDoc(doc(db, 'users/bob'), { displayName: 'x' }))
  })

  it('denies unauthenticated access', async () => {
    const db = anon(env)
    await assertFails(getDoc(doc(db, 'users/alice')))
    await assertFails(setDoc(doc(db, 'users/alice'), profile()))
  })
})

describe('S-007 AC2: users shape', () => {
  it('denies an extra key', async () => {
    const db = asUser(env, 'alice')
    await assertFails(setDoc(doc(db, 'users/alice'), { ...profile(), admin: true }))
  })

  it('denies wrong types and missing keys', async () => {
    const db = asUser(env, 'alice')
    await assertFails(setDoc(doc(db, 'users/alice'), { ...profile(), displayName: 42 }))
    await assertFails(setDoc(doc(db, 'users/alice'), { ...profile(), createdAt: 'now' }))
    await assertFails(setDoc(doc(db, 'users/alice'), { ...profile(), familyId: 7 }))
    await assertFails(setDoc(doc(db, 'users/alice'), { displayName: 'A', email: 'a@x.com' }))
  })

  it('denies adding an extra key on update', async () => {
    const db = asUser(env, 'alice')
    await assertSucceeds(setDoc(doc(db, 'users/alice'), profile()))
    await assertFails(updateDoc(doc(db, 'users/alice'), { role: 'admin' }))
  })
})

describe('users.createdAt is pinned', () => {
  it('denies a client-chosen createdAt on create', async () => {
    const db = asUser(env, 'alice')
    await assertFails(setDoc(doc(db, 'users/alice'), { ...profile(), createdAt: new Date(0) }))
  })

  it('allows an update that leaves createdAt unchanged', async () => {
    const db = asUser(env, 'alice')
    await assertSucceeds(setDoc(doc(db, 'users/alice'), profile()))
    const { createdAt } = (await getDoc(doc(db, 'users/alice'))).data()!
    await assertSucceeds(updateDoc(doc(db, 'users/alice'), { displayName: 'Ali', createdAt }))
  })

  it('denies changing createdAt on update', async () => {
    const db = asUser(env, 'alice')
    await assertSucceeds(setDoc(doc(db, 'users/alice'), profile()))
    await assertFails(updateDoc(doc(db, 'users/alice'), { createdAt: new Date(0) }))
    await assertFails(updateDoc(doc(db, 'users/alice'), { createdAt: serverTimestamp() }))
  })
})

describe('S-007 AC5: users.familyId requires membership', () => {
  const fam = () => ({
    name: 'Casa',
    members: ['alice'],
    ownerId: 'alice',
    inviteCode: 'ABCD2345',
    createdAt: serverTimestamp(),
  })

  it('allows setting familyId in a batch that creates the family', async () => {
    const db = asUser(env, 'alice')
    const b = writeBatch(db)
    b.set(doc(db, 'families/F1'), fam())
    b.set(doc(db, 'invites/ABCD2345'), {
      familyId: 'F1',
      familyName: 'Casa',
      createdBy: 'alice',
      createdAt: serverTimestamp(),
    })
    b.set(doc(db, 'users/alice'), { ...profile(), familyId: 'F1' })
    await assertSucceeds(b.commit())
  })

  it("denies setting familyId to someone else's family", async () => {
    await seed(env, {
      'families/F2': { name: 'Outra', members: ['bob'], ownerId: 'bob', createdAt: new Date() },
    })
    const db = asUser(env, 'alice')
    await assertFails(setDoc(doc(db, 'users/alice'), { ...profile(), familyId: 'F2' }))
  })

  it('denies setting familyId to a nonexistent family', async () => {
    const db = asUser(env, 'alice')
    await assertFails(setDoc(doc(db, 'users/alice'), { ...profile(), familyId: 'nope' }))
  })
})
