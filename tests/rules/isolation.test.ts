import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import {
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { anon, asUser, newCycle, newPurchase, newPurchaseLine, seed, setupEnv } from './support'

let env: RulesTestEnvironment

const SUBS = ['items', 'catalog', 'categories', 'members', 'purchases', 'purchaseLines', 'cycles']

async function seedAll() {
  const docs: Record<string, Record<string, unknown>> = {
    'users/alice': { name: 'Alice' },
    'users/bob': { name: 'Bob' },
    'invites/ABCDEFGH': { familyId: 'F1', createdBy: 'alice' },
  }
  for (const [fid, owner] of [
    ['F1', 'alice'],
    ['F2', 'bob'],
  ] as const) {
    docs[`families/${fid}`] = { name: fid, members: [owner] }
    for (const s of SUBS) docs[`families/${fid}/${s}/x`] = { name: 'x', createdBy: owner }
  }
  await seed(env, docs)
}

beforeAll(async () => {
  env = await setupEnv('demo-verbus-isolation')
})
afterAll(async () => {
  await env.cleanup()
})
beforeEach(async () => {
  await env.clearFirestore()
  await seedAll()
})

const actors = {
  anonymous: () => anon(env),
  'no family': () => asUser(env, 'carol'),
  'other family member': () => asUser(env, 'bob'),
}

const writes = async (sub: string) => {
  if (sub === 'purchases') return newPurchase()
  if (sub === 'purchaseLines') return newPurchaseLine()
  if (sub === 'cycles') return newCycle()
  return { name: 'y', createdBy: 'bob', uid: 'bob' }
}

describe.each(Object.keys(actors))('S-075 AC1: %s', (actor) => {
  describe.each(SUBS)('families/F1/%s', (sub) => {
    const db = () => actors[actor as keyof typeof actors]()
    it('denies get, list, create, update, delete', async () => {
      const d = db()
      await assertFails(getDoc(doc(d, `families/F1/${sub}/x`)))
      await assertFails(getDocs(collection(d, `families/F1/${sub}`)))
      await assertFails(setDoc(doc(d, `families/F1/${sub}/new`), await writes(sub)))
      await assertFails(updateDoc(doc(d, `families/F1/${sub}/x`), { name: 'z' }))
      await assertFails(deleteDoc(doc(d, `families/F1/${sub}/x`)))
    })
  })
})

describe('S-075 AC2: collectionGroup without family filter', () => {
  it.each(SUBS)('denies %s for members of any family', async (sub) => {
    await assertFails(getDocs(collectionGroup(asUser(env, 'alice'), sub)))
    await assertFails(getDocs(collectionGroup(asUser(env, 'bob'), sub)))
    await assertFails(getDocs(collectionGroup(asUser(env, 'carol'), sub)))
  })
})

describe('S-075 AC3: families list', () => {
  it('denies unfiltered list', async () => {
    await assertFails(getDocs(collection(asUser(env, 'alice'), 'families')))
  })
  it('allows list filtered by own uid', async () => {
    const q = query(
      collection(asUser(env, 'alice'), 'families'),
      where('members', 'array-contains', 'alice'),
    )
    const snap = await assertSucceeds(getDocs(q))
    expect(snap.docs.map((d) => d.id)).toEqual(['F1'])
  })
  it("denies list filtered by someone else's uid", async () => {
    const q = query(
      collection(asUser(env, 'alice'), 'families'),
      where('members', 'array-contains', 'bob'),
    )
    await assertFails(getDocs(q))
  })
})

describe('S-075 AC4: invites and users enumeration', () => {
  it('denies list of invites and users', async () => {
    for (const db of [asUser(env, 'alice'), asUser(env, 'carol'), anon(env)]) {
      await assertFails(getDocs(collection(db, 'invites')))
      await assertFails(getDocs(collection(db, 'users')))
    }
  })
  it('denies get of another user', async () => {
    await assertFails(getDoc(doc(asUser(env, 'alice'), 'users/bob')))
    await assertSucceeds(getDoc(doc(asUser(env, 'alice'), 'users/alice')))
  })
})

describe('S-075 AC5: nonexistent family', () => {
  it('denies read and write', async () => {
    const db = asUser(env, 'alice')
    await assertFails(getDoc(doc(db, 'families/NOPE/items/x')))
    await assertFails(setDoc(doc(db, 'families/NOPE/items/x'), { name: 'x' }))
  })
})

describe('S-075 AC6: removed member loses access immediately', () => {
  it('denies read and write after removal from members array', async () => {
    const db = asUser(env, 'alice')
    await assertSucceeds(getDoc(doc(db, 'families/F1/items/x')))
    await assertSucceeds(deleteDoc(doc(db, 'families/F1/items/y')))
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore() as never, 'families/F1'), { name: 'F1', members: [] })
    })
    await assertFails(getDoc(doc(db, 'families/F1/items/x')))
    await assertFails(getDocs(collection(db, 'families/F1/categories')))
    await assertFails(deleteDoc(doc(db, 'families/F1/items/x')))
    await assertFails(setDoc(doc(db, 'families/F1/items/n'), { name: 'n' }))
  })
})
