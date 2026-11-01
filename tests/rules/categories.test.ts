import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'
import { anon, asUser, seed, setupEnv } from './support'

let env: RulesTestEnvironment

beforeAll(async () => {
  env = await setupEnv('demo-verbus-categories')
})
afterAll(async () => {
  await env.cleanup()
})
beforeEach(async () => {
  await env.clearFirestore()
  await seed(env, {
    'families/f1': { name: 'Casa', members: ['alice', 'bob'], ownerId: 'alice' },
    'families/f2': { name: 'Outra', members: ['erin'], ownerId: 'erin' },
    'families/f1/categories/mercearia': { name: 'Mercearia', isDefault: true, order: 0 },
    'families/f1/categories/mine': { name: 'Pets', isDefault: false, order: 6 },
    'families/f2/categories/other': { name: 'Outra', isDefault: false, order: 6 },
    'users/carol': {
      displayName: 'Carol',
      email: 'c@x.com',
      groupIds: [],
      createdAt: new Date(),
    },
  })
})

const cat = (id: string, fam = 'f1') => `families/${fam}/categories/${id}`
const user = (over: Record<string, unknown> = {}) => ({
  name: 'Pets',
  isDefault: false,
  order: 7,
  ...over,
})

/** Create-family batch as the client does it (S-092: no seeded categories); `extra` adds category docs. */
function createFamilyBatch(
  uid: string,
  id: string,
  members: string[],
  extra: Record<string, Record<string, unknown>> = {},
) {
  const db = asUser(env, uid)
  const b = writeBatch(db)
  b.set(doc(db, `families/${id}`), {
    name: 'Nova',
    members,
    ownerId: uid,
    inviteCode: 'WXYZ6789',
    createdAt: serverTimestamp(),
  })
  b.set(doc(db, 'invites/WXYZ6789'), {
    familyId: id,
    familyName: 'Nova',
    createdBy: uid,
    createdAt: serverTimestamp(),
  })
  b.update(doc(db, `users/${uid}`), { groupIds: [id] })
  for (const [k, data] of Object.entries(extra)) b.set(doc(db, cat(k, id)), data)
  return b.commit()
}

describe('S-031 categories rules', () => {
  it('S-092 AC1: create-family batch without categories accepted; denied if caller not in members', async () => {
    await assertFails(createFamilyBatch('carol', 'f3', ['someone-else']))
    await assertSucceeds(createFamilyBatch('carol', 'f3', ['carol']))
  })

  it('S-092 AC1: a default category (isDefault true) in the create-family batch is denied; same shape with isDefault false is allowed', async () => {
    const def = (k: string, i: number) => ({ name: k, isDefault: true, order: i })
    await assertFails(
      createFamilyBatch('carol', 'f3', ['carol'], { mercearia: def('Mercearia', 0) }),
    )
    await assertFails(createFamilyBatch('carol', 'f3', ['carol'], { novo: def('Novo', 0) }))
    await assertSucceeds(
      createFamilyBatch('carol', 'f3', ['carol'], {
        novo: { name: 'Novo', isDefault: false, order: 0 },
      }),
    )
  })

  it('S-092 AC1: defaults cannot be created standalone on an existing family', async () => {
    const db = asUser(env, 'alice')
    await assertFails(setDoc(doc(db, cat('higiene')), user({ isDefault: true, order: 5 })))
  })

  it('S-031 AC2: members read and list; outsiders, other family and anon denied', async () => {
    const alice = asUser(env, 'alice')
    await assertSucceeds(getDoc(doc(alice, cat('mercearia'))))
    await assertSucceeds(getDoc(doc(alice, cat('mine'))))
    await assertSucceeds(getDocs(collection(alice, 'families/f1/categories')))
    const erin = asUser(env, 'erin')
    await assertFails(getDoc(doc(erin, cat('mine'))))
    await assertFails(getDocs(collection(erin, 'families/f1/categories')))
    await assertSucceeds(getDoc(doc(erin, cat('other', 'f2'))))
    await assertFails(getDoc(doc(asUser(env, 'dave'), cat('mine'))))
    await assertFails(getDoc(doc(anon(env), cat('mine'))))
    await assertFails(getDocs(collection(anon(env), 'families/f1/categories')))
  })

  it('S-031 AC3: member creates, renames and deletes own category', async () => {
    const db = asUser(env, 'bob')
    await assertSucceeds(setDoc(doc(db, cat('novo')), user()))
    await assertSucceeds(setDoc(doc(db, cat('limite')), user({ name: 'N'.repeat(40), order: 999 })))
    await assertSucceeds(updateDoc(doc(db, cat('mine')), { name: 'Animais' }))
    await assertSucceeds(updateDoc(doc(db, cat('mine')), { order: 0 }))
    await assertSucceeds(deleteDoc(doc(db, cat('mine'))))
  })

  it('S-031 AC3: non-members and other families cannot create, update or delete', async () => {
    const erin = asUser(env, 'erin')
    await assertFails(setDoc(doc(erin, cat('novo')), user()))
    await assertFails(updateDoc(doc(erin, cat('mine')), { name: 'Hack' }))
    await assertFails(deleteDoc(doc(erin, cat('mine'))))
    await assertFails(setDoc(doc(anon(env), cat('novo')), user()))
    await assertFails(deleteDoc(doc(anon(env), cat('mine'))))
  })

  it('S-031 AC3: isDefault true outside family creation and isDefault change are denied', async () => {
    const db = asUser(env, 'alice')
    await assertFails(setDoc(doc(db, cat('forjada')), user({ isDefault: true })))
    await assertFails(updateDoc(doc(db, cat('mine')), { isDefault: true }))
    await assertFails(setDoc(doc(db, cat('mine')), user({ isDefault: true })))
    // a default id cannot be hijacked into a user category either
    await assertFails(setDoc(doc(db, cat('mercearia')), user({ order: 0 })))
  })

  it('S-037 AC1: a user category (isDefault false) with a default id is denied, even when absent', async () => {
    const db = asUser(env, 'alice')
    await assertFails(setDoc(doc(db, cat('higiene')), user({ order: 5 })))
    await assertFails(setDoc(doc(db, cat('mercearia')), user({ order: 0 })))
    await assertSucceeds(setDoc(doc(db, cat('higiene2')), user({ order: 5 })))
  })

  it('S-092 AC1: legacy defaults keep no update/delete; control: own category still allowed', async () => {
    const db = asUser(env, 'alice')
    await assertFails(updateDoc(doc(db, cat('mercearia')), { name: 'X' }))
    await assertFails(updateDoc(doc(db, cat('mercearia')), { order: 3 }))
    await assertFails(updateDoc(doc(db, cat('mercearia')), { isDefault: false }))
    await assertFails(setDoc(doc(db, cat('mercearia')), user({ name: 'Mercearia' })))
    await assertFails(deleteDoc(doc(db, cat('mercearia'))))
    await assertSucceeds(updateDoc(doc(db, cat('mine')), { name: 'Animais' }))
    await assertSucceeds(deleteDoc(doc(db, cat('mine'))))
  })

  it('S-031 AC5: invalid name, order and extra or missing keys are denied', async () => {
    const db = asUser(env, 'alice')
    const bad = async (over: Record<string, unknown>) =>
      assertFails(setDoc(doc(db, cat('novo')), user(over)))
    await bad({ name: '' })
    await bad({ name: 'N'.repeat(41) })
    await bad({ name: 42 })
    await bad({ name: null })
    await bad({ order: -1 })
    await bad({ order: 1000 })
    await bad({ order: 1.5 })
    await bad({ order: '3' })
    await bad({ isDefault: 'false' })
    await bad({ extra: 1 })
    await assertFails(setDoc(doc(db, cat('novo')), { name: 'A', isDefault: false }))
    await assertFails(setDoc(doc(db, cat('novo')), { name: 'A', order: 1 }))
  })

  it('S-031 AC5: invalid updates are denied', async () => {
    const db = asUser(env, 'alice')
    const ref = doc(db, cat('mine'))
    await assertFails(updateDoc(ref, { name: '' }))
    await assertFails(updateDoc(ref, { name: 'N'.repeat(41) }))
    await assertFails(updateDoc(ref, { name: 5 }))
    await assertFails(updateDoc(ref, { order: 1000 }))
    await assertFails(updateDoc(ref, { order: 2.5 }))
    await assertFails(updateDoc(ref, { extra: true }))
  })
})
