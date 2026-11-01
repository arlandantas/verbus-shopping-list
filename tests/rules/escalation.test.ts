import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { deleteDoc, doc, serverTimestamp, setDoc, updateDoc, writeBatch } from 'firebase/firestore'
import { asUser, newPurchaseLine, seed, setupEnv } from './support'
import { newItem } from './itemsSupport'

let env: RulesTestEnvironment

beforeAll(async () => {
  env = await setupEnv('demo-verbus-escalation')
})
afterAll(async () => {
  await env.cleanup()
})

const now = () => new Date()
beforeEach(async () => {
  await env.clearFirestore()
  await seed(env, {
    'families/F1': {
      name: 'Casa',
      members: ['alice', 'bob'],
      ownerId: 'alice',
      inviteCode: 'ABCD2345',
      joinCode: 'ABCD2345',
      createdAt: now(),
    },
    'families/F2': { name: 'Outra', members: ['erin'], ownerId: 'erin', createdAt: now() },
    'invites/ABCD2345': {
      familyId: 'F1',
      familyName: 'Casa',
      createdBy: 'alice',
      createdAt: now(),
    },
    'invites/WXYZ2345': {
      familyId: 'F1',
      familyName: 'Casa',
      createdBy: 'alice',
      createdAt: now(),
    },
    'users/alice': { displayName: 'A', email: '', familyId: 'F1', createdAt: now() },
    'users/bob': { displayName: 'B', email: '', familyId: 'F1', createdAt: now() },
    'users/carol': { displayName: 'C', email: '', familyId: null, createdAt: now() },
    'users/erin': { displayName: 'E', email: '', familyId: 'F2', createdAt: now() },
    'families/F1/members/alice': { displayName: 'A' },
    'families/F1/members/bob': { displayName: 'B' },
    'families/F1/items/i1': {
      ...newItem(),
      createdBy: 'alice',
      createdAt: now(),
    },
    'families/F1/categories/mercearia': { name: 'Mercearia', isDefault: true, order: 0 },
    'families/F1/categories/mine': { name: 'Pets', isDefault: false, order: 6 },
    'families/F1/purchaseLines/L1': {
      ...(await newPurchaseLine({ purchasedAt: now() })),
    },
  })
})

const fam = (uid: string) => doc(asUser(env, uid), 'families/F1')

describe('S-078 AC1: families fields are immutable for members', () => {
  it('allows the control: member rotates only inviteCode (valid batch)', async () => {
    const db = asUser(env, 'alice')
    const b = writeBatch(db)
    b.update(doc(db, 'families/F1'), { inviteCode: 'WXYZ2345' })
    await assertSucceeds(b.commit())
  })
  it.each([
    ['ownerId', { ownerId: 'bob' }],
    ['name', { name: 'Outro' }],
    ['members', { members: ['alice'] }],
    ['members append', { members: ['alice', 'bob', 'carol'] }],
    ['createdAt', { createdAt: new Date(1) }],
    ['joinCode', { joinCode: 'WXYZ2345' }],
  ])('denies a member changing %s', async (_n, over) => {
    await assertFails(updateDoc(fam('bob'), over))
    await assertFails(updateDoc(fam('alice'), over))
  })
  it('denies deleting the family, even by the owner', async () => {
    await assertFails(deleteDoc(fam('alice')))
    await assertFails(deleteDoc(fam('bob')))
  })
})

describe('S-078 AC2: members, items and marks', () => {
  const profile = (uid: string, name = 'X') =>
    setDoc(doc(asUser(env, uid), `families/F1/members/${uid === 'alice' ? 'alice' : 'bob'}`), {
      displayName: name,
    })
  it('allows the control: a member writes their own profile', async () => {
    await assertSucceeds(profile('alice', 'Ali'))
  })
  it("denies creating or editing another member's profile", async () => {
    const db = asUser(env, 'alice')
    await assertFails(setDoc(doc(db, 'families/F1/members/bob'), { displayName: 'Hack' }))
    await assertFails(updateDoc(doc(db, 'families/F1/members/bob'), { displayName: 'Hack' }))
    await assertFails(setDoc(doc(db, 'families/F1/members/zed'), { displayName: 'Z' }))
  })
  it('allows the control: editing quantity of an item keeps identity fields', async () => {
    await assertSucceeds(
      updateDoc(doc(asUser(env, 'bob'), 'families/F1/items/i1'), { quantity: 3 }),
    )
  })
  it('denies changing createdBy or createdAt of an item', async () => {
    const ref = doc(asUser(env, 'bob'), 'families/F1/items/i1')
    await assertFails(updateDoc(ref, { createdBy: 'bob' }))
    await assertFails(updateDoc(ref, { createdAt: serverTimestamp() }))
  })
  it('allows marking as yourself and denies marking as another uid', async () => {
    const ref = doc(asUser(env, 'bob'), 'families/F1/items/i1')
    const mark = (by: string) => ({ status: 'bought', markedBy: by, markedAt: serverTimestamp() })
    await assertFails(updateDoc(ref, mark('alice')))
    await assertSucceeds(updateDoc(ref, mark('bob')))
  })
})

describe('S-078 AC3: category isDefault', () => {
  const db = () => asUser(env, 'alice')
  const cat = (id: string) => doc(db(), `families/F1/categories/${id}`)
  it('allows the control: editing a user category keeping isDefault false', async () => {
    await assertSucceeds(updateDoc(cat('mine'), { name: 'Bichos' }))
  })
  it('denies flipping isDefault in either direction', async () => {
    await assertFails(updateDoc(cat('mine'), { isDefault: true }))
    await assertFails(updateDoc(cat('mercearia'), { isDefault: false }))
    await assertFails(updateDoc(cat('mercearia'), { name: 'X' }))
  })
  it('denies a default-id category outside family creation; control with a custom id', async () => {
    await assertSucceeds(setDoc(cat('novo'), { name: 'Novo', isDefault: false, order: 7 }))
    await assertFails(setDoc(cat('carnes'), { name: 'Carnes', isDefault: false, order: 7 }))
    await assertFails(setDoc(cat('carnes'), { name: 'Carnes', isDefault: true, order: 7 }))
    await assertFails(setDoc(cat('forjada'), { name: 'F', isDefault: true, order: 7 }))
  })
})

describe('S-078 AC4: users displayName and email', () => {
  const user = (over: Record<string, unknown> = {}) => ({
    displayName: 'Dave',
    email: 'dave@x.com',
    familyId: null,
    createdAt: serverTimestamp(),
    ...over,
  })
  const asDave = () =>
    env.authenticatedContext('dave', { email: 'dave@x.com' }).firestore() as unknown as ReturnType<
      typeof asUser
    >
  it('allows the control: valid name and token email', async () => {
    await assertSucceeds(setDoc(doc(asDave(), 'users/dave'), user()))
  })
  it('allows boundary name (60) and denies empty or 61', async () => {
    await assertSucceeds(setDoc(doc(asDave(), 'users/dave'), user({ displayName: 'x'.repeat(60) })))
    await assertFails(setDoc(doc(asDave(), 'users/dave'), user({ displayName: '' })))
    await assertFails(setDoc(doc(asDave(), 'users/dave'), user({ displayName: 'x'.repeat(61) })))
  })
  it('denies a huge email and an email that is not the token email', async () => {
    const big = `${'x'.repeat(300)}@x.com`
    await assertFails(setDoc(doc(asDave(), 'users/dave'), user({ email: big })))
    await assertFails(setDoc(doc(asDave(), 'users/dave'), user({ email: 'alice@x.com' })))
    await assertFails(setDoc(doc(asDave(), 'users/dave'), user({ email: '' })))
  })
  it('token without email: only an empty email is accepted', async () => {
    const db = asUser(env, 'dave')
    await assertSucceeds(setDoc(doc(db, 'users/dave'), user({ email: '' })))
    await assertFails(setDoc(doc(db, 'users/zed'), user({ email: 'z@x.com' })))
  })
  it('denies updating displayName to a huge string and email to a foreign one', async () => {
    await assertSucceeds(setDoc(doc(asDave(), 'users/dave'), user()))
    await assertSucceeds(updateDoc(doc(asDave(), 'users/dave'), { displayName: 'Davi' }))
    await assertFails(updateDoc(doc(asDave(), 'users/dave'), { displayName: 'x'.repeat(5000) }))
    await assertFails(updateDoc(doc(asDave(), 'users/dave'), { email: 'alice@x.com' }))
  })
})

describe('S-078 AC5: purchaseLines.markedBy', () => {
  let n = 0
  const put = async (markedBy: string | null) =>
    setDoc(
      doc(asUser(env, 'alice'), `families/F1/purchaseLines/N${++n}`),
      await newPurchaseLine({ markedBy }),
    )
  it('allows null and a family member', async () => {
    await assertSucceeds(put(null))
    await assertSucceeds(put('bob'))
  })
  it('denies an invented uid and a member of another family', async () => {
    await assertFails(put('ghost'))
    await assertFails(put('erin'))
  })
})

describe('S-078 AC6: users.familyId', () => {
  it('allows the control: joining through the join batch', async () => {
    const db = asUser(env, 'carol')
    const b = writeBatch(db)
    b.update(doc(db, 'families/F1'), { members: ['alice', 'bob', 'carol'], joinCode: 'ABCD2345' })
    b.update(doc(db, 'users/carol'), { familyId: 'F1' })
    await assertSucceeds(b.commit())
  })
  it('denies pointing familyId at a family the user is not in', async () => {
    await assertFails(updateDoc(doc(asUser(env, 'carol'), 'users/carol'), { familyId: 'F1' }))
    await assertFails(updateDoc(doc(asUser(env, 'carol'), 'users/carol'), { familyId: 'F2' }))
  })
  it('denies resetting familyId to null or switching families once set', async () => {
    const db = asUser(env, 'alice')
    await assertFails(updateDoc(doc(db, 'users/alice'), { familyId: null }))
    await assertFails(updateDoc(doc(db, 'users/alice'), { familyId: 'F2' }))
    await assertSucceeds(updateDoc(doc(db, 'users/alice'), { displayName: 'Ali' }))
  })
})
