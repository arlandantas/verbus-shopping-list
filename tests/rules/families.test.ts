import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { anon, asUser, seed, setupEnv } from './support'

let env: RulesTestEnvironment

beforeAll(async () => {
  env = await setupEnv('demo-verbus-families')
})
afterAll(async () => {
  await env.cleanup()
})
beforeEach(async () => {
  await env.clearFirestore()
  await seed(env, {
    'families/F1': { name: 'Casa', members: ['alice'], ownerId: 'alice', createdAt: new Date() },
    'families/F1/items/x': { name: 'leite' },
    'families/F2': { name: 'Outra', members: ['bob'], ownerId: 'bob', createdAt: new Date() },
    'families/F2/items/y': { name: 'pao' },
  })
})

const fam = (over: Record<string, unknown> = {}) => ({
  name: 'Nova',
  members: ['carol'],
  ownerId: 'carol',
  createdAt: serverTimestamp(),
  ...over,
})

describe('S-007 AC3: creating families', () => {
  it('allows a valid create with the creator as sole member', async () => {
    await assertSucceeds(setDoc(doc(asUser(env, 'carol'), 'families/F3'), fam()))
    await assertSucceeds(
      setDoc(doc(asUser(env, 'carol'), 'families/F4'), fam({ inviteCode: 'ABCD2345' })),
    )
  })

  it('denies members with another uid or extra uids', async () => {
    const db = asUser(env, 'carol')
    await assertFails(setDoc(doc(db, 'families/F3'), fam({ members: ['dave'] })))
    await assertFails(setDoc(doc(db, 'families/F3'), fam({ members: ['carol', 'dave'] })))
  })

  it('denies a foreign ownerId, bad name, extra key and anonymous create', async () => {
    const db = asUser(env, 'carol')
    await assertFails(setDoc(doc(db, 'families/F3'), fam({ ownerId: 'dave' })))
    await assertFails(setDoc(doc(db, 'families/F3'), fam({ name: '' })))
    await assertFails(setDoc(doc(db, 'families/F3'), fam({ name: 'x'.repeat(61) })))
    await assertFails(setDoc(doc(db, 'families/F3'), fam({ name: 5 })))
    await assertFails(setDoc(doc(db, 'families/F3'), fam({ extra: 1 })))
    await assertFails(setDoc(doc(anon(env), 'families/F3'), fam()))
  })

  it('accepts a 60-char name', async () => {
    await assertSucceeds(
      setDoc(doc(asUser(env, 'carol'), 'families/F3'), fam({ name: 'x'.repeat(60) })),
    )
  })
})

describe('S-007 AC4: reading families and items', () => {
  it('lets a member read the family and its items', async () => {
    const db = asUser(env, 'alice')
    await assertSucceeds(getDoc(doc(db, 'families/F1')))
    await assertSucceeds(getDoc(doc(db, 'families/F1/items/x')))
  })

  it('denies non-members and anonymous users', async () => {
    const db = asUser(env, 'carol')
    await assertFails(getDoc(doc(db, 'families/F1')))
    await assertFails(getDoc(doc(db, 'families/F1/items/x')))
    await assertFails(getDoc(doc(anon(env), 'families/F1')))
    await assertFails(getDoc(doc(anon(env), 'families/F1/items/x')))
  })

  it('denies cross-family reads', async () => {
    const alice = asUser(env, 'alice')
    const bob = asUser(env, 'bob')
    await assertFails(getDoc(doc(alice, 'families/F2')))
    await assertFails(getDoc(doc(alice, 'families/F2/items/y')))
    await assertFails(getDoc(doc(bob, 'families/F1')))
    await assertFails(getDoc(doc(bob, 'families/F1/items/x')))
  })
})

describe('S-007 AC6: deletes and unknown paths', () => {
  it('denies deleting a family, even for members', async () => {
    await assertFails(deleteDoc(doc(asUser(env, 'alice'), 'families/F1')))
    await assertFails(deleteDoc(doc(asUser(env, 'carol'), 'families/F1')))
  })

  it('denies updating a family and writing items (out of scope)', async () => {
    const db = asUser(env, 'alice')
    await assertFails(updateDoc(doc(db, 'families/F1'), { name: 'x' }))
    await assertFails(setDoc(doc(db, 'families/F1/items/z'), { name: 'z' }))
  })

  it('denies paths outside the model', async () => {
    const db = asUser(env, 'alice')
    await assertFails(getDoc(doc(db, 'other/x')))
    await assertFails(setDoc(doc(db, 'other/x'), { a: 1 }))
  })
})
